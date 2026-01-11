import React, { useState, useEffect, useRef } from "react";
import { Loader, ChevronRight, ArrowLeft, Trophy, Sparkles, Music } from "lucide-react";
import { MusicCard } from "./MusicCard";
import { ArtistCard } from "./ArtistCard";
import { ArtistListItem } from "./ArtistListItem";
import { ArtistDetailView } from "./ArtistDetailView";
import { SongPreviewCard } from "./SongPreviewCard";
import type { Song, TopArtist, TopSong } from "../types";

interface ContentRendererProps {
  activeTab: string;
  searchResults: Song[];
  searchQuery: string;
  isDebouncing: boolean;
  isSearching: boolean;
  onPlaySong: (song: Song) => void;
  topArtists: TopArtist[];
  topGlobalSongs: TopSong[];
  topCountrySongs: TopSong[];
  userCountry: string;
  isLoadingHomeData: boolean;
  onShowSignUp: () => void;
  onSearch?: (query: string) => void;
  apiBaseUrl: string;
  onSetPlaylist?: (songs: Song[], currentIndex: number) => void;
  isPlayingAnySong?: boolean;
}

export const ContentRenderer = React.memo(({
  activeTab,
  searchResults,
  searchQuery,
  isDebouncing,
  isSearching,
  onPlaySong,
  topArtists,
  topGlobalSongs,
  topCountrySongs,
  userCountry,
  isLoadingHomeData,
  onShowSignUp,
  onSearch,
  apiBaseUrl,
  isPlayingAnySong
}: ContentRendererProps) => {
  const [currentView, setCurrentView] = useState<'home' | 'artists' | 'globalSongs' | 'countrySongs' | 'artistDetail'>('home');
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);

  /* 
    Calculate items per row dynamically to ensure exactly 2 rows.
    We'll determine columns based on grid width.
  */
  const [maxDisplayItems, setMaxDisplayItems] = useState(15); // Default approx for desktop
  const gridRef = useRef<HTMLDivElement>(null);


  // Reset view to home when search results appear
  useEffect(() => {
    if (searchResults.length > 0) {
      setCurrentView('home');
    }
  }, [searchResults.length]);

  useEffect(() => {
    const calculateMaxItems = () => {
      if (gridRef.current) {
        // card min-width is 200px, gap is 24px
        // Formula: n * 200 + (n - 1) * 24 <= width
        // n * 224 - 24 <= width
        // n * 224 <= width + 24
        // n <= (width + 24) / 224
        const width = gridRef.current.offsetWidth;
        const columns = Math.floor((width + 24) / 224);

        // We want exactly 2 rows
        // Total slots = columns * 2
        // Last slot is for 'More Card', so we show (columns * 2) - 1 content items
        // Ensure at least 1 item
        const max = Math.max(1, (columns * 2) - 1);
        setMaxDisplayItems(max);
      }
    };

    calculateMaxItems();

    // Add resize listener
    window.addEventListener('resize', calculateMaxItems);

    // Also use ResizeObserver for more robust handling
    const observer = new ResizeObserver(calculateMaxItems);
    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => {
      window.removeEventListener('resize', calculateMaxItems);
      observer.disconnect();
    };
  }, []);

  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const scrollContainer = document.querySelector('.main-content');
    if (!scrollContainer) return;

    if (currentView === 'artistDetail') {
      // When entering detail view, scroll to top
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    } else if (currentView === 'artists') {
      // When returning to artists list, restore scroll position if we have one
      if (scrollPositionRef.current > 0) {
        scrollContainer.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
      }
    } else {
      // For other views (home, global songs, etc), scroll top and reset ref
      // This ensures entering 'artists' view from Home starts at top
      scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
      scrollPositionRef.current = 0;
    }
  }, [currentView]);

  const handleArtistClick = (artistName: string) => {
    // Save current scroll position of the container before navigating
    const scrollContainer = document.querySelector('.main-content');
    if (scrollContainer) {
      scrollPositionRef.current = scrollContainer.scrollTop;
    }
    setSelectedArtistName(artistName);
    setCurrentView('artistDetail');
  };

  const handleBackToArtists = React.useCallback(() => {
    setCurrentView('artists');
  }, []);

  const getCountryName = (code: string): string => {
    const countryNames: { [key: string]: string } = {
      'us': 'United States',
      'gb': 'United Kingdom',
      'ca': 'Canada',
      'au': 'Australia',
      'de': 'Germany',
      'fr': 'France',
      'jp': 'Japan',
      'kr': 'South Korea',
      'cn': 'China',
      'in': 'India',
      'my': 'Malaysia',
      'sg': 'Singapore',
      'id': 'Indonesia',
      'th': 'Thailand',
      'ph': 'Philippines',
      'vn': 'Vietnam',
      'mx': 'Mexico',
      'br': 'Brazil',
      'ar': 'Argentina',
      'es': 'Spain',
      'it': 'Italy',
      'nl': 'Netherlands',
      'be': 'Belgium',
      'ch': 'Switzerland',
      'at': 'Austria',
      'se': 'Sweden',
      'no': 'Norway',
      'dk': 'Denmark',
      'fi': 'Finland',
      'pl': 'Poland',
      'ru': 'Russia',
      'tr': 'Turkey',
      'sa': 'Saudi Arabia',
      'ae': 'United Arab Emirates',
      'za': 'South Africa',
      'eg': 'Egypt',
      'nz': 'New Zealand'
    };
    return countryNames[code.toLowerCase()] || code.toUpperCase();
  };

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
            <MusicCard
              key={`${song.videoId}-${index}`}
              song={song}
              index={index}
              onPlay={onPlaySong}
            />
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "Home") {
    // Show full list views
    if (currentView === 'artists' && topArtists.length > 0) {
      return (
        <div>
          <button className="back-button" onClick={() => setCurrentView('home')}>
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>

          <div className="top-artists-banner">
            <div className="banner-deco-circle circle-1"></div>
            <div className="banner-deco-circle circle-2"></div>
            <div className="banner-floating-icon icon-trophy"><Trophy size={140} strokeWidth={1} /></div>
            <div className="banner-floating-icon icon-music"><Music size={100} strokeWidth={1} /></div>
            <div className="banner-floating-icon icon-sparkles"><Sparkles size={60} strokeWidth={1} /></div>

            <div className="banner-content-wrapper">
              <div className="banner-badge">
                <Sparkles size={14} /> Global Rankings
              </div>
              <h1 className="top-artists-title">Top Global Artists</h1>
              <p className="top-artists-subtitle">Chart-topping performancers dominating the airwaves worldwide</p>
            </div>
          </div>

          <div className="artist-list-container">
            <div className="artist-list-header">
              <span>#</span>
              <span>Artist</span>
              <span>Name</span>
            </div>
            {topArtists.map((artist, index) => (
              <div key={`full-artist-${artist.rank}-${index}`} onClick={() => handleArtistClick(artist.artist_name)}>
                <ArtistListItem
                  artist={artist}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentView === 'artistDetail' && selectedArtistName) {
      return (
        <ArtistDetailView
          artistName={selectedArtistName}
          onBack={handleBackToArtists}
          onPlaySong={onPlaySong}
          apiBaseUrl={apiBaseUrl}
          isPlayingAnySong={isPlayingAnySong}
        />
      );
    }

    if (currentView === 'globalSongs' && topGlobalSongs.length > 0) {
      return (
        <div>
          <button className="back-button" onClick={() => setCurrentView('home')}>
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="main-heading">Top Global Songs</h1>
          <p className="main-subtitle">Hover over a song to preview</p>
          <div className="music-grid">
            {topGlobalSongs.map((song, index) => (
              <SongPreviewCard
                key={`full-global-song-${song.rank}-${index}`}
                song={song}
                index={index}
                onPlay={onPlaySong}
                onSearch={onSearch}
              />
            ))}
          </div>
        </div>
      );
    }

    if (currentView === 'countrySongs' && topCountrySongs.length > 0) {
      return (
        <div>
          <button className="back-button" onClick={() => setCurrentView('home')}>
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="main-heading">Top Songs in {getCountryName(userCountry)}</h1>
          <p className="main-subtitle">Hover over a song to preview</p>
          <div className="music-grid">
            {topCountrySongs.map((song, index) => (
              <SongPreviewCard
                key={`full-country-song-${song.rank}-${index}`}
                song={song}
                index={index}
                onPlay={onPlaySong}
                onSearch={onSearch}
              />
            ))}
          </div>
        </div>
      );
    }

    // Main home view
    return (
      <div ref={gridRef}>
        {/* Sign-up CTA Banner */}
        <div className="signup-cta-banner slide-up">
          <div className="signup-cta-content">
            <h2 className="signup-cta-title">
              Discover Your Perfect Sound
            </h2>
            <p className="signup-cta-text">
              Sign up for a personalized music experience with custom playlists, recommendations, and more
            </p>
            <button className="signup-cta-button" onClick={onShowSignUp}>
              Sign Up Free
            </button>
          </div>
        </div>

        {/* Top Global Artists Section */}
        {topArtists.length > 0 && (
          <div className="section-container slide-up">
            <h2 className="section-heading">Top Global Artists</h2>
            <div className="music-grid">
              {topArtists.slice(0, maxDisplayItems).map((artist, index) => (
                <div key={`artist-${artist.rank}-${index}`} onClick={() => handleArtistClick(artist.artist_name)}>
                  <ArtistCard
                    artist={artist}
                    index={index}
                  />
                </div>
              ))}
              {topArtists.length > maxDisplayItems && (
                <div
                  className="more-card slide-up"
                  onClick={() => setCurrentView('artists')}
                >
                  <div className="more-card-content">
                    <div className="more-card-icon-wrapper">
                      <ChevronRight size={24} className="more-icon" />
                    </div>
                    <span className="more-text">View All</span>
                    <span className="more-count">{topArtists.length} Artists</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Global Songs Section */}
        {topGlobalSongs.length > 0 && (
          <div className="section-container slide-up">
            <h2 className="section-heading">Top Global Songs</h2>
            <p className="section-subtitle">Hover over a song to preview</p>
            <div className="music-grid">
              {topGlobalSongs.slice(0, maxDisplayItems).map((song, index) => (
                <SongPreviewCard
                  key={`global-song-${song.rank}-${index}`}
                  song={song}
                  index={index}
                  onPlay={onPlaySong}
                  onSearch={onSearch}
                />
              ))}
              {topGlobalSongs.length > maxDisplayItems && (
                <div
                  className="more-card slide-up"
                  onClick={() => setCurrentView('globalSongs')}
                >
                  <div className="more-card-content">
                    <div className="more-card-icon-wrapper">
                      <ChevronRight size={24} className="more-icon" />
                    </div>
                    <span className="more-text">View All</span>
                    <span className="more-count">{topGlobalSongs.length} Songs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Country Songs Section */}
        {topCountrySongs.length > 0 && (
          <div className="section-container slide-up">
            <h2 className="section-heading">Top Songs in {getCountryName(userCountry)}</h2>
            <p className="section-subtitle">Hover over a song to preview</p>
            <div className="music-grid">
              {topCountrySongs.slice(0, maxDisplayItems).map((song, index) => (
                <SongPreviewCard
                  key={`country-song-${song.rank}-${index}`}
                  song={song}
                  index={index}
                  onPlay={onPlaySong}
                  onSearch={onSearch}
                />
              ))}
              {topCountrySongs.length > maxDisplayItems && (
                <div
                  className="more-card slide-up"
                  onClick={() => setCurrentView('countrySongs')}
                >
                  <div className="more-card-content">
                    <div className="more-card-icon-wrapper">
                      <ChevronRight size={24} className="more-icon" />
                    </div>
                    <span className="more-text">View All</span>
                    <span className="more-count">{topCountrySongs.length} Songs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state if no data */}
        {!isLoadingHomeData && topArtists.length === 0 && topGlobalSongs.length === 0 && topCountrySongs.length === 0 && (
          <div>
            <h1 className="main-heading">
              Welcome to <span className="brand-color">Hanya</span>Music
            </h1>
            <p className="main-subtitle">
              Search for your favorite music using the search bar above
            </p>
          </div>
        )}
      </div>
    );
  } else if (activeTab === "Trending") {
    return (
      <div>
        <h1 className="main-heading">
          Welcome to <span className="brand-color">Hanya</span>Music
        </h1>
        <p className="main-subtitle">
          Search for your favorite music using the search bar above
        </p>
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
});