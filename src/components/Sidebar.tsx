import { Home, TrendingUp, ListMusic, Music2, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  isSidebarCollapsed: boolean;
  isMobileView: boolean;
  isSidebarOpen: boolean;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({
  activeTab,
  isSidebarCollapsed,
  isMobileView,
  isSidebarOpen,
  setActiveTab,
  toggleSidebar,
  setIsSidebarOpen,
  setIsSidebarCollapsed
}: SidebarProps) => {
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (isMobileView && isSidebarOpen) {
      setIsSidebarOpen(false);
      setIsSidebarCollapsed(true);
    }
  };

  const renderSidebarContent = () => {
    if (!isSidebarOpen && isMobileView) return null;
    
    return (
      <>
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
            onClick={() => handleTabClick("Home")}
          >
            <Home size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Home"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Trending" ? "active" : ""}`}
            onClick={() => handleTabClick("Trending")}
          >
            <TrendingUp size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Trending"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Playlists" ? "active" : ""}`}
            onClick={() => handleTabClick("Playlists")}
          >
            <ListMusic size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Playlists"}
          </a>
          <a
            className={`sidebar-link ${activeTab === "Your Songs" ? "active" : ""}`}
            onClick={() => handleTabClick("Your Songs")}
          >
            <Music2 size={20} className="sidebar-icon" />
            {(!isSidebarCollapsed || (isMobileView && isSidebarOpen)) && "Your Songs"}
          </a>
        </nav>
      </>
    );
  };

  return (
    <>
      <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileView ? "mobile" : ""} ${isSidebarOpen ? "open" : ""}`}>
        {renderSidebarContent()}
      </div>
    </>
  );
};