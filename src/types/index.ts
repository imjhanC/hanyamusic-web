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
}