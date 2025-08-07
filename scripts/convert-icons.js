const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "../public/assets/icons");
const outputFile = path.join(__dirname, "../src/constants/iconData.ts");

// Read all SVG files
const iconFiles = fs.readdirSync(iconsDir).filter((file) => file.endsWith(".svg"));

const iconData = {};

iconFiles.forEach((file) => {
  const iconName = file.replace(".svg", "");
  const filePath = path.join(iconsDir, file);
  const svgContent = fs.readFileSync(filePath, "utf8");

  // Convert to base64
  const base64 = Buffer.from(svgContent).toString("base64");
  iconData[iconName] = base64;
});

// Generate TypeScript file
const tsContent = `// Auto-generated icon data
export const iconData: Record<string, string> = ${JSON.stringify(iconData, null, 2)};

export const getIconData = (name: string): string | null => {
  return iconData[name] || null;
};
`;

fs.writeFileSync(outputFile, tsContent);
console.log(`Generated icon data for ${Object.keys(iconData).length} icons`);
