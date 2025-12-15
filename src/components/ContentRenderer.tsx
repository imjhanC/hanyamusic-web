import { Loader } from "lucide-react";
import { MusicCard } from "./MusicCard";
import type { Song } from "../types";

interface ContentRendererProps {
  activeTab: string;
  searchResults: Song[];
  searchQuery: string;
  isDebouncing: boolean;
  isSearching: boolean;
  onPlaySong: (song: Song) => void;
}

export const ContentRenderer = ({
  activeTab,
  searchResults,
  searchQuery,
  isDebouncing,
  isSearching,
  onPlaySong
}: ContentRendererProps) => {
  const getRandomColor = (): string => {
    const colors = [
      "#667eea", "#764ba2", "#f093fb", "#4facfe",
      "#43e97b", "#fa709a", "#fee140", "#30cfd0"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
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