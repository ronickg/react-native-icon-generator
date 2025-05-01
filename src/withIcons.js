const {
  createRunOncePlugin,
  withDangerousMod,
  withXcodeProject,
  IOSConfig,
  withPlugins,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");
const pkg = require("../../package.json");

/**
 * Handle Android icon resources
 * @param {Object} config - Expo config
 * @param {string} androidPath - Directory path for Android drawable resources
 */
const withAndroidIcons = (config, androidPath) => {
  return withDangerousMod(config, [
    "android",
    (config) => {
      if (!androidPath) {
        return config; // Skip if no Android resources provided
      }

      // Define the target drawable directory
      const drawableDir = path.join(
        config.modRequest.projectRoot,
        "android/app/src/main/res/drawable"
      );

      // Create the drawable directory if it doesn't exist
      if (!fs.existsSync(drawableDir)) {
        fs.mkdirSync(drawableDir, { recursive: true });
      }

      // Handle directory path
      const sourceDirPath = path.resolve(
        config.modRequest.projectRoot,
        androidPath
      );

      if (!fs.existsSync(sourceDirPath)) {
        throw new Error(
          `Android resource source directory not found: ${sourceDirPath}`
        );
      }

      if (!fs.lstatSync(sourceDirPath).isDirectory()) {
        throw new Error(
          `Android resource source path is not a directory: ${sourceDirPath}`
        );
      }

      // Copy all files from the directory
      const files = fs.readdirSync(sourceDirPath);
      files.forEach((fileName) => {
        const sourcePath = path.join(sourceDirPath, fileName);

        // Skip subdirectories
        if (fs.lstatSync(sourcePath).isDirectory()) {
          return;
        }

        const destPath = path.join(drawableDir, fileName);
        fs.copyFileSync(sourcePath, destPath);
      });

      return config;
    },
  ]);
};

/**
 * Handle iOS icon resources
 * @param {Object} config - Expo config
 * @param {string} iosPath - Path to iOS asset catalog
 */
const withIosIcons = (config, iosPath) => {
  return withXcodeProject(config, async (config) => {
    if (!iosPath) {
      return config; // Skip if no iOS resources provided
    }

    // Simple implementation - just add the asset catalog to the project
    const thisFilePath = path.join("../", iosPath);
    if (!config.modResults.hasFile(thisFilePath)) {
      console.log(`Adding ${thisFilePath} to Xcode project`);
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: thisFilePath,
        groupName: config.modRequest.projectName,
        project: config.modResults,
        isBuildFile: true,
      });
    }

    return config;
  });
};

/**
 * This config plugin handles resource files for both Android and iOS.
 * @param {Object} config - Expo config
 * @param {Object} props - Configuration props
 * @param {string} [props.android] - Directory path for Android drawable resources
 * @param {string} [props.ios] - Path to iOS asset catalog
 */
const withIcons = (config, { android, ios } = {}) => {
  // Apply modifications to the config here
  config = withPlugins(config, [
    [withAndroidIcons, android],
    [withIosIcons, ios],
  ]);
  return config;
};

module.exports = createRunOncePlugin(withIcons, pkg.name, pkg.version);
