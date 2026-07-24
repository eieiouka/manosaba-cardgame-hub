import { useCallback } from "react";

import {
  playAudioFromStart,
  resetAudio,
} from "../audioManager";

export default function useAudio(
  audioManager,
) {
  const playPassVoice = useCallback(
    (playerIndex) => {
      const audio =
        audioManager?.passAudios?.[
          playerIndex
        ];

      if (!audio) {
        return;
      }

      playAudioFromStart(audio).catch(() => {
        // 再生できなかった場合は何もしない
      });
    },
    [audioManager],
  );

  const playCardPlaySound = useCallback(() => {
    if (!audioManager) {
      return;
    }

    const burstAudio =
      audioManager.burstAudio;

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

    const cardAudios =
      audioManager.cardPlayAudios;

    if (
      !cardAudios ||
      cardAudios.length === 0
    ) {
      return;
    }

    /*
      現在止まっているAudioを優先する。
    */
    const availableAudio = cardAudios.find(
      (audio) =>
        audio.paused || audio.ended,
    );

    let audio = availableAudio;

    /*
      すべて再生中なら、
      プール内を順番に再利用する。
    */
    if (!audio) {
      const audioIndex =
        audioManager.cardPlayAudioIndex %
        cardAudios.length;

      audio = cardAudios[audioIndex];

      audioManager.cardPlayAudioIndex =
        (audioIndex + 1) %
        cardAudios.length;
    }

    playAudioFromStart(audio).catch(() => {
      // 再生できなかった場合は何もしない
    });
  }, [audioManager]);

  const playBurstVoice = useCallback(
    (playerIndex) => {
      if (!audioManager) {
        return;
      }

      const audio =
        audioManager.burstAudios?.[
          playerIndex
        ];

      if (!audio) {
        return;
      }

      const previousBurstAudio =
        audioManager.burstAudio;

      if (
        previousBurstAudio &&
        previousBurstAudio !== audio
      ) {
        resetAudio(previousBurstAudio);
      }

      audioManager.burstAudio = audio;

      const clearBurstAudio = () => {
        if (
          audioManager.burstAudio === audio
        ) {
          audioManager.burstAudio = null;
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
    },
    [audioManager],
  );

  const playFinishVoice = useCallback(
    (playerIndex) => {
      if (!audioManager) {
        return;
      }

      const audio =
        audioManager.finishAudios?.[
          playerIndex
        ];

      if (!audio) {
        return;
      }

      const previousActiveAudio =
        audioManager.activeAudio;

      if (
        previousActiveAudio &&
        previousActiveAudio !== audio
      ) {
        resetAudio(previousActiveAudio);
      }

      audioManager.activeAudio = audio;

      const clearActiveAudio = () => {
        if (
          audioManager.activeAudio === audio
        ) {
          audioManager.activeAudio = null;
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
    },
    [audioManager],
  );

  const playChampionVoice = useCallback(
    (playerIndex) => {
      if (!audioManager) {
        return;
      }

      const audio =
        audioManager.championAudios?.[
          playerIndex
        ];

      if (!audio) {
        return;
      }

      const previousActiveAudio =
        audioManager.activeAudio;

      if (
        previousActiveAudio &&
        previousActiveAudio !== audio
      ) {
        resetAudio(previousActiveAudio);
      }

      audioManager.activeAudio = audio;

      const clearActiveAudio = () => {
        if (
          audioManager.activeAudio === audio
        ) {
          audioManager.activeAudio = null;
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
    },
    [audioManager],
  );

  return {
    playPassVoice,
    playCardPlaySound,
    playBurstVoice,
    playFinishVoice,
    playChampionVoice,
  };
}