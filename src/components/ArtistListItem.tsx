import type { TopArtist } from "../types";

interface ArtistListItemProps {
    artist: TopArtist;
    index: number;
}

export const ArtistListItem = ({ artist, index }: ArtistListItemProps) => {
    const handleClick = () => {
        // Placeholder for future artist page navigation
        console.log('Artist clicked:', artist.artist_name);
    };

    return (
        <div
            className="artist-list-item slide-up"
            style={{ animationDelay: `${index * 0.03}s` }}
            onClick={handleClick}
        >
            <span className="artist-list-rank">
                {artist.rank}
            </span>
            <div
                className="artist-list-image"
                style={{ backgroundImage: `url(${artist.thumbnail})` }}
            />
            <span className="artist-list-name">
                {artist.artist_name}
            </span>
        </div>
    );
};
