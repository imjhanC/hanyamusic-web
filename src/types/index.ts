export interface Song {
  videoId: string;
  title: string;
  uploader: string;
  thumbnail_url: string;
  duration: string;
  view_count: string;
  stream_url?: string;
  format?: string;
  quality?: string;
  preview_url?: string;
}

export interface TopArtist {
  rank: number;
  artist_name: string;
  thumbnail: string;
}

export interface TopSong {
  rank: number;
  song_name: string;
  artist_name: string;
  thumbnail: string;
  preview_url: string;
}

export interface TopArtistsResponse {
  total_artists: number;
  artists: TopArtist[];
  sample_thumbnails: string[];
}

export interface TopSongsResponse {
  total_songs: number;
  songs: TopSong[];
  sample_thumbnails: string[];
}

export interface CountrySongsResponse {
  country: string;
  total_songs: number;
  songs: TopSong[];
  sample_thumbnails: string[];
}