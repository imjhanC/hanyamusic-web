import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ContentRenderer } from "./components/ContentRenderer";
import { MusicPlayer } from "./components/MusicPlayer";
import { MiniPlayerTrigger } from "./components/MiniPlayerTrigger";
import { SignUpModal } from "./components/SignUpModal";
import type { Song, TopArtist, TopSong } from "./types";
import "./css/main.css";
import "./css/responsive.css";

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
  // currentTime removed for performance to prevent app-wide re-renders
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [showLyrics, setShowLyrics] = useState(false);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topGlobalSongs, setTopGlobalSongs] = useState<TopSong[]>([]);
  const [topCountrySongs, setTopCountrySongs] = useState<TopSong[]>([]);
  const [userCountry, setUserCountry] = useState<string>('us');
  const [isLoadingHomeData, setIsLoadingHomeData] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [resetHomeCounter, setResetHomeCounter] = useState(0);
  const [artistQueue, setArtistQueue] = useState<{ artistName: string, albumName: string, songs: any[], currentIndex: number } | null>(null);
  const isPlayingFromArtistRef = useRef(false);

  const searchDebounceTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSearchValueRef = useRef("");
  const homeDataLoadedRef = useRef(false);

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

  // currentTime effect removed

  const toggleSidebar = useCallback(() => {
    if (isMobileView) {
      setIsSidebarOpen(!isSidebarOpen);
      // On mobile, when sidebar opens, it's not collapsed (shows text)
      setIsSidebarCollapsed(!isSidebarOpen);
    } else {
      // On desktop, toggle between collapsed (icons only) and expanded (icons + text)
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  }, [isMobileView, isSidebarOpen, isSidebarCollapsed]);

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "Home") {
      // Clear search results when going to Home
      setSearchResults([]);
      setSearchQuery("");
      if (currentSearchValueRef.current) currentSearchValueRef.current = "";

      if (activeTab === "Home") {
        // Force reset if already on Home
        setResetHomeCounter(prev => prev + 1);
      }
    }
    setActiveTab(tab);
  }, [activeTab]);

  const handleSearchWithValue = useCallback(async (searchValue: string) => {
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
  }, []);

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
    }, 2000);
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

  const handlePlaySong = useCallback(async (song: Song, skipOnError: boolean = false) => {
    setIsLoadingStream(true);
    try {
      // If the song already has a stream_url, use it directly
      if (song.stream_url) {
        setCurrentSong(song);
        setIsPlaying(true);
        // currentTime resets automatically with new src or we set it if needed
        setShowMusicPlayer(true);
        setIsLoadingStream(false);
        return;
      }

      // Otherwise, fetch the stream
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
      if (audioRef.current) audioRef.current.currentTime = 0;
      setShowMusicPlayer(true);
    } catch (error: unknown) {
      console.error('Stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // If skipOnError is true, try to play next song instead of showing alert
      if (skipOnError && isPlayingFromArtistRef.current && artistQueue) {
        console.log('Skipping failed song, trying next...');
        // Will be defined below
        playNextInArtistQueue();
      } else {
        alert(`Failed to load audio stream: ${errorMessage}`);
      }
    } finally {
      setIsLoadingStream(false);
    }
  }, []);

  const handleSetPlaylist = useCallback((songs: Song[], currentIndex: number) => {
    setPlaylist(songs);
    setCurrentSongIndex(currentIndex);
  }, []);

  const handleSetArtistQueue = useCallback((artistName: string, albumName: string, songs: any[], currentIndex: number) => {
    setArtistQueue({ artistName, albumName, songs, currentIndex });
    isPlayingFromArtistRef.current = true;
  }, []);

  const playNextInArtistQueue = useCallback(async () => {
    if (!artistQueue || !isPlayingFromArtistRef.current) return;

    const nextIndex = artistQueue.currentIndex + 1;

    // Check if there's a next song in the current album
    if (nextIndex < artistQueue.songs.length) {
      const nextSong = artistQueue.songs[nextIndex];
      console.log('Playing next song in artist queue:', nextSong.song_name);

      try {
        const searchUrl = `${API_BASE_URL}/search/exact?song_title=${encodeURIComponent(nextSong.song_name)}&artist=${encodeURIComponent(artistQueue.artistName)}`;
        const response = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'HanyaMusic/1.0'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch next song: ${response.status}`);
          // Update index and try next song
          setArtistQueue(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
          playNextInArtistQueue();
          return;
        }

        const songData = await response.json();

        // Check if stream_url exists
        if (!songData.stream_url) {
          console.log('Next song has no stream_url, skipping...');
          setArtistQueue(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
          playNextInArtistQueue();
          return;
        }

        const playerSong: Song = {
          videoId: songData.title || `${nextSong.song_name}-${artistQueue.artistName}`,
          title: songData.title || nextSong.song_name,
          uploader: artistQueue.artistName,
          thumbnail_url: songData.thumbnail_url || nextSong.thumbnail,
          duration: songData.duration ? `${Math.floor(songData.duration / 60)}:${String(songData.duration % 60).padStart(2, '0')}` : "0:00",
          view_count: "0",
          stream_url: songData.stream_url,
          format: songData.format,
          quality: songData.quality
        };

        setArtistQueue(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
        handlePlaySong(playerSong, true);
      } catch (error) {
        console.error('Error playing next song in queue:', error);
        // Try next song
        setArtistQueue(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
        playNextInArtistQueue();
      }
    } else {
      console.log('Reached end of artist queue');
      isPlayingFromArtistRef.current = false;
    }
  }, [artistQueue, handlePlaySong]);

  const playNextSong = useCallback(async () => {
    if (playlist.length === 0 || currentSongIndex === -1 || isLoadingStream) return;

    const nextIndex = currentSongIndex + 1;
    if (nextIndex >= playlist.length) {
      console.log('End of playlist reached');
      return;
    }

    const nextSong = playlist[nextIndex];
    setCurrentSongIndex(nextIndex);

    // Fetch the full song data using the search API
    try {
      const searchUrl = `${API_BASE_URL}/search/exact?song_title=${encodeURIComponent(nextSong.title)}&artist=${encodeURIComponent(nextSong.uploader)}`;
      console.log('Auto-playing next song:', searchUrl);

      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HanyaMusic/1.0'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch next song: ${response.status}`);
        return; // Stop trying if fetch fails
      }

      const songData = await response.json();

      const playerSong: Song = {
        ...nextSong,
        stream_url: songData.stream_url,
        format: songData.format,
        quality: songData.quality,
        duration: songData.duration ? `${Math.floor(songData.duration / 60)}:${String(songData.duration % 60).padStart(2, '0')}` : nextSong.duration
      };

      handlePlaySong(playerSong);
    } catch (error) {
      console.error('Error playing next song:', error);
      // Don't recursively call - just log the error
    }
  }, [playlist, currentSongIndex, isLoadingStream, handlePlaySong]);

  // Add event listener for when audio ends to auto-play next song
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      console.log('Song ended, checking what to play next...');

      // Prioritize artist queue if playing from artist view
      if (isPlayingFromArtistRef.current && artistQueue) {
        playNextInArtistQueue();
      } else if (playlist.length > 0) {
        playNextSong();
      }
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playNextSong, playNextInArtistQueue, artistQueue, playlist]);

  const handleClosePlayer = useCallback(() => {
    setShowMusicPlayer(false);
    setCurrentSong(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) return;
    setIsPlaying(prevIsPlaying => !prevIsPlaying);
  }, [currentSong]);

  const handleTimeUpdate = () => {
    // No-op: Time updates are handled internally by MusicPlayer via RAF
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentSong || duration === 0 || !audioRef.current) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
  }, [currentSong, duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
  }, []);

  const handleSkipBack = useCallback(() => {
    if (!currentSong || !audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  }, [currentSong]);

  const handleSkipForward = useCallback(() => {
    if (!currentSong || !audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
  }, [currentSong, duration]);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const handleToggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'one';
      if (prev === 'one') return 'all';
      return 'off';
    });
  }, []);

  const handleToggleLyrics = useCallback(() => {
    setShowLyrics(prev => !prev);
    // You can implement lyrics fetching logic here
    if (!showLyrics && currentSong) {
      // Fetch lyrics for current song
      console.log('Fetching lyrics for:', currentSong.title);
    }
  }, [showLyrics, currentSong]);

  const handleToggleMenu = useCallback(() => {
    // Toggle sidebar or player menu
    if (isMobileView) {
      toggleSidebar();
    }
    // Add additional menu logic if needed
  }, [isMobileView, toggleSidebar]);

  const handleToggleMic = useCallback(() => {
    // Implement voice control or search functionality
    console.log('Mic button clicked - implement voice search');
  }, []);

  const handleShowSignUp = useCallback(() => {
    setShowSignUpModal(true);
  }, []);

  // Detect user country using IP geolocation
  const detectUserCountry = async (): Promise<string> => {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code?.toLowerCase() || 'us';
        console.log('Detected country:', countryCode);
        return countryCode;
      }
    } catch (error) {
      console.error('Failed to detect country:', error);
    }
    return 'us'; // Default to US
  };

  // Fetch top global artists
  const fetchTopGlobalArtists = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/topglobalartists`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HanyaMusic/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch top artists: ${response.status}`);
      }

      const data = await response.json();
      setTopArtists(data.artists || []);
    } catch (error) {
      console.error('Error fetching top global artists:', error);
      setTopArtists([]);
    }
  };

  // Fetch top global songs
  const fetchTopGlobalSongs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/topglobalsongs`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HanyaMusic/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch top songs: ${response.status}`);
      }

      const data = await response.json();
      setTopGlobalSongs(data.songs || []);
    } catch (error) {
      console.error('Error fetching top global songs:', error);
      setTopGlobalSongs([]);
    }
  };

  // Fetch top country songs
  const fetchTopCountrySongs = async (country: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/topcountrysongs/${country}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HanyaMusic/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch country songs: ${response.status}`);
      }

      const data = await response.json();
      setTopCountrySongs(data.songs || []);
    } catch (error) {
      console.error('Error fetching top country songs:', error);
      setTopCountrySongs([]);
    }
  };

  // Fetch home page data when activeTab is Home
  useEffect(() => {
    if (activeTab === "Home" && searchResults.length === 0 && !homeDataLoadedRef.current) {
      setIsLoadingHomeData(true);
      homeDataLoadedRef.current = true;

      const loadHomeData = async () => {
        const country = await detectUserCountry();
        setUserCountry(country);

        // Fetch all data in parallel
        await Promise.all([
          fetchTopGlobalArtists(),
          fetchTopGlobalSongs(),
          fetchTopCountrySongs(country)
        ]);

        setIsLoadingHomeData(false);
      };

      loadHomeData();
    }

    // Reset home data loaded flag when search results appear
    if (searchResults.length > 0) {
      homeDataLoadedRef.current = false;
    }
  }, [activeTab, searchResults.length]);


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
        setActiveTab={handleTabChange}
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
          topArtists={topArtists}
          topGlobalSongs={topGlobalSongs}
          topCountrySongs={topCountrySongs}
          userCountry={userCountry}
          isLoadingHomeData={isLoadingHomeData}
          onShowSignUp={handleShowSignUp}
          onSearch={handleSearchWithValue}
          apiBaseUrl={API_BASE_URL}
          onSetPlaylist={handleSetPlaylist}
          isPlayingAnySong={currentSong !== null}
          currentSong={currentSong}
          audioRef={audioRef}
          onResetToHome={() => setResetHomeCounter(prev => prev + 1)}
          resetHomeCounter={resetHomeCounter}
          onSetArtistQueue={handleSetArtistQueue}
          artistQueue={artistQueue}
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
        audioRef={audioRef}
        isMobileView={isMobileView}
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

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
      />
    </div>
  );
}