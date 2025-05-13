/**
 * Color scale generation functions
 */

/**
 * Color levels used in the scale
 */
const COLOR_LEVELS = [100, 200, 300, 400, 500, 600, 700];

/**
 * Generate a complete color scale from a base HSL color
 * @param {Array} baseHSL - Base HSL color (level 400) 
 * @returns {Array} - Array of color objects with various properties
 */
function generateColorScale(baseHSL) {
    return COLOR_LEVELS.map(level => {
        // Calculate HSL using our algorithm
        const hsl = calculateHSL(baseHSL, level);
        const hex = hslToHex(hsl);
        const rgb = hslToRgb(hsl);

        // Calculate contrast ratios
        const blackContrast = getContrastRatio(rgb, [0, 0, 0]);
        const whiteContrast = getContrastRatio(rgb, [255, 255, 255]);

        // Check if they pass AA standards
        // 4.5:1 for normal text, 3:1 for large text
        const blackPassesNormal = blackContrast >= 4.5;
        const blackPassesLarge = blackContrast >= 3.0;
        const whitePassesNormal = whiteContrast >= 4.5;
        const whitePassesLarge = whiteContrast >= 3.0;

        // Determine if this color is better with black or white text
        const preferWhiteText = whiteContrast > blackContrast;

        return {
            level,
            hsl,
            hex,
            rgb,
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
 * Calculate HSL values for each level based on the 400 level
 * @param {Array} hsl400 - Base HSL color at level 400
 * @param {number} level - Target level (100-700)
 * @returns {Array} - HSL color for the specified level
 */
function calculateHSL(hsl400, level) {
    const [h, s, l] = hsl400;

    if (level === 400) {
        return hsl400;
    }

    // Check if this is a neutral/grayscale color (low saturation)
    const isNeutral = s < 10;

    // For neutral colors, use specific boundaries
    if (isNeutral) {
        // For neutral colors like #8d8d8d
        // Lighter boundary (100): #f1f1f1
        // Darker boundary (700): #484848

        // Use hue of original color to maintain neutrality
        const originalHue = h;

        // Calculate lightness based on level
        let newL;
        let newS;

        if (level < 400) {
            // Levels 100-300: linear interpolation towards lightness 95%
            const factor = (400 - level) / 300;
            newL = l + (factor * (95 - l)); // Lightest is 95% (f1f1f1)
            newS = Math.max(0, s - (factor * s)); // Gradually remove saturation
        } else {
            // Levels 500-700: linear interpolation towards lightness 28%
            const factor = (level - 400) / 300;
            newL = l - (factor * (l - 28)); // Darkest is 28% (484848)
            newS = s; // Keep saturation the same to avoid color shifts
        }

        // Ensure valid ranges
        newL = Math.max(0, Math.min(100, newL));
        newS = Math.max(0, Math.min(100, newS));

        return [originalHue, newS, newL];
    }

    // For non-neutral colors, use the original algorithm
    // Automatically calculate the boundaries for levels 100 and 700
    const l100 = Math.min(94, l + 44); // Cap at 94% to avoid pure white
    const s100 = Math.max(0, s - 1);   // Minimal saturation decrease

    const l700 = Math.max(24, l - 26); // Floor at 24% to avoid pure black
    const s700 = Math.min(100, s + 28); // Cap saturation at 100%

    let newL, newS;

    // Piecewise linear interpolation
    if (level < 400) {
        // Levels 100-400
        const factor = (400 - level) / 300;
        newL = l - (factor * (l - l100));
        newS = s - (factor * (s - s100));
    } else {
        // Levels 400-700
        const factor = (level - 400) / 300;
        newL = l - (factor * (l - l700));
        newS = s + (factor * (s700 - s));
    }

    // Ensure values are within valid ranges
    newL = Math.max(0, Math.min(100, newL));
    newS = Math.max(0, Math.min(100, newS));

    return [h, newS, newL];
}

/**
 * Get a generic color name based on HSL values
 * @param {Array} hsl - HSL color array
 * @returns {string} - Generic color name
 */
function getGenericColorName(hsl) {
    const [h, s, l] = hsl;

    // Color names based on hue
    if (s < 10) {
        return "Neutral"; // Grayscale colors
    }

    if (h >= 0 && h < 15) return "Red";
    if (h >= 15 && h < 45) return "Orange";
    if (h >= 45 && h < 65) return "Yellow";
    if (h >= 65 && h < 80) return "Lime";
    if (h >= 80 && h < 150) return "Green";
    if (h >= 150 && h < 190) return "Teal";
    if (h >= 190 && h < 220) return "Cyan";
    if (h >= 220 && h < 255) return "Blue";
    if (h >= 255 && h < 280) return "Indigo";
    if (h >= 280 && h < 320) return "Purple";
    if (h >= 320 && h < 340) return "Magenta";
    if (h >= 340 && h <= 360) return "Pink";

    return "Custom";
}

/**
 * Generate CSS variables from a color scale
 * @param {Array} colorScale - Color scale array
 * @param {string} colorName - Name of the color
 * @param {string} prefix - CSS variable prefix
 * @returns {string} - CSS variables string
 */
function generateCSSVariables(colorScale, colorName, prefix = '') {
    let css = '';

    if (prefix) {
        css += `/* ${colorName} Color Scale for ${prefix} */\n`;
    } else {
        css += `/* ${colorName} Color Scale */\n`;
    }

    css += ':root {\n';

    colorScale.forEach(color => {
        const varName = prefix
            ? `  --${colorName.toLowerCase()}-${color.level}-${prefix}: ${color.hex};`
            : `  --${colorName.toLowerCase()}-${color.level}: ${color.hex};`;

        css += varName + '\n';
    });

    css += '}';

    return css;
}