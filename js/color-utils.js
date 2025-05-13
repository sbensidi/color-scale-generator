/**
 * Color utility functions for converting between different color formats
 * and performing color-related calculations.
 */

/**
 * Convert a hex color string to an RGB array
 * @param {string} hex - The hex color string (with or without #)
 * @returns {Array} - [r, g, b] array of RGB values (0-255)
 */
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');

    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
}

/**
 * Convert a hex color string to an HSL array
 * @param {string} hex - The hex color string
 * @returns {Array} - [h, s, l] array of HSL values (h: 0-360, s: 0-100, l: 0-100)
 */
function hexToHSL(hex) {
    const rgb = hexToRgb(hex);
    return rgbToHSL(rgb);
}

/**
 * Convert an RGB array to an HSL array
 * @param {Array} rgb - [r, g, b] array of RGB values (0-255)
 * @returns {Array} - [h, s, l] array of HSL values (h: 0-360, s: 0-100, l: 0-100)
 */
function rgbToHSL(rgb) {
    const [r, g, b] = rgb.map(v => v / 255);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

/**
 * Convert an HSL array to an RGB array
 * @param {Array} hsl - [h, s, l] array of HSL values (h: 0-360, s: 0-100, l: 0-100)
 * @returns {Array} - [r, g, b] array of RGB values (0-255)
 */
function hslToRgb(hsl) {
    let [h, s, l] = hsl;
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

/**
 * Convert an HSL array to a hex color string
 * @param {Array} hsl - [h, s, l] array of HSL values
 * @returns {string} - Hex color string with # prefix
 */
function hslToHex(hsl) {
    const rgb = hslToRgb(hsl);

    const toHex = c => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

/**
 * Validate if a string is a valid hex color
 * @param {string} color - Color string to validate
 * @returns {boolean} - True if valid hex color
 */
function isValidHex(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Normalize a hex color string to include # prefix
 * @param {string} color - Hex color with or without # prefix
 * @returns {string} - Normalized hex color with # prefix
 */
function normalizeHex(color) {
    color = color.trim();
    if (!color.startsWith('#')) {
        color = '#' + color;
    }
    return color;
}