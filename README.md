# React Image Editor

A powerful React image editor component built with Fabric.js, featuring blur, crop, shapes, and undo/redo functionality.

## Features

- 🎨 **Image Editing**: Load and edit images with various tools
- 🔍 **Blur Tool**: Add blur effects to specific areas
- ✂️ **Crop Tool**: Crop images to desired dimensions
- 🔷 **Shape Tools**: Add rectangles and circles
- ↩️ **Undo/Redo**: Full undo/redo functionality
- 🎯 **Drawing Mode**: Free-hand drawing capabilities
- 🎨 **Color Picker**: Customizable colors for shapes and drawings
- 📏 **Stroke Width**: Adjustable stroke width for shapes and drawings

## Installation

```bash
npm install @ozdemircibaris/react-image-editor
# or
yarn add @ozdemircibaris/react-image-editor
```

## Usage

```jsx
import React, { useState } from "react";
import { ImageEditor } from "@ozdemircibaris/react-image-editor";

function App() {
  const [imageUrl, setImageUrl] = useState("");

  const handleSave = (imageBlob) => {
    // Handle the saved image blob
    const url = URL.createObjectURL(imageBlob);
    console.log("Saved image URL:", url);
  };

  const handleCancel = () => {
    console.log("Editing cancelled");
  };

  return <div>{imageUrl && <ImageEditor imageUrl={imageUrl} onSave={handleSave} onCancel={handleCancel} />}</div>;
}

export default App;
```

## Props

| Prop       | Type                        | Required | Description                        |
| ---------- | --------------------------- | -------- | ---------------------------------- |
| `imageUrl` | `string`                    | Yes      | URL of the image to edit           |
| `onSave`   | `(imageBlob: Blob) => void` | Yes      | Callback when image is saved       |
| `onCancel` | `() => void`                | Yes      | Callback when editing is cancelled |

## API

### ImageEditor Component

The main component that provides the full image editing experience.

### Hooks

#### useBlurHandlers

```jsx
import { useBlurHandlers } from "@ozdemircibaris/react-image-editor";

const { activeBlurRects, setActiveBlurRects, handleAddBlur } = useBlurHandlers(
  canvas,
  originalImage,
  isDrawing,
  setIsSelectMode,
);
```

#### useCropHandlers

```jsx
import { useCropHandlers } from "@ozdemircibaris/react-image-editor";

const { isCropping, setIsCropping, handleCropStart, handleCropApply, handleCropCancel } = useCropHandlers(
  canvas,
  originalImage,
  isDrawing,
  activeBlurRects,
  setActiveBlurRects,
  setIsSelectMode,
  setOriginalImage,
);
```

#### useShapeHandlers

```jsx
import { useShapeHandlers } from "@ozdemircibaris/react-image-editor";

const { handleAddShape } = useShapeHandlers(
  canvas,
  isCropping,
  isDrawing,
  currentColor,
  currentStrokeWidth,
  setIsSelectMode,
);
```

#### useUndoRedo

```jsx
import { useUndoRedo } from "@ozdemircibaris/react-image-editor";

const { saveState, undo, redo, initializeHistory, canUndo, canRedo } = useUndoRedo(
  canvas,
  50, // max history size
  updateOriginalImageReference,
);
```

## Types

```typescript
interface IImageEditorProps {
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
}

interface CustomFabricObject extends fabric.Object {
  id?: string;
  isDrawing?: boolean;
  isBlurPatch?: boolean;
  blurRectId?: string;
  stroke?: string;
  strokeWidth?: number;
}
```

## Dependencies

This package has the following peer dependencies:

- React >= 16.8.0
- React DOM >= 16.8.0

And the following dependencies:

- Fabric.js
- HeroUI React
- Radix UI Popover

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build the library: `npm run build:lib`

## License

MIT
