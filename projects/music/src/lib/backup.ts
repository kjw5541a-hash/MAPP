import type { Track, Playlist, LibraryBackup } from "../types";

/**
 * Exports library metadata (tracks with like status, and playlists) as a JSON file.
 * Audio and artwork blob payloads are excluded to avoid excessive file size.
 *
 * Uses Web Share API on mobile (iOS/Android) so users can tap "Save to Files"
 * and directly choose their music folder without Safari opening the raw JSON in a new tab.
 * Falls back to File System Access API (showSaveFilePicker) on desktop or direct download.
 */
export async function exportLibraryBackup(tracks: Track[], playlists: Playlist[]): Promise<void> {
  const backup: LibraryBackup = {
    version: 1,
    exportDate: Date.now(),
    tracks: tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      lyrics: t.lyrics,
      dateAdded: t.dateAdded,
      hash: t.hash,
      liked: t.liked,
      likeOrder: t.likeOrder,
    })),
    playlists: playlists.map((p) => ({
      id: p.id,
      name: p.name,
      trackIds: p.trackIds,
      dateCreated: p.dateCreated,
      order: p.order,
    })),
  };

  const json = JSON.stringify(backup, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `mapp-backup-${dateStr}.json`;

  // 1. Web Share API (iOS Safari / PWA):
  // iOS에서 a[download] 클릭 시 JSON 텍스트 원문이 화면에 열려버리는 현상을 방지하고,
  // 공유 시트의 '파일에 저장'을 통해 사용자가 음원을 가져왔던 폴더로 직접 저장할 수 있게 함.
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      const file = new File([json], fileName, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "MAPP 라이브러리 백업",
        });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
    }
  }

  // 2. File System Access API (Desktop Chrome / Edge):
  // 사용자가 음원 폴더를 직접 지정해서 저장할 수 있도록 파일 저장 피커 제공
  const win = typeof window !== "undefined" ? (window as unknown as { showSaveFilePicker?: (options: unknown) => Promise<{ createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }> }) : undefined;
  if (win && typeof win.showSaveFilePicker === "function") {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "MAPP 백업 파일 (JSON)",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
    }
  }

  // 3. Fallback: <a download> (Safari에서 텍스트로 열리지 않도록 octet-stream 지정)
  const blob = new Blob([json], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
