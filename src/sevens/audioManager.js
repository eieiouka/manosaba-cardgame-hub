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

const cardPlaySoundSource =
  "/audio/card-play.mp3";

const CARD_SOUND_POOL_SIZE = 4;

function createAudio(source, volume) {
  const audio = new Audio();

  audio.preload = "auto";
  audio.src = source;
  audio.volume = volume;
  audio.playsInline = true;

  /*
    StartScreen表示中に
    音声ファイルの読み込みを開始する。
  */
  audio.load();

  return audio;
}

export function resetAudio(audio) {
  if (!audio) {
    return;
  }

  audio.pause();

  try {
    audio.currentTime = 0;
  } catch {
    // 読み込み前なら何もしない
  }
}

export function playAudioFromStart(audio) {
  if (!audio) {
    return Promise.resolve();
  }

  resetAudio(audio);

  let playPromise;

  try {
    playPromise = audio.play();
  } catch {
    return Promise.resolve();
  }

  if (
    playPromise &&
    typeof playPromise.then === "function"
  ) {
    return playPromise;
  }

  return Promise.resolve();
}

export function createSevensAudioManager() {
  const passAudios =
    passVoiceSources.map((source) =>
      createAudio(source, 0.8),
    );

  const burstAudios =
    burstVoiceSources.map((source) =>
      createAudio(source, 1),
    );

  const finishAudios =
    finishVoiceSources.map((source) =>
      createAudio(source, 1),
    );

  const championAudios =
    championVoiceSources.map((source) =>
      createAudio(source, 1),
    );

  /*
    カード音は短時間に連続で鳴るため、
    4個のAudioを先に用意する。
  */
  const cardPlayAudios = Array.from(
    {
      length: CARD_SOUND_POOL_SIZE,
    },
    () =>
      createAudio(
        cardPlaySoundSource,
        0.65,
      ),
  );

  return {
    passAudios,
    burstAudios,
    finishAudios,
    championAudios,
    cardPlayAudios,

    cardPlayAudioIndex: 0,
    activeAudio: null,
    burstAudio: null,

    audioReady: false,
    warmUpPromise: null,
  };
}

function restoreAudioSettings(
  audio,
  originalMuted,
  originalVolume,
) {
  resetAudio(audio);

  audio.muted = originalMuted;
  audio.volume = originalVolume;
}

function warmUpSingleAudio(audio) {
  if (!audio) {
    return Promise.resolve();
  }

  const originalMuted = audio.muted;
  const originalVolume = audio.volume;

  audio.muted = true;
  audio.volume = 0;

  resetAudio(audio);

  let playPromise;

  try {
    playPromise = audio.play();
  } catch {
    restoreAudioSettings(
      audio,
      originalMuted,
      originalVolume,
    );

    return Promise.resolve();
  }

  const finishWarmUp = () =>
    new Promise((resolve) => {
      /*
        play()成功直後に止めると、
        スマホで音声の準備が完了しない場合がある。

        100msだけ再生状態を維持してから止める。
      */
      window.setTimeout(() => {
        restoreAudioSettings(
          audio,
          originalMuted,
          originalVolume,
        );

        resolve();
      }, 100);
    });

  if (
    playPromise &&
    typeof playPromise.then === "function"
  ) {
    return playPromise
      .then(() => finishWarmUp())
      .catch(() => {
        restoreAudioSettings(
          audio,
          originalMuted,
          originalVolume,
        );
      });
  }

  return finishWarmUp();
}

export function warmUpSevensAudio(
  audioManager,
) {
  if (!audioManager) {
    return Promise.resolve();
  }

  if (audioManager.audioReady) {
    return Promise.resolve();
  }

  if (audioManager.warmUpPromise) {
    return audioManager.warmUpPromise;
  }

  /*
    ゲーム内で使用するすべての音声を、
    ゲームスタートボタンの操作中に
    無音で一度再生する。
  */
  const allAudios = [
    ...audioManager.passAudios,
    ...audioManager.burstAudios,
    ...audioManager.finishAudios,
    ...audioManager.championAudios,
    ...audioManager.cardPlayAudios,
  ];

  const warmUpPromises =
    allAudios.map(warmUpSingleAudio);

  audioManager.warmUpPromise =
    Promise.allSettled(
      warmUpPromises,
    ).then(() => {
      audioManager.audioReady = true;
      audioManager.warmUpPromise = null;
    });

  return audioManager.warmUpPromise;
}

export function disposeSevensAudioManager(
  audioManager,
) {
  if (!audioManager) {
    return;
  }

  const allAudios = [
    ...audioManager.passAudios,
    ...audioManager.burstAudios,
    ...audioManager.finishAudios,
    ...audioManager.championAudios,
    ...audioManager.cardPlayAudios,
  ];

  allAudios.forEach((audio) => {
    resetAudio(audio);

    audio.removeAttribute("src");
    audio.load();
  });

  audioManager.passAudios = [];
  audioManager.burstAudios = [];
  audioManager.finishAudios = [];
  audioManager.championAudios = [];
  audioManager.cardPlayAudios = [];

  audioManager.cardPlayAudioIndex = 0;
  audioManager.activeAudio = null;
  audioManager.burstAudio = null;

  audioManager.audioReady = false;
  audioManager.warmUpPromise = null;
}