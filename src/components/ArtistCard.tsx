import type { TopArtist } from "../types";

interface ArtistCardProps {
  artist: TopArtist;
  index: number;
}

export const ArtistCard = ({ artist, index }: ArtistCardProps) => {
  const handleClick = () => {
    // Placeholder for future artist page navigation
    console.log('Artist clicked:', artist.artist_name);
  };

  return (
    <div
      key={`artist-${artist.rank}-${index}`}
      className="artist-card slide-up"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="artist-card-image"
        style={{
          backgroundImage: `url(${artist.thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <div className="artist-overlay">
          <span className="artist-rank">#{artist.rank}</span>
        </div>
      </div>
      <h3 className="artist-card-name" title={artist.artist_name}>
        <span>{artist.artist_name}</span>
      </h3>
    </div>
  );
};

