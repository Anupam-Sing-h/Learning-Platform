import { NextRequest, NextResponse } from 'next/server';
import { fetchTranscript } from '@/lib/youtube-transcript';

function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:v=|v\/|vi\/|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const url: string = body.url;

        if (!url) {
            return NextResponse.json({ detail: 'URL is required' }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ detail: 'Invalid YouTube URL' }, { status: 400 });
        }

        // 1. Fetch transcript on Vercel by scraping the YouTube watch page
        let transcriptText: string;
        let title: string;
        let duration: string | null;
        let languageCode: string;

        try {
            const result = await fetchTranscript(videoId, 'en');
            transcriptText = result.transcriptText;
            title = result.title;
            duration = result.duration;
            languageCode = result.languageCode;
        } catch (err) {
            console.error('Transcript fetch error:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            return NextResponse.json(
                { detail: `Failed to fetch transcript: ${message}` },
                { status: 400 }
            );
        }

        if (!transcriptText) {
            return NextResponse.json(
                { detail: 'No transcript available for this video' },
                { status: 400 }
            );
        }

        // 2. Send pre-fetched transcript to backend for processing
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/process-video-with-transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                title,
                transcript_text: transcriptText,
                thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                duration,
                language_code: languageCode,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error (process-video):', error);
        return NextResponse.json(
            { detail: 'Failed to process video' },
            { status: 500 }
        );
    }
}
