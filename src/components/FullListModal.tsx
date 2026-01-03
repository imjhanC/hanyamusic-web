import { X } from "lucide-react";
import type { TopArtist, TopSong } from "../types";
import { ArtistCard } from "./ArtistCard";
import { SongPreviewCard } from "./SongPreviewCard";

interface FullListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'artists' | 'songs';
  items: TopArtist[] | TopSong[];
  onPlaySong?: (song: any) => void;
  onSearch?: (query: string) => void;
}

export const FullListModal = ({ 
  isOpen, 
  onClose, 
  title, 
  type, 
  items,
  onPlaySong,
  onSearch
}: FullListModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="full-list-modal">
        <div className="full-list-modal-header">
          <h2 className="full-list-modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="full-list-modal-content">
          <div className="music-grid">
            {type === 'artists' ? (
              (items as TopArtist[]).map((artist, index) => (
                <ArtistCard 
                  key={`full-artist-${artist.rank}-${index}`} 
                  artist={artist} 
                  index={index}
                />
              ))
            ) : (
              (items as TopSong[]).map((song, index) => (
                <SongPreviewCard 
                  key={`full-song-${song.rank}-${index}`} 
                  song={song} 
                  index={index}
                  onPlay={onPlaySong || (() => {})}
                  onSearch={onSearch}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

