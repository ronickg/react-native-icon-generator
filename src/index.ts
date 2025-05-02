#!/usr/bin/env node

import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { createSfSymbolsSvg } from "./sfSymbolsSvg";

// Define paths
const iconsSourceDir = "./assets/icons";
const tempSvgsDir = "./assets/generated-icons/temp";
const androidOutputDir = "./assets/generated-icons/android";
const iosOutputDir = "./assets/generated-icons/ios";
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

// Track processed files and their paths
const processedFiles: {
  android: string[];
  ios: string[];
} = {
  android: [],
  ios: [],
};

// Process each SVG file
(async function processIcons() {
  try {
    for (let i = 0; i < svgFiles.length; i++) {
      const svgPath = svgFiles[i];
      const iconName = path.basename(svgPath, ".svg");

      // Show simple progress bar
      process.stdout.write(`\rProcessing: [${i + 1}/${svgFiles.length}]`);

      // Create iOS symbolset dir for this icon
      // Replace hyphens with dots for iOS naming convention
      const iosIconName = iconName.replace(/-/g, ".");
      const iconSymbolsetDir = path.join(
        iosXcassetsDir,
        `${iosIconName}.symbolset`
      );
      fs.mkdirSync(iconSymbolsetDir, { recursive: true });

      // Step 1: Fix the SVG
      const fixerCommand = `npx oslllo-svg-fixer --source ${svgPath} --destination ${tempSvgsDir} --sp true`;
      try {
        execSync(fixerCommand, { stdio: "pipe" });
      } catch (error) {
        console.error(`\nError fixing SVG for ${iconName}:`, error);
        continue;
      }

      // Get the fixed SVG file path
      const fixedSvgPath = path.join(tempSvgsDir, path.basename(svgPath));
      const androidOutputPath = path.join(
        androidOutputDir,
        "ic_" + iconName.replace(/-/g, "_") + ".xml"
      );

      // Check if fixed SVG exists
      if (!fs.existsSync(fixedSvgPath)) {
        console.error(`\nFixed SVG file not found at: ${fixedSvgPath}`);
        continue;
      }

      // Run svg2vectordrawable
      const vectorDrawableCommand = `npx svg2vectordrawable -i ${fixedSvgPath} -o ${androidOutputPath}`;
      try {
        execSync(vectorDrawableCommand, { stdio: "pipe" });
      } catch (error) {
        console.error(
          `\nError creating Vector Drawable for ${iconName}:`,
          error
        );
        continue;
      }

      // Modify the fill color in the generated XML
      if (fs.existsSync(androidOutputPath)) {
        let xmlContent = fs.readFileSync(androidOutputPath, "utf8");

        // Replace any fill color attributes with ?attr/colorControlNormal
        // This regex finds android:fillColor="#XXXXXX" patterns
        xmlContent = xmlContent.replace(
          /android:fillColor="([^"]*)"/g,
          'android:fillColor="?attr/colorControlNormal"'
        );

        fs.writeFileSync(androidOutputPath, xmlContent);
        processedFiles.android.push(androidOutputPath);
      } else {
        console.warn(
          `\nWarning: Could not find the Vector Drawable at ${androidOutputPath} for color modification`
        );
      }

      // Process SVG for iOS Symbol format
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
      const sfSymbolsSvg = createSfSymbolsSvg(fixedSvgContent);

      const iosSvgPath = path.join(iconSymbolsetDir, path.basename(svgPath));
      fs.writeFileSync(iosSvgPath, sfSymbolsSvg);
      processedFiles.ios.push(iconSymbolsetDir);
    }

    // Show final output after processing all icons
    console.log("\n"); // Add an empty line after the progress bar

    if (processedFiles.android.length > 0 && processedFiles.ios.length > 0) {
      console.log(
        `✅ Successfully processed ${processedFiles.android.length} icons`
      );
      console.log(`   Android: ${androidOutputDir}`);
      console.log(`   iOS: ${iosXcassetsDir}`);
    } else {
      console.log("⚠️ No icons were successfully processed");
    }

    // Clean up the temporary SVGs folder
    if (fs.existsSync(tempSvgsDir)) {
      fs.rmSync(tempSvgsDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error("\nError in process:", error);

    // Try to clean up even if there was an error
    try {
      if (fs.existsSync(tempSvgsDir)) {
        fs.rmSync(tempSvgsDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    process.exit(1);
  }
})();
