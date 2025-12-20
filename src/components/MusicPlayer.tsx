import { 
  X, SkipBack, SkipForward, Play, Volume2, Loader, 
  Shuffle, Repeat, Repeat1, Mic, Menu, Music 
} from "lucide-react";
import type { Song } from "../types";

interface MusicPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  isLoadingStream: boolean;
  showPlayer: boolean;
  isSidebarCollapsed: boolean;
  isMobileView: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all'; // 'off', 'one', 'all'
  showLyrics: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLyrics: () => void;
  onToggleMenu?: () => void; // Optional for mobile hamburger
  onToggleMic?: () => void; // Optional for mic functionality
}

export const MusicPlayer = ({
  song,
  isPlaying,
  isLoadingStream,
  showPlayer,
  isSidebarCollapsed,
  isMobileView,
  currentTime,
  duration,
  volume,
  isShuffle,
  repeatMode,
  showLyrics,
  onClose,
  onTogglePlay,
  onVolumeChange,
  onProgressClick,
  onSkipBack,
  onSkipForward,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLyrics,
  onToggleMenu,
  onToggleMic
}: MusicPlayerProps) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showPlayer) return null;

  return (
    <div className={`music-player ${isSidebarCollapsed ? "collapsed" : ""} ${showPlayer ? "show" : ""} ${isMobileView ? "mobile" : ""}`}>
      {showPlayer && (
        <>
          <button
            className="close-player-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
          
          {isLoadingStream ? (
            <div className="loading-stream">
              <Loader size={24} className="spinner" />
              <span className="loading-text">Loading stream...</span>
            </div>
          ) : song ? (
            <>
              <div className="player-song-info">
                <div
                  className="player-thumbnail"
                  style={{
                    backgroundImage: `url(${song.thumbnail_url})`,
                  }}
                ></div>
                <div className="player-song-details">
                  <div className="player-song-title" title={song.title}>
                    {song.title.length > 30 ? song.title.substring(0, 30) + '...' : song.title}
                  </div>
                  <div className="player-song-artist" title={song.uploader}>
                    {song.uploader}
                  </div>
                </div>
              </div>

              <div className="player-controls">
                {/* Shuffle Button - Left of main controls */}
                <button 
                  className={`control-btn shuffle-btn ${isShuffle ? 'active' : ''}`}
                  onClick={onToggleShuffle}
                  title={isShuffle ? "Shuffle enabled" : "Enable shuffle"}
                >
                  <Shuffle size={18} />
                </button>

                <button className="control-btn" onClick={onSkipBack}>
                  <SkipBack size={18} />
                </button>
                
                <button className="control-btn play-btn" onClick={onTogglePlay}>
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <rect x="6" y="4" width="4" height="16" rx="1"/>
                      <rect x="14" y="4" width="4" height="16" rx="1"/>
                    </svg>
                  ) : (
                    <Play size={20} fill="white" />
                  )}
                </button>
                
                <button className="control-btn" onClick={onSkipForward}>
                  <SkipForward size={18} />
                </button>

                {/* Repeat Button - Right of main controls */}
                <button 
                  className={`control-btn repeat-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                  onClick={onToggleRepeat}
                  title={repeatMode === 'one' ? "Repeat one" : repeatMode === 'all' ? "Repeat all" : "Repeat off"}
                >
                  {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
              </div>

              {/* Compact Progress Container */}
              <div className="progress-container compact">
                <div className="progress-bar" onClick={onProgressClick}>
                  <div 
                    className="progress-fill" 
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="progress-time">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Middle Control Buttons */}
              <div className="middle-controls">
                {/* Hamburger Icon (optional for mobile) */}
                {onToggleMenu && (
                  <button className="middle-control-btn" onClick={onToggleMenu}>
                    <Menu size={18} />
                  </button>
                )}
                
                {/* Mic Icon */}
                {onToggleMic && (
                  <button className="middle-control-btn" onClick={onToggleMic}>
                    <Mic size={18} />
                  </button>
                )}
                
                {/* Lyrics Icon */}
                <button 
                  className={`middle-control-btn lyrics-btn ${showLyrics ? 'active' : ''}`}
                  onClick={onToggleLyrics}
                  title={showLyrics ? "Hide lyrics" : "Show lyrics"}
                >
                  <Music size={18} />
                </button>
              </div>

              {/* Volume Control */}
              <div className="volume-control">
                <Volume2 size={20} className="volume-icon" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={onVolumeChange}
                  className="volume-slider"
                />
              </div>
            </>
          ) : (
            <>
              <div className="player-song-info">
                <div
                  className="player-thumbnail"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                ></div>
                <div className="player-song-details">
                  <div className="player-song-title">No Song Playing</div>
                  <div className="player-song-artist">Search and select a song</div>
                </div>
              </div>

              <div className="player-controls">
                <button className="control-btn" disabled>
                  <Shuffle size={18} />
                </button>
                <button className="control-btn" disabled>
                  <SkipBack size={18} />
                </button>
                <button className="control-btn play-btn" disabled>
                  <Play size={20} fill="white" />
                </button>
                <button className="control-btn" disabled>
                  <SkipForward size={18} />
                </button>
                <button className="control-btn" disabled>
                  <Repeat size={18} />
                </button>
              </div>

              <div className="progress-container compact">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "0%" }}></div>
                </div>
                <div className="progress-time">
                  <span>0:00</span>
                  <span>0:00</span>
                </div>
              </div>

              <div className="middle-controls">
                {onToggleMenu && (
                  <button className="middle-control-btn" disabled>
                    <Menu size={18} />
                  </button>
                )}
                {onToggleMic && (
                  <button className="middle-control-btn" disabled>
                    <Mic size={18} />
                  </button>
                )}
                <button className="middle-control-btn" disabled>
                  <Music size={18} />
                </button>
              </div>

              <div className="volume-control">
                <Volume2 size={20} className="volume-icon" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="70"
                  className="volume-slider"
                  disabled
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};