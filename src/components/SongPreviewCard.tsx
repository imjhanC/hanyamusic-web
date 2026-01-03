import { useRef, useState, useEffect } from "react";
import { Play, Volume2 } from "lucide-react";
import type { TopSong } from "../types";
import type { Song } from "../types";

interface SongPreviewCardProps {
  song: TopSong;
  index: number;
  onPlay: (song: Song) => void;
  onSearch?: (query: string) => void;
}

// Global ref to track currently playing preview
let currentPreviewAudio: HTMLAudioElement | null = null;

export const SongPreviewCard = ({ song, index, onPlay, onSearch }: SongPreviewCardProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (!song.preview_url) return;

    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Set 1 second delay before playing preview
    previewTimeoutRef.current = setTimeout(() => {
      // Stop any currently playing preview
      if (currentPreviewAudio && currentPreviewAudio !== audioRef.current) {
        currentPreviewAudio.pause();
        currentPreviewAudio.currentTime = 0;
      }

      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        const audio = new Audio(song.preview_url);
        audio.volume = 0.5; // Set preview volume to 50%
        audioRef.current = audio;
        
        audio.addEventListener('ended', () => {
          setIsPreviewPlaying(false);
          currentPreviewAudio = null;
        });
      }

      // Play preview
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPreviewPlaying(true);
            currentPreviewAudio = audioRef.current;
          })
          .catch((error) => {
            console.error('Preview play failed:', error);
          });
      }
    }, 1000); // 1 second delay
  };

  const handleMouseLeave = () => {
    // Clear the timeout if user leaves before delay completes
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Stop preview if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPreviewPlaying(false);
      if (currentPreviewAudio === audioRef.current) {
        currentPreviewAudio = null;
      }
    }
  };

  const handleClick = () => {
    // Stop preview if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPreviewPlaying(false);
      if (currentPreviewAudio === audioRef.current) {
        currentPreviewAudio = null;
      }
    }

    // Clear timeout if exists
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Trigger search for the song instead of trying to play with placeholder videoId
    if (onSearch) {
      onSearch(`${song.song_name} ${song.artist_name}`);
    } else if (onPlay) {
      // Fallback: try to play (will fail but at least attempt)
      const songForPlay: Song = {
        videoId: `preview-${song.rank}`,
        title: song.song_name,
        uploader: song.artist_name,
        thumbnail_url: song.thumbnail,
        duration: '0:00',
        view_count: '',
        preview_url: song.preview_url
      };
      onPlay(songForPlay);
    } else {
      // Last resort: show message
      alert(`Please search for "${song.song_name}" to play the full song.`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (currentPreviewAudio === audioRef.current) {
        currentPreviewAudio = null;
      }
    };
  }, []);

  return (
    <div 
      key={`song-${song.rank}-${index}`} 
      className={`music-card slide-up ${isPreviewPlaying ? 'preview-playing' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="music-card-image"
        style={{
          backgroundImage: `url(${song.thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <div className="play-overlay">
          {isPreviewPlaying ? (
            <Volume2 size={40} fill="white" color="white" />
          ) : (
            <Play size={40} fill="white" color="white" />
          )}
        </div>
        {isPreviewPlaying && (
          <div className="preview-indicator">
            <div className="preview-wave"></div>
          </div>
        )}
      </div>
      <h3 className="music-card-title" title={song.song_name}>
        <span>{song.song_name}</span>
      </h3>
      <p className="music-card-artist" title={song.artist_name}>
        <span>{song.artist_name}</span>
      </p>
    </div>
  );
};

