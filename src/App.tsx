import React, {useEffect, useState} from 'react';
import initZoom from './initZoom'
import {FramesToMp4Downloader} from "./FramesToMp4Downloader";

const AnimationStudio = () => {
    const [showPalette, setShowPalette] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(8);
    const [frames, setFrames] = useState<string[]>([]); // Store frames as base64 images
    const [frames2, setFrames2] = useState<string[]>([]); // Store frames as base64 images
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isEraser, setIsEraser] = useState(false);
    const [showFrameManager, setShowFrameManager] = useState(false);

    useEffect(() => {
        // Initialize with a blank frame after the canvas is ready
        const timer = setTimeout(() => {
            // Initialize the drawing function first
            initZoom();

            // Then get the drawing canvas data after initZoom has created it
            setTimeout(() => {
                if ((window as any).drawingCanvas) {
                    const drawingCanvas = (window as any).drawingCanvas as HTMLCanvasElement;
                    const initialFrameData = drawingCanvas.toDataURL();
                    setFrames([initialFrameData]);
                }
            }, 50); // Small delay to ensure drawing canvas is ready
        }, 100); // Small delay to ensure canvas is ready

        return () => clearTimeout(timer);
    }, []);

    // Update the selected color and brush size when they change
    useEffect(() => {
        (window as any).selectedColor = selectedColor;
        (window as any).brushSize = brushSize;
        (window as any).isEraser = isEraser;
    }, [selectedColor, brushSize, isEraser]);

    // Update canvas when current frame changes
    useEffect(() => {
        if (frames.length > 0 && currentFrame >= 0 && currentFrame < frames.length) {
            const currentFrameData = frames[currentFrame];
            if (currentFrameData && currentFrameData !== '') {
                setCanvasData(currentFrameData);
            } else if ((window as any).drawingCanvas) {
                // If the frame is empty, clear the drawing canvas
                const drawingCanvas = (window as any).drawingCanvas as HTMLCanvasElement;
                const ctx = drawingCanvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                }
            }
        }
    }, [currentFrame, frames]);

    // Function to load an example drawing
    const loadExample = (exampleType: string) => {
        // Use the drawing canvas that's exposed by initZoom
        if ((window as any).drawingCanvas) {
            const drawingCanvas = (window as any).drawingCanvas as HTMLCanvasElement;
            const ctx = drawingCanvas.getContext('2d');
            if (!ctx) return;

            // Clear the canvas
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Draw example based on type
            ctx.fillStyle = selectedColor;
            ctx.strokeStyle = selectedColor;
            ctx.lineWidth = brushSize;

            switch (exampleType) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(drawingCanvas.width / 2, drawingCanvas.height / 2, 50, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'square':
                    ctx.fillRect(drawingCanvas.width / 2 - 50, drawingCanvas.height / 2 - 50, 100, 100);
                    break;
                case 'smiley':
                    // Draw face
                    ctx.beginPath();
                    ctx.arc(drawingCanvas.width / 2, drawingCanvas.height / 2, 60, 0, Math.PI * 2);
                    ctx.stroke();

                    // Draw eyes
                    ctx.beginPath();
                    ctx.arc(drawingCanvas.width / 2 - 20, drawingCanvas.height / 2 - 20, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(drawingCanvas.width / 2 + 20, drawingCanvas.height / 2 - 20, 8, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw smile
                    ctx.beginPath();
                    ctx.arc(drawingCanvas.width / 2, drawingCanvas.height / 2, 30, 0, Math.PI, false);
                    ctx.stroke();
                    break;
                default:
                    break;
            }
        }
    };

    // Function to get canvas data as base64
    const getCanvasData = (): string => {
        if ((window as any).getDrawingCanvasData) {
            return (window as any).getDrawingCanvasData();
        }
        return '';
    };

    // Function to set canvas data from base64
    const setCanvasData = (dataUrl: string) => {
        if ((window as any).setDrawingCanvasData && dataUrl) {
            (window as any).setDrawingCanvasData(dataUrl);
        }
    };

    // Function to add a new frame
    const addFrame = () => {
        // Save the current frame first
        const updatedFrames = [...frames];
        updatedFrames[currentFrame] = getCanvasData();
        setFrames(updatedFrames);

        // Add a new blank frame
        const newFrameData = ''; // blank frame
        const newFrames = [...updatedFrames];
        newFrames.splice(currentFrame + 1, 0, newFrameData);
        setFrames(newFrames);
        setCurrentFrame(currentFrame + 1);
    };

    // Function to duplicate current frame
    const duplicateFrame = () => {
        if (frames.length === 0) return;
        // Save the current frame first
        const updatedFrames = [...frames];
        updatedFrames[currentFrame] = getCanvasData();
        setFrames(updatedFrames);

        // Duplicate the current frame
        const currentFrameData = updatedFrames[currentFrame];
        const newFrames = [...updatedFrames];
        newFrames.splice(currentFrame + 1, 0, currentFrameData);
        setFrames(newFrames);
        setCurrentFrame(currentFrame + 1);
    };

    // Function to clear the current canvas
    const clearCanvas = () => {
        if (!window.confirm('Are you sure you want to clear the current canvas? This action cannot be undone.')) {
            return;
        }

        // Use the drawing canvas that's exposed by initZoom
        if ((window as any).drawingCanvas) {
            const drawingCanvas = (window as any).drawingCanvas as HTMLCanvasElement;
            const ctx = drawingCanvas.getContext('2d');
            if (ctx) {
                // Clear the drawing canvas and fill with white
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

                // Update the current frame with the cleared canvas data
                const updatedFrames = [...frames];
                updatedFrames[currentFrame] = drawingCanvas.toDataURL();
                setFrames(updatedFrames);
            }
        }
    };

    // Function to delete current frame
    const deleteFrame = () => {
        if (frames.length <= 1) return; // Don't delete the last frame

        // Show confirmation dialog
        if (!window.confirm('Are you sure you want to delete this frame? This action cannot be undone.')) {
            return;
        }

        // Save the current frame before deletion
        const updatedFrames = [...frames];
        updatedFrames[currentFrame] = getCanvasData();

        const newFrames = updatedFrames.filter((_, index) => index !== currentFrame);
        setFrames(newFrames);

        // Update current frame index, ensuring it's within bounds
        const newCurrentFrame = Math.min(currentFrame, newFrames.length - 1);
        setCurrentFrame(newCurrentFrame);
    };

    // Function to change frame
    const changeFrame = (index: number) => {
        if (index < 0 || index >= frames.length) return;

        // Save current frame before changing
        const updatedFrames = [...frames];
        updatedFrames[currentFrame] = getCanvasData();
        setFrames(updatedFrames);

        setCurrentFrame(index);
    };

    // Function to convert frames to GIF
    const exportGif = async () => {
        if (frames.length === 0) {
            alert('No frames to export');
            return;
        }

        // Show confirmation dialog
        if (!window.confirm('Are you sure you want to export this animation as a GIF? This may take a moment.')) {
            return;
        }

        try {
            // Show loading indicator
            // alert('Preparing GIF export... This may take a moment.');

            // Load ffmpeg if not already loaded
            // const ffmpeg = await loadFFmpeg();
            const ffmpeg = {};
            console.log('frames')
            console.log(frames)
            // ffmpeg.on('log', (m: any) => {
            //     console.log(m)
            // })
            const getBase64FromDataUrl = (dataUrl: any) => {
                if (typeof dataUrl !== 'string') return null;
                const parts = dataUrl.split(',');
                if (parts.length !== 2 || !parts[0].includes('base64')) {
                    console.warn('Not a valid base64 Data URL:', dataUrl);
                    return null;
                }
                return parts[1]; // pure base64 string
            };
            let f = []
            // Convert base64 frames to image files for ffmpeg
            for (let i = 0; i < frames.length; i++) {
                const frameData = frames[i];
                // let b64 = getBase64FromDataUrl(frameData)
                if (frameData) {
                    f.push(frameData);
                }
                if (frameData) {
                    // Convert base64 to Uint8Array
                    const base64Data = frameData.split(',')[1]; // Remove data:image/png;base64, prefix
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let j = 0; j < binaryString.length; j++) {
                        bytes[j] = binaryString.charCodeAt(j);
                    }

                    // Write frame to ffmpeg as image file
                    // console.log(ffmpeg)
                    // await ffmpeg.writeFile(`frame${i.toString().padStart(3, '0')}.png`, bytes);
                }
            }
            console.log(f)
            if (f.length) setFrames2(frames.filter(Boolean));

            // Create a text file with frame list for ffmpeg
            const frameList = frames.map((_, i) => {
                // const data2 = await ffmpeg.readFile(`frame${i.toString().padStart(3, '0')}.png`);

                // downloadFile(data2, `frame${i.toString().padStart(3, '0')}.png`, 'image/png')
                return `file 'frame${i.toString().padStart(3, '0')}.png'`
            }).join('\n') + '\n';


            // await ffmpeg.writeFile('framelist.txt', new TextEncoder().encode(frameList));
            // const data1 = await ffmpeg.readFile('framelist.txt');
            // console.log(data1)
            // downloadFile(data1, 'framelist.txt', 'image/plain')

            // Run ffmpeg command to create GIF
            // await ffmpeg.exec(
            //     '-f', 'concat',
            //     '-safe', '0',
            //     '-i', 'framelist.txt',
            //     '-vf', 'fps=5,scale=320:320:flags=lanczos',
            //     '-pix_fmt', 'rgb24',
            //     '-y',
            //     'output.gif'
            // );

            // Read the output GIF
            // const data = await ffmpeg.readFile('output.gif');
            // downloadFile(data, 'animation.gif', 'image/gif')
            // const data = await ffmpeg.readFile('output.webm');
            // downloadFile(data, 'animation.webm', 'video/webm')

            // alert('GIF exported successfully!');
        } catch (error) {
            console.error('Error exporting GIF:', error);
            // alert('Error exporting GIF: ' + (error as Error).message);
        }
    };

    // return null
    return (
        <div className="fixed inset-0 bg-gray-900 overflow-hidden">
            <canvas
                id={'canvas'}

            />

            {/* Color Palette Popup */}
            {showPalette && (
                <div
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-60">
                    <div className="grid grid-cols-6 gap-2 mb-3">
                        {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                            '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'].map((color) => (
                            <button
                                key={color}
                                className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-white' : 'border-gray-600'} focus:outline-none`}
                                style={{backgroundColor: color}}
                                onClick={() => setSelectedColor(color)}
                                aria-label={`Select ${color} color`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center space-x-3">
                        <label htmlFor="brushSize" className="text-white text-sm">Size:</label>
                        <input
                            id="brushSize"
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-32 accent-white"
                        />
                        <span className="text-white text-sm w-8">{brushSize}px</span>
                    </div>
                </div>
            )}

            {/* Toggle Palette Button */}
            <button
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg z-60 -translate-x-16"
                onClick={() => {
                    setShowPalette(!showPalette);
                    if (showExamples) setShowExamples(false); // Close examples if open
                }}
                aria-label={showPalette ? 'Hide color palette' : 'Show color palette'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                </svg>
            </button>

            <button
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg z-60 translate-x-0"
                // className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm w-full"
                onClick={() => {
                    setShowFrameManager(!showFrameManager);
                    setShowPalette(false);
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
            </button>

            {/* Examples Button */}
            <button
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg z-60 translate-x-16"
                onClick={() => {
                    setShowExamples(!showExamples);
                    if (showPalette) setShowPalette(false); // Close palette if open
                }}
                aria-label={showExamples ? 'Hide examples' : 'Show examples'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                </svg>
            </button>

            {/* Examples Popup */}
            {showExamples && (
                <div
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-60">
                    <h3 className="text-white mb-2">Examples</h3>
                    <div className="flex space-x-2">
                        <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                            onClick={() => {
                                loadExample('circle');
                                setShowExamples(false);
                            }}
                        >
                            Circle
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                            onClick={() => {
                                loadExample('square');
                                setShowExamples(false);
                            }}
                        >
                            Square
                        </button>
                        <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                            onClick={() => {
                                loadExample('smiley');
                                setShowExamples(false);
                            }}
                        >
                            Smiley
                        </button>
                    </div>
                </div>
            )}

            {/* Frame Manager Popup */}
            {showFrameManager && (
                <div
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-60">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Frame Manager</h3>
                        <button
                            className="text-white hover:text-gray-300"
                            onClick={() => setShowFrameManager(false)}
                            aria-label="Close frame manager"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <div className="flex space-x-2">
                            <button
                                className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded"
                                onClick={deleteFrame}
                                aria-label="Delete frame"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>

                            <button
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                                onClick={addFrame}
                                aria-label="Add frame"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                </svg>
                            </button>

                            <button
                                className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded"
                                onClick={duplicateFrame}
                                aria-label="Duplicate frame"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                            </button>

                            <button
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                                onClick={clearCanvas}
                                aria-label="Clear canvas"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>

                            <button
                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                                onClick={exportGif}
                                aria-label="Export as GIF"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-1 max-w-xs">
                            {frames.map((_, index) => (
                                <button
                                    key={index}
                                    className={`w-10 h-10 rounded ${index === currentFrame ? 'ring-2 ring-blue-400' : ''}`}
                                    onClick={() => changeFrame(index)}
                                    aria-label={`Go to frame ${index + 1}`}
                                >
                                    <div
                                        className="w-full h-full bg-gray-200 border border-gray-400 rounded flex items-center justify-center text-xs">
                                        {index + 1}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="text-white text-sm">
                            Frame: {currentFrame + 1}/{frames.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Eraser Button */}
            <button
                className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg z-60 translate-x-32 ${isEraser ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => setIsEraser(!isEraser)}
                aria-label={isEraser ? 'Switch to drawing mode' : 'Switch to eraser mode'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
            {!!frames2.length && (
                <FramesToMp4Downloader
                    frames={frames2} fps={10} width={512} height={512}
                    clearFrames={() => setFrames2([])}
                />
            )}
        </div>
    );
};

export default AnimationStudio;
