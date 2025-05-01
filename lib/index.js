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
    fs.writeFileSync(path.join(iosXcassetsDir, "Contents.json"), JSON.stringify(assetCatalogContents, null, 2));
}
catch (error) {
    console.error("Error creating directories:", error);
    process.exit(1);
}
// Check if icons directory exists
if (!fs.existsSync(iconsSourceDir)) {
    console.error(`Error: Icons directory '${iconsSourceDir}' not found. Please create it and add your SVG icons.`);
    process.exit(1);
}
// Get all SVG files from the icons directory
const svgFiles = fs
    .readdirSync(iconsSourceDir)
    .filter((file) => file.toLowerCase().endsWith(".svg"))
    .map((file) => path.join(iconsSourceDir, file));
if (svgFiles.length === 0) {
    console.error(`No SVG files found in '${iconsSourceDir}' directory. Please add some SVG icons.`);
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
            const iconSymbolsetDir = path.join(iosXcassetsDir, `${iosIconName}.symbolset`);
            fs.mkdirSync(iconSymbolsetDir, { recursive: true });
            // Step 1: Fix the SVG
            console.log(`Step 1: Fixing SVG for ${iconName}...`);
            const fixerCommand = `npx oslllo-svg-fixer --source ${svgPath} --destination ${tempSvgsDir} --sp true`;
            console.log(`Running command: ${fixerCommand}`);
            execSync(fixerCommand, { stdio: "inherit" });
            console.log(`SVG fixed successfully for ${iconName}!`);
            // Step 2: Convert fixed SVG to Vector Drawable
            console.log(`\nStep 2: Converting fixed SVG to Vector Drawable for ${iconName}...`);
            // Get the fixed SVG file path
            const fixedSvgPath = path.join(tempSvgsDir, path.basename(svgPath));
            const androidOutputPath = path.join(androidOutputDir, "ic_" + iconName.replace(/-/g, "_") + ".xml");
            // Check if fixed SVG exists
            if (!fs.existsSync(fixedSvgPath)) {
                throw new Error(`Fixed SVG file not found at: ${fixedSvgPath}`);
            }
            // Run svg2vectordrawable
            const vectorDrawableCommand = `npx svg2vectordrawable -i ${fixedSvgPath} -o ${androidOutputPath}`;
            console.log(`Running command: ${vectorDrawableCommand}`);
            execSync(vectorDrawableCommand, { stdio: "inherit" });
            console.log(`Vector Drawable created successfully at: ${androidOutputPath}`);
            // Step 3: Modify the fill color in the generated XML
            console.log(`\nStep 3: Setting fill color to ?attr/colorControlNormal for ${iconName}...`);
            if (fs.existsSync(androidOutputPath)) {
                let xmlContent = fs.readFileSync(androidOutputPath, "utf8");
                // Replace any fill color attributes with ?attr/colorControlNormal
                // This regex finds android:fillColor="#XXXXXX" patterns
                xmlContent = xmlContent.replace(/android:fillColor="([^"]*)"/g, 'android:fillColor="?attr/colorControlNormal"');
                fs.writeFileSync(androidOutputPath, xmlContent);
                console.log("Fill color updated successfully!");
            }
            else {
                console.warn(`Warning: Could not find the Vector Drawable at ${androidOutputPath} for color modification`);
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
<!--Generator: React Native Icon Generator CLI-->
<!DOCTYPE svg
PUBLIC "-//W3C//DTD SVG 1.1//EN"
       "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 3300 2200">
 <style>.defaults {-sfsymbols-wiggle-style:clockwise}

.monochrome-0 {-sfsymbols-motion-group:0}

.multicolor-0:systemBlueColor {-sfsymbols-motion-group:0}

.hierarchical-0:primary {-sfsymbols-motion-group:0}

.SFSymbolsPreviewWireframe {fill:none;opacity:1.0;stroke:black;stroke-width:0.5}
</style>
   <g id="Notes">
              <rect height="2200" id="artboard" style="fill:white;opacity:1" width="3300" x="0" y="0" />
              <line style="fill:none;stroke:black;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="292" y2="292" />
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;font-weight:bold;"
                     transform="matrix(1 0 0 1 263 322)">Weight/Scale Variations</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 559.711 322)">Ultralight</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 856.422 322)">Thin</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 1153.13 322)">Light</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 1449.84 322)">Regular</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 1746.56 322)">Medium</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 2043.27 322)">Semibold</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 2339.98 322)">Bold</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 2636.69 322)">Heavy</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:middle;"
                     transform="matrix(1 0 0 1 2933.4 322)">Black</text>
              <line style="fill:none;stroke:black;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="1903" y2="1903" />
              <g transform="matrix(0.2 0 0 0.2 263 1933)">
                     <path
                            d="m46.2402 4.15039c21.7773 0 39.4531-17.627 39.4531-39.4043s-17.6758-39.4043-39.4531-39.4043c-21.7285 0-39.4043 17.627-39.4043 39.4043s17.6758 39.4043 39.4043 39.4043Zm0-7.42188c-17.6758 0-31.9336-14.3066-31.9336-31.9824s14.2578-31.9824 31.9336-31.9824 31.9824 14.3066 31.9824 31.9824-14.3066 31.9824-31.9824 31.9824Zm-17.9688-31.9824c0 2.14844 1.51367 3.61328 3.75977 3.61328h10.498v10.5957c0 2.19727 1.46484 3.71094 3.61328 3.71094 2.24609 0 3.71094-1.51367 3.71094-3.71094v-10.5957h10.5957c2.19727 0 3.71094-1.46484 3.71094-3.61328 0-2.19727-1.51367-3.71094-3.71094-3.71094h-10.5957v-10.5469c0-2.24609-1.46484-3.75977-3.71094-3.75977-2.14844 0-3.61328 1.51367-3.61328 3.75977v10.5469h-10.498c-2.24609 0-3.75977 1.51367-3.75977 3.71094Z" />
              </g>
              <g transform="matrix(0.2 0 0 0.2 281.506 1933)">
                     <path
                            d="m58.5449 14.5508c27.4902 0 49.8047-22.3145 49.8047-49.8047s-22.3145-49.8047-49.8047-49.8047-49.8047 22.3145-49.8047 49.8047 22.3145 49.8047 49.8047 49.8047Zm0-8.30078c-22.9492 0-41.5039-18.5547-41.5039-41.5039s18.5547-41.5039 41.5039-41.5039 41.5039 18.5547 41.5039 41.5039-18.5547 41.5039-41.5039 41.5039Zm-22.6562-41.5039c0 2.39258 1.66016 4.00391 4.15039 4.00391h14.3555v14.4043c0 2.44141 1.66016 4.15039 4.05273 4.15039 2.44141 0 4.15039-1.66016 4.15039-4.15039v-14.4043h14.4043c2.44141 0 4.15039-1.61133 4.15039-4.00391 0-2.44141-1.70898-4.15039-4.15039-4.15039h-14.4043v-14.3555c0-2.49023-1.70898-4.19922-4.15039-4.19922-2.39258 0-4.05273 1.70898-4.05273 4.19922v14.3555h-14.3555c-2.49023 0-4.15039 1.70898-4.15039 4.15039Z" />
              </g>
              <g transform="matrix(0.2 0 0 0.2 304.924 1933)">
                     <path
                            d="m74.8535 28.3203c35.1074 0 63.623-28.4668 63.623-63.5742s-28.5156-63.623-63.623-63.623-63.5742 28.5156-63.5742 63.623 28.4668 63.5742 63.5742 63.5742Zm0-9.08203c-30.127 0-54.4922-24.3652-54.4922-54.4922s24.3652-54.4922 54.4922-54.4922 54.4922 24.3652 54.4922 54.4922-24.3652 54.4922-54.4922 54.4922Zm-28.8574-54.4922c0 2.58789 1.85547 4.39453 4.58984 4.39453h19.7266v19.7754c0 2.68555 1.85547 4.58984 4.44336 4.58984 2.68555 0 4.54102-1.85547 4.54102-4.58984v-19.7754h19.7754c2.68555 0 4.58984-1.80664 4.58984-4.39453 0-2.73438-1.85547-4.58984-4.58984-4.58984h-19.7754v-19.7266c0-2.73438-1.85547-4.63867-4.54102-4.63867-2.58789 0-4.44336 1.9043-4.44336 4.63867v19.7266h-19.7266c-2.73438 0-4.58984 1.85547-4.58984 4.58984Z" />
              </g>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;font-weight:bold;"
                     transform="matrix(1 0 0 1 263 1953)">Design Variations</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 263 1971)">Symbols are supported in up to nine weights and three
                     scales.</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 263 1989)">For optimal layout with text and other symbols, vertically
                     align</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 263 2007)">symbols with the adjacent text.</text>
              <line style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="776" x2="776" y1="1919"
                     y2="1933" />
              <g transform="matrix(0.2 0 0 0.2 776 1933)">
                     <path
                            d="m16.5527 0.78125c2.58789 0 3.85742-0.976562 4.78516-3.71094l6.29883-17.2363h28.8086l6.29883 17.2363c0.927734 2.73438 2.19727 3.71094 4.73633 3.71094 2.58789 0 4.24805-1.5625 4.24805-4.00391 0-0.830078-0.146484-1.61133-0.537109-2.63672l-22.9004-60.9863c-1.12305-2.97852-3.125-4.49219-6.25-4.49219-3.02734 0-5.07812 1.46484-6.15234 4.44336l-22.9004 61.084c-0.390625 1.02539-0.537109 1.80664-0.537109 2.63672 0 2.44141 1.5625 3.95508 4.10156 3.95508Zm13.4766-28.3691 11.8652-32.8613h0.244141l11.8652 32.8613Z" />
              </g>
              <line style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="792.836" x2="792.836" y1="1919"
                     y2="1933" />
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;font-weight:bold;"
                     transform="matrix(1 0 0 1 776 1953)">Margins</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 776 1971)">Leading and trailing margins on the left and right side of
                     each symbol</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 776 1989)">can be adjusted by modifying the x-location of the margin
                     guidelines.</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 776 2007)">Modifications are automatically applied proportionally to
                     all</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 776 2025)">scales and weights.</text>
              <g transform="matrix(0.2 0 0 0.2 1289 1933)">
                     <path
                            d="m14.209 9.32617 8.49609 8.54492c4.29688 4.3457 9.22852 4.05273 13.8672-1.07422l53.4668-58.9355-4.83398-4.88281-53.0762 58.3984c-1.75781 2.00195-3.41797 2.49023-5.76172 0.146484l-5.85938-5.81055c-2.34375-2.29492-1.80664-4.00391 0.195312-5.81055l57.373-54.0039-4.88281-4.83398-57.959 54.4434c-4.93164 4.58984-5.32227 9.47266-1.02539 13.8184Zm32.0801-90.9668c-2.09961 2.05078-2.24609 4.93164-1.07422 6.88477 1.17188 1.80664 3.4668 2.97852 6.68945 2.14844 7.32422-1.70898 14.9414-2.00195 22.0703 2.68555l-2.92969 7.27539c-1.70898 4.15039-0.830078 7.08008 1.85547 9.81445l11.4746 11.5723c2.44141 2.44141 4.49219 2.53906 7.32422 2.05078l5.32227-0.976562 3.32031 3.36914-0.195312 2.7832c-0.195312 2.49023 0.439453 4.39453 2.88086 6.78711l3.80859 3.71094c2.39258 2.39258 5.46875 2.53906 7.8125 0.195312l14.5508-14.5996c2.34375-2.34375 2.24609-5.32227-0.146484-7.71484l-3.85742-3.80859c-2.39258-2.39258-4.24805-3.17383-6.64062-2.97852l-2.88086 0.244141-3.22266-3.17383 1.2207-5.61523c0.634766-2.83203-0.146484-5.0293-3.07617-7.95898l-10.9863-10.9375c-16.6992-16.6016-38.8672-16.2109-53.3203-1.75781Zm7.4707 1.85547c12.1582-8.88672 28.6133-7.37305 39.7461 3.75977l12.1582 12.0605c1.17188 1.17188 1.36719 2.09961 1.02539 3.80859l-1.61133 7.42188 7.51953 7.42188 4.93164-0.292969c1.26953-0.0488281 1.66016 0.0488281 2.63672 1.02539l2.88086 2.88086-12.207 12.207-2.88086-2.88086c-0.976562-0.976562-1.12305-1.36719-1.07422-2.68555l0.341797-4.88281-7.4707-7.42188-7.61719 1.26953c-1.61133 0.341797-2.34375 0.195312-3.56445-0.976562l-10.0098-10.0098c-1.26953-1.17188-1.41602-2.00195-0.634766-3.85742l4.39453-10.4492c-7.8125-7.27539-17.9688-10.4004-28.125-7.42188-0.78125 0.195312-1.07422-0.439453-0.439453-0.976562Z" />
              </g>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;font-weight:bold;"
                     transform="matrix(1 0 0 1 1289 1953)">Exporting</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 1289 1971)">Symbols should be outlined when exporting to ensure
                     the</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 1289 1989)">design is preserved when submitting to Xcode.</text>
              <text id="template-version"
                     style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:end;"
                     transform="matrix(1 0 0 1 3036 1933)">Template v.6.0</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:end;"
                     transform="matrix(1 0 0 1 3036 1951)">Requires Xcode 16 or greater</text>
              <text id="descriptive-name"
                     style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:end;"
                     transform="matrix(1 0 0 1 3036 1969)">Generated from circle</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:end;"
                     transform="matrix(1 0 0 1 3036 1987)">Typeset at 100.0 points</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 263 726)">Small</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 263 1156)">Medium</text>
              <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;"
                     transform="matrix(1 0 0 1 263 1586)">Large</text>
       </g>
 <g id="Guides">
              <g id="H-reference" style="fill:#27AAE1;stroke:none;" transform="matrix(1 0 0 1 339 696)">
                     <path
                            d="M0.993654 0L3.63775 0L29.3281-67.1323L30.0303-67.1323L30.0303-70.459L28.1226-70.459ZM11.6885-24.4799L46.9815-24.4799L46.2315-26.7285L12.4385-26.7285ZM55.1196 0L57.7637 0L30.6382-70.459L29.4326-70.459L29.4326-67.1323Z" />
              </g>
              <line id="Baseline-S" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036"
                     y1="696" y2="696" />
              <line id="Capline-S" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036"
                     y1="625.541" y2="625.541" />
              <g id="H-reference" style="fill:#27AAE1;stroke:none;" transform="matrix(1 0 0 1 339 1126)">
                     <path
                            d="M0.993654 0L3.63775 0L29.3281-67.1323L30.0303-67.1323L30.0303-70.459L28.1226-70.459ZM11.6885-24.4799L46.9815-24.4799L46.2315-26.7285L12.4385-26.7285ZM55.1196 0L57.7637 0L30.6382-70.459L29.4326-70.459L29.4326-67.1323Z" />
              </g>
              <line id="Baseline-M" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036"
                     y1="1126" y2="1126" />
              <line id="Capline-M" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036"
                     y1="1055.54" y2="1055.54" />
              <g id="H-reference" style="fill:#27AAE1;stroke:none;" transform="matrix(1 0 0 1 339 1556)">
                     <path
                            d="M0.993654 0L3.63775 0L29.3281-67.1323L30.0303-67.1323L30.0303-70.459L28.1226-70.459ZM11.6885-24.4799L46.9815-24.4799L46.2315-26.7285L12.4385-26.7285ZM55.1196 0L57.7637 0L30.6382-70.459L29.4326-70.459L29.4326-67.1323Z" />
              </g>
              <line id="Baseline-L" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036"
                     y1="1556" y2="1556" />
              <line id="Capline-L" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036"
                     y1="1485.54" y2="1485.54" />
              <line id="right-margin-Black-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;"
                     x1="2982.23" x2="2982.23" y1="600.785" y2="720.121" />
              <line id="left-margin-Black-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="2884.57"
                     x2="2884.57" y1="600.785" y2="720.121" />
              <line id="right-margin-Regular-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;"
                     x1="1496.11" x2="1496.11" y1="600.785" y2="720.121" />
              <line id="left-margin-Regular-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;"
                     x1="1403.58" x2="1403.58" y1="600.785" y2="720.121" />
              <line id="right-margin-Ultralight-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;"
                     x1="603.773" x2="603.773" y1="600.785" y2="720.121" />
              <line id="left-margin-Ultralight-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;"
                     x1="515.649" x2="515.649" y1="600.785" y2="720.121" />
       </g>
 <g id="Symbols">
  <!-- Small size variants -->
  <g id="Black-S" transform="matrix(1 0 0 1 2884.57 625.541)">
   <path class="monochrome-0 multicolor-0:systemBlueColor hierarchical-0:primary SFSymbolsPreviewWireframe" d="${extractIconPath(fixedSvgContent, 2)}"/>
  </g>
  <g id="Regular-S" transform="matrix(1 0 0 1 1404.14 625.541)">
   <path class="monochrome-0 multicolor-0:systemBlueColor hierarchical-0:primary SFSymbolsPreviewWireframe" d="${extractIconPath(fixedSvgContent, 1)}"/>
  </g>
  <g id="Ultralight-S" transform="matrix(1 0 0 1 515.484 625.541)">
   <path class="monochrome-0 multicolor-0:systemBlueColor hierarchical-0:primary SFSymbolsPreviewWireframe" d="${extractIconPath(fixedSvgContent, 0)}"/>
  </g>
 </g>
</svg>`;
            const iosSvgPath = path.join(iconSymbolsetDir, path.basename(svgPath));
            fs.writeFileSync(iosSvgPath, sfSymbolsSvg);
            console.log(`iOS Symbol files created successfully at: ${iconSymbolsetDir}`);
        }
        // Clean up the temporary SVGs folder
        console.log("\nCleaning up temporary files...");
        if (fs.existsSync(tempSvgsDir)) {
            fs.rmSync(tempSvgsDir, { recursive: true, force: true });
            console.log(`Removed temporary directory: ${tempSvgsDir}`);
        }
        console.log("\nAll icons processed successfully!");
    }
    catch (error) {
        console.error("Error in process:", error);
        // Try to clean up even if there was an error
        try {
            if (fs.existsSync(tempSvgsDir)) {
                fs.rmSync(tempSvgsDir, { recursive: true, force: true });
                console.log(`Removed temporary directory: ${tempSvgsDir}`);
            }
        }
        catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
        }
        process.exit(1);
    }
})();
// Helper function to extract paths from SVG content and position them for SF Symbols format
function extractPaths(svgContent, centerX, centerY, isAppleFormat = false) {
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
    // Calculate scale and position to center the icon
    const scale = 70 / Math.max(viewBox.width, viewBox.height);
    if (isAppleFormat) {
        // For Apple format, extract all path data
        let pathData = extractSvgPathsData(svgContent);
        return pathData;
    }
    else {
        // For the old format, return a transformed group
        const offsetX = centerX - (viewBox.width * scale) / 2;
        const offsetY = centerY - (viewBox.height * scale) / 2;
        return `<g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
            ${extractSvgElements(svgContent)}
        </g>`;
    }
}
// Helper function to extract just the path data for Apple format
function extractSvgPathsData(svgContent) {
    // Extract all path data
    const pathRegex = /<path[^>]*\sd="([^"]*)"[^>]*>/g;
    const paths = [];
    let match;
    while ((match = pathRegex.exec(svgContent)) !== null) {
        paths.push(match[1]);
    }
    // Also check for other shape elements we might need to convert to paths
    const otherShapes = svgContent.match(/<(circle|rect|ellipse|polygon|polyline)[^>]*>/g) || [];
    // Combine all path data
    return paths.length > 0
        ? paths.join(" ")
        : "M24,12 a12,12 0 1,0 -24,0 a12,12 0 1,0 24,0"; // Fallback circle if no paths found
}
// Helper function to extract SVG elements with proper classes
function extractSvgElements(svgContent) {
    // Extract all paths, circles, lines, etc.
    let content = svgContent
        .replace(/<svg[^>]*>([\s\S]*)<\/svg>/, "$1")
        .replace(/<g[^>]*>([\s\S]*)<\/g>/g, "$1");
    // Add fill attributes and remove any stroke if it exists
    // This makes the paths solid which is required for SF Symbols
    return content.replace(/<(path|circle|line|rect|ellipse|polygon|polyline)([^>]*)>/g, (match, type, attrs) => {
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
    });
}
function extractIconPath(svgContent, pos) {
    // Extract viewBox from the SVG
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']*)["']/);
    let viewBox = { x: 0, y: 0, width: 24, height: 24 };
    if (viewBoxMatch && viewBoxMatch[1]) {
        const parts = viewBoxMatch[1].split(/\s+/).map((part) => parseFloat(part));
        if (parts.length === 4) {
            viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
        }
    }
    // Extract all path data
    const pathRegex = /<path[^>]*\sd="([^"]*)"[^>]*>/g;
    let paths = [];
    let match;
    while ((match = pathRegex.exec(svgContent)) !== null) {
        paths.push(match[1]);
    }
    // Fallback if no paths are found
    if (paths.length === 0) {
        return "M24,12 a12,12 0 1,0 -24,0 a12,12 0 1,0 24,0";
    }
    // SF Symbols small template dimensions
    let size = 0;
    if (pos === 0) {
        size = 74.44922;
    }
    else if (pos === 1) {
        size = 78.80859;
    }
    else if (pos === 2) {
        size = 83.98438;
    }
    let guideWidth = 0;
    if (pos === 0) {
        guideWidth = 88.124;
    }
    else if (pos === 1) {
        guideWidth = 92.53;
    }
    else if (pos === 2) {
        guideWidth = 97.66;
    }
    const guideHeight = 70.459; // Assuming square canvas for simplicity
    // Calculate scaling factor to map viewBox to target dimensions
    const scaleModifier = 1.1;
    const scaleX = (size / viewBox.width) * scaleModifier;
    const scaleY = (size / viewBox.height) * scaleModifier;
    // Calculate offset to center the scaled path
    const scaledWidth = viewBox.width * scaleX;
    const scaledHeight = viewBox.height * scaleY;
    const offsetX = (guideWidth - scaledWidth) / 2;
    const offsetY = (guideHeight - scaledHeight) / 2;
    // Combine and transform all paths
    const transformedPaths = paths.map((path) => {
        // Parse and transform the path data by applying scale and offset
        let isXCoordinate = true; // Tracks whether the current number is an x-coordinate
        return path.replace(/([-]?[0-9]+(\.[0-9]+)?)/g, (match) => {
            const num = parseFloat(match);
            // Apply scale and offset
            const transformedNum = isXCoordinate
                ? num * scaleX + offsetX
                : num * scaleY + offsetY;
            isXCoordinate = !isXCoordinate; // Toggle between x and y
            return transformedNum.toString();
        });
    });
    // Return the combined path data
    return transformedPaths.join(" ");
}
