import { parseBlob } from "music-metadata";
import type { Track } from "../types";

export interface ParsedTrack {
  track: Track;
  fileBlob: Blob;
  artBlob?: Blob;
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^./]+$/, "");
}

/** Identifies a file by its bytes, so a rename still counts as the same track. */
export async function hashFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function parseM4aFile(file: File, hash: string): Promise<ParsedTrack> {
  const id = crypto.randomUUID();
  const metadata = await parseBlob(file, { skipCovers: false }).catch(() => null);

  const common = metadata?.common;
  const picture = common?.picture?.[0];
  const lyricsTag = common?.lyrics?.find((l) => l.text);

  const track: Track = {
    id,
    title: common?.title?.trim() || stripExtension(file.name),
    artist: common?.artist?.trim() || "Unknown Artist",
    album: common?.album?.trim() || "Unknown Album",
    duration: metadata?.format.duration ?? 0,
    lyrics: lyricsTag?.text?.trim() || undefined,
    dateAdded: Date.now(),
    fileKey: id,
    artKey: picture ? `${id}-art` : undefined,
    hash,
  };

  const artBlob = picture
    ? new Blob([picture.data as BlobPart], { type: picture.format })
    : undefined;

  return { track, fileBlob: file, artBlob };
}
