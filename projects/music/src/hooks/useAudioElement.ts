import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store/playerStore";
import { getTrackFile, getTrackArt } from "../lib/db";

export function useAudioElement() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }
  const objectUrlRef = useRef<string | null>(null);
  const artUrlRef = useRef<string | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack());
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seekRequest = usePlayerStore((s) => s.seekRequest);
  const clearSeekRequest = usePlayerStore((s) => s.clearSeekRequest);

  // Load a new source whenever the current track changes.
  useEffect(() => {
    let cancelled = false;
    const audio = audioRef.current!;

    if (!currentTrack) {
      audio.pause();
      audio.removeAttribute("src");
      if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
      return;
    }

    (async () => {
      const [fileBlob, artBlob] = await Promise.all([
        getTrackFile(currentTrack.fileKey),
        currentTrack.artKey ? getTrackArt(currentTrack.artKey) : Promise.resolve(undefined),
      ]);
      if (cancelled || !fileBlob) return;

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(fileBlob);
      objectUrlRef.current = url;
      audio.src = url;
      audio.currentTime = 0;

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

      if (usePlayerStore.getState().isPlaying) {
        audio.play().catch(() => {});
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
      audio.play().catch(() => {});
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
    audioRef.current!.currentTime = seekRequest;
    clearSeekRequest();
  }, [seekRequest, clearSeekRequest]);

  // Native element event listeners + Media Session action handlers (mount once).
  useEffect(() => {
    const audio = audioRef.current!;
    const { setProgress, setDuration, onTrackEnded, next, prev, seek, setPlaying } =
      usePlayerStore.getState();

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => onTrackEnded();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
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
    };
  }, []);
}
