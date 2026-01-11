import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ArrowLeft, Play, Disc, AlertCircle, ArrowUpDown } from "lucide-react";
import type { ArtistSongsResponse, ArtistSong } from "../types";
import type { Song } from "../types";

// Global ref to track currently playing preview to ensure only one plays at a time
let currentPreviewAudio: HTMLAudioElement | null = null;

// Optimized song data structure with pre-formatted date
interface ProcessedSong extends ArtistSong {
    formattedDate: string;
}

interface ArtistSongRowProps {
    song: ProcessedSong;
    index: number;
    formattedDate: string;
    onPlayFull: (song: ArtistSong) => void;
    isDisabled: boolean;
    isPreviewDisabled: boolean;
    isCurrentlyPlaying: boolean;
}

const ArtistSongRow = React.memo(({ song, index, formattedDate, onPlayFull, isDisabled, isPreviewDisabled, isCurrentlyPlaying }: ArtistSongRowProps) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previewTimeoutRef = useRef<number | null>(null);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

    // Memoized click handler
    const handleClick = useCallback(() => {
        if (!isDisabled) {
            onPlayFull(song);
        }
    }, [isDisabled, onPlayFull, song]);

    const handleMouseEnter = useCallback(() => {
        // Don't play preview if disabled, preview disabled, or no preview URL
        if (isDisabled || isPreviewDisabled || !song.preview_url) return;

        // Clear any existing timeout
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
        }

        // Set delay before playing preview
        previewTimeoutRef.current = window.setTimeout(() => {
            // Stop any currently playing preview
            if (currentPreviewAudio && currentPreviewAudio !== audioRef.current) {
                currentPreviewAudio.pause();
                currentPreviewAudio.currentTime = 0;
            }

            // Create audio element if it doesn't exist
            if (!audioRef.current && song.preview_url) {
                const audio = new Audio(song.preview_url);
                audio.volume = 0.5;
                audioRef.current = audio;

                audio.addEventListener('ended', () => {
                    setIsPreviewPlaying(false);
                    if (currentPreviewAudio === audio) {
                        currentPreviewAudio = null;
                    }
                });
            }

            // Play preview
            if (audioRef.current) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            setIsPreviewPlaying(true);
                            currentPreviewAudio = audioRef.current;
                        })
                        .catch((error) => {
                            console.error('Preview play failed:', error);
                        });
                }
            }
        }, 2000);
    }, [isDisabled, isPreviewDisabled, song.preview_url]);

    const handleMouseLeave = useCallback(() => {
        // Clear the timeout if user leaves before delay completes
        if (previewTimeoutRef.current) {
            clearTimeout(previewTimeoutRef.current);
            previewTimeoutRef.current = null;
        }

        // Stop preview if playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPreviewPlaying(false);
            if (currentPreviewAudio === audioRef.current) {
                currentPreviewAudio = null;
            }
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = ''; // Release memory
                audioRef.current = null;
            }
            if (currentPreviewAudio === audioRef.current) {
                currentPreviewAudio = null;
            }
        };
    }, []);

    // Effect to stop preview when disabled or preview is disabled
    useEffect(() => {
        if (isDisabled || isPreviewDisabled) {
            if (previewTimeoutRef.current) {
                clearTimeout(previewTimeoutRef.current);
                previewTimeoutRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPreviewPlaying(false);
            }
            if (currentPreviewAudio === audioRef.current) {
                currentPreviewAudio = null;
            }
        }
    }, [isDisabled, isPreviewDisabled]);

    const rowClassName = `album-song-row ${isPreviewPlaying ? 'preview-active' : ''} ${isDisabled ? 'disabled' : ''} ${isCurrentlyPlaying ? 'currently-playing' : ''}`;
    const songTitleClassName = `song-title ${!song.preview_url ? 'disabled' : ''} ${isPreviewPlaying ? 'highlight' : ''} ${isCurrentlyPlaying ? 'highlight' : ''}`;

    return (
        <div
            className={rowClassName}
            onMouseEnter={(isDisabled || isPreviewDisabled) ? undefined : handleMouseEnter}
            onMouseLeave={(isDisabled || isPreviewDisabled) ? undefined : handleMouseLeave}
            onClick={handleClick}
            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.6 : 1 }}
        >
            <div className="song-row-left">
                <div className="song-number-wrapper">
                    {isPreviewPlaying ? (
                        <div className="mini-visualizer">
                            <div className="bar bar1"></div>
                            <div className="bar bar2"></div>
                            <div className="bar bar3"></div>
                        </div>
                    ) : (
                        <>
                            <span className="song-number">{index + 1}</span>
                            <Play size={16} className="mini-play-icon" fill="currentColor" />
                        </>
                    )}
                </div>

                <div className="song-title-wrapper">
                    <span className={songTitleClassName}>
                        {song.song_name}
                    </span>
                    {!song.preview_url && <span className="unavailable-tag">Unavailable</span>}
                </div>
            </div>

            <div className="song-row-right">
                <div className="playing-badge">
                    <div className="mini-visualizer" style={{ height: '10px' }}>
                        <div className="bar bar1"></div>
                        <div className="bar bar2"></div>
                        <div className="bar bar3"></div>
                    </div>
                    Previewing
                </div>
                <span className="release-date">{formattedDate}</span>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
        prevProps.song.song_name === nextProps.song.song_name &&
        prevProps.index === nextProps.index &&
        prevProps.isDisabled === nextProps.isDisabled &&
        prevProps.isPreviewDisabled === nextProps.isPreviewDisabled &&
        prevProps.formattedDate === nextProps.formattedDate &&
        prevProps.isCurrentlyPlaying === nextProps.isCurrentlyPlaying
    );
});

ArtistSongRow.displayName = 'ArtistSongRow';

/**interface ProcessedAlbum {
    name: string;
    songs: ProcessedSong[];
    thumbnail: string;
    year: string;
    trackCount: number;
}**/

interface ArtistDetailViewProps {
    artistName: string;
    onBack: () => void;
    onPlaySong: (song: Song) => void;
    apiBaseUrl: string;
    isPlayingAnySong?: boolean;
    currentSong?: Song | null;
    audioRef?: React.RefObject<HTMLAudioElement | null>;
    onSetArtistQueue?: (artistName: string, albumName: string, songs: any[], currentIndex: number) => void;
    artistQueue?: { artistName: string, albumName: string, songs: any[], currentIndex: number } | null;
}

export const ArtistDetailView = React.memo(({ artistName, onBack, onPlaySong, apiBaseUrl, isPlayingAnySong, currentSong, onSetArtistQueue, artistQueue }: ArtistDetailViewProps) => {
    const [data, setData] = useState<ArtistSongsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingSong, setIsLoadingSong] = useState(false);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    useEffect(() => {
        const fetchArtistSongs = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${apiBaseUrl}/getartistssongs/${encodeURIComponent(artistName)}`, {
                    headers: {
                        'Accept': 'application/json',
                        'ngrok-skip-browser-warning': 'true',
                        'User-Agent': 'HanyaMusic/1.0'
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch artist songs');
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError('Could not load artist data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (artistName) {
            fetchArtistSongs();
        }
    }, [artistName, apiBaseUrl]);

    // Pre-process albums and songs with memoization
    const processedAlbums = useMemo(() => {
        if (!data?.albums) return [];

        const albums = Object.entries(data.albums).map(([albumName, songs]) => {
            const processedSongs: ProcessedSong[] = songs.map(song => ({
                ...song,
                formattedDate: new Date(song.release_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                })
            }));

            return {
                name: albumName,
                songs: processedSongs,
                thumbnail: songs[0]?.thumbnail || '',
                year: songs[0]?.release_year || '',
                trackCount: songs.length
            };
        });

        // Sort albums by year
        return albums.sort((a, b) => {
            const yearA = parseInt(String(a.year)) || 0;
            const yearB = parseInt(String(b.year)) || 0;
            return sortOrder === 'desc' ? yearB - yearA : yearA - yearB;
        });
    }, [data, sortOrder]);

    // Hero background image memoized
    const heroBackground = useMemo(() => {
        if (!data) return '';
        return data.sample_thumbnails?.[0] ||
            (data.albums && Object.values(data.albums)[0]?.[0]?.thumbnail) ||
            '';
    }, [data]);

    // Optimized play song handler
    const handlePlayFullSong = useCallback(async (song: ArtistSong, albumName?: string, songIndexInAlbum?: number) => {
        if (!data || isLoadingSong) return;

        setIsLoadingSong(true);
        try {
            const searchUrl = `${apiBaseUrl}/search/exact?song_title=${encodeURIComponent(song.song_name)}&artist=${encodeURIComponent(data.artist)}`;
            console.log('Fetching song from:', searchUrl);

            const response = await fetch(searchUrl, {
                headers: {
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    'User-Agent': 'HanyaMusic/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch song: ${response.status}`);
            }

            const songData = await response.json();
            console.log('Song data received:', songData);

            const playerSong: Song = {
                videoId: songData.title || `${song.song_name}-${data.artist}`,
                title: songData.title || song.song_name,
                uploader: data.artist,
                thumbnail_url: songData.thumbnail_url || song.thumbnail,
                duration: songData.duration ? `${Math.floor(songData.duration / 60)}:${String(songData.duration % 60).padStart(2, '0')}` : "0:00",
                view_count: "0",
                stream_url: songData.stream_url,
                format: songData.format,
                quality: songData.quality
            };

            // Set the artist queue for global playback management
            if (onSetArtistQueue && albumName !== undefined && songIndexInAlbum !== undefined) {
                const album = processedAlbums.find(a => a.name === albumName);
                if (album) {
                    onSetArtistQueue(data.artist, albumName, album.songs, songIndexInAlbum);
                }
            } else if (onSetArtistQueue) {
                // Find the album and index of the song
                for (const album of processedAlbums) {
                    const index = album.songs.findIndex(s => s.song_name === song.song_name);
                    if (index !== -1) {
                        onSetArtistQueue(data.artist, album.name, album.songs, index);
                        break;
                    }
                }
            }

            onPlaySong(playerSong);
        } catch (err) {
            console.error('Error fetching song:', err);
            alert('Failed to load song. Please try again.');
        } finally {
            setIsLoadingSong(false);
        }
    }, [data, isLoadingSong, apiBaseUrl, onPlaySong, processedAlbums, onSetArtistQueue]);

    // Check if a song is currently playing
    const isCurrentlyPlayingSong = useCallback((songName: string, albumName: string) => {
        if (!currentSong || !artistQueue) return false;
        // Check if the current song matches and we're in the same album
        return currentSong.title === songName && artistQueue.albumName === albumName && artistQueue.artistName === data?.artist;
    }, [currentSong, artistQueue, data]);

    const toggleSortOrder = useCallback(() => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    }, []);

    const isRowDisabled = isLoadingSong;
    const isPreviewDisabled = isPlayingAnySong || false;

    return (
        <div className="artist-detail-container">
            <button className="back-button" onClick={onBack}>
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            {loading ? (
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
                    <h2 className="loading-text">Loading {artistName}</h2>
                    <p className="loading-subtext">Fetching discography...</p>
                </div>
            ) : (error || !data) ? (
                <div className="artist-detail-error">
                    <div className="error-icon-wrapper">
                        <AlertCircle size={48} />
                    </div>
                    <h2 className="error-title">Oops! Something went wrong</h2>
                    <p className="error-message">{error || "We couldn't load the artist data at this time."}</p>
                    <div className="error-actions">
                        <button className="back-button-error" onClick={onBack}>
                            <ArrowLeft size={18} /> Go Back
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Hero Banner */}
                    <div className="artist-hero" style={{ backgroundImage: `url(${heroBackground})` }}>
                        <div className="artist-hero-overlay">
                            <div className="artist-hero-content">
                                <h1 className="artist-hero-name">{data.artist}</h1>
                                <div className="artist-stats">
                                    <span className="stat-pill"><Disc size={16} /> {data.total_albums} Albums</span>
                                    <span className="stat-pill"><Music size={16} /> {data.total_songs} Songs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="artist-content-controls" style={{ padding: '0 40px', marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="sort-button"
                            onClick={toggleSortOrder}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                color: '#e5e7eb',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <ArrowUpDown size={16} />
                            Sort: {sortOrder === 'desc' ? 'Latest' : 'Oldest'}
                        </button>
                    </div>

                    <div className="artist-albums-list slide-up">
                        {processedAlbums.map((album) => (
                            <div key={album.name} className="album-section">
                                <div className="album-header">
                                    <img
                                        src={album.thumbnail}
                                        alt={album.name}
                                        className="album-cover-small"
                                    />
                                    <div className="album-info">
                                        <h2 className="album-title">{album.name}</h2>
                                        <div className="album-meta">
                                            <span className="album-year">{album.year}</span>
                                            <span className="bullet">•</span>
                                            <span className="album-track-count">{album.trackCount} songs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="album-songs-grid">
                                    {album.songs.map((song, index) => (
                                        <ArtistSongRow
                                            key={`${song.song_name}-${index}`}
                                            song={song}
                                            index={index}
                                            formattedDate={song.formattedDate}
                                            onPlayFull={(s) => handlePlayFullSong(s, album.name, index)}
                                            isDisabled={isRowDisabled}
                                            isPreviewDisabled={isPreviewDisabled}
                                            isCurrentlyPlaying={isCurrentlyPlayingSong(song.song_name, album.name)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
});

ArtistDetailView.displayName = 'ArtistDetailView';

// Add Music icon locally since it might not be imported in this file
function Music({ size = 24, ...props }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    );
}
