export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  lyrics?: string;
  dateAdded: number;
  fileKey: string;
  artKey?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  dateCreated: number;
}

export type RepeatMode = "off" | "all" | "one";

export type QueueSource =
  | { type: "songs" }
  | { type: "album"; album: string }
  | { type: "artist"; artist: string }
  | { type: "playlist"; playlistId: string }
  | { type: "search" };
