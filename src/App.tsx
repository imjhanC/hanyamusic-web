import { useState, useRef, useEffect } from "react";
import { Search, Home, TrendingUp, ListMusic, Music2, Play, SkipBack, SkipForward, Volume2, User, ChevronLeft, ChevronRight, Loader, X, Menu } from "lucide-react";
import "./index.css";

const API_BASE_URL = "https://instinctually-monosodium-shawnda.ngrok-free.app";

interface Song {
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

  /*const handleSearch = async () => {
    handleSearchWithValue(searchQuery.trim());
  };*/

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
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
    if (!audioRef.current || !currentSong) return;
    
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const width = progressBar.offsetWidth;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkipBack = () => {
    if (!audioRef.current || !currentSong) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const handleSkipForward = () => {
    if (!audioRef.current || !currentSong) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
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

  const renderContent = () => {
    // Show loading animation while debouncing
    if (isDebouncing && searchQuery.trim().length >= 2) {
      return (
        <div className="search-loading-container">
          <div className="music-visualizer">
            <div className="visualizer-bar" style={{ animationDelay: '0s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.1s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.3s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.4s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.5s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.4s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.3s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0.1s' }}></div>
            <div className="visualizer-bar" style={{ animationDelay: '0s' }}></div>
          </div>
          <h2 className="loading-text">Searching for "{searchQuery}"</h2>
          <p className="loading-subtext">Finding the best music for you...</p>
        </div>
      );
    }

    // Show searching spinner while fetching results
    if (isSearching) {
      return (
        <div className="search-loading-container">
          <Loader size={48} className="spinner" />
          <h2 className="loading-text">Loading results...</h2>
        </div>
      );
    }

    if (activeTab === "Home" && searchResults.length > 0) {
      return (
        <div>
          <h1 className="main-heading">
            Search Results
          </h1>
          <p className="main-subtitle">
            Found {searchResults.length} results for "{searchQuery}"
          </p>

          <div className="music-grid">
            {searchResults.map((song, index) => (
              <div 
                key={`${song.videoId}-${index}`} 
                className="music-card slide-up"
                onClick={() => handlePlaySong(song)}
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
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === "Home") {
      return (
        <div>
          <h1 className="main-heading">
            Welcome to <span className="brand-color">Hanya</span>Music
          </h1>
          <p className="main-subtitle">
            Search for your favorite music using the search bar above
          </p>

          <div className="music-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="music-card slide-up">
                <div
                  className="music-card-image"
                  style={{
                    background: `linear-gradient(135deg, 
                      ${getRandomColor()} 0%, 
                      ${getRandomColor()} 100%)`
                  }}
                ></div>
                <h3 className="music-card-title">Trending Song {item}</h3>
                <p className="music-card-artist">Popular Artist</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h1 className="main-heading">
          {activeTab}
        </h1>
        <p className="main-subtitle">
          This section is under development
        </p>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileView ? "mobile" : ""} ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && (
            <h2 className="sidebar-logo">
              <span className="brand-color">Hanya</span>Music
            </h2>
          )}
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
          >
            {isMobileView ? (
              isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />
            ) : (
              isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />
            )}
          </button>
        </div>
        <nav className="sidebar-nav">
          <a
            className={`sidebar-link ${activeTab === "Home" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Home");
              if (isMobileView && isSidebarOpen) {
                setIsSidebarOpen(false);
                setIsSidebarCollapsed(true);
              }
            }}
          >
            <Home size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Home"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Trending" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Trending");
              if (isMobileView && isSidebarOpen) {
                setIsSidebarOpen(false);
                setIsSidebarCollapsed(true);
              }
            }}
          >
            <TrendingUp size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Trending"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Playlists" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Playlists");
              if (isMobileView && isSidebarOpen) {
                setIsSidebarOpen(false);
                setIsSidebarCollapsed(true);
              }
            }}
          >
            <ListMusic size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Playlists"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Your Songs" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("Your Songs");
              if (isMobileView && isSidebarOpen) {
                setIsSidebarOpen(false);
                setIsSidebarCollapsed(true);
              }
            }}
          >
            <Music2 size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Your Songs"}
          </a>
        </nav>
      </div>

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
      <div className={`top-bar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="search-container">
          {/* Hamburger menu button for mobile */}
          {isMobileView && (
            <button
              className="hamburger-menu-btn"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
          )}
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search artists, songs, or albums..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
            />
            <Search className="search-icon" size={20} />
            
            {/* Clear search button */}
            {searchQuery && !isSearching && (
              <button
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            
            <div className="search-status">
              {isSearching && (
                <Loader size={20} className="spinner" />
              )}
            </div>
          </div>
        </div>
        <div className="user-icon">
          <User size={22} />
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content fade-in ${isSidebarCollapsed ? "collapsed" : ""}`}>
        {renderContent()}
      </div>

      {/* Mini Player Trigger (Floating Button) */}
      {!showMusicPlayer && currentSong && (
        <div 
          className="mini-player-trigger"
          onClick={() => setShowMusicPlayer(true)}
          title="Show music player"
        >
          <Music2 size={24} color="white" />
        </div>
      )}

      {/* Music Player */}
      <div className={`music-player ${isSidebarCollapsed ? "collapsed" : ""} ${showMusicPlayer ? "show" : ""} ${isMobileView ? "mobile" : ""}`}>
        {showMusicPlayer && (
          <>
            <button
              className="close-player-btn"
              onClick={handleClosePlayer}
            >
              <X size={18} />
            </button>
            
            {isLoadingStream ? (
              <div className="loading-stream">
                <Loader size={24} className="spinner" />
                <span className="loading-text">Loading stream...</span>
              </div>
            ) : currentSong ? (
              <>
                <div className="player-song-info">
                  <div
                    className="player-thumbnail"
                    style={{
                      backgroundImage: `url(${currentSong.thumbnail_url})`,
                    }}
                  ></div>
                  <div className="player-song-details">
                    <div className="player-song-title" title={currentSong.title}>
                      {currentSong.title.length > 30 ? currentSong.title.substring(0, 30) + '...' : currentSong.title}
                    </div>
                    <div className="player-song-artist" title={currentSong.uploader}>
                      {currentSong.uploader}
                    </div>
                  </div>
                </div>

                <div className="player-controls">
                  <button className="control-btn" onClick={handleSkipBack}>
                    <SkipBack size={18} />
                  </button>
                  <button className="control-btn play-btn" onClick={togglePlayPause}>
                    {isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <rect x="6" y="4" width="4" height="16" rx="1"/>
                        <rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                    ) : (
                      <Play size={20} fill="white" />
                    )}
                  </button>
                  <button className="control-btn" onClick={handleSkipForward}>
                    <SkipForward size={18} />
                  </button>
                </div>

                <div className="progress-container">
                  <div className="progress-bar" onClick={handleProgressClick}>
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

                <div className="volume-control">
                  <Volume2 size={20} className="volume-icon" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>

                <audio
                  ref={audioRef}
                  key={currentSong.videoId}
                  src={currentSong.stream_url}
                  autoPlay
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
                    <SkipBack size={18} />
                  </button>
                  <button className="control-btn play-btn" disabled>
                    <Play size={20} fill="white" />
                  </button>
                  <button className="control-btn" disabled>
                    <SkipForward size={18} />
                  </button>
                </div>

                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "0%" }}></div>
                  </div>
                  <div className="progress-time">
                    <span>0:00</span>
                    <span>0:00</span>
                  </div>
                </div>

                <div className="volume-control">
                  <Volume2 size={20} className="volume-icon" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="70"
                    className="volume-slider"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getRandomColor(): string {
  const colors = [
    "#667eea", "#764ba2", "#f093fb", "#4facfe",
    "#43e97b", "#fa709a", "#fee140", "#30cfd0"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}