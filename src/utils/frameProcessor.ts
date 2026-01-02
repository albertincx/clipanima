/**
 * Process frames with white background using HTML canvas (async version)
 */
export async function processFramesWithWhiteBackgroundAsync(
    frames: string[],
    width: number = 512,
    height: number = 512
): Promise<string[]> {
    // Create a temporary canvas element
    // if (!ctx) {
    //     console.error('Could not get 2D context for frame processing');
    //     return frames; // return original frames if context fails
    // }

    // Process each frame with Promise.all to handle all asynchronously
    const processedFrames = await Promise.all(frames.map(async (frame) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // console.error('Could not get 2D context for frame processing');
                return frame; // return original frames if context fails
            }
            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);

            // Create image element to draw the frame
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Handle CORS if needed

            // Return a promise that resolves when the image is loaded and processed
            return new Promise<string>((resolve) => {
                img.onload = () => {
                    try {
                        ctx.drawImage(img, 0, 0, width, height);
                        const processedFrame = canvas.toDataURL('image/png');
                        resolve(processedFrame);
                    } catch (drawError) {
                        console.error('Error drawing image:', drawError);
                        resolve(frame); // fallback to original frame
                    }
                };

                img.onerror = () => {
                    console.error('Error loading image:', frame);
                    resolve(frame); // fallback to original frame
                };

                img.src = frame;
            });
        } catch (error) {
            console.error('Error processing frame:', error);
            // If processing fails, return the original frame
            return frame;
        }
    }));

    return processedFrames;
}
