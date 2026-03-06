/**
 * Live channel interface
 */
export interface LiveChannel {
    id: string;
    name: string;
    handle?: string; // YouTube channel handle (e.g., @bloomberg)
    fallbackVideoId?: string; // Fallback if no live stream detected
    videoId?: string; // Dynamically fetched live video ID
    isLive?: boolean;
    hlsUrl?: string; // HLS manifest URL for native <video> playback (desktop)
    useFallbackOnly?: boolean; // Skip auto-detection, always use fallback
    geoAvailability?: string[]; // ISO 3166-1 alpha-2 codes; undefined = available everywhere
}
