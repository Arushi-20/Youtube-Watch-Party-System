/**
 * Extracts a YouTube Video ID from any standard YouTube URL or raw ID
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const input = urlOrId.trim();

  // If already an 11-character alphanumeric YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Regex covering standard watch URLs, short URLs, embeds, and shorts
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = input.match(regex);
  return match ? match[1] : null;
}

/**
 * Formats time in seconds to mm:ss or hh:mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedMins = String(mins).padStart(hours > 0 ? 2 : 1, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMins.padStart(2, '0')}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

export interface PresetVideo {
  title: string;
  category: string;
  videoId: string;
  thumbnail: string;
}

export const PRESET_VIDEOS: PresetVideo[] = [
  {
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    category: 'Music',
    videoId: 'jfKfPfyJRdk',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
  },
  {
    title: 'Big Buck Bunny (4K 60FPS Open Source)',
    category: 'Animation',
    videoId: 'aqz-KE-bpKQ',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
  },
  {
    title: 'Costa Rica in 4K 60fps HDR (Ultra HD)',
    category: 'Nature',
    videoId: 'LXb3EKWsInQ',
    thumbnail: 'https://img.youtube.com/vi/LXb3EKWsInQ/hqdefault.jpg',
  },
  {
    title: 'Synthwave Chill Mix - Retro 80s Cyberpunk',
    category: 'Vibes',
    videoId: '4xDzrJKXOOY',
    thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/hqdefault.jpg',
  },
];
