import {
  useCallback,
  useEffect,
  useRef,
} from "react";

const passVoiceSources = [
  "/audio/nanoka-pass.mp3",
  "/audio/ema-pass.mp3",
  "/audio/sherry-pass.mp3",
  "/audio/hanna-pass.mp3",
];

const burstVoiceSources = [
  "/audio/nanoka-burst.mp3",
  "/audio/ema-burst.mp3",
  "/audio/sherry-burst.mp3",
  "/audio/hanna-burst.mp3",
];

const finishVoiceSources = [
  "/audio/nanoka-finish.mp3",
  "/audio/ema-finish.mp3",
  "/audio/sherry-finish.mp3",
  "/audio/hanna-finish.mp3",
];

const championVoiceSources = [
  "/audio/nanoka-champion.mp3",
  "/audio/ema-champion.mp3",
  "/audio/sherry-champion.mp3",
  "/audio/hanna-champion.mp3",
];

const cardPlaySoundSource = "/audio/card-play.mp3";

const CARD_SOUND_POOL_SIZE = 4;

function createAudio(source, volume) {
  const audio = new Audio();

  audio.preload = "auto";
  audio.src = source;
  audio.volume = volume;

  audio.load();

  return audio;
}

function resetAudio(audio) {
  if (!audio) {
    return;
  }

  audio.pause();

  try {
    audio.currentTime = 0;
  } catch {
    // 読み込み前で変更できない場合は何もしない
  }
}

function playAudioFromStart(audio) {
  if (!audio) {
    return Promise.resolve();
  }

  resetAudio(audio);

  const playPromise = audio.play();

  if (playPromise instanceof Promise) {
    return playPromise;
  }

  return Promise.resolve();
}

export default function useAudio() {
  const passAudioRefs = useRef([]);
  const burstAudioRefs = useRef([]);
  const finishAudioRefs = useRef([]);
  const championAudioRefs = useRef([]);

  const cardPlayAudioRefs = useRef([]);
  const cardPlayAudioIndexRef = useRef(0);

  const activeAudioRef = useRef(null);
  const burstAudioRef = useRef(null);

  const audioReadyRef = useRef(false);
  const warmUpPromiseRef = useRef(null);

  useEffect(() => {
    const passAudios = passVoiceSources.map((source) =>
      createAudio(source, 0.8),
    );

    const burstAudios = burstVoiceSources.map((source) =>
      createAudio(source, 1),
    );

    const finishAudios = finishVoiceSources.map((source) =>
      createAudio(source, 1),
    );

    const championAudios = championVoiceSources.map((source) =>
      createAudio(source, 1),
    );

    /*
      カード音は短時間に続けて鳴るため、
      同じAudioを使い回さず4個用意する。
    */
    const cardPlayAudios = Array.from(
      { length: CARD_SOUND_POOL_SIZE },
      () => createAudio(cardPlaySoundSource, 0.65),
    );

    passAudioRefs.current = passAudios;
    burstAudioRefs.current = burstAudios;
    finishAudioRefs.current = finishAudios;
    championAudioRefs.current = championAudios;
    cardPlayAudioRefs.current = cardPlayAudios;

    /*
      canplaythroughを待つだけでは、
      ブラウザによっては発火しないことがある。

      そのため、読み込み要求だけ先に出して、
      実際の初回再生準備はwarmUpAudioで行う。
    */
    const allAudios = [
      ...passAudios,
      ...burstAudios,
      ...finishAudios,
      ...championAudios,
      ...cardPlayAudios,
    ];

    allAudios.forEach((audio) => {
      audio.load();
    });

    return () => {
      allAudios.forEach((audio) => {
        resetAudio(audio);

        audio.removeAttribute("src");
        audio.load();
      });

      passAudioRefs.current = [];
      burstAudioRefs.current = [];
      finishAudioRefs.current = [];
      championAudioRefs.current = [];
      cardPlayAudioRefs.current = [];

      activeAudioRef.current = null;
      burstAudioRef.current = null;

      audioReadyRef.current = false;
      warmUpPromiseRef.current = null;
    };
  }, []);

  /*
    ゲーム開始操作の直後に呼び出す。

    カード音を無音で一度だけ再生することで、
    スマホ側の初回デコードを先に済ませる。
  */
  const warmUpAudio = useCallback(() => {
    if (audioReadyRef.current) {
      return Promise.resolve();
    }

    if (warmUpPromiseRef.current) {
      return warmUpPromiseRef.current;
    }

    const cardAudios = cardPlayAudioRefs.current;

    if (cardAudios.length === 0) {
      return Promise.resolve();
    }

    const warmUpPromises = cardAudios.map((audio) => {
      const originalVolume = audio.volume;
      const originalMuted = audio.muted;

      audio.muted = true;
      audio.volume = 0;

      resetAudio(audio);

      const playPromise = audio.play();

      if (!(playPromise instanceof Promise)) {
        resetAudio(audio);

        audio.muted = originalMuted;
        audio.volume = originalVolume;

        return Promise.resolve();
      }

      return playPromise
        .then(() => {
          resetAudio(audio);

          audio.muted = originalMuted;
          audio.volume = originalVolume;
        })
        .catch(() => {
          resetAudio(audio);

          audio.muted = originalMuted;
          audio.volume = originalVolume;
        });
    });

    warmUpPromiseRef.current = Promise.allSettled(
      warmUpPromises,
    ).then(() => {
      audioReadyRef.current = true;
      warmUpPromiseRef.current = null;
    });

    return warmUpPromiseRef.current;
  }, []);

  const playPassVoice = useCallback((playerIndex) => {
    const audio = passAudioRefs.current[playerIndex];

    if (!audio) {
      return;
    }

    playAudioFromStart(audio).catch(() => {
      // 再生できなかった場合は何もしない
    });
  }, []);

  const playCardPlaySound = useCallback(() => {
    const burstAudio = burstAudioRef.current;

    /*
      バーストボイス再生中は、
      カード効果音を鳴らさない。
    */
    if (
      burstAudio &&
      !burstAudio.paused &&
      !burstAudio.ended
    ) {
      return;
    }

    const cardAudios = cardPlayAudioRefs.current;

    if (cardAudios.length === 0) {
      return;
    }

    /*
      現在止まっているAudioを優先して使う。
      全部再生中なら順番に再利用する。
    */
    const availableAudio = cardAudios.find(
      (audio) => audio.paused || audio.ended,
    );

    let audio = availableAudio;

    if (!audio) {
      const audioIndex =
        cardPlayAudioIndexRef.current %
        cardAudios.length;

      audio = cardAudios[audioIndex];

      cardPlayAudioIndexRef.current =
        (audioIndex + 1) %
        cardAudios.length;
    }

    playAudioFromStart(audio).catch(() => {
      // 再生できなかった場合は何もしない
    });
  }, []);

  const playBurstVoice = useCallback((playerIndex) => {
    const audio = burstAudioRefs.current[playerIndex];

    if (!audio) {
      return;
    }

    const previousBurstAudio = burstAudioRef.current;

    if (
      previousBurstAudio &&
      previousBurstAudio !== audio
    ) {
      resetAudio(previousBurstAudio);
    }

    burstAudioRef.current = audio;

    const clearBurstAudio = () => {
      if (burstAudioRef.current === audio) {
        burstAudioRef.current = null;
      }
    };

    audio.addEventListener(
      "ended",
      clearBurstAudio,
      { once: true },
    );

    audio.addEventListener(
      "error",
      clearBurstAudio,
      { once: true },
    );

    playAudioFromStart(audio).catch(() => {
      clearBurstAudio();
    });
  }, []);

  const playFinishVoice = useCallback((playerIndex) => {
    const audio = finishAudioRefs.current[playerIndex];

    if (!audio) {
      return;
    }

    const previousActiveAudio = activeAudioRef.current;

    if (
      previousActiveAudio &&
      previousActiveAudio !== audio
    ) {
      resetAudio(previousActiveAudio);
    }

    activeAudioRef.current = audio;

    const clearActiveAudio = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
    };

    audio.addEventListener(
      "ended",
      clearActiveAudio,
      { once: true },
    );

    audio.addEventListener(
      "error",
      clearActiveAudio,
      { once: true },
    );

    playAudioFromStart(audio).catch(() => {
      clearActiveAudio();
    });
  }, []);

  const playChampionVoice = useCallback((playerIndex) => {
    const audio =
      championAudioRefs.current[playerIndex];

    if (!audio) {
      return;
    }

    const previousActiveAudio = activeAudioRef.current;

    if (
      previousActiveAudio &&
      previousActiveAudio !== audio
    ) {
      resetAudio(previousActiveAudio);
    }

    activeAudioRef.current = audio;

    const clearActiveAudio = () => {
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
    };

    audio.addEventListener(
      "ended",
      clearActiveAudio,
      { once: true },
    );

    audio.addEventListener(
      "error",
      clearActiveAudio,
      { once: true },
    );

    playAudioFromStart(audio).catch(() => {
      clearActiveAudio();
    });
  }, []);

  return {
    warmUpAudio,
    playPassVoice,
    playCardPlaySound,
    playBurstVoice,
    playFinishVoice,
    playChampionVoice,
  };
}