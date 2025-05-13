/**
 * Integration with the color.pizza API for color naming
 */

// API endpoint for color.pizza
const COLOR_API_ENDPOINT = 'https://api.color.pizza/v1/';

/**
 * Get a color name from the color.pizza API
 * @param {string} hexColor - Hex color code (with or without #)
 * @returns {Promise<string>} - Promise that resolves to the color name
 */
async function getColorName(hexColor) {
    // Normalize hex color (remove # if present)
    const normalizedHex = hexColor.replace(/^#/, '');

    try {
        // Construct API URL
        const apiUrl = `${COLOR_API_ENDPOINT}?values=${normalizedHex}`;

        // Fetch color name from API
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract color name from the API response
        if (data && data.colors && data.colors.length > 0) {
            return data.colors[0].name;
        } else {
            // Fallback to generic color name if API doesn't return a name
            return getGenericColorName(hexToHSL(`#${normalizedHex}`));
        }
    } catch (error) {
        console.error('Error fetching color name:', error);
        // Fallback to generic color name in case of API error
        return getGenericColorName(hexToHSL(`#${normalizedHex}`));
    }
}

/**
 * Cache for storing color names to reduce API calls
 */
const colorNameCache = new Map();

/**
 * Get a color name with caching to avoid unnecessary API calls
 * @param {string} hexColor - Hex color code
 * @returns {Promise<string>} - Promise that resolves to the color name
 */
async function getCachedColorName(hexColor) {
    // Normalize hex color for consistent caching
    const normalizedHex = hexColor.replace(/^#/, '').toLowerCase();

    // Check if we have this color name in cache
    if (colorNameCache.has(normalizedHex)) {
        return colorNameCache.get(normalizedHex);
    }

    // If not in cache, fetch from API
    const colorName = await getColorName(normalizedHex);

    // Store in cache for future use
    colorNameCache.set(normalizedHex, colorName);

    return colorName;
}