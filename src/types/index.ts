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

export interface ArtistSong {
  song_name: string;
  release_date: string;
  release_month: string;
  release_year: number;
  thumbnail: string;
  preview_url: string | null;
}

export interface ArtistSongsResponse {
  artist: string;
  total_songs: number;
  total_albums: number;
  albums: {
    [key: string]: ArtistSong[];
  };
  sample_thumbnails: string[];
}

export interface RelatedArtist {
  artist_name: string;
  image: string | null;
}

export interface RelatedArtistsResponse {
  song: string;
  related_artists: RelatedArtist[];
}