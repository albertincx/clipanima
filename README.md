# Animation Studio - HTML5 Drawing Canvas App

A feature-rich drawing canvas application built with React and TypeScript that supports animation creation with multiple
frames and GIF export functionality.

### IN DEVELOPMENT!

## Features

### Drawing Tools

- **Color Palette**: Choose from 12 different colors with a popup palette
- **Brush Size**: Adjustable brush size from 1px to 20px
- **Eraser Tool**: Toggle between drawing and erasing modes
- **Examples**: Predefined drawings (circle, square, smiley) to start with

### Animation Tools

- **Frame Manager**: Create and manage multiple frames for animations
- **Frame Operations**: Add, duplicate, and delete frames
- **Frame Navigation**: Switch between frames to build animations
- **GIF Export**: Export all frames as an animated GIF

### UI Components

- **Fixed Positioning**: All tools positioned at the bottom of the screen
- **Popups**: Color palette, examples, and frame manager appear as popups
- **Responsive Design**: Works well on different screen sizes

## How to Use

### Drawing

1. Select a color from the color palette
2. Adjust brush size using the slider
3. Draw on the canvas using your mouse or touch
4. Toggle eraser mode to remove parts of your drawing

### Animation

1. Create your first frame
2. Use the frame manager to add new frames
3. Draw different content on each frame to create animation
4. Duplicate frames to create smooth transitions
5. Export your animation as a GIF

### Tools Location

- **Color Palette**: Bottom center, left side (paintbrush icon)
- **Examples**: Bottom center, middle (folder icon)
- **Frame Manager**: Access via color palette popup (click "Open Frame Manager")
- **Eraser**: Bottom center, right side (eraser icon)

## Technical Details

### Technologies Used

- React (with TypeScript)
- Tailwind CSS for styling
- Canvas API for drawing functionality
- ffmpeg.wasm for GIF export
- Vite for build tooling

### Architecture

- The drawing functionality is implemented in `aa.ts`
- UI components and state management in `App.tsx`
- Frame management stores each frame as a base64 image

### GIF Export Process

1. All frames are converted to base64 images
2. mp4muxer processes the images into an animated mp4
3. The resulting GIF is downloaded to your device

## Installation

```bash
npm install
npm run dev
```

## Dependencies

- `react`
- `@ffmpeg/ffmpeg`
- `typescript`
- `vite`
- `tailwindcss`

## Contributing

Feel free to submit issues or pull requests to improve the application.

## License

This project is open source and available under the MIT License.
