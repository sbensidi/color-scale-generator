/**
 * UI Controller for managing the user interface and DOM interactions
 */

// DOM elements
let baseColorInput;
let colorPicker;
let colorPreview;
let errorMessage;
let colorScale;
let alternativeColorScale;
let originalAccessibility;
let originalAccessibilityInfo;
let alternativeScaleSection;
let alternativeInfo;
let darkModeToggle;
let colorNameElement;
let lightModeCSSOutput;
let darkModeCSSOutput;
let copyLightModeCSS;
let copyDarkModeCSS;
let tabButtons;
let tabContents;

// Current state
let currentColorName = '';
let lightModeScale = [];
let darkModeScale = [];
let accessibleScale = null;
let isDarkModeActive = false;

/**
 * Initialize UI elements and event listeners
 */
function initUI() {
    // Get DOM elements
    baseColorInput = document.getElementById('baseColor');
    colorPicker = document.getElementById('colorPicker');
    colorPreview = document.getElementById('colorPreview');
    errorMessage = document.getElementById('error');
    colorScale = document.getElementById('colorScale');
    alternativeColorScale = document.getElementById('alternativeColorScale');
    originalAccessibility = document.getElementById('originalAccessibility');
    originalAccessibilityInfo = document.getElementById('originalAccessibilityInfo');
    alternativeScaleSection = document.getElementById('alternativeScaleSection');
    alternativeInfo = document.getElementById('alternativeInfo');
    darkModeToggle = document.getElementById('darkModeToggle');
    colorNameElement = document.getElementById('colorName');
    lightModeCSSOutput = document.getElementById('lightModeCSS');
    darkModeCSSOutput = document.getElementById('darkModeCSS');
    copyLightModeCSS = document.getElementById('copyLightModeCSS');
    copyDarkModeCSS = document.getElementById('copyDarkModeCSS');
    tabButtons = document.querySelectorAll('.tab-btn');
    tabContents = document.querySelectorAll('.tab-content');

    // Add event listeners
    baseColorInput.addEventListener('input', handleColorInput);
    colorPicker.addEventListener('input', handleColorPickerChange);
    colorPreview.addEventListener('click', () => colorPicker.click());
    darkModeToggle.addEventListener('change', handleDarkModeToggle);
    copyLightModeCSS.addEventListener('click', () => copyToClipboard(lightModeCSSOutput.textContent));
    copyDarkModeCSS.addEventListener('click', () => copyToClipboard(darkModeCSSOutput.textContent));

    // Set up tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to current button and content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });

    // Check for system dark mode preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial dark mode based on system preference
    if (prefersDarkMode) {
        darkModeToggle.checked = true;
        isDarkModeActive = true;

        // Trigger dark mode
        handleDarkModeToggle();
    }

    // Initialize with default color
    handleColorInput();
}

/**
 * Handle changes to the color input field
 */
function handleColorInput() {
    let color = baseColorInput.value.trim();

    // Add # if missing
    if (color && !color.startsWith('#')) {
        color = '#' + color;
    }

    if (isValidHex(color)) {
        // Update both preview and color picker
        colorPreview.style.backgroundColor = color;
        colorPicker.value = color;
        errorMessage.style.display = 'none';

        // Generate color scales and update UI
        updateColorScales(color);
    } else {
        colorPreview.style.backgroundColor = '#ffffff';
        errorMessage.style.display = 'block';
    }
}

/**
 * Handle changes to the color picker
 */
function handleColorPickerChange() {
    const color = colorPicker.value;
    // Update text input without # prefix
    baseColorInput.value = color.substring(1);
    colorPreview.style.backgroundColor = color;
    errorMessage.style.display = 'none';

    // Generate color scales and update UI
    updateColorScales(color);
}

/**
 * Toggle between light and dark mode
 */
function handleDarkModeToggle() {
    isDarkModeActive = darkModeToggle.checked;

    // Switch the theme stylesheet
    const themeStylesheet = document.getElementById('theme-stylesheet');
    themeStylesheet.href = isDarkModeActive ? 'css/dark-theme.css' : 'css/light-theme.css';

    // Update the displayed color scale based on active mode
    updateDisplayedColorScale();

    // If we have an accessible alternative, update that too
    if (alternativeScaleSection.style.display !== 'none') {
        updateAlternativeColorScale();
    }
}

/**
 * Update the displayed color scale based on current dark mode state
 */
function updateDisplayedColorScale() {
    if (isDarkModeActive) {
        // Show dark mode scale
        renderColorScale(darkModeScale, colorScale, currentColorName + " (Dark)");
    } else {
        // Show light mode scale
        renderColorScale(lightModeScale, colorScale, currentColorName);
    }
}

/**
 * Update the alternative color scale based on current dark mode state
 */
function updateAlternativeColorScale() {
    if (!accessibleScale) return;

    if (isDarkModeActive) {
        // Generate dark mode version of the accessible scale
        const accessibleDarkMode = generateDarkModeScale(accessibleScale, null);
        renderColorScale(accessibleDarkMode, alternativeColorScale, currentColorName + " (Accessible Dark)");
    } else {
        // Show light mode accessible scale
        renderColorScale(accessibleScale, alternativeColorScale, currentColorName + " (Accessible)");
    }
}

/**
 * Update color scales and UI based on selected color
 * @param {string} hexColor - Hex color code
 */
async function updateColorScales(hexColor) {
    // Convert base color to HSL
    const hsl400 = hexToHSL(hexColor);

    // Generate light mode scale
    lightModeScale = generateColorScale(hsl400);

    // Check accessibility of the original color
    const base400 = lightModeScale.find(color => color.level === 400);
    const blackPassesNormal = base400.blackPassesNormal;
    const whitePassesNormal = base400.whitePassesNormal;
    const isAccessible = blackPassesNormal && whitePassesNormal;

    // Generate accessible scale if needed
    accessibleScale = null;
    if (!isAccessible) {
        // Find nearest accessible color
        const accessibleHSL = findAccessibleColor(hsl400);
        accessibleScale = generateColorScale(accessibleHSL);
    }

    // Generate dark mode scale using the appropriate scale (original or accessible)
    darkModeScale = generateDarkModeScale(lightModeScale, accessibleScale);

    // Get color name from API or cache
    try {
        currentColorName = await getCachedColorName(hexColor);
        // Update color name in the UI
        colorNameElement.textContent = currentColorName;
    } catch (error) {
        console.error('Error getting color name:', error);
        currentColorName = getGenericColorName(hsl400);
        colorNameElement.textContent = currentColorName;
    }

    // Update accessibility status indicator
    originalAccessibility.className = `accessible-status accessible-${isAccessible}`;
    originalAccessibility.textContent = isAccessible ? "Accessible" : "Not Accessible";

    // Update accessibility info
    updateAccessibilityInfo(isAccessible, blackPassesNormal, whitePassesNormal);

    // Display the appropriate color scale based on current mode
    updateDisplayedColorScale();

    // Generate alternative scale if needed
    if (!isAccessible) {
        // Show alternative section
        alternativeScaleSection.style.display = "block";

        // Update alternative info
        const accessibleHex = accessibleScale.find(color => color.level === 400).hex;
        alternativeInfo.innerHTML = `
            This is the closest color to your selection that passes accessibility requirements.<br>
            <strong>Original:</strong> ${hexColor} &nbsp; <strong>Accessible:</strong> ${accessibleHex}
        `;

        // Update alternative scale display based on current mode
        updateAlternativeColorScale();
    } else {
        // If original is already accessible, hide alternative section
        alternativeScaleSection.style.display = "none";
    }

    // Update CSS outputs
    updateCSSOutputs(lightModeScale, darkModeScale, currentColorName);
}

/**
 * Update accessibility information display
 */
function updateAccessibilityInfo(isAccessible, blackPasses, whitePasses) {
    if (isAccessible) {
        originalAccessibilityInfo.className = "info-box accessible-info";
        originalAccessibilityInfo.innerHTML = "The base color passes WCAG AA requirements for both black and white text.";
    } else {
        originalAccessibilityInfo.className = "info-box non-accessible-info";
        if (!blackPasses && !whitePasses) {
            originalAccessibilityInfo.innerHTML = "The base color doesn't pass WCAG AA requirements for either black or white text.";
        } else if (!blackPasses) {
            originalAccessibilityInfo.innerHTML = "The base color doesn't pass WCAG AA requirements for black text.";
        } else {
            originalAccessibilityInfo.innerHTML = "The base color doesn't pass WCAG AA requirements for white text.";
        }
    }
}

/**
 * Render a color scale to the specified container
 * @param {Array} scale - Array of color objects
 * @param {Element} container - DOM element to render the scale into
 * @param {string} colorName - Name of the color
 */
function renderColorScale(scale, container, colorName) {
    // SVG icons for pass/fail indicators
    const checkIcon = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
    const closeIcon = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

    const colorCards = scale.map(color => {
        // Determine text color for the card (for better readability)
        const isDark = color.preferWhiteText;
        const textColorClass = isDark ? 'rgb-value-white' : '';
        const hslColorClass = isDark ? 'hsl-value-white' : '';

        return `
            <div class="color-card" style="background-color: ${color.hex};">
                <div class="color-info">
                    <div class="color-left">
                        <div class="color-name" style="color: ${isDark ? 'white' : 'black'}">${colorName}<span class="color-level">-${color.level}</span></div>
                    </div>
                    <div class="color-values">
                        <div class="hex-value" style="color: ${isDark ? 'white' : 'black'}">${color.hex}</div>
                        <div class="rgb-value ${textColorClass}">rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})</div>
                        <div class="hsl-value ${hslColorClass}">hsl(${Math.round(color.hsl[0])}, ${Math.round(color.hsl[1])}%, ${Math.round(color.hsl[2])}%)</div>
                    </div>
                </div>
                <div class="aa-container">
                    <!-- Black text contrast -->
                    <div class="aa-item">
                        <div class="circle-indicator black-bg">${color.blackContrast.toFixed(2)}</div>
                        <div class="aa-contrast">
                            <div class="aa-value">
                                <span class="aa-text" style="color: ${isDark ? 'white' : 'black'}">AA <small>(Normal)</small></span>
                                <div class="indicator ${color.blackPassesNormal ? 'pass' : 'fail'}">
                                    ${color.blackPassesNormal ? checkIcon : closeIcon}
                                </div>
                            </div>
                            <div class="aa-value">
                                <span class="aa-text" style="color: ${isDark ? 'white' : 'black'}">AA <small>(Large)</small></span>
                                <div class="indicator ${color.blackPassesLarge ? 'pass' : 'fail'}">
                                    ${color.blackPassesLarge ? checkIcon : closeIcon}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- White text contrast -->
                    <div class="aa-item">
                        <div class="circle-indicator white-bg">${color.whiteContrast.toFixed(2)}</div>
                        <div class="aa-contrast">
                            <div class="aa-value">
                                <span class="aa-text" style="color: ${isDark ? 'white' : 'black'}">AA <small>(Normal)</small></span>
                                <div class="indicator ${color.whitePassesNormal ? 'pass' : 'fail'}">
                                    ${color.whitePassesNormal ? checkIcon : closeIcon}
                                </div>
                            </div>
                            <div class="aa-value">
                                <span class="aa-text" style="color: ${isDark ? 'white' : 'black'}">AA <small>(Large)</small></span>
                                <div class="indicator ${color.whitePassesLarge ? 'pass' : 'fail'}">
                                    ${color.whitePassesLarge ? checkIcon : closeIcon}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Update the DOM
    container.innerHTML = colorCards;
}

/**
 * Update CSS variable outputs for both light and dark mode
 */
function updateCSSOutputs(lightScale, darkScale, colorName) {
    // Format the color name for CSS variables (lowercase, no spaces)
    const cssColorName = colorName.toLowerCase().replace(/\s+/g, '-');

    // Generate CSS variables for light mode
    const lightModeCSS = generateCSSVariables(lightScale, cssColorName);
    lightModeCSSOutput.textContent = lightModeCSS;

    // Generate CSS variables for dark mode
    const darkModeCSS = generateCSSVariables(darkScale, cssColorName, 'dark');
    darkModeCSSOutput.textContent = darkModeCSS;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('CSS variables copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}