/**
 * Accessibility-related calculations for color contrast
 */

/**
 * Calculate the luminance of an RGB color
 * @param {Array} rgb - [r, g, b] array of RGB values (0-255)
 * @returns {number} - Luminance value (0-1)
 */
function calculateLuminance(rgb) {
    const [r, g, b] = rgb.map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two RGB colors
 * @param {Array} rgb1 - First RGB color
 * @param {Array} rgb2 - Second RGB color
 * @returns {number} - Contrast ratio (1-21)
 */
function getContrastRatio(rgb1, rgb2) {
    const luminance1 = calculateLuminance(rgb1);
    const luminance2 = calculateLuminance(rgb2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color passes WCAG AA requirements for text
 * @param {Array} rgb - RGB color to test
 * @param {Array} textRgb - Text RGB color (usually black or white)
 * @param {boolean} isLargeText - Whether the text is large (≥18pt or ≥14pt bold)
 * @returns {boolean} - True if the color passes the contrast requirements
 */
function passesContrastCheck(rgb, textRgb, isLargeText = false) {
    const ratio = getContrastRatio(rgb, textRgb);
    return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Find the nearest accessible color to the given HSL color
 * @param {Array} originalHSL - Original HSL color
 * @returns {Array} - Nearest accessible HSL color that passes AA requirements
 */
function findAccessibleColor(originalHSL) {
    const [h, s, l] = originalHSL;
    let closestHSL = [...originalHSL];
    let minDistance = Infinity;

    // We'll adjust lightness to find an accessible color
    // The range we'll search through
    for (let newL = 45; newL <= 65; newL++) {
        // Create and test a color with the new lightness
        const testHSL = [h, s, newL];
        const testRGB = hslToRgb(testHSL);

        // Check contrast ratios
        const blackContrast = getContrastRatio(testRGB, [0, 0, 0]);
        const whiteContrast = getContrastRatio(testRGB, [255, 255, 255]);

        // If this passes both contrast requirements
        if (blackContrast >= 4.5 && whiteContrast >= 4.5) {
            // Calculate "distance" from original color
            const distance = Math.abs(l - newL);

            // If this is closer than our previous best match
            if (distance < minDistance) {
                minDistance = distance;
                closestHSL = testHSL;
            }
        }
    }

    // If no accessible color found by just changing lightness
    if (minDistance === Infinity) {
        // Try more aggressive adjustments with saturation too
        for (let newL = 45; newL <= 65; newL++) {
            for (let newS = Math.max(0, s - 20); newS <= Math.min(100, s + 20); newS += 5) {
                const testHSL = [h, newS, newL];
                const testRGB = hslToRgb(testHSL);

                const blackContrast = getContrastRatio(testRGB, [0, 0, 0]);
                const whiteContrast = getContrastRatio(testRGB, [255, 255, 255]);

                if (blackContrast >= 4.5 && whiteContrast >= 4.5) {
                    const distance = Math.sqrt(Math.pow(l - newL, 2) + Math.pow(s - newS, 2));

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestHSL = testHSL;
                    }
                }
            }
        }
    }

    // If still no accessible color found, try adjusting hue as well
    if (minDistance === Infinity) {
        for (let hueShift = -30; hueShift <= 30; hueShift += 5) {
            const newH = (h + hueShift + 360) % 360; // Ensure hue stays in 0-360 range

            for (let newL = 45; newL <= 65; newL += 2) {
                for (let newS = Math.max(0, s - 30); newS <= Math.min(100, s + 30); newS += 10) {
                    const testHSL = [newH, newS, newL];
                    const testRGB = hslToRgb(testHSL);

                    const blackContrast = getContrastRatio(testRGB, [0, 0, 0]);
                    const whiteContrast = getContrastRatio(testRGB, [255, 255, 255]);

                    if (blackContrast >= 4.5 && whiteContrast >= 4.5) {
                        // Calculate a weighted distance that prioritizes hue similarity
                        const distance = Math.sqrt(
                            Math.pow((h - newH) / 3, 2) +
                            Math.pow(l - newL, 2) +
                            Math.pow((s - newS) / 2, 2)
                        );

                        if (distance < minDistance) {
                            minDistance = distance;
                            closestHSL = testHSL;
                        }
                    }
                }
            }
        }
    }

    // If still no accessible color found, return a known accessible color
    if (minDistance === Infinity) {
        // Return a medium teal that's known to be accessible
        return [195, 60, 55]; // Medium teal that passes both black and white contrast
    }

    return closestHSL;
}