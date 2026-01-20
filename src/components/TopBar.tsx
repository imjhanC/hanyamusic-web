import { useState, useRef, useEffect } from "react";
import { Search, User, Menu, X, Loader, LogOut, Key } from "lucide-react";

interface UserData {
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface TopBarProps {
  searchQuery: string;
  isSearching: boolean;
  isSidebarCollapsed: boolean;
  isMobileView: boolean;
  isLoggedIn: boolean;
  userData?: UserData | null;
  onSignIn: () => void;
  onSignUp: () => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
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
  isLoggedIn,
  userData,
  onSignIn,
  onSignUp,
  onLogout,
  onChangePassword,
  onSearchChange,
  onKeyPress,
  onClearSearch,
  onToggleSidebar
}: TopBarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debug logging
  if (isLoggedIn && userData) {
    console.log('[TopBar] User Data:', userData);
    console.log('[TopBar] Avatar URL:', userData.avatar_url);
  }

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

      {!isLoggedIn ? (
        <div className="auth-buttons" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={onSignIn}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e5e7eb',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 12px',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#e5e7eb'}
          >
            Sign In
          </button>
          <button
            onClick={onSignUp}
            style={{
              background: '#e5e7eb',
              border: 'none',
              color: '#121212',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '24px',
              padding: '10px 24px',
              cursor: 'pointer',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
          >
            Sign Up
          </button>
        </div>
      ) : (
        <div
          className="user-profile-section"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          ref={dropdownRef}
          style={{ position: 'relative' }}
        >
          <span className="user-display-name">
            {userData?.display_name || userData?.username || 'User'}
          </span>
          {userData?.avatar_url ? (
            <div
              className="user-avatar"
              style={{ backgroundImage: `url(${userData.avatar_url})` }}
            />
          ) : (
            <div className="user-icon">
              <User size={22} />
            </div>
          )}

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="user-dropdown-menu">
              <button
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                  onChangePassword?.();
                }}
              >
                <Key size={16} />
                Change Password
              </button>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-item delete-text"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                  onLogout?.();
                }}
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};