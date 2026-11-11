import { parseBlob } from "music-metadata";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { Track } from "../types";

export interface ParsedTrack {
  track: Track;
  fileBlob: Blob;
  artBlob?: Blob;
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^./]+$/, "");
}

export async function hashBuffer(data: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

/** Identifies a file by its bytes, so a rename still counts as the same track. */
export async function hashFile(file: File): Promise<string> {
  try {
    const hasher = sha256.create();
    for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
      const chunk = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
      hasher.update(new Uint8Array(chunk));
    }
    return bytesToHex(hasher.digest());
  } catch {
    return hashBuffer(await file.arrayBuffer());
  }
}

export async function parseM4aFile(file: File, hash: string): Promise<ParsedTrack> {
  const id = crypto.randomUUID();
  const metadata = await parseBlob(file, { skipCovers: false }).catch(() => null);

  const common = metadata?.common;
  const picture = common?.picture?.[0];
  const lyricsTag = common?.lyrics?.find((l) => l.text);
  // picture.data is Uint8Array<ArrayBufferLike>; copy into a plain ArrayBuffer-backed view for crypto.subtle.
  const artKey = picture ? await hashBuffer(new Uint8Array(picture.data)) : undefined;

  const track: Track = {
    id,
    title: common?.title?.trim() || stripExtension(file.name),
    artist: common?.artist?.trim() || "Unknown Artist",
    album: common?.album?.trim() || "Unknown Album",
    duration: metadata?.format.duration ?? 0,
    lyrics: lyricsTag?.text?.trim() || undefined,
    dateAdded: Date.now(),
    fileKey: id,
    artKey,
    hash,
    trackNumber: common?.track?.no ?? undefined,
    diskNumber: common?.disk?.no ?? undefined,
    genre: common?.genre?.[0]?.trim() || undefined,
    year: common?.year ?? undefined,
    albumArtist: common?.albumartist?.trim() || undefined,
  };

  const artBlob = picture
    ? new Blob([picture.data as BlobPart], { type: picture.format })
    : undefined;

  return { track, fileBlob: file, artBlob };
}
