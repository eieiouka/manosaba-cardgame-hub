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

export default function useAudio() {
  const activeAudioRef = useRef(null);
  const burstAudioRef = useRef(null);

  const playPassVoice = useCallback((playerIndex) => {
    const source = passVoiceSources[playerIndex];

    if (!source) {
      return;
    }

    const audio = new Audio(source);
    audio.volume = 0.8;

    audio.play().catch(() => {
      // 再生できなかった場合は何もしない
    });
  }, []);

  const playCardPlaySound = useCallback(() => {
    const burstAudio = burstAudioRef.current;

    if (
      burstAudio &&
      !burstAudio.paused &&
      !burstAudio.ended
    ) {
      return;
    }

    const audio = new Audio(cardPlaySoundSource);
    audio.volume = 0.65;

    audio.play().catch(() => {
      // 再生できなかった場合は何もしない
    });
  }, []);

  const playBurstVoice = useCallback((playerIndex) => {
    const source = burstVoiceSources[playerIndex];

    if (!source) {
      return;
    }

    const audio = new Audio(source);
    audio.volume = 1;

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

    audio.play().catch(() => {
      clearBurstAudio();
    });
  }, []);

  const playFinishVoice = useCallback((playerIndex) => {
    const source = finishVoiceSources[playerIndex];

    if (!source) {
      return;
    }

    const audio = new Audio(source);
    audio.volume = 1;

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

    audio.play().catch(() => {
      clearActiveAudio();
    });
  }, []);

  const playChampionVoice = useCallback((playerIndex) => {
    const source = championVoiceSources[playerIndex];

    if (!source) {
      return;
    }

    const audio = new Audio(source);
    audio.volume = 1;

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

    audio.play().catch(() => {
      clearActiveAudio();
    });
  }, []);

  useEffect(() => {
    return () => {
      activeAudioRef.current?.pause();
      burstAudioRef.current?.pause();

      activeAudioRef.current = null;
      burstAudioRef.current = null;
    };
  }, []);

  return {
    playPassVoice,
    playCardPlaySound,
    playBurstVoice,
    playFinishVoice,
    playChampionVoice,
  };
}