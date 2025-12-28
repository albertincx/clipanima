import React, {useEffect, useRef, useState} from 'react';

import initZoom from './initZoom'

import {FramesToMp4Downloader} from "./FramesToMp4Downloader";
import LoadFramesModal from "./LoadFramesModal";
import Crop from "./components/Crop";

const AnimationStudio = () => {
    const [showPalette, setShowPalette] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showFrames, setShowFrames] = useState(true);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showCustomFps, setShowCustomFps] = useState(false);
    const [showLoadGridModal, setShowLoadGridModal] = useState(false);
    const [gridCellWidth, setGridCellWidth] = useState(64);
    const [gridCellHeight, setGridCellHeight] = useState(64);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(8);
    const [frames, setFrames] = useState<string[]>([]); // Store frames as base64 images
    const [frames2, setFrames2] = useState<string[]>([]); // Store frames as base64 images
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isEraser, setIsEraser] = useState(false);
    // Removed showFrameManager state since frame manager is now always visible
    const [autosaveEnabled, setAutosaveEnabled] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fps, setFps] = useState(5); // frames per second
    // State for Load Grid Modal checkboxes
    const [preserveAspectRatio, setPreserveAspectRatio] = useState(true);
    const [autoAdjustGrid, setAutoAdjustGrid] = useState(true);
    // Ref for the grid image file input
    const gridImageInputRef = useRef<HTMLInputElement>(null);
    // @ts-ignore
    const playbackInterval = useRef<NodeJS.Timeout | null>(null);

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

                    // Check if autosave is enabled and try to load frames from localStorage
                    const savedFrames = loadFramesFromLocalStorage();
                    if (savedFrames && savedFrames.length > 0) {
                        setFrames(savedFrames);
                    } else {
                        setFrames([initialFrameData]);
                    }
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

    // Handle autosave when frames change and autosave is enabled
    useEffect(() => {
        if (autosaveEnabled && frames.length > 0) {
            saveFramesToLocalStorage(frames);
        }
    }, [frames, autosaveEnabled]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (playbackInterval.current) {
                clearInterval(playbackInterval.current);
            }
        };
    }, []);

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

        // Autosave if enabled
        if (autosaveEnabled) {
            saveFramesToLocalStorage(newFrames);
        }
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

        // Autosave if enabled
        if (autosaveEnabled) {
            saveFramesToLocalStorage(newFrames);
        }
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

                // Autosave if enabled
                if (autosaveEnabled) {
                    saveFramesToLocalStorage(updatedFrames);
                }
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

        // Autosave if enabled
        if (autosaveEnabled) {
            saveFramesToLocalStorage(newFrames);
        }
    };

    // Function to save frames to localStorage
    const saveFramesToLocalStorage = (framesToSave: string[]) => {
        if (autosaveEnabled) {
            try {
                localStorage.setItem('animationFrames', JSON.stringify(framesToSave));
                console.log('Frames saved to localStorage');
            } catch (error) {
                console.error('Error saving frames to localStorage:', error);
            }
        }
    };

    // Function to load frames from localStorage
    const loadFramesFromLocalStorage = (): string[] | null => {
        try {
            const savedFrames = localStorage.getItem('animationFrames');
            return savedFrames ? JSON.parse(savedFrames) : null;
        } catch (error) {
            console.error('Error loading frames from localStorage:', error);
            return null;
        }
    };

    // Function to play the animation
    const playAnimation = () => {
        if (frames.length <= 1) return; // Need at least 2 frames to animate

        setIsPlaying(true);

        // Clear any existing interval
        if (playbackInterval.current) {
            clearInterval(playbackInterval.current);
        }

        // Calculate interval in milliseconds from FPS (1000ms / fps)
        const intervalMs = Math.max(10, 1000 / fps); // Minimum 10ms to prevent performance issues

        // Set up new interval to advance frames
        playbackInterval.current = setInterval(() => {
            setCurrentFrame(prevFrame => {
                const nextFrame = (prevFrame + 1) % frames.length;
                // const nextFrame = prevFrame + 1;
                // if (nextFrame >= frames.length) {
                //     // Stop animation when reaching the last frame
                //     pauseAnimation();
                //     return frames.length - 1; // Return index of last frame
                // }
                return nextFrame;
            });
        }, intervalMs);
    };

    // Function to pause the animation
    const pauseAnimation = () => {
        if (playbackInterval.current) {
            clearInterval(playbackInterval.current);
            playbackInterval.current = null;
        }
        setIsPlaying(false);
    };

    // Function to toggle play/pause
    const togglePlayPause = () => {
        if (isPlaying) {
            pauseAnimation();
        } else {
            // changeFrame(0)
            // If we're at the last frame and want to play again, go back to first frame
            if (currentFrame === frames.length - 1) {
                changeFrame(0);
            }
            playAnimation();
        }
    };

    // Function to change frame
    const changeFrame = (index: number) => {
        if (index < 0 || index >= frames.length) return;

        // Save current frame before changing
        const updatedFrames = [...frames];
        updatedFrames[currentFrame] = getCanvasData();
        setFrames(updatedFrames);

        setCurrentFrame(index);

        // Autosave if enabled
        if (autosaveEnabled) {
            saveFramesToLocalStorage(updatedFrames);
        }
    };

    // Function to load frames from external source
    const loadFrames = (newFrames: string[]) => {
        // Save the current frame before replacing
        if (frames.length > 0) {
            const updatedFrames = [...frames];
            updatedFrames[currentFrame] = getCanvasData();
            setFrames(updatedFrames);
        }

        // Replace current frames with new frames
        setFrames(newFrames);
        setCurrentFrame(0);

        // Update canvas to show the first frame
        if (newFrames.length > 0) {
            setCanvasData(newFrames[0]);
        }

        // Autosave if enabled
        if (autosaveEnabled) {
            saveFramesToLocalStorage(newFrames);
        }
    };

    // Function to save the current frame as an image file
    const saveFrame = () => {
        const currentFrameData = getCanvasData();
        if (!currentFrameData) {
            alert('No frame data to save');
            return;
        }

        // Create a temporary link element
        const link = document.createElement('a');
        link.href = currentFrameData;
        link.download = `frame_${currentFrame + 1}.png`; // Name the file based on current frame number
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Function to convert frames to GIF
    const exportGif = async () => {
        if (frames.length === 0) {
            alert('No frames to export');
            return;
        }

        // Show confirmation dialog
        if (!window.confirm('Are you sure you want to export this animation as a MP4? This may take a moment.')) {
            return;
        }

        try {
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

    // Function to start a new project
    const newProject = () => {
        // Show confirmation dialog
        if (!window.confirm('Are you sure you want to start a new project? This will delete all frames and cannot be undone.')) {
            return;
        }

        // Create a blank frame
        if ((window as any).drawingCanvas) {
            const drawingCanvas = (window as any).drawingCanvas as HTMLCanvasElement;
            const ctx = drawingCanvas.getContext('2d');
            if (ctx) {
                // Clear the drawing canvas and fill with white
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

                // Create a new blank frame
                const blankFrameData = drawingCanvas.toDataURL();

                // Reset frames to contain only the blank frame
                setFrames([blankFrameData]);
                setCurrentFrame(0);

                // Autosave if enabled
                if (autosaveEnabled) {
                    saveFramesToLocalStorage([blankFrameData]);
                }
            }
        }
    };

    // Function to handle grid image upload
    const handleGridImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Show confirmation dialog
                if (!window.confirm(`Are you sure you want to load frames from this image? This will replace all current frames (${frames.length} frames will be deleted).`)) {
                    setShowLoadGridModal(false);
                    return;
                }

                // Create temporary canvas to extract frames
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');

                if (!tempCtx) {
                    alert('Could not create canvas context');
                    setShowLoadGridModal(false);
                    return;
                }

                // Use checkbox states to determine behavior
                let cellWidth = gridCellWidth;
                let cellHeight = gridCellHeight;
                let cols, rows;

                // If auto-adjust grid is enabled, calculate optimal cell size
                if (autoAdjustGrid) {
                    // Calculate how many cells fit in the image based on the specified dimensions
                    cols = Math.floor(img.width / gridCellWidth);
                    rows = Math.floor(img.height / gridCellHeight);

                    if (cols > 0 && rows > 0) {
                        // Adjust cell dimensions to evenly divide the image
                        cellWidth = Math.floor(img.width / cols);
                        cellHeight = Math.floor(img.height / rows);
                    } else {
                        // Fallback to original dimensions if calculation fails
                        cols = Math.floor(img.width / cellWidth);
                        rows = Math.floor(img.height / cellHeight);
                    }
                } else {
                    // Use original specified dimensions
                    cols = Math.floor(img.width / cellWidth);
                    rows = Math.floor(img.height / cellHeight);
                }

                if (cols <= 0 || rows <= 0) {
                    alert('Cell size is too large for the image or invalid dimensions');
                    setShowLoadGridModal(false);
                    return;
                }

                const newFrames: string[] = [];

                // Extract each frame from the grid
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        // Set canvas size to match cell dimensions
                        tempCanvas.width = cellWidth;
                        tempCanvas.height = cellHeight;

                        // Draw the specific cell area onto the temporary canvas
                        tempCtx.drawImage(
                            img,
                            col * cellWidth,
                            row * cellHeight,
                            cellWidth,
                            cellHeight,
                            0,
                            0,
                            cellWidth,
                            cellHeight
                        );

                        // Convert to data URL and add to frames
                        const frameData = tempCanvas.toDataURL('image/png');
                        newFrames.push(frameData);
                    }
                }

                // Update the frames state
                setFrames(newFrames);
                setCurrentFrame(0);

                // Close the modal
                setShowLoadGridModal(false);

                // Autosave if enabled
                if (autosaveEnabled) {
                    saveFramesToLocalStorage(newFrames);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Function to load example grid images
    const loadExampleGrid = (imagePath: string, cellWidth: number, cellHeight: number) => {
        // Set the grid cell dimensions
        setGridCellWidth(cellWidth);
        setGridCellHeight(cellHeight);

        // Create image element to load the example
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS if needed
        img.onload = () => {
            // Show confirmation dialog
            if (!window.confirm(`Are you sure you want to load frames from this example image? This will replace all current frames (${frames.length} frames will be deleted).`)) {
                setShowLoadGridModal(false);
                return;
            }

            // Create temporary canvas to extract frames
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) {
                alert('Could not create canvas context');
                setShowLoadGridModal(false);
                return;
            }

            // Use checkbox states to determine behavior
            let finalCellWidth = cellWidth;
            let finalCellHeight = cellHeight;
            let cols, rows;

            // If auto-adjust grid is enabled, calculate optimal cell size
            if (autoAdjustGrid) {
                // Calculate how many cells fit in the image based on the specified dimensions
                cols = Math.floor(img.width / cellWidth);
                rows = Math.floor(img.height / cellHeight);

                if (cols > 0 && rows > 0) {
                    // Adjust cell dimensions to evenly divide the image
                    finalCellWidth = Math.floor(img.width / cols);
                    finalCellHeight = Math.floor(img.height / rows);
                } else {
                    // Fallback to original dimensions if calculation fails
                    cols = Math.floor(img.width / finalCellWidth);
                    rows = Math.floor(img.height / finalCellHeight);
                }
            } else {
                // Use original specified dimensions
                cols = Math.floor(img.width / finalCellWidth);
                rows = Math.floor(img.height / finalCellHeight);
            }

            if (cols <= 0 || rows <= 0) {
                alert('Cell size is too large for the image or invalid dimensions');
                setShowLoadGridModal(false);
                return;
            }

            const newFrames: string[] = [];

            // Extract each frame from the grid
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    // Set canvas size to match cell dimensions
                    tempCanvas.width = finalCellWidth;
                    tempCanvas.height = finalCellHeight;

                    // Draw the specific cell area onto the temporary canvas
                    tempCtx.drawImage(
                        img,
                        col * finalCellWidth,
                        row * finalCellHeight,
                        finalCellWidth,
                        finalCellHeight,
                        0,
                        0,
                        finalCellWidth,
                        finalCellHeight
                    );

                    // Convert to data URL and add to frames
                    const frameData = tempCanvas.toDataURL('image/png');
                    newFrames.push(frameData);
                }
            }

            // Update the frames state
            setFrames(newFrames);
            setCurrentFrame(0);

            // Close the modal
            setShowLoadGridModal(false);

            // Autosave if enabled
            if (autosaveEnabled) {
                saveFramesToLocalStorage(newFrames);
            }
        };

        img.src = imagePath;
    };

    // Function to handle cropped image
    const handleCropComplete = (croppedImage: any) => {
        console.log(croppedImage);
        setGridCellWidth(croppedImage.w);
        setGridCellHeight(croppedImage.h);
        return
        // Update the current frame with the cropped image
        // const updatedFrames = [...frames];
        // updatedFrames[currentFrame] = croppedImage;
        // setFrames(updatedFrames);
        //
        // // Update the canvas to show the cropped image
        // if ((window as any).drawingCanvas) {
        //     const drawingCanvas = (window as any).drawingCanvas as HTMLCanvasElement;
        //     const ctx = drawingCanvas.getContext('2d');
        //     if (ctx) {
        //         const img = new Image();
        //         img.onload = () => {
        //             // Clear the canvas and draw the cropped image
        //             const canvasCtx = ctx; // Capture context to avoid TypeScript error
        //             canvasCtx.fillStyle = 'white';
        //             canvasCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        //             canvasCtx.drawImage(img, 0, 0, drawingCanvas.width, drawingCanvas.height);
        //         };
        //         img.src = croppedImage;
        //     }
        // }
        //
        // // Autosave if enabled
        // if (autosaveEnabled) {
        //     saveFramesToLocalStorage(updatedFrames);
        // }
    };

    // Function to process the image
    // const processImage = () => {
    //     const fileInput = gridImageInputRef.current;
    //     if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    //         alert('Please select an image file first');
    //         return;
    //     }
    //
    //     handleImageUpload({target: fileInput} as unknown as React.ChangeEvent<HTMLInputElement>);
    // };
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
                    setShowFrames(!showFrames);
                    setShowPalette(false);
                }}
                aria-label="Frame manager"
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

            {/* Always Visible Frame Manager Toolbar */}
            {showFrames && (
                <div
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-50 w-full max-w-4xl">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Frame Manager</h3>
                    </div>
                    <div className="flex flex-col space-y-3">
                        <div className="flex space-x-2 justify-center">
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
                                className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded"
                                onClick={saveFrame}
                                aria-label="Save current frame"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                     viewBox="0 0 24 24"
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                                </svg>
                            </button>

                            <button
                                className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded"
                                onClick={togglePlayPause}
                                aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                            >
                                {isPlaying ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path fillRule="evenodd"
                                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                              clipRule="evenodd"/>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                         fill="currentColor">
                                        <path fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                              clipRule="evenodd"/>
                                    </svg>
                                )}
                            </button>

                            <div className="flex items-center space-x-2 bg-gray-700 p-2 rounded">
                                <label htmlFor="fps-control" className="text-white text-sm">FPS:</label>
                                <select
                                    id="fps-control"
                                    value={fps}
                                    onChange={(e) => setFps(parseInt(e.target.value))}
                                    className="bg-gray-600 text-white text-sm rounded px-1"
                                    disabled={isPlaying} // Disable when playing to avoid interval issues
                                >
                                    <option value="1">1</option>
                                    <option value="5">5</option>
                                    {fps > 1 && fps < 10 && fps !== 5 && (
                                        <option value={fps}>{fps}</option>
                                    )}
                                    <option value="10">10</option>
                                    <option value="15">15</option>
                                    <option value="24">24</option>
                                    <option value="30">30</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1 justify-center max-h-24 overflow-y-auto">
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

                        <div className="flex items-center justify-between text-white text-sm text-center">
                            <div>
                                Frame: {currentFrame + 1}/{frames.length}
                            </div>
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
                        </div>

                    </div>
                </div>
            )}

            {/* Settings Popup */}
            {showSettings && (
                <div
                    className="fixed bottom-20 left-1/3 transform -translate-x-1/3 bg-gray-800 p-4 rounded-lg shadow-lg z-60">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Settings</h3>
                        <button
                            className="text-white hover:text-gray-300"
                            onClick={() => setShowSettings(false)}
                            aria-label="Close settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Autosave to localStorage</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={autosaveEnabled}
                                onChange={(e) => setAutosaveEnabled(e.target.checked)}
                            />
                            <div
                                className={`w-11 h-6 rounded-full peer ${autosaveEnabled ? 'bg-blue-600' : 'bg-gray-700'} peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                        </label>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white">LOAD FRAMES</span>
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                            onClick={() => {
                                setShowSettings(false)
                                setShowLoadModal(true)
                            }}
                            aria-label="Load frames"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white">Save as MP4</span>
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                            onClick={exportGif}
                            aria-label="Export as MP4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white">New Project</span>
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                            onClick={newProject}
                            aria-label="Start new project"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-white">Custom FPS</span>
                        <button
                            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
                            onClick={() => setShowCustomFps(true)}
                            aria-label="Set custom FPS"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-white">Load Grid (in dev)</span>
                        <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                            onClick={() => setShowLoadGridModal(true)}
                            aria-label="Load frames from grid"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-white">Crop Image (in dev)</span>
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                            onClick={() => setShowCropModal(true)}
                            aria-label="Crop image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Custom FPS Popup */}
            {showCustomFps && (
                <div
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-70">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Set Custom FPS</h3>
                        <button
                            className="text-white hover:text-gray-300"
                            onClick={() => setShowCustomFps(false)}
                            aria-label="Close custom FPS"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded text-lg font-bold"
                                onClick={() => {
                                    setFps(num);
                                    setShowCustomFps(false);
                                    setShowSettings(false)
                                }}
                                aria-label={`Set FPS to ${num}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Load Grid Modal */}
            {showLoadGridModal && (
                <div
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-70 w-96">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Load Frames from Grid</h3>
                        <button
                            className="text-white hover:text-gray-300"
                            onClick={() => setShowLoadGridModal(false)}
                            aria-label="Close load grid"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    <div className="mb-3">
                        <label className="block text-white mb-1">Cell Width (px):</label>
                        <input
                            type="number"
                            min="1"
                            value={gridCellWidth}
                            onChange={(e) => setGridCellWidth(parseInt(e.target.value) || 1)}
                            className="w-full bg-gray-700 text-white p-2 rounded"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-white mb-1">Cell Height (px):</label>
                        <input
                            type="number"
                            min="1"
                            value={gridCellHeight}
                            onChange={(e) => setGridCellHeight(parseInt(e.target.value) || 1)}
                            className="w-full bg-gray-700 text-white p-2 rounded"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-white mb-1">Select Grid Image:</label>
                        <input
                            ref={gridImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleGridImageUpload}
                            className="w-full text-white"
                        />
                    </div>

                    {/* Example buttons */}
                    <div className="mb-3">
                        <label className="block text-white mb-2">Example Grids:</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded text-sm"
                                onClick={() => loadExampleGrid('/clipanima/assets/grid_man.jpg', 130, 160)}
                                aria-label="Load man grid example"
                            >
                                Man Grid
                            </button>
                        </div>
                    </div>

                    {/* Checkbox items */}
                    <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                            <input
                                type="checkbox"
                                id="preserveAspectRatio"
                                checked={preserveAspectRatio}
                                onChange={(e) => setPreserveAspectRatio(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="preserveAspectRatio" className="text-gray-300">
                                Preserve aspect ratio
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="autoAdjustGrid"
                                checked={autoAdjustGrid}
                                onChange={(e) => setAutoAdjustGrid(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="autoAdjustGrid" className="text-gray-300">
                                Auto-adjust grid size
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                            onClick={() => setShowLoadGridModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                            onClick={() => {
                                // OK button functionality - trigger the file input's change event
                                if (gridImageInputRef.current && gridImageInputRef.current.files && gridImageInputRef.current.files.length > 0) {
                                    // Create a new event to trigger the onChange handler
                                    const event = {
                                        target: gridImageInputRef.current
                                    } as React.ChangeEvent<HTMLInputElement>;
                                    handleGridImageUpload(event);
                                } else {
                                    alert('Please select an image file first.');
                                }
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showCropModal && (
                <div
                    className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow-lg z-70 w-full max-w-4xl h-3/4 max-h-[80vh] overflow-auto">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white font-bold">Crop Image</h3>
                        <button
                            className="text-white hover:text-gray-300"
                            onClick={() => setShowCropModal(false)}
                            aria-label="Close crop"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                                 fill="currentColor">
                                <path fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                    <div className="h-[70vh]">
                        <Crop
                            defaultSrc={frames[currentFrame] || ''}
                            onCropComplete={handleCropComplete}
                            onClose={() => setShowCropModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* Settings Button */}
            <button
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg z-60 -translate-x-32"
                onClick={() => {
                    setShowSettings(!showSettings);
                }}
                aria-label={showSettings ? 'Hide settings' : 'Show settings'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            </button>

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
                    frames={frames2} fps={fps} width={512} height={512}
                    clearFrames={() => setFrames2([])}
                />
            )}

            <LoadFramesModal
                isOpen={showLoadModal}
                onClose={() => setShowLoadModal(false)}
                onLoadFrames={loadFrames}
                currentFrameCount={frames.length}
            />
        </div>
    );
};

export default AnimationStudio;
