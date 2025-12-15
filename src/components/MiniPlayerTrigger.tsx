import { Music2 } from "lucide-react";
import type { Song } from "../types";

interface MiniPlayerTriggerProps {
  currentSong: Song | null;
  showMusicPlayer: boolean;
  onShowPlayer: () => void;
}

export const MiniPlayerTrigger = ({
  currentSong,
  showMusicPlayer,
  onShowPlayer
}: MiniPlayerTriggerProps) => {
  if (!currentSong || showMusicPlayer) return null;

  return (
    <div 
      className="mini-player-trigger"
      onClick={onShowPlayer}
      title="Show music player"
    >
      <Music2 size={24} color="white" />
    </div>
  );
};