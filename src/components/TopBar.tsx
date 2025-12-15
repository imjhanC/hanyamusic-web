import { Search, User, Menu, X, Loader } from "lucide-react";

interface TopBarProps {
  searchQuery: string;
  isSearching: boolean;
  isSidebarCollapsed: boolean;
  isMobileView: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onToggleSidebar: () => void;
}

export const TopBar = ({
  searchQuery,
  isSearching,
  isSidebarCollapsed,
  isMobileView,
  onSearchChange,
  onKeyPress,
  onClearSearch,
  onToggleSidebar
}: TopBarProps) => {
  return (
    <div className={`top-bar ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="search-container">
        {isMobileView && (
          <button
            className="hamburger-menu-btn"
            onClick={onToggleSidebar}
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
            onChange={onSearchChange}
            onKeyPress={onKeyPress}
            disabled={isSearching}
          />
          <Search className="search-icon" size={20} />
          
          {searchQuery && !isSearching && (
            <button
              className="clear-search-btn"
              onClick={onClearSearch}
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
  );
};