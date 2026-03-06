/**
 * Custom YouTube transcript fetcher for Next.js API routes.
 * 
 * Replicates the exact approach used by the Python youtube-transcript-api:
 * 1. Fetches YouTube watch page HTML to extract INNERTUBE_API_KEY
 * 2. Calls InnerTube /player API with ANDROID client context
 *    (returns caption URLs that actually work, without &exp=xpe)
 * 3. Fetches and parses the XML captions
 * 
 * This works from both local and cloud environments (Vercel, etc.)
 * because the ANDROID client endpoint isn't blocked like the WEB one.
 */

import { decode as htmlDecode } from 'he';

export interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
}

export interface TranscriptResult {
    title: string;
    segments: TranscriptSegment[];
    transcriptText: string;
    duration: string | null;
    languageCode: string;
}

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// Same context the Python youtube-transcript-api uses
const INNERTUBE_CONTEXT = {
    client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
    },
};

/**
 * Fetch transcript for a YouTube video
 */
export async function fetchTranscript(
    videoId: string,
    preferredLang: string = 'en'
): Promise<TranscriptResult> {
    // Step 1: Fetch YouTube watch page to get INNERTUBE_API_KEY and cookies
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(watchUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'en-US,en;q=0.9',
            Accept: 'text/html,application/xhtml+xml',
        },
    });

    if (!pageResponse.ok) {
        throw new Error(`Failed to fetch YouTube page: ${pageResponse.status}`);
    }

    const html = await pageResponse.text();

    // Handle consent page
    if (html.includes('action="https://consent.youtube.com/s"')) {
        throw new Error('YouTube consent page detected. Try again with cookies.');
    }

    // Check for recaptcha (IP blocked)
    if (html.includes('class="g-recaptcha"')) {
        throw new Error('YouTube is blocking requests from this IP (recaptcha detected).');
    }

    // Extract INNERTUBE_API_KEY
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
    if (!apiKeyMatch) {
        throw new Error('Could not extract INNERTUBE_API_KEY from YouTube page.');
    }
    const apiKey = apiKeyMatch[1];

    // Extract title from HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    let title = videoId;
    if (titleMatch) {
        title = htmlDecode(titleMatch[1].replace(' - YouTube', '').trim());
    }

    // Get cookies from page response for subsequent requests
    const setCookies = pageResponse.headers.getSetCookie?.() || [];
    const cookieStr = setCookies.map((c) => c.split(';')[0]).join('; ');

    // Step 2: Call InnerTube /player API with ANDROID client
    // This is the key: ANDROID client returns caption URLs without &exp=xpe
    // (the WEB client's URLs have &exp=xpe which returns empty content)
    const playerResponse = await fetch(
        `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': USER_AGENT,
                Cookie: cookieStr,
            },
            body: JSON.stringify({
                context: INNERTUBE_CONTEXT,
                videoId,
            }),
        }
    );

    if (!playerResponse.ok) {
        throw new Error(`InnerTube player API failed: ${playerResponse.status}`);
    }

    const playerData = await playerResponse.json();

    // Check playability
    const status = playerData?.playabilityStatus?.status;
    const reason = playerData?.playabilityStatus?.reason;

    if (status === 'LOGIN_REQUIRED') {
        if (reason === "Sign in to confirm you're not a bot") {
            throw new Error('YouTube is blocking requests from this IP.');
        }
        throw new Error('This video requires login to view.');
    }
    if (status === 'ERROR') {
        throw new Error(`Video unavailable: ${reason || 'unknown'}`);
    }

    // Step 3: Extract caption tracks
    const captionTracks =
        playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
        throw new Error('No captions/subtitles available for this video.');
    }

    // Find best caption track (same priority as Python lib)
    const getName = (t: { name?: { runs?: { text: string }[]; simpleText?: string } }) =>
        t.name?.runs?.[0]?.text || t.name?.simpleText || '';

    // Priority: manual in lang → auto in lang → any auto → first
    const track =
        captionTracks.find(
            (t: { languageCode: string; kind?: string }) =>
                t.languageCode === preferredLang && t.kind !== 'asr'
        ) ||
        captionTracks.find(
            (t: { languageCode: string; kind?: string }) =>
                t.languageCode === preferredLang && t.kind === 'asr'
        ) ||
        captionTracks.find(
            (t: { kind?: string }) => t.kind === 'asr'
        ) ||
        captionTracks[0];

    // Strip &fmt=srv3 like the Python lib does
    const captionUrl = track.baseUrl.replace('&fmt=srv3', '');

    // Verify the URL doesn't have &exp=xpe (which would return empty)
    if (captionUrl.includes('&exp=xpe')) {
        throw new Error(
            'Caption URL contains &exp=xpe parameter which blocks access. ' +
            'This should not happen with ANDROID client.'
        );
    }

    // Step 4: Fetch the caption XML
    const captionResponse = await fetch(captionUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            Cookie: cookieStr,
        },
    });

    if (!captionResponse.ok) {
        throw new Error(`Failed to fetch caption content: ${captionResponse.status}`);
    }

    const xml = await captionResponse.text();

    if (!xml || xml.length === 0) {
        throw new Error('Caption content was empty.');
    }

    // Step 5: Parse the XML captions
    const segments = parseXmlCaptions(xml);

    if (segments.length === 0) {
        throw new Error('No caption segments found in the XML content.');
    }

    // Build result
    const transcriptText = segments.map((s) => s.text).join(' ');

    const lastSeg = segments[segments.length - 1];
    let duration: string | null = null;
    if (lastSeg) {
        const totalSeconds = Math.floor(lastSeg.start + lastSeg.duration);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        duration = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const languageCode: string = track.languageCode || 'en';

    return { title, segments, transcriptText, duration, languageCode };
}

/**
 * Parse YouTube caption XML into segments
 */
function parseXmlCaptions(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    // Match each <text> element
    const textRegex =
        /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;

    let match;
    while ((match = textRegex.exec(xml)) !== null) {
        const start = parseFloat(match[1]);
        const duration = parseFloat(match[2]);
        // Strip HTML tags and decode entities
        let text = match[3]
            .replace(/<[^>]+>/g, '')
            .replace(/\n/g, ' ')
            .trim();
        text = htmlDecode(text);

        if (text) {
            segments.push({ text, start, duration });
        }
    }

    return segments;
}
