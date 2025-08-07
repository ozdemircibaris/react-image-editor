/**
 * Available icon names that correspond to SVG files in public/assets/icons/
 * Each name should match an SVG file: public/assets/icons/{iconName}.svg
 *
 * To add a new icon:
 * 1. Add the SVG file to public/assets/icons/
 * 2. Add the icon name to this array
 * 3. TypeScript will automatically provide autocompletion
 */
export const iconNames = [
  "graduation",
  "search",
  "chevron-down",
  "user-guard",
  "user-group",
  "users",
  "user",
  "information",
  "business",
  "property",
  "employment",
  "thumbs-up",
  "thumbs-down",
  "list-done",
  "eye-close",
  "eye",
  "home",
  "task-list",
  "calendar",
  "rewards",
  "files",
  "help-circle",
  "notification",
  "download",
  "trash",
  "file",
  "2-task-list",
  "category",
  "plus",
  "upload",
  "three-dot",
  "check",
  "settings",
  "pencil",
  "duplicate",
  "share-link",
  "pin",
  "alert",
  "image",
  "audio",
  "video",
  "document",
  "url",
  "cloud-download",
  "circle-check",
  "switch",
  "cursor",
  "square",
  "circle",
  "crop",
  "blur",
  "undo",
  "redo",
  "arrow-left",
  // Add more icon names here as you add SVG files
] as const;

/**
 * Union type of all available icon names
 * This provides TypeScript autocompletion and type safety
 */
export type IconNamesType = (typeof iconNames)[number];
