import React, { useEffect, useMemo, useState } from "react";
import { X, Loader } from "lucide-react";
import type { VideoStreamResponse } from "../../types";

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  error?: string | null;
  stream?: VideoStreamResponse | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isSidebarCollapsed: boolean;
  isMobileView: boolean;
  playerHeight: number;
  onClose: () => void;
  onReady?: () => void;
};

export function MusicVideoPlayer({
  isOpen,
  isLoading,
  error,
  stream,
  videoRef,
  isSidebarCollapsed,
  isMobileView,
  playerHeight,
  onClose,
  onReady,
}: Props) {
  const [availableHeight, setAvailableHeight] = useState(600);

  // ensure the video element never outputs audio (we play audio_url separately)
  useEffect(() => {
    if (!isOpen) return;
    const v = videoRef.current;
    if (v) v.muted = true;
  }, [isOpen, videoRef]);

  // Recompute available vertical space so the MV box stays above MusicPlayer
  useEffect(() => {
    if (!isOpen) return;
    const compute = () => {
      const top = isMobileView ? 60 : 70;
      const padding = 16; // breathing room
      const avail = window.innerHeight - top - playerHeight - padding;
      setAvailableHeight(Math.max(320, avail));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isOpen, isMobileView, playerHeight]);

  // Calculate box height - MUST be before early return to maintain hook order
  const boxHeight = useMemo(() => {
    // Increase to 85vh for a more immersive experience
    const eightyFiveVh = Math.round(window.innerHeight * 1.00);
    return Math.min(availableHeight, eightyFiveVh);
  }, [availableHeight]);

  if (!isOpen) return null;

  const top = isMobileView ? 60 : 70; // matches TopBar height
  const left = isMobileView ? 0 : isSidebarCollapsed ? 80 : 240; // matches Sidebar width
  const bottom = playerHeight; // leave room for MusicPlayer
  const height = `calc(100vh - ${top + playerHeight}px)`;

  return (
    <div
      className="music-video-overlay"
      style={{
        top,
        left,
        width: `calc(100% - ${left}px)`,
        bottom,
        height,
      }}
    >
      <div className="music-video-shell" style={{ height: boxHeight }}>
        <div className="music-video-header">
          <div className="music-video-title">
            {stream?.title || "Music Video"}
          </div>
          <button className="music-video-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="music-video-body">
          {error ? (
            <div className="music-video-error">
              {error}
            </div>
          ) : stream?.video_url ? (
            <>
              {isLoading && (
                <div className="music-video-loading-overlay">
                  <Loader size={30} className="spinner" />
                  <span>Preparing music video…</span>
                </div>
              )}
              <video
                ref={videoRef}
                className={`music-video-element ${isLoading ? 'hidden' : ''}`}
                src={stream.video_url}
                playsInline
                controls={false}
                muted
                poster={stream.thumbnail_url}
                onCanPlay={onReady}
              />
            </>
          ) : isLoading ? (
            <div className="music-video-loading">
              <Loader size={20} className="spinner" />
              <span>Loading music video…</span>
            </div>
          ) : (
            <div className="music-video-error">No music video stream found.</div>
          )}
        </div>
      </div>
    </div>
  );
}