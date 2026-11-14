import { useEffect, useRef } from "react";
import type { Track } from "../types";
import { usePlayerStore } from "../store/playerStore";
import { getTrackFile, getTrackArt } from "../lib/db";

function getNextTrack(): Track | null {
  const { queue, playOrder, orderPos, repeat } = usePlayerStore.getState();
  if (repeat === "one") return null;
  let nextQueueIndex: number | undefined;
  if (orderPos + 1 < playOrder.length) {
    nextQueueIndex = playOrder[orderPos + 1];
  } else if (repeat === "all" && playOrder.length > 0) {
    nextQueueIndex = playOrder[0];
  }
  if (nextQueueIndex === undefined) return null;
  return queue[nextQueueIndex] ?? null;
}

function updatePositionState(duration: number, position: number) {
  if (!("mediaSession" in navigator) || typeof navigator.mediaSession.setPositionState !== "function") {
    return;
  }
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isFinite(position) ||
    position < 0
  ) {
    return;
  }
  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: Math.min(position, duration),
      playbackRate: 1.0,
    });
  } catch {
    // Unsupported or rejected position state; ignore silently.
  }
}

export function useAudioElement() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }
  const objectUrlRef = useRef<string | null>(null);
  const artUrlRef = useRef<string | null>(null);
  const prefetchedRef = useRef<{ trackId: string; blob: Blob; objectUrl: string } | null>(null);
  const prefetchedForTrackIdRef = useRef<string | null>(null);
  // Timestamp of the last src swap, to filter out the stale pause event the
  // browser fires for the old resource when a new track starts.
  const lastSrcChangeRef = useRef(0);
  // Id of the track whose source is actually loaded in the element.
  // The sync effect must not call play() before the async IndexedDB load
  // finishes: until then audio.src still holds the previous track (or
  // nothing on first play), and a play() there rejects and would wrongly
  // be reported as a playback failure. The load effect starts playback
  // once the src is ready, so this ref is the only gate the sync effect
  // needs.
  const loadedTrackIdRef = useRef<string | null>(null);
  // Set when the element paused while the store still said playing, i.e.
  // the pause came from the system (incoming call, alarm) rather than the
  // user. A user pause flips the store's isPlaying to false BEFORE the
  // element pauses (the sync effect calls audio.pause()), so by the time
  // the pause event arrives the store already says paused — that is the
  // discriminator. iOS does not auto-resume web audio after the
  // interruption ends, so a foreground event tries to resume instead.
  const interruptedRef = useRef(false);

  const revokeUrls = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (artUrlRef.current) {
      URL.revokeObjectURL(artUrlRef.current);
      artUrlRef.current = null;
    }
    if (prefetchedRef.current?.objectUrl) {
      URL.revokeObjectURL(prefetchedRef.current.objectUrl);
      prefetchedRef.current = null;
    }
  };

  const checkAndPrefetchNextTrack = () => {
    const current = usePlayerStore.getState().currentTrack();
    if (!current) return;
    if (prefetchedForTrackIdRef.current === current.id) return;

    const nextTrack = getNextTrack();
    if (!nextTrack) return;
    if (prefetchedRef.current?.trackId === nextTrack.id) return;

    prefetchedForTrackIdRef.current = current.id;
    const targetTrackId = nextTrack.id;

    getTrackFile(nextTrack.fileKey)
      .then((blob) => {
        if (!blob) return;
        const currentNow = usePlayerStore.getState().currentTrack();
        if (currentNow?.id !== current.id) return;

        if (prefetchedRef.current?.objectUrl) {
          URL.revokeObjectURL(prefetchedRef.current.objectUrl);
        }
        prefetchedRef.current = {
          trackId: targetTrackId,
          blob,
          objectUrl: URL.createObjectURL(blob),
        };
      })
      .catch(() => {
        // 프리페치 실패(IndexedDB 오류 등)는 조용히 무시하고 기존 전환 경로가 그대로 동작하게 한다.
      });
  };

  const currentTrack = usePlayerStore((s) => s.currentTrack());
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seekRequest = usePlayerStore((s) => s.seekRequest);
  const clearSeekRequest = usePlayerStore((s) => s.clearSeekRequest);

  // Load a new source whenever the current track changes.
  useEffect(() => {
    let cancelled = false;
    const audio = audioRef.current!;

    // A new track (or no track) makes any earlier interruption moot:
    // never resume the old track after a switch.
    interruptedRef.current = false;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute("src");
      loadedTrackIdRef.current = null;
      if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
      revokeUrls();
      return;
    }

    const prefetched = prefetchedRef.current;
    prefetchedRef.current = null;
    const isPrefetchMatch = prefetched?.trackId === currentTrack.id;
    if (prefetched && !isPrefetchMatch && prefetched.objectUrl) {
      URL.revokeObjectURL(prefetched.objectUrl);
    }
    const matchingPrefetch = isPrefetchMatch ? prefetched : null;

    (async () => {
      const artPromise = currentTrack.artKey
        ? getTrackArt(currentTrack.artKey)
        : Promise.resolve(undefined);

      let fileBlob: Blob | undefined;
      let url: string | undefined;

      if (matchingPrefetch) {
        fileBlob = matchingPrefetch.blob;
        url = matchingPrefetch.objectUrl;
      } else {
        fileBlob = await getTrackFile(currentTrack.fileKey);
      }

      if (cancelled || !fileBlob) {
        if (matchingPrefetch?.objectUrl) {
          URL.revokeObjectURL(matchingPrefetch.objectUrl);
        }
        // A genuinely missing file (not a superseded load) is a real
        // failure: stop and tell the user, instead of leaving the player
        // stuck on "playing" with nothing loaded.
        if (!cancelled) {
          loadedTrackIdRef.current = null;
          const { setPlaying, setPlaybackError } = usePlayerStore.getState();
          setPlaying(false);
          setPlaybackError("재생할 수 없습니다. 다시 눌러주세요.");
        }
        return;
      }

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (!url) {
        url = URL.createObjectURL(fileBlob);
      }
      objectUrlRef.current = url;
      audio.src = url;
      lastSrcChangeRef.current = Date.now();
      loadedTrackIdRef.current = currentTrack.id;
      const initialProgress = usePlayerStore.getState().progress;
      audio.currentTime = initialProgress > 0 ? initialProgress : 0;

      if (usePlayerStore.getState().isPlaying) {
        audio.play().catch(() => {
          const { setPlaying, setPlaybackError } = usePlayerStore.getState();
          setPlaying(false);
          setPlaybackError("재생할 수 없습니다. 다시 눌러주세요.");
        });
      }

      const artBlob = await artPromise;
      if (cancelled) return;

      if (artUrlRef.current) URL.revokeObjectURL(artUrlRef.current);
      artUrlRef.current = artBlob ? URL.createObjectURL(artBlob) : null;

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          artwork: artUrlRef.current
            ? [{ src: artUrlRef.current, sizes: "512x512", type: artBlob!.type }]
            : [],
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Keep native playback state in sync with the store.
  useEffect(() => {
    const audio = audioRef.current!;
    if (isPlaying) {
      // The user (or an auto-resume) asked to play: any earlier
      // interruption is settled, so a later foreground event must not
      // resume on its own.
      interruptedRef.current = false;
      // Play only when the current track's source is actually loaded.
      // Before the async load finishes, audio.src still holds the previous
      // track (or nothing on first play): a play() there rejects, and that
      // rejection is not a real failure — the load effect starts playback
      // once the src is ready. Skipping here is what fixes the first-play
      // "재생할 수 없습니다" error.
      if (currentTrack?.id && loadedTrackIdRef.current === currentTrack.id) {
        audio.play().catch(() => {
          const { setPlaying, setPlaybackError } = usePlayerStore.getState();
          setPlaying(false);
          setPlaybackError("재생할 수 없습니다. 다시 눌러주세요.");
        });
      }
    } else {
      audio.pause();
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying, currentTrack?.id]);

  // Handle imperative seek requests from the UI.
  useEffect(() => {
    if (seekRequest === null) return;
    const audio = audioRef.current!;
    audio.currentTime = seekRequest;
    // Same gate as the sync effect: a seek issued while a new track's
    // source is still loading must not play() on the stale/empty src.
    // The seek position itself is already in the store's progress, which
    // the load effect applies once the src is ready.
    const current = usePlayerStore.getState().currentTrack();
    if (
      usePlayerStore.getState().isPlaying &&
      current &&
      loadedTrackIdRef.current === current.id
    ) {
      audio.play().catch(() => {
        const { setPlaying, setPlaybackError } = usePlayerStore.getState();
        setPlaying(false);
        setPlaybackError("재생할 수 없습니다. 다시 눌러주세요.");
      });
    }
    clearSeekRequest();
  }, [seekRequest, clearSeekRequest]);

  // Native element event listeners + Media Session action handlers (mount once).
  useEffect(() => {
    const audio = audioRef.current!;
    const { setProgress, setDuration, onTrackEnded, next, prev, seek, setPlaying } =
      usePlayerStore.getState();

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
      updatePositionState(audio.duration, audio.currentTime);

      if (
        audio.duration > 0 &&
        Number.isFinite(audio.duration) &&
        audio.duration - audio.currentTime <= 15
      ) {
        checkAndPrefetchNextTrack();
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      const { progress } = usePlayerStore.getState();
      if (progress > 0 && Math.abs(audio.currentTime - progress) > 0.5) {
        audio.currentTime = progress;
      }
      updatePositionState(audio.duration, audio.currentTime);
    };
    const onEnded = () => {
      // The track finished on its own; there is nothing to resume.
      interruptedRef.current = false;
      onTrackEnded();
    };
    // Swapping src on a playing element makes the browser fire a pause event
    // for the old resource; that stale event must not stop the new track.
    // A genuine system pause (call, alarm) arrives well after the swap.
    const onPause = () => {
      if (Date.now() - lastSrcChangeRef.current < 1000) return;
      // A user pause flips the store's isPlaying to false BEFORE the
      // element pauses (the sync effect calls audio.pause()), so when this
      // event arrives the store already says paused. A system interruption
      // pauses the element while the store still says playing — that is
      // the discriminator. Record the interruption, then keep the existing
      // behaviour of showing paused during the call.
      if (usePlayerStore.getState().isPlaying) {
        interruptedRef.current = true;
      } else {
        interruptedRef.current = false;
      }
      setPlaying(false);
    };
    const onError = () => setPlaying(false);

    // iOS does not auto-resume web audio after a system interruption
    // (incoming call, alarm) ends. The interruption is recorded in
    // onPause; when the app comes back to the foreground, try once to
    // resume at the same position.
    const tryResumeAfterInterruption = () => {
      if (!interruptedRef.current) return;
      // Not foregrounded yet (e.g. a focus event while still hidden):
      // keep the flag so the later foreground event can still resume.
      if (document.visibilityState !== "visible") return;
      const current = usePlayerStore.getState().currentTrack();
      if (!current || loadedTrackIdRef.current !== current.id) {
        interruptedRef.current = false;
        return;
      }
      if (!audio.paused) {
        interruptedRef.current = false;
        return;
      }
      interruptedRef.current = false;
      audio.play().then(() => {
        // Sync the store to playing. The sync effect calling play() again
        // on the already-playing element is a harmless no-op.
        usePlayerStore.getState().setPlaying(true);
      }).catch(() => {
        // Auto-resume failed (e.g. the audio session is not ready yet):
        // stay paused silently. Manual play is the fallback — never show
        // the "재생할 수 없습니다" error for an auto-resume, and never
        // retry in a loop.
      });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tryResumeAfterInterruption();
    };
    const onWindowFocus = () => tryResumeAfterInterruption();
    const onPageShow = () => tryResumeAfterInterruption();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("pageshow", onPageShow);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
          updatePositionState(audio.duration, details.seekTime);
        }
      });
      // iOS is a known WebKit bug (webkit.org/b/229068): it keeps showing the
      // 10s skip icons on the lock screen regardless of previoustrack/nexttrack
      // being registered. Nulling seekforward/seekbackward doesn't remove the
      // icons either, so instead we wire them to next/prev — the icon stays
      // wrong but tapping it actually changes track.
      navigator.mediaSession.setActionHandler("seekforward", () => next());
      navigator.mediaSession.setActionHandler("seekbackward", () => prev());
    }

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("pageshow", onPageShow);
      revokeUrls();
    };
  }, []);
}
