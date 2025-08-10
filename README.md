# React Image Editor

Professional image editing made simple with a powerful React component built on modern web technologies.

[![Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?style=for-the-badge)](https://image-editor.ozdemircibaris.dev)
[![Version](https://img.shields.io/badge/version-1.0.9-green.svg)](https://www.npmjs.com/package/@ozdemircibaris/react-image-editor)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎨 **Professional Image Editing** - Load and edit images with intuitive tools
- 🔍 **Smart Blur Tool** - Add selective blur effects to specific areas
- ✂️ **Precise Crop Tool** - Crop images with pixel-perfect accuracy
- 🔷 **Shape Tools** - Add rectangles and circles with custom styling
- ✏️ **Drawing Mode** - Free-hand drawing with customizable brush settings
- ↩️ **Undo/Redo System** - Full history management with keyboard shortcuts
- 🎯 **Selection Mode** - Intuitive object selection and manipulation
- 🎨 **Color & Stroke Control** - Customizable colors and stroke widths
- ⌨️ **Keyboard Shortcuts** - Professional workflow with Ctrl+Z, Ctrl+Y, Delete

## 🚀 Live Demo

**Try it now:** [https://image-editor.ozdemircibaris.dev](https://image-editor.ozdemircibaris.dev)

## 📦 Installation

```bash
npm install @ozdemircibaris/react-image-editor
# or
yarn add @ozdemircibaris/react-image-editor
# or
pnpm add @ozdemircibaris/react-image-editor
```

## 🎯 Quick Start

```jsx
import React, { useState } from "react";
import { ImageEditor } from "@ozdemircibaris/react-image-editor";

function App() {
  const [imageUrl, setImageUrl] = useState("");

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleSave = (imageBlob) => {
    // Handle the saved image blob
    const url = URL.createObjectURL(imageBlob);
    console.log("Saved image URL:", url);

    // You can also download the image
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "edited-image.png";
    downloadLink.click();
  };

  const handleCancel = () => {
    console.log("Editing cancelled");
    setImageUrl(""); // Reset image
  };

  return (
    <div>
      {!imageUrl ? (
        <div className="image-picker">
          <input type="file" accept="image/*" onChange={handleImageSelect} className="file-input" />
          <p>Select an image to start editing</p>
        </div>
      ) : (
        <ImageEditor imageUrl={imageUrl} onSave={handleSave} onCancel={handleCancel} />
      )}
    </div>
  );
}

export default App;
```

## 🔧 API Reference

### Props

| Prop       | Type                        | Required | Description                        |
| ---------- | --------------------------- | -------- | ---------------------------------- |
| `imageUrl` | `string`                    | Yes      | URL of the image to edit           |
| `onSave`   | `(imageBlob: Blob) => void` | Yes      | Callback when image is saved       |
| `onCancel` | `() => void`                | Yes      | Callback when editing is cancelled |

### Available Tools

- **Selection Mode** - Select and manipulate objects
- **Drawing Mode** - Free-hand drawing with customizable brush
- **Blur Tool** - Add selective blur effects
- **Crop Tool** - Precise image cropping
- **Shape Tools** - Add rectangles and circles
- **Undo/Redo** - Full operation history with keyboard shortcuts

## 🚀 Coming Soon

- **📝 Text Tool** - Add and edit text on images
- **➡️ Arrow Tool** - Draw arrows and lines
- **📱 Mobile UI** - Optimized interface for mobile devices
- **🎨 Filters** - Instagram-style filters and effects
- **🤖 AI Tools** - Background removal and object recognition

## 🛠️ Development

```bash
# Clone and setup
git clone https://github.com/ozdemircibaris/react-image-editor.git
cd react-image-editor
npm install

# Start development server
npm run dev

# Build library
npm run build:lib
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

- **Demo**: [https://image-editor.ozdemircibaris.dev](https://image-editor.ozdemircibaris.dev)
- **Issues**: [GitHub Issues](https://github.com/ozdemircibaris/react-image-editor/issues)

---

Built with ❤️ by [@ozdemircibaris](https://github.com/ozdemircibaris)

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/ozdemircibaris/react-image-editor)
[![NPM](https://img.shields.io/badge/NPM-Package-red?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@ozdemircibaris/react-image-editor)
