# react-native-icon-generator-cli

A tool to generate SVG-based icons in formats compatible with Android and iOS apps.

## Installation

To install dependencies:

```bash
bun install
```

## Usage

To run:

```bash
bun run index.ts
```

This will:

1. Fix any SVG rendering issues using oslllo-svg-fixer
2. Convert the SVG to Android Vector Drawable format
3. Convert the SVG to iOS SF Symbols compatible format

## Output Files

- `android/locate.xml`: Android Vector Drawable file
- `ios/locate.symbolset/`: iOS SF Symbols compatible directory
  - `Contents.json`: Symbol set metadata
  - `locate.svg`: SF Symbols compatible SVG

## How to use the iOS Symbol in Xcode

1. Add the generated `.symbolset` folder to your Xcode project's asset catalog.
2. Use the custom symbol in your Swift/Objective-C code:

```swift
// Swift
let image = UIImage(named: "locate")

// Or using SF Symbols API (iOS 13+)
let config = UIImage.SymbolConfiguration(pointSize: 24, weight: .regular)
let image = UIImage(named: "locate")?.withConfiguration(config)
```

## Notes

- iOS symbols are formatted to be compatible with SF Symbols.
- For iOS, you can import the `.symbolset` directory into the SF Symbols app for further customization.

This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
