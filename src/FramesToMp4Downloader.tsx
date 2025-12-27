// FramesToMp4Downloader.tsx
import React, {useEffect, useState} from 'react';
import {Muxer, ArrayBufferTarget} from 'mp4-muxer';

interface FrameToMp4Props {
    frames: string[]; // array of base64 PNG strings, e.g. "data:image/png;base64,..."
    fps?: number;
    width?: number;
    clearFrames?: any;
    height?: number;
}

export const FramesToMp4Downloader: React.FC<FrameToMp4Props> = ({
                                                                     frames,
                                                                     clearFrames,
                                                                     fps = 10,
                                                                     width = 512,
                                                                     height = 512,
                                                                 }) => {
    const [isEncoding, setIsEncoding] = useState(false);
    console.log('FramesToMp4Downloader');
    const handleDownloadMp4 = async () => {
        if (!frames.length) return;

        // Check browser support
        if (!('VideoEncoder' in window)) {
            alert('WebCodecs not supported in this browser (Chrome 94+ required)');
            return;
        }

        setIsEncoding(true);
        let mp4Blob: Blob | null = null;

        try {
            mp4Blob = await encodeFramesToMp4(frames, fps, width, height);
            console.log('mp4Blob')
            console.log(mp4Blob)
            if (mp4Blob) {
                const url = URL.createObjectURL(mp4Blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'animation.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                clearFrames?.()
            }
        } catch (err) {
            console.error('Encoding failed:', err);
            alert('Failed to encode video. Check console for details.');
        } finally {
            setIsEncoding(false);
        }
    };
    useEffect(() => {
        // if (!frames.length) return;
        handleDownloadMp4()
    }, []);
    return (
        <button className={'z-100 relative'} onClick={handleDownloadMp4} disabled={isEncoding || !frames.length}>
            {isEncoding ? 'Encoding...' : 'Download MP4'}
        </button>
    );
};

// Core encoding logic (outside React to avoid re-renders)
async function encodeFramesToMp4(
    base64Frames: string[],
    fps: number,
    width: number,
    height: number
): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
        // 1. Setup MP4 muxer
        const muxer = new Muxer({
            fastStart: 'in-memory',
            target: new ArrayBufferTarget(),
            video: {
                codec: 'avc', // H.264 Baseline (widely compatible)
                width,
                height,
                // timescale: fps,
            }
        });

        // 2. Create offscreen canvas
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', {willReadFrequently: true});

        if (!ctx) {
            reject(new Error('Could not get 2D context'));
            return;
        }

        // 3. Setup VideoEncoder
        const encoder = new VideoEncoder({
            output: (chunk, meta) => {
                muxer.addVideoChunk(chunk, meta);
            },
            error: (e) => {
                reject(new Error(`Encoder error: ${e.message}`));
            },
        });

        // 4. Configure encoder
        await encoder.configure({
            codec: 'avc1.42001e',
            width,
            height,
            bitrate: 2_000_000, // 2 Mbps
            framerate: fps,
        });

        // 5. Preload frames as ImageBitmap (more efficient)
        const imageBitmaps: ImageBitmap[] = [];
        for (const src of base64Frames) {
            try {
                // ✅ Directly use Data URL with Image constructor + createImageBitmap
                const img = new Image();
                img.src = src; // must be full data:... URL
                await img.decode(); // wait for load
                const bitmap = await createImageBitmap(
                    img,
                    {resizeWidth: width, resizeHeight: height, resizeQuality: 'high'}
                );
                imageBitmaps.push(bitmap);
            } catch (err) {
                reject(new Error(`Failed to load frame: ${err}`));
                return;
            }
        }

        // 6. Encode each frame
        for (let i = 0; i < imageBitmaps.length; i++) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(imageBitmaps[i], 0, 0, width, height);

            const videoFrame = new VideoFrame(canvas, {
                timestamp: Math.round((i * 1_000_000) / fps), // microseconds
                duration: Math.round(1_000_000 / fps),
            });

            try {
                encoder.encode(videoFrame);
            } finally {
                videoFrame.close();
            }

            // Optional: yield to keep UI responsive
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // 7. Finalize
        await encoder.flush();
        muxer.finalize();
        let {buffer} = muxer.target;
        const blob = new Blob([buffer], {type: 'video/mp4'}); // ✅ create Blob

        // console.log(muxer.target)
        resolve(blob);

        // Cleanup
        imageBitmaps.forEach(bm => bm.close());
    });
}
