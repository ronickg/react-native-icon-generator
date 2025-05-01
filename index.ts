#!/usr/bin/env node

import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Define paths
const sourcePath = "./locate.svg";
const fixedOutputDir = "./fixed";
const androidOutputDir = "./android";

// Ensure output directories exist
try {
  fs.mkdirSync(fixedOutputDir, { recursive: true });
  fs.mkdirSync(androidOutputDir, { recursive: true });
} catch (error) {
  console.error("Error creating directories:", error);
}

// Step 1: Fix the SVG
console.log("Step 1: Fixing SVG...");
const fixerCommand = `npx oslllo-svg-fixer --source ${sourcePath} --destination ${fixedOutputDir} --sp true`;
console.log(`Running command: ${fixerCommand}`);

try {
  // Execute the SVG fixer command
  execSync(fixerCommand, { stdio: "inherit" });
  console.log("SVG fixed successfully!");

  // Step 2: Convert fixed SVG to Vector Drawable
  console.log("\nStep 2: Converting fixed SVG to Vector Drawable...");

  // Get the fixed SVG file path (assuming filename remains the same)
  const fixedSvgPath = path.join(fixedOutputDir, path.basename(sourcePath));
  const androidOutputPath = path.join(
    androidOutputDir,
    path.basename(sourcePath, ".svg") + ".xml"
  );

  // Check if fixed SVG exists
  if (!fs.existsSync(fixedSvgPath)) {
    throw new Error(`Fixed SVG file not found at: ${fixedSvgPath}`);
  }

  // Run svg2vectordrawable
  const vectorDrawableCommand = `npx svg2vectordrawable -i ${fixedSvgPath} -o ${androidOutputPath}`;
  console.log(`Running command: ${vectorDrawableCommand}`);

  execSync(vectorDrawableCommand, { stdio: "inherit" });
  console.log("Vector Drawable created successfully at:", androidOutputPath);

  console.log("\nProcess completed successfully!");
} catch (error) {
  console.error("Error in process:", error);
  process.exit(1);
}
