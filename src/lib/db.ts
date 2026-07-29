import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Track, Playlist } from "../types";

interface MusicDB extends DBSchema {
  tracks: { key: string; value: Track };
  trackFiles: { key: string; value: Blob };
  trackArt: { key: string; value: Blob };
  playlists: { key: string; value: Playlist };
}

let dbPromise: Promise<IDBPDatabase<MusicDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MusicDB>("mapp-music", 1, {
      upgrade(db) {
        db.createObjectStore("tracks", { keyPath: "id" });
        db.createObjectStore("trackFiles");
        db.createObjectStore("trackArt");
        db.createObjectStore("playlists", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function addTrack(track: Track, fileBlob: Blob, artBlob?: Blob) {
  const db = await getDB();
  const tx = db.transaction(["tracks", "trackFiles", "trackArt"], "readwrite");
  await Promise.all([
    tx.objectStore("tracks").put(track),
    tx.objectStore("trackFiles").put(fileBlob, track.fileKey),
    artBlob && track.artKey ? tx.objectStore("trackArt").put(artBlob, track.artKey) : Promise.resolve(),
    tx.done,
  ]);
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  return db.getAll("tracks");
}

export async function getTrackFile(fileKey: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get("trackFiles", fileKey);
}

export async function getTrackArt(artKey: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get("trackArt", artKey);
}

export async function deleteTrack(track: Track) {
  const db = await getDB();
  const tx = db.transaction(["tracks", "trackFiles", "trackArt"], "readwrite");
  await Promise.all([
    tx.objectStore("tracks").delete(track.id),
    tx.objectStore("trackFiles").delete(track.fileKey),
    track.artKey ? tx.objectStore("trackArt").delete(track.artKey) : Promise.resolve(),
    tx.done,
  ]);
}

export async function clearAll() {
  const db = await getDB();
  const tx = db.transaction(["tracks", "trackFiles", "trackArt", "playlists"], "readwrite");
  await Promise.all([
    tx.objectStore("tracks").clear(),
    tx.objectStore("trackFiles").clear(),
    tx.objectStore("trackArt").clear(),
    tx.objectStore("playlists").clear(),
    tx.done,
  ]);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll("playlists");
}

export async function savePlaylist(playlist: Playlist) {
  const db = await getDB();
  await db.put("playlists", playlist);
}

export async function deletePlaylist(id: string) {
  const db = await getDB();
  await db.delete("playlists", id);
}
