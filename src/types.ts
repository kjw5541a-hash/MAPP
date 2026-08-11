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
  /** SHA-256 of the source file, used to skip re-imports. Absent on tracks
   *  imported before this existed. */
  hash?: string;
  liked?: boolean;
  /** Manual sort key within the liked list, set when a track is liked. */
  likeOrder?: number;
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
  | { type: "playlist"; playlistId: string };
