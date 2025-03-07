declare module 'gifshot' {
    interface CreateGIFOptions {
        images?: (string | HTMLImageElement | HTMLCanvasElement)[];
        video?: string | HTMLVideoElement;
        gifWidth?: number;
        gifHeight?: number;
        interval?: number;
        numFrames?: number;
        frameDuration?: number;
        sampleInterval?: number;
        numWorkers?: number;
        text?: string;
        fontWeight?: string;
        fontSize?: string;
        fontFamily?: string;
        fontColor?: string;
        textAlign?: string;
        textBaseline?: string;
        stroke?: string;
        strokeColor?: string;
        waterMark?: HTMLImageElement;
        progressCallback?: (captureProgress: number) => void;
    }

    interface CreateGIFResponse {
        error: boolean;
        errorCode?: string;
        errorMsg?: string;
        image?: string;
        cameraStream?: MediaStream;
        video?: string;
    }

    function createGIF(
        options: CreateGIFOptions,
        callback: (obj: CreateGIFResponse) => void
    ): void;

    export { createGIF, CreateGIFOptions, CreateGIFResponse };
}
