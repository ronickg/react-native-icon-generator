#!/usr/bin/env node

import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Define paths
const iconsSourceDir = "./icons";
const tempSvgsDir = "./.temp_svgs";
const androidOutputDir = "./android-icons";
const iosOutputDir = "./ios-icons";
const iosXcassetsDir = path.join(iosOutputDir, "Icons.xcassets");

// Ensure output directories exist
try {
  fs.mkdirSync(tempSvgsDir, { recursive: true });
  fs.mkdirSync(androidOutputDir, { recursive: true });
  fs.mkdirSync(iosOutputDir, { recursive: true });
  fs.mkdirSync(iosXcassetsDir, { recursive: true });

  // Create a Contents.json file for the asset catalog
  const assetCatalogContents = {
    info: {
      author: "xcode",
      version: 1,
    },
  };
  fs.writeFileSync(
    path.join(iosXcassetsDir, "Contents.json"),
    JSON.stringify(assetCatalogContents, null, 2)
  );
} catch (error) {
  console.error("Error creating directories:", error);
  process.exit(1);
}

// Check if icons directory exists
if (!fs.existsSync(iconsSourceDir)) {
  console.error(
    `Error: Icons directory '${iconsSourceDir}' not found. Please create it and add your SVG icons.`
  );
  process.exit(1);
}

// Get all SVG files from the icons directory
const svgFiles = fs
  .readdirSync(iconsSourceDir)
  .filter((file) => file.toLowerCase().endsWith(".svg"))
  .map((file) => path.join(iconsSourceDir, file));

if (svgFiles.length === 0) {
  console.error(
    `No SVG files found in '${iconsSourceDir}' directory. Please add some SVG icons.`
  );
  process.exit(1);
}

console.log(`Found ${svgFiles.length} SVG icons to process.`);

// Process each SVG file
(async function processIcons() {
  try {
    for (const svgPath of svgFiles) {
      const iconName = path.basename(svgPath, ".svg");
      console.log(`\n=== Processing icon: ${iconName} ===`);

      // Create iOS symbolset dir for this icon
      // Replace hyphens with dots for iOS naming convention
      const iosIconName = iconName.replace(/-/g, ".");
      const iconSymbolsetDir = path.join(
        iosXcassetsDir,
        `${iosIconName}.symbolset`
      );
      fs.mkdirSync(iconSymbolsetDir, { recursive: true });

      // Step 1: Fix the SVG
      console.log(`Step 1: Fixing SVG for ${iconName}...`);
      const fixerCommand = `npx oslllo-svg-fixer --source ${svgPath} --destination ${tempSvgsDir} --sp true`;
      console.log(`Running command: ${fixerCommand}`);

      execSync(fixerCommand, { stdio: "inherit" });
      console.log(`SVG fixed successfully for ${iconName}!`);

      // Step 2: Convert fixed SVG to Vector Drawable
      console.log(
        `\nStep 2: Converting fixed SVG to Vector Drawable for ${iconName}...`
      );

      // Get the fixed SVG file path
      const fixedSvgPath = path.join(tempSvgsDir, path.basename(svgPath));
      const androidOutputPath = path.join(
        androidOutputDir,
        "ic_" + iconName + ".xml"
      );

      // Check if fixed SVG exists
      if (!fs.existsSync(fixedSvgPath)) {
        throw new Error(`Fixed SVG file not found at: ${fixedSvgPath}`);
      }

      // Run svg2vectordrawable
      const vectorDrawableCommand = `npx svg2vectordrawable -i ${fixedSvgPath} -o ${androidOutputPath}`;
      console.log(`Running command: ${vectorDrawableCommand}`);

      execSync(vectorDrawableCommand, { stdio: "inherit" });
      console.log(
        `Vector Drawable created successfully at: ${androidOutputPath}`
      );

      // Step 3: Modify the fill color in the generated XML
      console.log(
        `\nStep 3: Setting fill color to ?attr/colorControlNormal for ${iconName}...`
      );

      if (fs.existsSync(androidOutputPath)) {
        let xmlContent = fs.readFileSync(androidOutputPath, "utf8");

        // Replace any fill color attributes with ?attr/colorControlNormal
        // This regex finds android:fillColor="#XXXXXX" patterns
        xmlContent = xmlContent.replace(
          /android:fillColor="([^"]*)"/g,
          'android:fillColor="?attr/colorControlNormal"'
        );

        fs.writeFileSync(androidOutputPath, xmlContent);
        console.log("Fill color updated successfully!");
      } else {
        console.warn(
          `Warning: Could not find the Vector Drawable at ${androidOutputPath} for color modification`
        );
      }

      // Step 4: Process SVG for iOS Symbol format
      console.log(`\nStep 4: Creating iOS Symbol format for ${iconName}...`);

      // Create Contents.json for the symbolset
      const contentsJson = {
        info: {
          author: "xcode",
          version: 1,
        },
        symbols: [
          {
            idiom: "universal",
            filename: path.basename(svgPath),
          },
        ],
      };

      const contentsJsonPath = path.join(iconSymbolsetDir, "Contents.json");
      fs.writeFileSync(contentsJsonPath, JSON.stringify(contentsJson, null, 2));

      // Read the fixed SVG content
      let fixedSvgContent = fs.readFileSync(fixedSvgPath, "utf8");

      // Create a simpler SF Symbols compatible SVG with just Small size line
      // but all three weight variants (Ultralight, Regular, and Black)
      const sfSymbolsSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg height="600" width="800" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Notes" font-family="'LucidaGrande', 'Lucida Grande', sans-serif" font-size="13">
        <rect fill="white" height="600.0" width="800.0" x="0.0" y="0.0" />
        <g font-size="13">
            <text x="18.0" y="176.0">Small</text>
            <text x="18.0" y="376.0">Medium</text>
            <text x="18.0" y="576.0">Large</text>
        </g>
        <g font-size="9">
            <text x="250.0" y="30.0">Ultralight</text>
            <text x="450.0" y="30.0">Regular</text>
            <text x="650.0" y="30.0">Black</text>
            <text id="template-version" fill="#505050" text-anchor="end" x="785.0" y="575.0">Template v.3.0</text>
            <text fill="#505050" text-anchor="end" x="785.0" y="590.0">Generated by react-native-icon-generator-cli</text>
        </g>
    </g>
    <g id="Guides" stroke="rgb(39, 170, 225)" stroke-width="0.5">
        <path id="Capline-S" d="M18,76 l800,0" />
        <path id="H-reference" d="M85,145.755 L87.685,145.755 L113.369,79.287 L114.052,79.287 L114.052,76 L112.148,76 L85,145.755 Z M95.693,121.536 L130.996,121.536 L130.263,119.313 L96.474,119.313 L95.693,121.536 Z M139.15,145.755 L141.787,145.755 L114.638,76 L113.466,76 L113.466,79.287 L139.15,145.755 Z" stroke="none" />
        <path id="Baseline-S" d="M18,146 l800,0" />
        <path id="left-margin-Ultralight-S" d="M220,56 l0,110" />
        <path id="right-margin-Ultralight-S" d="M310,56 l0,110" />
        <path id="left-margin-Regular-S" d="M420,56 l0,110" />
        <path id="right-margin-Regular-S" d="M510,56 l0,110" />
        <path id="left-margin-Black-S" d="M620,56 l0,110" />
        <path id="right-margin-Black-S" d="M710,56 l0,110" />

        <!-- Medium size guidelines -->
        <path id="Capline-M" d="M18,276 l800,0" />
        <path id="Baseline-M" d="M18,346 l800,0" />
        <path id="left-margin-Ultralight-M" d="M220,256 l0,110" />
        <path id="right-margin-Ultralight-M" d="M310,256 l0,110" />
        <path id="left-margin-Regular-M" d="M420,256 l0,110" />
        <path id="right-margin-Regular-M" d="M510,256 l0,110" />
        <path id="left-margin-Black-M" d="M620,256 l0,110" />
        <path id="right-margin-Black-M" d="M710,256 l0,110" />

        <!-- Large size guidelines -->
        <path id="Capline-L" d="M18,476 l800,0" />
        <path id="Baseline-L" d="M18,546 l800,0" />
        <path id="left-margin-Ultralight-L" d="M220,456 l0,110" />
        <path id="right-margin-Ultralight-L" d="M310,456 l0,110" />
        <path id="left-margin-Regular-L" d="M420,456 l0,110" />
        <path id="right-margin-Regular-L" d="M510,456 l0,110" />
        <path id="left-margin-Black-L" d="M620,456 l0,110" />
        <path id="right-margin-Black-L" d="M710,456 l0,110" />
    </g>
    <g id="Symbols">
        <!-- Only include the Small size variants -->
        <g id="Ultralight-S">
            ${extractPaths(fixedSvgContent, 265, 111)}
        </g>
        <g id="Regular-S">
            ${extractPaths(fixedSvgContent, 465, 111)}
        </g>
        <g id="Black-S">
            ${extractPaths(fixedSvgContent, 665, 111)}
        </g>
    </g>
</svg>`;

      const iosSvgPath = path.join(iconSymbolsetDir, path.basename(svgPath));
      fs.writeFileSync(iosSvgPath, sfSymbolsSvg);

      console.log(
        `iOS Symbol files created successfully at: ${iconSymbolsetDir}`
      );
    }

    // Clean up the temporary SVGs folder
    console.log("\nCleaning up temporary files...");
    if (fs.existsSync(tempSvgsDir)) {
      fs.rmSync(tempSvgsDir, { recursive: true, force: true });
      console.log(`Removed temporary directory: ${tempSvgsDir}`);
    }

    console.log("\nAll icons processed successfully!");
  } catch (error) {
    console.error("Error in process:", error);

    // Try to clean up even if there was an error
    try {
      if (fs.existsSync(tempSvgsDir)) {
        fs.rmSync(tempSvgsDir, { recursive: true, force: true });
        console.log(`Removed temporary directory: ${tempSvgsDir}`);
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    process.exit(1);
  }
})();

// Helper function to extract paths from SVG content and position them for SF Symbols
function extractPaths(
  svgContent: string,
  centerX: number,
  centerY: number
): string {
  // Extract viewBox from the SVG to calculate proper scaling
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']*)["']/);
  let viewBox = { x: 0, y: 0, width: 24, height: 24 };

  if (viewBoxMatch && viewBoxMatch[1]) {
    const parts = viewBoxMatch[1].split(/\s+/).map((part) => parseFloat(part));
    if (parts.length === 4) {
      viewBox = {
        x: parts[0],
        y: parts[1],
        width: parts[2],
        height: parts[3],
      };
    }
  }

  // Calculate scale and position to center the icon in the specified position
  const scale = 70 / Math.max(viewBox.width, viewBox.height);
  const offsetX = centerX - (viewBox.width * scale) / 2;
  const offsetY = centerY - (viewBox.height * scale) / 2;

  // Create a wrapper group with proper transformation to position and scale the paths
  return `<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
          ${extractSvgElements(svgContent)}
      </g>`;
}

// Helper function to extract SVG elements with proper classes
function extractSvgElements(svgContent: string): string {
  // Extract all paths, circles, lines, etc.
  let content = svgContent
    .replace(/<svg[^>]*>([\s\S]*)<\/svg>/, "$1")
    .replace(/<g[^>]*>([\s\S]*)<\/g>/g, "$1");

  // Add fill attributes and remove any stroke if it exists
  // This makes the paths solid which is required for SF Symbols
  return content.replace(
    /<(path|circle|line|rect|ellipse|polygon|polyline)([^>]*)>/g,
    (match: string, type: string, attrs: string) => {
      // Remove stroke attributes
      attrs = attrs.replace(/stroke="[^"]*"/g, "");
      attrs = attrs.replace(/stroke-width="[^"]*"/g, "");
      attrs = attrs.replace(/stroke-linecap="[^"]*"/g, "");
      attrs = attrs.replace(/stroke-linejoin="[^"]*"/g, "");

      // Add fill if it doesn't exist or is "none"
      if (!attrs.includes('fill="') || attrs.includes('fill="none"')) {
        attrs = attrs.replace(/fill="none"/g, "");
        attrs += ' fill="black"';
      }

      return `<${type}${attrs}>`;
    }
  );
}
