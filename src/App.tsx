import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ContentRenderer } from "./components/ContentRenderer";
import { MusicPlayer } from "./components/MusicPlayer";
import { MiniPlayerTrigger } from "./components/MiniPlayerTrigger";
import type { Song } from "./types";
import "./css/main.css";

const API_BASE_URL = "https://instinctually-monosodium-shawnda.ngrok-free.app";

export default function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [showLyrics, setShowLyrics] = useState(false);
  
  const searchDebounceTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSearchValueRef = useRef("");

  // Handle responsive behavior at 770px
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width <= 770;
      setIsMobileView(isMobile);
      
      // Auto-collapse sidebar at 770px
      if (isMobile) {
        setIsSidebarCollapsed(true);
        setIsSidebarOpen(false);
      } else {
        // Reset to original state on larger screens
        setIsSidebarCollapsed(false);
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Control audio playback based on isPlaying state
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio play failed:", error);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // Control volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle seeking when currentTime changes
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const toggleSidebar = () => {
    if (isMobileView) {
      setIsSidebarOpen(!isSidebarOpen);
      // On mobile, when sidebar opens, it's not collapsed (shows text)
      setIsSidebarCollapsed(!isSidebarOpen);
    } else {
      // On desktop, toggle between collapsed (icons only) and expanded (icons + text)
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleSearchWithValue = async (searchValue: string) => {
    if (!searchValue || searchValue.length < 2) {
      setSearchResults([]);
      setActiveTab("Home");
      return;
    }

    console.log('Searching with query:', searchValue);

    setIsSearching(true);
    try {
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(searchValue)}`;
      console.log('Searching:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HanyaMusic/1.0'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      if (!data || data.length === 0) {
        setSearchResults([]);
        setActiveTab("Home");
      } else {
        setSearchResults(data);
        setActiveTab("Home");
      }
    } catch (error: unknown) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to search: ${errorMessage}. Please check the console for details.`);
      setSearchResults([]);
      setActiveTab("Home");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    currentSearchValueRef.current = value; // Save the current value

    console.log('User typed in search:', value);

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setActiveTab("Home");
      setIsDebouncing(false);
      return;
    }

    // Start debouncing animation
    setIsDebouncing(true);
    
    // Wait 3 seconds after user stops typing before searching
    searchDebounceTimer.current = setTimeout(() => {
      setIsDebouncing(false);
      // Use the ref value instead of the closure-captured value
      const currentValue = currentSearchValueRef.current.trim();
      if (currentValue.length >= 2) {
        // Pass the current value from ref to handleSearch
        handleSearchWithValue(currentValue);
      }
    }, 3000);
  };

  const handleClearSearch = () => {
    console.log('User cleared search');
    setSearchQuery("");
    currentSearchValueRef.current = "";
    setSearchResults([]);
    setActiveTab("Home");
    setIsDebouncing(false);
    
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
      searchDebounceTimer.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('User pressed Enter to search with:', searchQuery);
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
        searchDebounceTimer.current = null;
      }
      setIsDebouncing(false);
      handleSearchWithValue(searchQuery.trim());
    }
  };

  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  const handlePlaySong = async (song: Song) => {
    setIsLoadingStream(true);
    try {
      const url = `${API_BASE_URL}/stream/${song.videoId}`;
      console.log('Fetching stream:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HanyaMusic/1.0'
        }
      });
      
      console.log('Stream response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stream error response:', errorText);
        throw new Error(`Failed to get stream: ${response.status}`);
      }
      
      const streamData = await response.json();
      console.log('Stream data:', streamData);
      
      setCurrentSong({
        ...song,
        stream_url: streamData.stream_url,
        format: streamData.format,
        quality: streamData.quality
      });
      setIsPlaying(true);
      setCurrentTime(0);
      setShowMusicPlayer(true);
    } catch (error: unknown) {
      console.error('Stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to load audio stream: ${errorMessage}`);
    } finally {
      setIsLoadingStream(false);
    }
  };

  const handleClosePlayer = () => {
    setShowMusicPlayer(false);
    setCurrentSong(null);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlayPause = () => {
    if (!currentSong) return;
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentSong || duration === 0) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
  };

  const handleSkipBack = () => {
    if (!currentSong) return;
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
  };

  const handleSkipForward = () => {
    if (!currentSong) return;
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
  };

  const handleToggleShuffle = () => {
  setIsShuffle(!isShuffle);
};

const handleToggleRepeat = () => {
  // Cycle through repeat modes: off -> one -> all -> off
  if (repeatMode === 'off') {
    setRepeatMode('one');
  } else if (repeatMode === 'one') {
    setRepeatMode('all');
  } else {
    setRepeatMode('off');
  }
};

const handleToggleLyrics = () => {
  setShowLyrics(!showLyrics);
  // You can implement lyrics fetching logic here
  if (!showLyrics && currentSong) {
    // Fetch lyrics for current song
    console.log('Fetching lyrics for:', currentSong.title);
  }
};

const handleToggleMenu = () => {
  // Toggle sidebar or player menu
  if (isMobileView) {
    toggleSidebar();
  }
  // Add additional menu logic if needed
};

const handleToggleMic = () => {
  // Implement voice control or search functionality
  console.log('Mic button clicked - implement voice search');
};


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentSong) {
        handleClosePlayer();
      }
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        if (currentSong) {
          togglePlayPause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSong, isPlaying]);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileView={isMobileView}
        isSidebarOpen={isSidebarOpen}
        setActiveTab={setActiveTab}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      {/* Sidebar Overlay for Mobile */}
      {isMobileView && isSidebarOpen && (
        <div 
          className="sidebar-overlay show"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsSidebarCollapsed(true);
          }}
        />
      )}

      {/* Top Bar */}
      <TopBar
        searchQuery={searchQuery}
        isSearching={isSearching}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileView={isMobileView}
        onSearchChange={handleSearchInputChange}
        onKeyPress={handleKeyPress}
        onClearSearch={handleClearSearch}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Content */}
      <div className={`main-content fade-in ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <ContentRenderer
          activeTab={activeTab}
          searchResults={searchResults}
          searchQuery={searchQuery}
          isDebouncing={isDebouncing}
          isSearching={isSearching}
          onPlaySong={handlePlaySong}
        />
      </div>

      {/* Mini Player Trigger (Floating Button) */}
      <MiniPlayerTrigger
        currentSong={currentSong}
        showMusicPlayer={showMusicPlayer}
        onShowPlayer={() => setShowMusicPlayer(true)}
      />

      {/* Music Player */}
      <MusicPlayer
        song={currentSong}
        isPlaying={isPlaying}
        isLoadingStream={isLoadingStream}
        showPlayer={showMusicPlayer}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileView={isMobileView}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        showLyrics={showLyrics}
        onClose={handleClosePlayer}
        onTogglePlay={togglePlayPause}
        onVolumeChange={handleVolumeChange}
        onProgressClick={handleProgressClick}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleLyrics={handleToggleLyrics}
        onToggleMenu={handleToggleMenu}
        onToggleMic={handleToggleMic}
      />

      {/* Audio Element - Keep it in App.tsx for centralized control */}
      {currentSong && (
        <audio
          ref={audioRef}
          key={currentSong.videoId}
          src={currentSong.stream_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Audio error:', e);
            alert('Failed to play audio. Please try another song.');
            handleClosePlayer();
          }}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}