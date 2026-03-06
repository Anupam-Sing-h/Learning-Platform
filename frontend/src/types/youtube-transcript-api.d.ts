declare module 'youtube-transcript-api' {
    interface TranscriptSegment {
        text: string;
        start: string;
        dur: string;
    }

    interface TranscriptTrack {
        language: string;
        transcript: TranscriptSegment[];
    }

    interface TranscriptResult {
        id: string;
        title: string;
        author: string;
        channelId: string;
        languages: { label: string; languageCode: string }[];
        tracks: TranscriptTrack[];
        isLive: boolean;
        playabilityStatus: { status: string; playableInEmbed: boolean };
        microformat: {
            playerMicroformatRenderer: {
                lengthSeconds: string;
                viewCount: string;
                category: string;
                publishDate: string;
                title: { simpleText: string };
                thumbnail: { thumbnails: { url: string }[] };
            };
        };
    }

    class TranscriptClient {
        ready: Promise<void>;
        constructor(axiosOptions?: object);
        getTranscript(id: string, config?: object): Promise<TranscriptResult>;
        bulkGetTranscript(ids: string[], config?: object): Promise<TranscriptResult[]>;
    }

    export default TranscriptClient;
}
