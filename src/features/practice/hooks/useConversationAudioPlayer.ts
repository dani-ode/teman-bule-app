/**
 * useConversationAudioPlayer
 *
 * SATU player expo-audio untuk seluruh layar conversation. Semua audio
 * (TTS AI, voice note user) diputar lewat instance ini, sehingga secara
 * struktural TIDAK MUNGKIN ada dua audio berbunyi bersamaan, dan player
 * tidak pernah ikut siklus hidup FlatList (penyebab error
 * "shared object that was already released").
 *
 * Pola: bubbles jadi controlled component — diberi `playing` + `onToggle`.
 * Hook ini yang memutuskan kapan `replace()` + `play()` dipanggil.
 *
 * Logging: setiap jalur play/pause/replace/finish dicatat dengan prefix
 * `[Audio]` agar bisa ditelusuri di terminal Metro/Logcat.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';

const TAG = '[Audio]';

function log(event: string, detail?: Record<string, unknown>): void {
  if (detail) {
    console.log(`${TAG} ${event}`, JSON.stringify(detail));
  } else {
    console.log(`${TAG} ${event}`);
  }
}

export interface ConversationAudioTarget {
  /** Id unik pesan (dipakai untuk menandai bubble mana yang sedang bunyi). */
  readonly id: string;
  /** URL/file audio yang akan diputar. */
  readonly uri: string;
}

export interface ConversationAudioController {
  /** Id pesan yang sedang aktif (playing/paused), atau null. */
  readonly activeId: string | null;
  /** True bila player sedang berbunyi. */
  readonly playing: boolean;
  /** Posisi & durasi saat ini (detik) untuk progress UI. */
  readonly currentTime: number;
  readonly duration: number;
  /**
   * Toggle play/pause untuk sebuah target.
   * - target sama & sedang play  → pause
   * - target sama & paused       → resume
   * - target beda                → replace source lalu play (pause yg lama)
   */
  readonly toggle: (target: ConversationAudioTarget) => void;
  /**
   * Mulai autoplay untuk pesan baru (idempotent per pesan). Sama dengan
   * toggle tapi tanpa cabang pause — selalu berakhir playing.
   */
  readonly start: (target: ConversationAudioTarget) => void;
  /** Hentikan playback apa pun (mis. saat mulai merekam / kirim pesan). */
  readonly stop: () => void;
}

export function useConversationAudioPlayer(): ConversationAudioController {
  // Satu-satunya useAudioPlayer di seluruh layar. Source awal null; kita
  // replace() secara eksplisit. Player hidup seumur layar → tidak pernah
  // released karena FlatList recycle.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const activeUriRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Saat selesai: PENTING — pause() untuk menurunkan playWhenReady di native.
  // JANGAN seekTo(0) di sini: di ExoPlayer, seek saat state ENDED memindahkan
  // posisi ke awal TETAPI playWhenReady tetap true → audio replay otomatis
  // (inilah sumber loop "berulang" yang dilaporkan). Cukup pause + bersihkan
  // penanda aktif; posisi di-reset saat user menekan play lagi.
  useEffect(() => {
    if (status.didJustFinish) {
      log('didJustFinish → pause (no auto-seek, no auto-replay)', {
        id: activeIdRef.current,
        playing: status.playing,
        currentTime: status.currentTime,
        duration: status.duration,
      });
      try {
        player.pause();
      } catch (e) {
        log('pause after finish failed', { error: String(e) });
      }
      activeIdRef.current = null;
      activeUriRef.current = null;
      setActiveId(null);
    }
  }, [status.didJustFinish, status.playing, status.currentTime, status.duration, player]);

  const playUri = useCallback(
    (id: string, uri: string) => {
      // Bila source sama → cukup resume; bila beda → replace dulu.
      const isSameSource = activeUriRef.current === uri;
      if (!isSameSource) {
        log('replace() source', { id, uri: uri.slice(0, 64) });
        try {
          player.replace(uri as AudioSource);
        } catch (e) {
          log('replace failed', { id, error: String(e) });
          return;
        }
      }
      try {
        // Bila posisi sudah di akhir (selesai diputar), mundur ke awal
        // SEBELUM play agar replay mulai dari 0, bukan diam di akhir.
        const dur = player.duration;
        const cur = player.currentTime;
        if (dur > 0 && cur >= dur - 0.1) {
          log('seekTo(0) before replay', { id, cur, dur });
          void player.seekTo(0);
        }
        log('play()', { id, resume: isSameSource });
        player.play();
        activeUriRef.current = uri;
        activeIdRef.current = id;
        setActiveId(id);
      } catch (e) {
        log('play failed', { id, error: String(e) });
      }
    },
    [player],
  );

  const start = useCallback(
    (target: ConversationAudioTarget) => {
      log('start() autoplay', { id: target.id });
      playUri(target.id, target.uri);
    },
    [playUri],
  );

  const toggle = useCallback(
    (target: ConversationAudioTarget) => {
      const sameActive = activeIdRef.current === target.id;
      if (sameActive && status.playing) {
        log('pause() by toggle', { id: target.id });
        try {
          player.pause();
        } catch (e) {
          log('toggle pause failed', { id: target.id, error: String(e) });
        }
        return;
      }
      playUri(target.id, target.uri);
    },
    [player, status.playing, playUri],
  );

  const stop = useCallback(() => {
    if (activeIdRef.current !== null) {
      log('stop()', { id: activeIdRef.current });
    }
    try {
      if (player.playing) {
        player.pause();
      }
    } catch (e) {
      log('stop pause failed', { error: String(e) });
    }
    activeIdRef.current = null;
    activeUriRef.current = null;
    setActiveId(null);
  }, [player]);

  return {
    activeId,
    playing: status.playing,
    currentTime: status.currentTime,
    duration: status.duration,
    toggle,
    start,
    stop,
  };
}
