# React Image Editor

A professional image editing library for React applications with both headless and styled component options.

[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?style=flat-square)](https://image-editor.ozdemircibaris.dev)
[![npm](https://img.shields.io/npm/v/@ozdemircibaris/react-image-editor?style=flat-square)](https://www.npmjs.com/package/@ozdemircibaris/react-image-editor)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://opensource.org/licenses/MIT)

## Features

- **Headless Mode** - Full control over UI with React hooks
- **Styled Components** - Ready-to-use components for quick setup
- **Text Tool** - Add and style text with font controls
- **Blur Tool** - Add selective blur effects to specific areas
- **Crop Tool** - Pixel-perfect image cropping
- **Shape Tools** - Rectangles and circles with custom styling
- **Drawing Mode** - Free-hand drawing with customizable brush
- **Undo/Redo** - Full history management with keyboard shortcuts
- **Zoom & Pan** - Navigate large images with ease
- **Original Resolution Export** - Exports maintain original image dimensions
- **MIME Type Validation** - Validate image files before loading
- **Base64 Support** - Load and export images as data URLs

If React Image Editor doesn't cover your needs we recommend taking a look at [Pintura](https://pqina.nl/pintura?atp=baris-image-editor).

Pintura features cropping, rotating, flipping, filtering, annotating, and lots of additional functionality to cover all your image and video editing needs on both mobile and desktop devices.

[Learn more about Pintura](https://pqina.nl/pintura?atp=baris-image-editor)

## Installation

```bash
npm install @ozdemircibaris/react-image-editor
```

## Quick Start

### Styled Component

```tsx
import { ImageEditor } from "@ozdemircibaris/react-image-editor";

function App() {
  const handleSave = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    // Download or upload the image
  };

  return (
    <ImageEditor
      imageUrl="/path/to/image.jpg"
      onSave={handleSave}
      onCancel={() => console.log("Cancelled")}
    />
  );
}
```

### Headless Mode

```tsx
import { useImageEditor } from "@ozdemircibaris/react-image-editor/core";

function CustomEditor({ imageUrl }: { imageUrl: string }) {
  const editor = useImageEditor({
    imageUrl,
    defaultColor: "#ff0000",
    defaultStrokeWidth: 3,
  });

  return (
    <div>
      <canvas ref={editor.canvasRef} />

      <div>
        <button onClick={() => editor.text.addText()}>Add Text</button>
        <button onClick={() => editor.blur.add()}>Add Blur</button>
        <button onClick={() => editor.crop.start()}>Crop</button>
        <button onClick={() => editor.shapes.add("rectangle")}>Rectangle</button>
        <button onClick={() => editor.drawing.toggle()}>Draw</button>
        <button onClick={editor.history.undo} disabled={!editor.history.canUndo}>
          Undo
        </button>
        <button onClick={editor.history.redo} disabled={!editor.history.canRedo}>
          Redo
        </button>
      </div>

      {editor.crop.isActive && (
        <div>
          <button onClick={() => editor.crop.apply()}>Apply</button>
          <button onClick={() => editor.crop.cancel()}>Cancel</button>
        </div>
      )}

      <button onClick={async () => {
        const blob = await editor.exportToBlob();
        // Handle the blob
      }}>
        Save
      </button>
    </div>
  );
}
```

## Image Validation

Validate image files by MIME type before loading:

```tsx
import {
  validateImageFile,
  createValidatedImageURL,
  SUPPORTED_IMAGE_TYPES,
} from "@ozdemircibaris/react-image-editor/core";

// Option 1: Validate file directly
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const result = validateImageFile(file);
  if (!result.valid) {
    alert(result.error);
    return;
  }

  const url = URL.createObjectURL(file);
  setImageUrl(url);
};

// Option 2: Validate and create URL in one step
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  const { url, error } = createValidatedImageURL(file);

  if (!url) {
    alert(error);
    return;
  }

  setImageUrl(url);
};

// Custom allowed types
const result = validateImageFile(file, ["image/jpeg", "image/png"]);
```

**Supported MIME types:** jpeg, png, gif, webp, svg+xml, bmp

## Export Options

```tsx
// Export as Blob (original resolution)
const blob = await editor.exportToBlob();

// Export as Base64 data URL
const dataUrl = editor.exportToDataURL("png", 1);
```

Exports preserve the original image dimensions. If you load a 1920x1080 image, the export will be 1920x1080 regardless of canvas display size.

## API Reference

### useImageEditor Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `imageUrl` | `string` | `""` | URL of the image to load |
| `width` | `number` | auto | Canvas width |
| `height` | `number` | auto | Canvas height |
| `defaultColor` | `string` | `"#ff7000"` | Default color for shapes/drawing |
| `defaultStrokeWidth` | `number` | `2` | Default stroke width |
| `maxHistorySize` | `number` | `50` | Max undo/redo steps |
| `blurIntensity` | `number` | `20` | Blur effect intensity |

### useImageEditor Return Value

| Property | Description |
|----------|-------------|
| `canvas` | Fabric.js canvas instance |
| `canvasRef` | Callback ref for canvas element |
| `hasImage` | Whether an image is loaded |
| `history.undo()` | Undo last action |
| `history.redo()` | Redo last undone action |
| `history.canUndo` | Whether undo is available |
| `history.canRedo` | Whether redo is available |
| `blur.add()` | Add a blur region |
| `blur.clearAll()` | Remove all blur regions |
| `crop.start()` | Enter crop mode |
| `crop.apply()` | Apply the crop |
| `crop.cancel()` | Cancel crop mode |
| `crop.isActive` | Whether crop mode is active |
| `drawing.enable()` | Enable drawing mode |
| `drawing.disable()` | Disable drawing mode |
| `drawing.toggle()` | Toggle drawing mode |
| `drawing.isActive` | Whether drawing is active |
| `shapes.add(type)` | Add a shape ("rectangle" or "circle") |
| `text.addText(text?)` | Add text to canvas |
| `text.setFontSize(size)` | Set font size of selected text |
| `text.setFontFamily(family)` | Set font family of selected text |
| `text.setTextColor(color)` | Set color of selected text |
| `text.setFontWeight(weight)` | Set bold ("normal" or "bold") |
| `text.setFontStyle(style)` | Set italic ("normal" or "italic") |
| `text.fontFamilies` | Available font families |
| `selection.enable()` | Enable selection mode |
| `selection.deleteSelected()` | Delete selected object |
| `style.color` | Current color |
| `style.setColor(color)` | Set color |
| `style.strokeWidth` | Current stroke width |
| `style.setStrokeWidth(width)` | Set stroke width |
| `zoom.in()` | Zoom in |
| `zoom.out()` | Zoom out |
| `zoom.level` | Current zoom level |
| `exportToBlob()` | Export canvas as Blob |
| `exportToDataURL(format, quality)` | Export as data URL |
| `dispose()` | Clean up resources |

### ImageEditor Props (Styled Component)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `imageUrl` | `string` | Yes | Image URL to edit |
| `onSave` | `(blob: Blob) => void` | Yes | Save callback |
| `onCancel` | `() => void` | Yes | Cancel callback |
| `showCancelButton` | `boolean` | No | Show cancel button |
| `className` | `string` | No | Container class |
| `background` | `string` | No | Canvas background color |

## Keyboard Shortcuts

- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` - Redo
- `Delete/Backspace` - Delete selected object
- `Escape` - Exit text editing mode
- `Space + Drag` - Pan canvas

## Development

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Build
npm run build
```

## License

MIT

## Links

- [Live Demo](https://image-editor.ozdemircibaris.dev)
- [GitHub](https://github.com/ozdemircibaris/react-image-editor)
- [npm](https://www.npmjs.com/package/@ozdemircibaris/react-image-editor)
