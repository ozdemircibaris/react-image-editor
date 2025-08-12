// Inline CSS styles for the image editor with dark mode theme
export const imageEditorStyles = `
/* Image Editor Styles - Dark Mode Theme */
.image-editor-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #000000 100%);
  color: white;
  overflow: hidden; /* Scroll bar'ı engelle */
}

/* Ensure custom background classes can override the default gradient */
.image-editor-container[class*="bg-"] {
  background: inherit !important;
}

.image-editor-container[class*="bg-red-"] {
  background-color: inherit !important;
  background-image: none !important;
}

.image-editor-container[class*="bg-blue-"] {
  background-color: inherit !important;
  background-image: none !important;
}

.image-editor-container[class*="bg-green-"] {
  background-color: inherit !important;
  background-image: none !important;
}

.image-editor-container[class*="bg-yellow-"] {
  background-color: inherit !important;
  background-image: none !important;
}

.image-editor-container[class*="bg-purple-"] {
  background-color: inherit !important;
  background-image: none !important;
}

.image-editor-container[class*="bg-pink-"] {
  background-color: inherit !important;
  background-image: none !important;
}

.image-editor-container[class*="bg-gray-"] {
  background-color: inherit !important;
  background-image: none !important;
}

.image-editor-header {
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #374151;
  padding: 1rem 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.image-editor-header-left {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.image-editor-header-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  transition: all 0.2s ease;
}

.image-editor-header-button:hover {
  color: #3b82f6;
  transform: scale(1.05);
}

.image-editor-title {
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.image-editor-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.image-editor-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  transform: translateY(0);
}

.image-editor-button-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.25);
}

.image-editor-button-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.35);
}

.image-editor-button-secondary {
  background: rgba(75, 85, 99, 0.5);
  color: white;
  border: 1px solid #374151;
}

.image-editor-button-secondary:hover {
  background: rgba(75, 85, 99, 0.7);
  border-color: #4b5563;
}

.image-editor-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Toolbar Styles */
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  color: #d1d5db;
  border: 1px solid transparent;
  cursor: pointer;
  background: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(4px);
}

.toolbar-button:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #3b82f6;
  transform: scale(1.05);
}

.toolbar-button.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.toolbar-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.toolbar-button.delete-button {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
  color: #ef4444;
}

.toolbar-button.delete-button:hover {
  background: rgba(220, 38, 38, 0.2);
  border-color: #ef4444;
  color: #fca5a5;
  transform: scale(1.05);
}

.toolbar-divider {
  width: 1px;
  height: 2rem;
  background: linear-gradient(180deg, transparent 0%, #374151 50%, transparent 100%);
  margin: 0 0.5rem;
}

/* Color Palette */
.color-palette {
  padding: 0.75rem;
  background: rgba(31, 41, 55, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 0.75rem;
  border: 1px solid #374151;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.color-palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 12rem;
}

.color-button {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  border: 2px solid;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.color-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.color-button:hover::before {
  opacity: 1;
}

.color-button.active {
  border-color: #3b82f6;
  transform: scale(1.15);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.color-button:not(.active) {
  border-color: rgba(255, 255, 255, 0.2);
}

/* Width Slider */
.width-slider {
  padding: 0.75rem;
  background: rgba(31, 41, 55, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 0.75rem;
  border: 1px solid #374151;
  min-width: 24rem;
}

.width-slider-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.width-slider-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
}

.width-slider-input {
  flex: 1;
}

.width-slider-value {
  font-size: 0.875rem;
  color: #9ca3af;
  width: 2rem;
  text-align: center;
}

/* Canvas Container */
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(31, 41, 55, 0.3);
  padding: 1rem;
  position: relative;
}

.canvas-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.canvas-wrapper {
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  border: 1px solid #374151;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  max-width: calc(100vw - 200px);
  max-height: calc(100vh - 200px);
  position: relative;
}

.canvas-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  pointer-events: none;
  border-radius: 1rem;
}

.canvas-element {
  display: block;
  border-radius: 1rem;
  width: 100%;
  height: 100%;
  background: transparent;
}

/* Crop Mode */
.crop-mode {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #374151;
  border-top: 1px solid #374151;
}

.crop-mode-text {
  color: #d1d5db;
  font-weight: 500;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.crop-mode-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.crop-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  transform: translateY(0);
}

.crop-button-apply {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.25);
}

.crop-button-apply:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.35);
}

.crop-button-cancel {
  background: rgba(75, 85, 99, 0.5);
  color: white;
  border: 1px solid #374151;
}

.crop-button-cancel:hover {
  background: rgba(75, 85, 99, 0.7);
  border-color: #4b5563;
}

/* Utility Classes */
.text-white {
  color: white;
}

.text-gray-300 {
  color: #d1d5db;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-blue-400 {
  color: #60a5fa;
}

.text-yellow-400 {
  color: #fbbf24;
}

.bg-transparent {
  background-color: transparent;
}

.bg-gray-800\/50 {
  background-color: rgba(31, 41, 55, 0.5);
}

.bg-gray-900\/50 {
  background-color: rgba(17, 24, 39, 0.5);
}

.rounded-3xl {
  border-radius: 1.5rem;
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.overflow-hidden {
  overflow: hidden;
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

.backdrop-blur-md {
  backdrop-filter: blur(8px);
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.p-4 {
  padding: 1rem;
}

.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.m-2 {
  margin: 0.5rem;
}

.w-full {
  width: 100%;
}

.h-screen {
  height: 100vh;
}

.min-w-96 {
  min-width: 24rem;
}

.max-w-48 {
  max-width: 12rem;
}

.w-10 {
  width: 2.5rem;
}

.h-10 {
  height: 2.5rem;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.w-px {
  width: 1px;
}

.h-8 {
  height: 2rem;
}

.w-8 {
  width: 2rem;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease;
}

.transition-all {
  transition: all 0.2s ease;
}

.opacity-50 {
  opacity: 0.5;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-not-allowed {
  cursor: not-allowed;
}

.inline-block {
  display: inline-block;
}

.text-sm {
  font-size: 0.875rem;
}

.font-medium {
  font-weight: 500;
}

.font-semibold {
  font-weight: 600;
}

.border-2 {
  border-width: 2px;
}

.border-gray-700 {
  border-color: #374151;
}

.border-white\\/10 {
  border-color: rgba(255, 255, 255, 0.1);
}

.border-white\\/20 {
  border-color: rgba(255, 255, 255, 0.2);
}

.scale-110 {
  transform: scale(1.1);
}

.scale-105 {
  transform: scale(1.05);
}

/* HeroUI Overrides for Dark Mode */
.heroui-slider {
  flex: 1;
}

.heroui-slider-track {
  background-color: #374151;
}

.heroui-slider-filler {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.heroui-slider-thumb {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Glassmorphism Effects */
.glass-effect {
  background: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-effect-strong {
  background: rgba(17, 24, 39, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(55, 65, 81, 0.7);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6);
}

/* Utility: remove default focus outlines where undesired */
.no-focus-ring:focus {
  outline: none !important;
  box-shadow: none !important;
}
.no-focus-ring:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

/* Gradient Text Effects */
.gradient-text-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Hover Effects */
.hover-lift {
  transition: all 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Focus States */
.focus-ring {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Animation Classes */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Zoom Button Styles */
.zoom-button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Default styles - only apply when no custom className is provided */
.zoom-button.zoom-in:not([style*="background"]) {
  background: #3b82f6;
  color: white;
  border-color: rgba(59, 130, 246, 0.35);
}

.zoom-button.zoom-in:not([style*="background"]):hover {
  background: #2563eb;
}

.zoom-button.zoom-out:not([style*="background"]) {
  background: #1f2937;
  color: #d1d5db;
  border-color: rgba(255, 255, 255, 0.08);
}

.zoom-button.zoom-out:not([style*="background"]):hover {
  background: #374151;
  color: #f3f4f6;
}

/* Ensure custom className props always override default styles */
.zoom-button[class*="bg-"] {
  background: inherit !important;
}

.zoom-button[class*="text-"] {
  color: inherit !important;
}

.zoom-button[class*="border-"] {
  border-color: inherit !important;
}

/* Customization Override Classes */
.image-editor-container.custom-theme {
  background: var(--custom-background, linear-gradient(135deg, #111827 0%, #1f2937 50%, #000000 100%));
}

.toolbar.custom-toolbar {
  background: var(--custom-toolbar-bg, rgba(31, 41, 55, 0.5));
  border: var(--custom-toolbar-border, 1px solid #374151);
}

.toolbar-button.custom-button {
  background: var(--custom-button-bg, rgba(31, 41, 55, 0.5));
  border-color: var(--custom-button-border, transparent);
  color: var(--custom-button-color, #d1d5db);
}

.toolbar-button.custom-button:hover {
  background: var(--custom-button-hover-bg, rgba(59, 130, 246, 0.1));
  border-color: var(--custom-button-hover-border, #3b82f6);
  color: var(--custom-button-hover-color, #3b82f6);
}

.image-editor-button.custom-save-button {
  background: var(--custom-save-bg, linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%));
  color: var(--custom-save-color, white);
  border: var(--custom-save-border, none);
}

.image-editor-button.custom-cancel-button {
  background: var(--custom-cancel-bg, rgba(75, 85, 99, 0.5));
  color: var(--custom-cancel-color, white);
  border: var(--custom-cancel-border, 1px solid #374151);
}

.zoom-button.custom-zoom-button {
  background: var(--custom-zoom-bg, rgba(31, 41, 55, 0.9));
  color: var(--custom-zoom-color, #d1d5db);
  border: var(--custom-zoom-border, 1px solid rgba(255, 255, 255, 0.08));
}

.zoom-button.custom-zoom-button:hover {
  background: var(--custom-zoom-hover-bg, rgba(55, 65, 81, 0.9));
  transform: var(--custom-zoom-hover-transform, scale(1.1));
}

/* Save and Cancel Button Specific Styles */
.image-editor-actions .image-editor-button {
  /* Ensure custom classes can override default styles */
  transition: all 0.2s ease;
}

.image-editor-actions .image-editor-button-primary {
  /* Default save button styles */
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.25);
}

.image-editor-actions .image-editor-button-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.35);
}

.image-editor-actions .image-editor-button-secondary {
  /* Default cancel button styles */
  background: rgba(75, 85, 99, 0.5);
  color: white;
  border: 1px solid #374151;
}

.image-editor-actions .image-editor-button-secondary:hover {
  background: rgba(75, 85, 99, 0.7);
  border-color: #4b5563;
}

/* Ensure custom className props can override with !important if needed */
.image-editor-actions .image-editor-button[class*="bg-"] {
  background: inherit !important;
}

.image-editor-actions .image-editor-button[class*="text-"] {
  color: inherit !important;
}

.image-editor-actions .image-editor-button[class*="border-"] {
  border: inherit !important;
}

/* ===== MOBILE RESPONSIVE STYLES ===== */

/* Mobile: 320px - 768px */
@media (max-width: 768px) {
  /* Container mobile height */
  .image-editor-container {
    height: 100vh;
    min-height: 100vh;
    max-height: 100vh;
  }
  
  /* Toolbar mobile layout - sadece gerekli yerlerde alt alta */
  .toolbar {
    flex-wrap: wrap; /* Wrap yap ama column yapma */
    gap: 0.5rem;
    padding: 0.5rem;
    justify-content: center;
  }
  
  .toolbar-button {
    width: 2.75rem; /* Çok büyütme */
    height: 2.75rem;
  }
  
  /* Header mobile layout - sadece çok dar ekranlarda */
  .image-editor-header {
    flex-direction: row; /* Yan yana bırak */
    gap: 0.5rem; /* Daha az gap */
    padding: 0.75rem; /* Daha az padding */
    flex-wrap: wrap; /* Gerekirse wrap yap */
  }
  
  .image-editor-actions {
    gap: 0.5rem;
  }
  
  .image-editor-button {
    padding: 0.5rem 1rem; /* Daha küçük padding */
    font-size: 0.85rem;
  }
  
  /* Canvas mobile size */
  .canvas-container {
    padding: 0.5rem; /* Desktop'taki 1rem'i mobile'da azalt */
  }
  
  .canvas-wrapper {
    max-width: calc(100vw - 8px) !important; /* Desktop'taki 200px'i override et */
    max-height: calc(100vh - 80px) !important; /* Desktop'taki 200px'i override et */
    margin: 0 4px !important;
  }
  
  /* Zoom buttons mobile */
  .zoom-button {
    width: 36px; /* Daha küçük */
    height: 36px;
    font-size: 16px;
  }
  
  /* Color palette mobile */
  .color-palette {
    min-width: 220px;
    padding: 0.5rem;
  }
  
  /* Width slider mobile */
  .width-slider {
    min-width: 220px;
    padding: 0.5rem;
  }
  
  /* Crop mode mobile */
  .crop-mode {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  /* Space hint mobile */
  .canvas-wrapper .animate-fade-in {
    display: none; /* Mobile'da space hint'i gizle */
  }
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) {
  .toolbar {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .toolbar-button {
    width: 2.75rem;
    height: 2.75rem;
  }
  
  .canvas-wrapper {
    max-width: calc(100vw - 100px);
    max-height: calc(100vh - 180px);
  }
}

/* Large screens: 1024px+ */
@media (min-width: 1024px) {
  .toolbar {
    flex-direction: row;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }
  
  .image-editor-header {
    flex-direction: row;
    gap: 0;
    padding: 1rem 1.5rem;
  }
}
`;

// Function to inject styles
export const injectStyles = () => {
  if (typeof document !== "undefined") {
    const styleId = "react-image-editor-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = imageEditorStyles;
      document.head.appendChild(style);
    }
  }
};
