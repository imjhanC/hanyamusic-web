import { Play } from "lucide-react";
import type { Song } from "../types";

interface MusicCardProps {
  song: Song;
  index: number;
  onPlay: (song: Song) => void;
}

export const MusicCard = ({ song, index, onPlay }: MusicCardProps) => {
  return (
    <div 
      key={`${song.videoId}-${index}`} 
      className="music-card slide-up"
      onClick={() => onPlay(song)}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="music-card-image"
        style={{
          backgroundImage: `url(${song.thumbnail_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <div className="play-overlay">
          <Play size={40} fill="white" color="white" />
        </div>
      </div>
      <h3 className="music-card-title" title={song.title}>
        <span>{song.title}</span>
      </h3>
      <p className="music-card-artist" title={song.uploader}>
        <span>{song.uploader}</span>
      </p>
      <div className="song-info">
        <span>{song.duration}</span>
        <span>{song.view_count}</span>
      </div>
    </div>
  );
};