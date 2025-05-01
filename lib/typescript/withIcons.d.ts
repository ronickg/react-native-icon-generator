export = withIcons;
/**
 * This config plugin handles resource files for both Android and iOS.
 * @param {Object} config - Expo config
 * @param {Object} props - Configuration props
 * @param {string} [props.android] - Directory path for Android drawable resources
 * @param {string} [props.ios] - Path to iOS asset catalog
 */
declare function withIcons(config: any, { android, ios }?: {
    android?: string;
    ios?: string;
}): any;
//# sourceMappingURL=withIcons.d.ts.map