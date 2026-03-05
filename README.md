# ☀️ Sun Hours Calculator

A web application that calculates direct sunlight hours for any location, compass direction range, and date using astronomical algorithms.

## Features

- **GPS Location Support**: Use your current location or enter coordinates manually
- **Compass Direction Range**: Specify the direction range you want to analyze (e.g., south-facing windows)
- **Date Selection**: Calculate for any date to see seasonal variations
- **Visual Sun Path**: Interactive visualization showing the sun's path and when it's in your specified range
- **Accurate Calculations**: Uses NREL's Solar Position Algorithm (SPA) for precise results

## How to Use

1. **Open the App**: Simply open `index.html` in your web browser
2. **Set Location**: 
   - Click "Use Current Location" to automatically get your GPS coordinates
   - Or manually enter latitude and longitude
3. **Set Direction Range**:
   - Enter the compass directions you want to analyze
   - 0° = North, 90° = East, 180° = South, 270° = West
   - Example: For south-facing, use 135° to 225°
4. **Select Date**: Choose the date you want to calculate for
5. **Calculate**: Click "Calculate Sun Hours" to get results

## Results Explained

- **Direct Sun Hours**: Total hours the sun is visible in your specified direction range
- **Sunrise/Sunset Times**: Local sunrise and sunset times for the selected date
- **Sun in Range**: Time period when the sun is within your specified direction
- **Sun Path Visualization**: Shows the sun's path with highlighted portions in your range

## Use Cases

- **Solar Panel Planning**: Determine optimal placement and expected sun exposure
- **Garden Planning**: Find the best spots for sun-loving plants
- **Architecture**: Analyze natural lighting for buildings and rooms
- **Photography**: Plan golden hour shots for specific directions
- **Energy Efficiency**: Optimize window placement and shading

## Technical Details

The app uses advanced astronomical calculations including:
- Solar declination angle
- Equation of time corrections
- Solar hour angle calculations
- Azimuth and elevation angle computations
- Sunrise/sunset time calculations

## Browser Compatibility

- Modern browsers with JavaScript enabled
- Geolocation API support for automatic location detection
- HTML5 Canvas support for visualizations

## Example Scenarios

### South-Facing Window
- **Location**: Your home coordinates
- **Direction Range**: 135° to 225° (southeast to southwest)
- **Use**: Determine how much direct sunlight a south-facing window receives

### Solar Panel Installation
- **Location**: Installation site coordinates
- **Direction Range**: 180° to 180° (due south)
- **Use**: Calculate peak sun hours for energy production estimates

### Garden Planning
- **Location**: Garden coordinates
- **Direction Range**: 90° to 270° (east to west)
- **Use**: Find areas that receive full sun throughout the day

## Files Structure

```
sun-calculator/
├── index.html              # Main HTML file
├── styles.css              # Styling and layout
├── solar-calculator.js     # Solar position algorithms
├── app.js                  # Main application logic
└── README.md              # This documentation
```

## Getting Started

1. Download all files to a folder
2. Open `index.html` in your web browser
3. Allow location access when prompted (optional)
4. Start calculating sun hours for your location!

No installation or server setup required - it's a pure client-side web application.# sun-hours
