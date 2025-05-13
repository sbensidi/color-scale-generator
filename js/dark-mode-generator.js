/**
 * Dark mode color scale generation based on accessible colors
 * Uses the accessible color scale as the foundation for the dark mode scale
 */

/**
 * Generate a dark mode color scale from the appropriate light mode scale
 * @param {Array} lightModeScale - Original light mode color scale
 * @param {Array} accessibleScale - Accessible alternative color scale (optional)
 * @returns {Array} - Array of color objects for dark mode
 */
function generateDarkModeScale(lightModeScale, accessibleScale = null) {
    // Determine which scale to use as the basis for dark mode
    // If the original color is already accessible, use it
    // Otherwise, use the accessible alternative scale
    const base400 = lightModeScale.find(color => color.level === 400);
    const isOriginalAccessible = base400.blackPassesNormal && base400.whitePassesNormal;

    // Choose the appropriate scale to reverse
    let baseScale = isOriginalAccessible ? lightModeScale : accessibleScale;

    // If we need an accessible scale but it wasn't provided, generate it
    if (!isOriginalAccessible && !baseScale) {
        // Get the base color HSL
        const baseHSL = base400.hsl;

        // Find an accessible alternative
        const accessibleHSL = findAccessibleColor(baseHSL);

        // Generate the accessible scale
        baseScale = generateColorScale(accessibleHSL);
    }

    // Create a mapping of reversed levels
    const levelMap = {
        100: 700,
        200: 600,
        300: 500,
        400: 400, // Base color stays the same
        500: 300,
        600: 200,
        700: 100
    };

    // Use baseScale (either original or accessible) to generate dark mode colors
    return lightModeScale.map(color => {
        let darkModeHSL;

        if (color.level === 400) {
            // Find the level 400 color in the base scale
            const baseColor = baseScale.find(c => c.level === 400);
            // Keep the base color exactly the same
            darkModeHSL = [...baseColor.hsl];
        } else {
            // Get the corresponding reversed level's color from the base scale
            const reversedLevel = levelMap[color.level];
            const reversedColor = baseScale.find(c => c.level === reversedLevel);

            if (!reversedColor) {
                console.error(`Could not find color with level ${reversedLevel} in base scale`);
                // Fallback to original color if reversed isn't found
                darkModeHSL = [...color.hsl];
            } else {
                // Apply minor adjustments for better dark mode visibility
                darkModeHSL = adjustForDarkMode(reversedColor.hsl);
            }
        }

        const darkModeHex = hslToHex(darkModeHSL);
        const darkModeRGB = hslToRgb(darkModeHSL);

        // Calculate contrast ratios
        const blackContrast = getContrastRatio(darkModeRGB, [0, 0, 0]);
        const whiteContrast = getContrastRatio(darkModeRGB, [255, 255, 255]);

        // Check if they pass AA standards
        const blackPassesNormal = blackContrast >= 4.5;
        const blackPassesLarge = blackContrast >= 3.0;
        const whitePassesNormal = whiteContrast >= 4.5;
        const whitePassesLarge = whiteContrast >= 3.0;

        // Determine if this color is better with black or white text
        const preferWhiteText = whiteContrast > blackContrast;

        return {
            level: color.level,
            hsl: darkModeHSL,
            hex: darkModeHex,
            rgb: darkModeRGB,
            blackContrast,
            whiteContrast,
            blackPassesNormal,
            blackPassesLarge,
            whitePassesNormal,
            whitePassesLarge,
            preferWhiteText
        };
    });
}

/**
 * Make minor adjustments to optimize the color for dark mode
 * @param {Array} hsl - HSL values of the original color
 * @returns {Array} - Adjusted HSL values for dark mode
 */
function adjustForDarkMode(hsl) {
    const [h, s, l] = hsl;

    // Minor saturation boost for dark mode visibility
    const newS = Math.min(s * 1.1, 100);

    return [h, newS, l];
}