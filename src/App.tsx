import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ContentRenderer } from "./components/ContentRenderer";
import { MusicPlayer } from "./components/MusicPlayer";
import { MiniPlayerTrigger } from "./components/MiniPlayerTrigger";
import { MusicVideoPlayer } from "./components/utils/MusicVideoPlayer";
import { SignUpModal } from "./components/SignUpModal";
import { RegisterPage } from "./components/credentials/RegisterPage";
import { LoginModal } from "./components/credentials/LoginModal";
import type { Song, TopArtist, TopSong, VideoStreamResponse } from "./types";
import "./css/main.css";
import "./css/responsive.css";
import "react-easy-crop/react-easy-crop.css";

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
  const [isMusicVideoActive, setIsMusicVideoActive] = useState(false);
  const [mvStream, setMvStream] = useState<VideoStreamResponse | null>(null);
  const [isLoadingMv, setIsLoadingMv] = useState(false);
  const [isMvVideoReady, setIsMvVideoReady] = useState(false);
  const [isMvAudioReady, setIsMvAudioReady] = useState(false);
  const [mvError, setMvError] = useState<string | null>(null);
  const [musicPlayerHeight, setMusicPlayerHeight] = useState(100);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topGlobalSongs, setTopGlobalSongs] = useState<TopSong[]>([]);
  const [topCountrySongs, setTopCountrySongs] = useState<TopSong[]>([]);
  const [userCountry, setUserCountry] = useState<string>('us');
  const [isLoadingHomeData, setIsLoadingHomeData] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<{
    id: number;
    username: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  } | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [resetHomeCounter, setResetHomeCounter] = useState(0);
  const [artistQueue, setArtistQueue] = useState<{ artistName: string, albumName: string, songs: any[], currentIndex: number } | null>(null);
  const isPlayingFromArtistRef = useRef(false);

  const searchDebounceTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mvAudioRef = useRef<HTMLAudioElement>(null);
  const mvVideoRef = useRef<HTMLVideoElement>(null);
  const resumeTimeRef = useRef<number>(0);
  const resumeWasPlayingRef = useRef<boolean>(false);
  const currentSearchValueRef = useRef("");
  const homeDataLoadedRef = useRef(false);
  const isMusicVideoActiveRef = useRef(false);

  useEffect(() => {
    isMusicVideoActiveRef.current = isMusicVideoActive;
  }, [isMusicVideoActive]);

  const activeAudioRef = isMusicVideoActive ? mvAudioRef : audioRef;

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

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUserData = localStorage.getItem('user_data');

    if (token && storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  // Control audio playback based on isPlaying state
  useEffect(() => {
    const activeAudio = activeAudioRef.current;
    if (!activeAudio || !currentSong) return;

    if (isPlaying) {
      const playPromise = activeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio play failed:", error);
          setIsPlaying(false);
        });
      }
    } else {
      activeAudio.pause();
    }
  }, [isPlaying, currentSong, isMusicVideoActive]);

  // Control volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (mvAudioRef.current) mvAudioRef.current.volume = volume;
  }, [volume]);

  // currentTime effect removed

  // Update document title based on current song
  useEffect(() => {
    if (currentSong) {
      document.title = `${currentSong.title} - ${currentSong.uploader}`;
    } else {
      document.title = "hanyamusic-web";
    }
  }, [currentSong]);

  // Ensure LoginModal is closed if RegisterPage is opened
  useEffect(() => {
    if (showRegisterPage) {
      setShowLoginModal(false);
      setShowSignUpModal(false);
    }
  }, [showRegisterPage]);

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

  const handlePlaySong = useCallback(async (song: Song, skipOnError: boolean = false, keepMusicVideo: boolean = false) => {
    const shouldPlayWithMusicVideo = keepMusicVideo || isMusicVideoActiveRef.current;

    if (shouldPlayWithMusicVideo) {
      // Keep MV overlay alive for the next track
      setIsMusicVideoActive(true);
      setIsLoadingMv(true);
      setIsMvVideoReady(false);
      setIsMvAudioReady(false);
      setMvError(null);
      setMvStream(null);
      resumeTimeRef.current = 0;
      resumeWasPlayingRef.current = true;
    }

    setIsLoadingStream(true);
    try {
      let resolvedSong = song;

      // Fetch stream if missing
      if (!song.stream_url) {
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

        resolvedSong = {
          ...song,
          stream_url: streamData.stream_url,
          format: streamData.format,
          quality: streamData.quality
        };
      }

      setCurrentSong(resolvedSong);
      if (!shouldPlayWithMusicVideo) {
        setIsPlaying(true);
        if (audioRef.current) audioRef.current.currentTime = 0;
      } else {
        setIsPlaying(false); // will be set to true by the MV readiness effect
      }
      setShowMusicPlayer(true);

      // If MV mode is on, also fetch the MV stream for this song
      if (shouldPlayWithMusicVideo) {
        try {
          const mvUrl = `${API_BASE_URL}/search/exactwithMV?song_title=${encodeURIComponent(resolvedSong.title)}&artist=${encodeURIComponent(resolvedSong.uploader)}`;
          const mvResponse = await fetch(mvUrl, {
            method: "GET",
            headers: {
              'Accept': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              'User-Agent': 'HanyaMusic/1.0'
            }
          });

          if (!mvResponse.ok) {
            const errorText = await mvResponse.text();
            throw new Error(`MV search failed: ${mvResponse.status} ${errorText}`);
          }

          const mvData: VideoStreamResponse = await mvResponse.json();
          setMvStream(mvData);
          if (mvVideoRef.current) {
            mvVideoRef.current.load();
          }
        } catch (mvError: unknown) {
          console.error("MV error:", mvError);
          const msg = mvError instanceof Error ? mvError.message : "Failed to load music video.";
          setMvError(msg);
          setIsMusicVideoActive(false);
          setIsLoadingMv(false);
        }
      }
    } catch (error: unknown) {
      console.error('Stream error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // If skipOnError is true, try to play next song instead of showing alert
      if (skipOnError && isPlayingFromArtistRef.current && artistQueue) {
        console.log('Skipping failed song, trying next...');
        playNextInArtistQueue(shouldPlayWithMusicVideo);
      } else if (skipOnError && playlist.length > 0) {
        playNextSong(shouldPlayWithMusicVideo);
      } else {
        alert(`Failed to load audio stream: ${errorMessage}`);
      }
      setIsLoadingMv(false);
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

  const playNextInArtistQueue = useCallback(async (preferMusicVideo: boolean = false) => {
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
          playNextInArtistQueue(preferMusicVideo);
          return;
        }

        const songData = await response.json();

        // Check if stream_url exists
        if (!songData.stream_url) {
          console.log('Next song has no stream_url, skipping...');
          setArtistQueue(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
          playNextInArtistQueue(preferMusicVideo);
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
        handlePlaySong(playerSong, true, preferMusicVideo);
      } catch (error) {
        console.error('Error playing next song in queue:', error);
        // Try next song
        setArtistQueue(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
        playNextInArtistQueue(preferMusicVideo);
      }
    } else {
      console.log('Reached end of artist queue');
      isPlayingFromArtistRef.current = false;
    }
  }, [artistQueue, handlePlaySong]);

  const playNextSong = useCallback(async (preferMusicVideo: boolean = false) => {
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

      handlePlaySong(playerSong, false, preferMusicVideo);
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
      // If MV overlay is active, ignore main audio ended events
      if (isMusicVideoActiveRef.current) return;
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
    // Always close MV overlay if open
    setIsMusicVideoActive(false);
    setMvStream(null);
    setMvError(null);
    setIsLoadingMv(false);
    if (mvAudioRef.current) {
      mvAudioRef.current.pause();
      mvAudioRef.current.currentTime = 0;
    }
    if (mvVideoRef.current) {
      mvVideoRef.current.pause();
      try {
        mvVideoRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }

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
    const a = activeAudioRef.current;
    if (a) setDuration(a.duration);
  };

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = activeAudioRef.current;
    if (!currentSong || duration === 0 || !a) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    a.currentTime = newTime;
    // keep MV video in sync on seek
    if (isMusicVideoActive && mvVideoRef.current) {
      try {
        mvVideoRef.current.currentTime = newTime;
      } catch {
        // ignore
      }
    }
  }, [currentSong, duration, isMusicVideoActive]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
  }, []);

  const handleSkipBack = useCallback(() => {
    const a = activeAudioRef.current;
    if (!currentSong || !a) return;
    a.currentTime = Math.max(0, a.currentTime - 10);
    if (isMusicVideoActive && mvVideoRef.current) {
      mvVideoRef.current.currentTime = a.currentTime;
    }
  }, [currentSong, isMusicVideoActive]);

  const handleSkipForward = useCallback(() => {
    const a = activeAudioRef.current;
    if (!currentSong || !a) return;
    a.currentTime = Math.min(duration, a.currentTime + 10);
    if (isMusicVideoActive && mvVideoRef.current) {
      mvVideoRef.current.currentTime = a.currentTime;
    }
  }, [currentSong, duration, isMusicVideoActive]);

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

  const closeMusicVideo = useCallback(() => {
    setIsMusicVideoActive(false);

    // stop MV playback
    if (mvAudioRef.current) mvAudioRef.current.pause();
    if (mvVideoRef.current) mvVideoRef.current.pause();

    setIsMvVideoReady(false);
    setIsMvAudioReady(false);

    // restore main audio position + play state
    const mainAudio = audioRef.current;
    if (mainAudio && currentSong) {
      mainAudio.currentTime = resumeTimeRef.current || 0;
      setDuration(mainAudio.duration || duration);
      setIsPlaying(resumeWasPlayingRef.current);
    } else {
      setIsPlaying(false);
    }
  }, [currentSong, duration]);

  const handleToggleMusicVideo = useCallback(async () => {
    if (!currentSong) return;

    if (isMusicVideoActiveRef.current) {
      closeMusicVideo();
      return;
    }

    // Snapshot current listening position/state so we can restore it later
    resumeTimeRef.current = audioRef.current?.currentTime || 0;
    resumeWasPlayingRef.current = isPlaying;

    // Pause main audio while switching to MV mode
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);

    setIsMusicVideoActive(true);
    setIsLoadingMv(true);
    setIsMvVideoReady(false);
    setIsMvAudioReady(false);
    setMvError(null);
    setMvStream(null);

    try {
      const url = `${API_BASE_URL}/search/exactwithMV?song_title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.uploader)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'HanyaMusic/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MV search failed: ${response.status} ${errorText}`);
      }

      const data: VideoStreamResponse = await response.json();
      setMvStream(data);
      // preload video element time to match audio after metadata
      if (mvVideoRef.current) {
        mvVideoRef.current.load();
      }
    } catch (e: unknown) {
      console.error("MV error:", e);
      const msg = e instanceof Error ? e.message : "Failed to load music video.";
      setMvError(msg);
      setIsLoadingMv(false);
    }
  }, [currentSong, isPlaying, closeMusicVideo]);

  // Keep MV <video> synced with MV <audio>
  useEffect(() => {
    if (!isMusicVideoActive) return;
    const a = mvAudioRef.current;
    const v = mvVideoRef.current;
    if (!a || !v) return;

    let raf: number | null = null;

    const sync = () => {
      // only adjust if drift is noticeable
      if (Math.abs(v.currentTime - a.currentTime) > 0.35) {
        try {
          v.currentTime = a.currentTime;
        } catch {
          // ignore
        }
      }
    };

    const rafSync = () => {
      sync();
      raf = requestAnimationFrame(rafSync);
    };

    const onPlay = () => {
      // video should follow audio play state
      const p = v.play();
      if (p !== undefined) p.catch(() => undefined);
    };

    const onPause = () => v.pause();

    a.addEventListener("timeupdate", sync);
    a.addEventListener("seeking", sync);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    raf = requestAnimationFrame(rafSync);

    return () => {
      a.removeEventListener("timeupdate", sync);
      a.removeEventListener("seeking", sync);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [isMusicVideoActive, mvStream]);

  // Coordinate smooth start of MV when both media are buffered/ready
  useEffect(() => {
    if (isMusicVideoActive && isMvVideoReady && isMvAudioReady && isLoadingMv) {
      console.log('MV both streams ready, starting playback...');

      // Ensure sync before playing
      const a = mvAudioRef.current;
      const v = mvVideoRef.current;
      if (a && v) {
        v.currentTime = a.currentTime;
      }

      if (resumeWasPlayingRef.current) {
        setIsPlaying(true);
      }
      setIsLoadingMv(false);
    }
  }, [isMusicVideoActive, isMvVideoReady, isMvAudioReady, isLoadingMv]);

  // Track actual music player height so the MV overlay leaves room
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector(".music-player.show") as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = Math.max(80, Math.round(rect.height || 0));
      if (next !== musicPlayerHeight) setMusicPlayerHeight(next);
    };

    measure();
    window.addEventListener("resize", measure);

    const id = window.setInterval(measure, 400);

    return () => {
      window.removeEventListener("resize", measure);
      window.clearInterval(id);
    };
  }, [showMusicPlayer, isMobileView, musicPlayerHeight]);

  // Keep MV video play/pause aligned when toggling isPlaying
  useEffect(() => {
    if (!isMusicVideoActive) return;
    const v = mvVideoRef.current;
    if (!v) return;
    if (isPlaying) {
      const p = v.play();
      if (p !== undefined) p.catch(() => undefined);
    } else {
      v.pause();
    }
  }, [isMusicVideoActive, isPlaying]);

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

  const handleContinueToRegister = useCallback(() => {
    setShowSignUpModal(false);
    setShowLoginModal(false);
    setShowRegisterPage(true);
  }, []);

  const handleDirectRegister = useCallback(() => {
    setShowLoginModal(false);
    setShowSignUpModal(false);
    setShowRegisterPage(true);
  }, []);

  const handleRegisterSuccess = useCallback((newUserData: any) => {
    setUserData({
      id: newUserData.id,
      username: newUserData.username,
      email: newUserData.email,
      display_name: newUserData.display_name,
      avatar_url: newUserData.avatar_url
    });
    setIsLoggedIn(true);
    setShowRegisterPage(false);

    // Navigate to home
    setActiveTab("Home");
  }, []);

  const handleLoginSuccess = useCallback((newUserData: any) => {
    setUserData({
      id: newUserData.id,
      username: newUserData.username,
      email: newUserData.email,
      display_name: newUserData.display_name,
      avatar_url: newUserData.avatar_url
    });
    setIsLoggedIn(true);
    setShowLoginModal(false);

    // Navigate to home
    setActiveTab("Home");
  }, []);

  const handleSignIn = useCallback(() => {
    console.log('Sign in clicked');
    setShowLoginModal(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setIsLoggedIn(false);
    setUserData(null);
    setActiveTab("Home");
  }, []);

  const handleChangePassword = useCallback(() => {
    // Placeholder for now
    alert("Change password functionality will be implemented in the next update.");
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
        isLoggedIn={isLoggedIn}
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
        isLoggedIn={isLoggedIn}
        userData={userData}
        onSignIn={handleSignIn}
        onSignUp={handleDirectRegister}
        onLogout={handleLogout}
        onChangePassword={handleChangePassword}
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
          isLoggedIn={isLoggedIn}
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
        audioRef={activeAudioRef}
        isMobileView={isMobileView}
        duration={duration}
        volume={volume}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        isMusicVideoActive={isMusicVideoActive}
        onClose={handleClosePlayer}
        onTogglePlay={togglePlayPause}
        onVolumeChange={handleVolumeChange}
        onProgressClick={handleProgressClick}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleMusicVideo={handleToggleMusicVideo}
        onToggleMenu={handleToggleMenu}
        onToggleMic={handleToggleMic}
      />

      {/* Music Video Overlay */}
      <MusicVideoPlayer
        isOpen={showMusicPlayer && !!currentSong && isMusicVideoActive}
        isLoading={isLoadingMv}
        error={mvError}
        stream={mvStream}
        videoRef={mvVideoRef}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileView={isMobileView}
        playerHeight={musicPlayerHeight}
        onClose={closeMusicVideo}
        onReady={() => setIsMvVideoReady(true)}
      />

      {/* Audio Element - Keep it in App.tsx for centralized control */}
      {currentSong && (
        <audio
          ref={audioRef}
          key={currentSong.videoId}
          src={currentSong.stream_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={(e) => {
            console.error('Audio error:', e);
            alert('Failed to play audio. Please try another song.');
            handleClosePlayer();
          }}
          style={{ display: 'none' }}
        />
      )}

      {/* MV Audio Element (separate audio stream) */}
      {currentSong && isMusicVideoActive && mvStream?.audio_url && (
        <audio
          ref={mvAudioRef}
          key={`${currentSong.videoId}-mv`}
          src={mvStream.audio_url}
          onLoadedMetadata={() => {
            const a = mvAudioRef.current;
            if (!a) return;
            // restore previous listening position
            a.currentTime = resumeTimeRef.current || 0;
            setDuration(a.duration);
            setIsMvAudioReady(true);
          }}
          onEnded={() => {
            console.log('MV audio ended, moving to next song with music video...');

            // Stop current MV playback cleanly
            if (mvAudioRef.current) mvAudioRef.current.pause();
            if (mvVideoRef.current) mvVideoRef.current.pause();

            // Auto-play next song while keeping MV mode if possible
            if (isPlayingFromArtistRef.current && artistQueue) {
              playNextInArtistQueue(true);
            } else if (playlist.length > 0) {
              playNextSong(true);
            } else {
              setIsPlaying(false);
              setIsMusicVideoActive(false);
              setMvStream(null);
              setMvError(null);
            }
          }}
          onError={(e) => {
            console.error('MV audio error:', e);
            setMvError('Failed to play MV audio stream.');
          }}
          style={{ display: 'none' }}
        />
      )}

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSignUpContinue={handleContinueToRegister}
        onSwitchToLogin={() => {
          setShowSignUpModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Register Page */}
      <RegisterPage
        isOpen={showRegisterPage}
        onClose={() => setShowRegisterPage(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => {
          setShowRegisterPage(false);
          setShowLoginModal(true);
        }}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignUpContinue={handleContinueToRegister}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}