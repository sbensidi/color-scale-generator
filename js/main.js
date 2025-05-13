/**
 * Main entry point for the application
 */

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initUI();

    // Check for system dark mode preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial dark mode based on system preference
    if (prefersDarkMode) {
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.checked = true;

        // Trigger dark mode
        handleDarkModeToggle();
    }

    // Generate color scales with default color
    const initialColor = document.getElementById('baseColor').value.trim();
    let normalizedColor = initialColor;

    if (!normalizedColor.startsWith('#')) {
        normalizedColor = '#' + normalizedColor;
    }

    // Initial generation of color scales
    updateColorScales(normalizedColor);
});