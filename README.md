# Enhanced Color Scale Generator

A sophisticated tool for generating accessible color scales for web design and UI development. This application helps designers and developers create consistent color palettes with proper accessibility considerations for both light and dark modes.

## Features

- Generate complete color scales from a single base color
- Automatically check accessibility (WCAG AA) for each color against both black and white text
- Display alternative accessible color scales when needed
- Get color names automatically via the color.pizza API
- Generate dark mode variants of your color scales
- Output ready-to-use CSS variables for your design system
- Toggle between light and dark mode interface

## Usage

1. Enter a HEX color code or use the color picker to select your base color
2. View the complete color scale from 100 to 700
3. See accessibility ratings for each color in the scale
4. Copy the generated CSS variables for use in your project
5. Toggle dark mode to see how your colors adapt

## Technical Details

The application uses a sophisticated algorithm to generate color scales:

- Lighter variants (100-300) have increasing lightness and slightly decreasing saturation
- Darker variants (500-700) have decreasing lightness and increasing saturation
- Dark mode variants use a perceptually optimized approach that maintains color relationships

## Dependencies

This project uses the [color.pizza](https://github.com/meodai/color-names) API for color naming.

## License

MIT License