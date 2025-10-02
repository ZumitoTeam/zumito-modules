# Canvas Module

The **Canvas Module** is a utility library for the Zumito ecosystem that provides enhanced canvas rendering capabilities for Discord bots. This module extends the native HTML5 Canvas API with additional drawing utilities, image processing functions, and GIF generation tools specifically designed for bot development.

## Features

- **Extended Canvas API**: Enhanced drawing functions beyond standard canvas operations
- **Image Processing**: Built-in utilities for image manipulation and processing
- **GIF Generation**: Tools for creating animated GIF files from canvas frames
- **Avatar Integration**: Utilities for fetching and processing Discord user avatars
- **Text Rendering**: Advanced text drawing with custom fonts and effects
- **Shape Drawing**: Enhanced geometric shape rendering functions
- **Performance Optimized**: Efficient memory management for canvas operations

## Installation

This module is part of the Zumito ecosystem and serves as a dependency for other visual modules.

```bash
npm install @zumito-team/canvas-module
```

## Usage

Import and use the Canvas Module in your Zumito bot `zumito.config.ts`:

```typescript
import path from 'path';
import { ServiceContainer, type LauncherConfig } from 'zumito-framework';

const __dirname = process.cwd();

export const config: LauncherConfig = {
    bundles: [{
        path: path.join(__dirname, "node_modules", "@zumito-team", "canvas-module"),
    }],
};
```

### Using Canvas Utils

```typescript
import { CanvasUtils } from "@zumito-team/canvas-module";

const canvasUtil = new CanvasUtils({
    width: 500,
    height: 300,
    isGif: true,
    delay: 100,
    quality: 10,
    repeat: 0,
});
const ctx = canvasUtil.getContext();
canvasUtil.startEncoder();

const avatar1 = await CanvasUtils.loadImage(user1.displayAvatarURL({ extension: 'png', size: 64 }));
const avatar2 = await CanvasUtils.loadImage(user2.displayAvatarURL({ extension: 'png', size: 64 }));

const drawBackground = () => {
    canvasUtil.drawBackground('#87CEEB', '#90EE90');
    canvasUtil.drawRect(0, 260, 500, 40, '#8B4513');
};

drawBackground();
ctx.drawImage(avatar1, 80, 110, 40, 40);
ctx.drawImage(avatar2, 380, 110, 40, 40);
canvasUtil.drawParticles(250, 150, '#FFD700');
canvasUtil.addFrame();

const attachment = await canvasUtil.toAttachment('stickmanfight.gif');
await interaction.reply({ files: [attachment] });
```

## Technical Details

### Canvas Utilities

The `CanvasUtils` class provides a comprehensive set of static methods for enhanced canvas operations:

- **Drawing Functions**: Extended shape and path drawing capabilities
- **Image Processing**: Loading, resizing, and manipulating images
- **Text Utilities**: Advanced text rendering with alignment and styling
- **Avatar Handling**: Specialized functions for Discord avatar processing
- **Animation Support**: Frame-by-frame animation utilities for GIF creation

### Core Functionality

```typescript
class CanvasUtils {
    // Image processing
    static async loadImage(source: string | Buffer): Promise<Image>
    static resizeImage(image: Image, width: number, height: number): Canvas
    
    // Drawing utilities
    static drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void
    static drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void
    
    // Text rendering
    static drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options?: TextOptions): void
    static measureText(ctx: CanvasRenderingContext2D, text: string): TextMetrics
    
    // Avatar processing
    static async drawAvatar(ctx: CanvasRenderingContext2D, avatarUrl: string, x: number, y: number, size: number): Promise<void>
    static createCircularAvatar(avatar: Image, size: number): Canvas
    
    // GIF utilities
    static createGifEncoder(width: number, height: number): GIFEncoder
    static addFrameToGif(encoder: GIFEncoder, canvas: Canvas): void
}
```

## File Structure

```
canvas/
├── index.ts              # Module entry point and exports
├── package.json         # Package configuration and dependencies
└── utils/
    └── CanvasUtils.ts   # Main utility class with canvas functions
```

## Dependencies

- **canvas**: Node.js Canvas implementation for server-side rendering
- **gifencoder**: GIF encoding library for animation creation
- **zumito-framework**: Core framework integration
- **node-fetch**: HTTP client for fetching remote images (avatars)

## API Reference

### Image Operations

```typescript
// Load image from URL or buffer
const image = await CanvasUtils.loadImage('https://example.com/image.png');

// Resize image maintaining aspect ratio
const resized = CanvasUtils.resizeImage(image, 200, 200);
```

### Drawing Operations

```typescript
// Draw rounded rectangle
CanvasUtils.drawRoundedRect(ctx, 10, 10, 100, 50, 10);

// Draw perfect circle
CanvasUtils.drawCircle(ctx, 150, 150, 75);

// Advanced text rendering
CanvasUtils.drawText(ctx, 'Hello World', 100, 100, {
    font: '24px Arial',
    fillStyle: '#ffffff',
    textAlign: 'center'
});
```

### Avatar Processing

```typescript
// Draw user avatar at specified position
await CanvasUtils.drawAvatar(ctx, user.displayAvatarURL(), 50, 50, 64);

// Create circular avatar mask
const circularAvatar = CanvasUtils.createCircularAvatar(avatarImage, 128);
```

### GIF Creation

```typescript
// Initialize GIF encoder
const encoder = CanvasUtils.createGifEncoder(500, 300);
encoder.start();
encoder.setRepeat(0);
encoder.setDelay(100);

// Add frames
for (let frame = 0; frame < frameCount; frame++) {
    // Render frame to canvas
    renderFrame(canvas, frame);
    CanvasUtils.addFrameToGif(encoder, canvas);
}

encoder.finish();
const buffer = encoder.out.getData();
```

## Performance Considerations

- **Memory Management**: Canvas objects are memory-intensive; dispose properly after use
- **Image Caching**: Consider caching frequently used images like avatars
- **Async Operations**: Image loading is asynchronous; handle promises appropriately
- **GIF Size**: Large GIFs can consume significant memory and processing time


## Error Handling

The module includes built-in error handling for:
- Invalid image URLs or corrupted image data
- Canvas rendering errors
- Memory allocation failures during large operations
- Network timeouts when fetching remote images

## License

This project is licensed under the GNU General Public License (GPL).

---

**Perfect for**: Any Zumito module that requires canvas operations, image processing, or GIF generation. Essential dependency for visual Discord bot commands and interactive graphics generation.
