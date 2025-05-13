/**
 * Triple View - Shows original, accessible and dark mode scales simultaneously
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const baseColorInput = document.getElementById('baseColor');
    const colorPicker = document.getElementById('colorPicker');
    const colorPreview = document.getElementById('colorPreview');
    const errorMessage = document.getElementById('error');
    const colorScale = document.getElementById('colorScale');
    const alternativeColorScale = document.getElementById('alternativeColorScale');
    const darkModeColorScale = document.getElementById('darkModeColorScale');
    const originalAccessibility = document.getElementById('originalAccessibility');
    const originalAccessibilityInfo = document.getElementById('originalAccessibilityInfo');
    const alternativeScaleSection = document.getElementById('alternativeScaleSection');
    const alternativeInfo = document.getElementById('alternativeInfo');
    const colorNameElement = document.getElementById('colorName');
    const darkModeColorNameElement = document.getElementById('darkModeColorName');
    const lightModeCSSOutput = document.getElementById('lightModeCSS');
    const darkModeCSSOutput = document.getElementById('darkModeCSS');
    const copyLightModeCSS = document.getElementById('copyLightModeCSS');
    const copyDarkModeCSS = document.getElementById('copyDarkModeCSS');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Current state
    let currentColorName = '';
    let lightModeScale = [];
    let darkModeScale = [];
    let accessibleScale = null;

    // SVG icons for pass/fail
    const checkIcon = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
    const closeIcon = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

    // Add event listeners
    baseColorInput.addEventListener('input', handleColorInput);
    colorPicker.addEventListener('input', handleColorPickerChange);
    colorPreview.addEventListener('click', () => colorPicker.click());

    // Copy buttons
    if (copyLightModeCSS && copyDarkModeCSS) {
        copyLightModeCSS.addEventListener('click', () => copyToClipboard(lightModeCSSOutput.textContent));
        copyDarkModeCSS.addEventListener('click', () => copyToClipboard(darkModeCSSOutput.textContent));
    }

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

    // Handle changes to the color input field
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

    // Handle changes to the color picker
    function handleColorPickerChange() {
        const color = colorPicker.value;
        // Update text input without # prefix
        baseColorInput.value = color.substring(1);
        colorPreview.style.backgroundColor = color;
        errorMessage.style.display = 'none';

        // Generate color scales and update UI
        updateColorScales(color);
    }

    // Copy text to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('CSS variables copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    }

    // Update color scales and UI based on selected color
    async function updateColorScales(hexColor) {
        try {
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

            // Generate dark mode scale using the appropriate scale
            darkModeScale = generateDarkModeScale(lightModeScale, accessibleScale);

            // Get color name from API or cache
            try {
                currentColorName = await getCachedColorName(hexColor);
                // Update color name in the UI
                colorNameElement.textContent = currentColorName;
                darkModeColorNameElement.textContent = currentColorName + " (Dark)";
            } catch (error) {
                console.error('Error getting color name:', error);
                currentColorName = getGenericColorName(hsl400);
                colorNameElement.textContent = currentColorName;
                darkModeColorNameElement.textContent = currentColorName + " (Dark)";
            }

            // Update accessibility status indicator
            originalAccessibility.className = `accessible-status accessible-${isAccessible}`;
            originalAccessibility.textContent = isAccessible ? "Accessible" : "Not Accessible";

            // Update accessibility info
            updateAccessibilityInfo(isAccessible, blackPassesNormal, whitePassesNormal);

            // Render original color scale
            renderColorScale(lightModeScale, colorScale, currentColorName);

            // Generate and render dark mode scale (always shown)
            renderColorScale(darkModeScale, darkModeColorScale, currentColorName + " (Dark)");

            // Generate alternative scale if needed
            if (!isAccessible && accessibleScale) {
                // Show alternative section
                alternativeScaleSection.style.display = "block";

                // Update alternative info
                const accessibleHex = accessibleScale.find(color => color.level === 400).hex;
                alternativeInfo.innerHTML = `
                    This is the closest color to your selection that passes accessibility requirements.<br>
                    <strong>Original:</strong> ${hexColor} &nbsp; <strong>Accessible:</strong> ${accessibleHex}
                `;

                // Render alternative color scale
                renderColorScale(accessibleScale, alternativeColorScale, currentColorName + " (Accessible)");
            } else {
                // If original is already accessible, hide alternative section
                alternativeScaleSection.style.display = "none";
            }

            // Update CSS outputs
            updateCSSOutputs(lightModeScale, darkModeScale, currentColorName);
        } catch (error) {
            console.error('Error updating color scales:', error);
            alert('There was an error updating the color scales. Check the console for details.');
        }
    }

    // Update accessibility information display
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

    // Render a color scale to the specified container
    function renderColorScale(scale, container, colorName) {
        if (!scale || !container) {
            console.error('Missing scale or container for rendering');
            return;
        }

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

    // Update CSS variable outputs for both light and dark mode
    function updateCSSOutputs(lightScale, darkScale, colorName) {
        if (!lightModeCSSOutput || !darkModeCSSOutput) {
            console.error('CSS output elements not found');
            return;
        }

        // Format the color name for CSS variables (lowercase, no spaces)
        const cssColorName = colorName.toLowerCase().replace(/\s+/g, '-');

        // Generate CSS variables for light mode
        const lightModeCSS = generateCSSVariables(lightScale, cssColorName);
        lightModeCSSOutput.textContent = lightModeCSS;

        // Generate CSS variables for dark mode
        const darkModeCSS = generateCSSVariables(darkScale, cssColorName, 'dark');
        darkModeCSSOutput.textContent = darkModeCSS;
    }

    // Initialize with default color
    console.log('Triple view initializing...');
    const initialColor = baseColorInput.value.trim();
    let normalizedColor = initialColor;

    if (!normalizedColor.startsWith('#')) {
        normalizedColor = '#' + normalizedColor;
    }

    // Initial generation of color scales
    updateColorScales(normalizedColor);
});