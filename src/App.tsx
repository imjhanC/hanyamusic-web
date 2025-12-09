import React, { useState, useRef, useEffect } from "react";
import { Search, Home, TrendingUp, ListMusic, Music2, Play, SkipBack, SkipForward, Volume2, User, ChevronLeft, ChevronRight, Loader } from "lucide-react";
import "./index.css"; // Import the external CSS file

const API_BASE_URL = "https://instinctually-monosodium-shawnda.ngrok-free.app";

export default function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  const searchDebounceTimer = useRef(null);
  const audioRef = useRef(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setActiveTab("Home");
      return;
    }

    setIsSearching(true);
    try {
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery.trim())}`;
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
    } catch (error) {
      console.error('Search error:', error);
      alert(`Failed to search: ${error.message}. Please check the console for details.`);
      setSearchResults([]);
      setActiveTab("Home");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setActiveTab("Home");
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    
    searchDebounceTimer.current = setTimeout(() => {
      setIsDebouncing(false);
      if (value.trim().length >= 2) {
        handleSearch();
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
        searchDebounceTimer.current = null;
      }
      setIsDebouncing(false);
      handleSearch();
    }
  };

  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []);

  const handlePlaySong = async (song) => {
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
    } catch (error) {
      console.error('Stream error:', error);
      alert(`Failed to load audio stream: ${error.message}`);
    } finally {
      setIsLoadingStream(false);
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

  const handleProgressClick = (e) => {
    if (!audioRef.current || !currentSong) return;
    
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const width = progressBar.offsetWidth;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds) => {
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

  const renderContent = () => {
    if (activeTab === "Home" && searchResults.length > 0) {
      return (
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "10px" }}>
            Search Results
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "30px" }}>
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
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    borderRadius: '12px'
                  }}
                  className="play-overlay"
                  >
                    <Play size={40} fill="white" color="white" />
                  </div>
                </div>
                <h3 className="music-card-title" title={song.title}>
                  {song.title}
                </h3>
                <p className="music-card-artist" title={song.uploader}>
                  {song.uploader}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  marginTop: '8px'
                }}>
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
          <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "10px" }}>
            Welcome to <span style={{ color: '#22c55e' }}>Hanya</span>Music
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "30px" }}>
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
        <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "10px" }}>
          {activeTab}
        </h1>
        <p style={{ color: "#6b7280", fontSize: "16px", marginBottom: "30px" }}>
          This section is under development
        </p>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {!isSidebarCollapsed && (
            <h2 className="sidebar-logo">
              <span style={{ color: '#22c55e' }}>Hanya</span>Music
            </h2>
          )}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <a
            className={`sidebar-link ${activeTab === "Home" ? "active" : ""}`}
            onClick={() => setActiveTab("Home")}
          >
            <Home size={20} style={{ display: "inline", marginRight: isSidebarCollapsed ? "0" : "10px" }} />
            {!isSidebarCollapsed && "Home"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Trending" ? "active" : ""}`}
            onClick={() => setActiveTab("Trending")}
          >
            <TrendingUp size={20} style={{ display: "inline", marginRight: isSidebarCollapsed ? "0" : "10px" }} />
            {!isSidebarCollapsed && "Trending"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Playlists" ? "active" : ""}`}
            onClick={() => setActiveTab("Playlists")}
          >
            <ListMusic size={20} style={{ display: "inline", marginRight: isSidebarCollapsed ? "0" : "10px" }} />
            {!isSidebarCollapsed && "Playlists"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Your Songs" ? "active" : ""}`}
            onClick={() => setActiveTab("Your Songs")}
          >
            <Music2 size={20} style={{ display: "inline", marginRight: isSidebarCollapsed ? "0" : "10px" }} />
            {!isSidebarCollapsed && "Your Songs"}
          </a>
        </nav>
      </div>

      {/* Top Bar */}
      <div className={`top-bar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="search-container">
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
            
            <div style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isSearching ? (
                <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: '#22c55e' }} />
              ) : isDebouncing ? (
                <div style={{ 
                  color: '#6b7280',
                  fontSize: '12px',
                  background: '#333',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  Typing...
                </div>
              ) : null}
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

      {/* Music Player */}
      <div className={`music-player ${isSidebarCollapsed ? "collapsed" : ""}`}>
        {isLoadingStream ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: '#22c55e' }} />
            <span style={{ marginLeft: '10px', color: '#9ca3af' }}>Loading stream...</span>
          </div>
        ) : currentSong ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", minWidth: "250px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundImage: `url(${currentSong.thumbnail_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: "8px"
                }}
              ></div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }} title={currentSong.title}>
                  {currentSong.title.length > 30 ? currentSong.title.substring(0, 30) + '...' : currentSong.title}
                </div>
                <div style={{ color: "#6b7280", fontSize: "12px" }} title={currentSong.uploader}>
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
              <Volume2 size={20} style={{ color: "#6b7280" }} />
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
              style={{ display: 'none' }}
            />
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "15px", minWidth: "250px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "8px"
                }}
              ></div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>No Song Playing</div>
                <div style={{ color: "#6b7280", fontSize: "12px" }}>Search and select a song</div>
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
              <Volume2 size={20} style={{ color: "#6b7280" }} />
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
      </div>
    </div>
  );
}

function getRandomColor() {
  const colors = [
    "#667eea", "#764ba2", "#f093fb", "#4facfe",
    "#43e97b", "#fa709a", "#fee140", "#30cfd0"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}