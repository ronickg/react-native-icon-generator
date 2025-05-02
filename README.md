# react-native-icon-converter

A command-line tool to convert SVG icons into formats compatible with both Android and iOS from a single source. Also has an expo plugin to copy the files into the correct native folders.

## Installation

```bash
npm install react-native-icon-converter --save-dev
```

## Expo Integration

Add the plugin to your Expo config in `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": ["react-native-icon-converter"]
  }
}
```

With custom paths (optional):

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-icon-converter",
        {
          "ios": "./assets/ios-icons/Icons.xcassets",
          "android": "./assets/android-icons"
        }
      ]
    ]
  }
}
```

## Usage Guide

1. Place your SVG icons in the `assets/icons` folder
2. Run the converter tool:
   ```bash
   npx generate-icons
   ```
3. For Expo projects:
   - Run `npx expo prebuild` to copy the generated icons to the native folders
   - The next time you build your app, the icons will be included
   - For non-Expo projects, you'll need to manually copy the generated files to their respective native folders.

## Example use case using Lucide Icons inside native menus

### iOS Icons

![iOS Icons](./ios-image.png)

### Android Icons

![Android Icons](./android-image.png)
