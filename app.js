/**
 * Sun Hours Calculator App
 * Main application logic and UI interactions
 */

class SunHoursApp {
    constructor() {
        this.calculator = new SolarCalculator();
        this.currentLanguage = 'he';
        this.initializeElements();
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateCompassVisualization();
        this.setupLanguageSupport();
    }

    initializeElements() {
        // Input elements
        this.latitudeInput = document.getElementById('latitude');
        this.longitudeInput = document.getElementById('longitude');
        this.directionStartInput = document.getElementById('direction-start');
        this.directionEndInput = document.getElementById('direction-end');
        this.dateInput = document.getElementById('calculation-date');
        this.minElevationInput = document.getElementById('min-elevation');
        
        // Elevation profile elements
        this.addElevationPointBtn = document.getElementById('add-elevation-point');
        this.measurePointsBtn = document.getElementById('measure-points');
        this.clearElevationProfileBtn = document.getElementById('clear-elevation-profile');
        this.elevationProfileTable = document.getElementById('elevation-profile-table');
        this.elevationProfileTbody = document.getElementById('elevation-profile-tbody');
        
        // Camera measurement elements
        this.cameraMeasurement = document.getElementById('camera-measurement');
        this.cameraVideo = document.getElementById('camera-video');
        this.cameraOverlay = document.getElementById('camera-overlay');
        this.cameraReturnBtn = document.getElementById('camera-return');
        this.cameraHelpBtn = document.getElementById('camera-help');
        this.currentDirectionDisplay = document.getElementById('current-direction');
        this.currentElevationDisplay = document.getElementById('current-elevation');
        this.addMeasurementPointBtn = document.getElementById('add-measurement-point');
        this.removeLastPointBtn = document.getElementById('remove-last-point');
        this.pointsCountDisplay = document.getElementById('points-count');
        this.measurementDoneBtn = document.getElementById('measurement-done');
        
        // Button elements
        this.getLocationBtn = document.getElementById('get-location');
        this.calculateBtn = document.getElementById('calculate');
        this.languageSelector = document.getElementById('language-selector');
        
        // Elevation profile data
        this.elevationProfile = [];
        
        // Camera measurement data
        this.measurementPoints = [];
        this.cameraStream = null;
        this.orientationData = { direction: null, elevation: null };
        this.isOrientationSupported = false;
        
        // Result elements
        this.resultsSection = document.getElementById('results-section');
        this.sunHoursDisplay = document.getElementById('sun-hours');
        this.sunriseTimeDisplay = document.getElementById('sunrise-time');
        this.sunsetTimeDisplay = document.getElementById('sunset-time');
        this.sunRangeTimeDisplay = document.getElementById('sun-range-time');
        this.timezoneOffsetDisplay = document.getElementById('timezone-offset');
        
        // Visualization elements
        this.compassNeedle = document.getElementById('compass-needle');
        this.directionArc = document.getElementById('direction-arc');
        this.sunPathCanvas = document.getElementById('sun-path-canvas');
        this.directionTimeChart = document.getElementById('direction-time-chart');
        this.elevationTimeChart = document.getElementById('elevation-time-chart');
        this.irradianceTimeChart = document.getElementById('irradiance-time-chart');
        this.yearlyChart = document.getElementById('yearly-chart');
        this.yearlyChartCanvas = document.getElementById('yearly-chart-canvas');
        this.yearlyIrradianceChart = document.getElementById('yearly-irradiance-chart');
        this.yearlyIrradianceCanvas = document.getElementById('yearly-irradiance-canvas');
    }

    setupEventListeners() {
        // Language selector
        this.languageSelector.addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });

        // Get current location
        this.getLocationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Calculate button
        this.calculateBtn.addEventListener('click', () => {
            this.calculateSunHours();
        });

        // Update compass visualization when direction inputs change
        this.directionStartInput.addEventListener('input', () => {
            this.updateCompassVisualization();
        });

        this.directionEndInput.addEventListener('input', () => {
            this.updateCompassVisualization();
        });

        // Elevation profile event listeners
        this.addElevationPointBtn.addEventListener('click', () => {
            this.addElevationPoint();
        });

        this.measurePointsBtn.addEventListener('click', () => {
            this.openCameraMeasurement();
        });

        this.clearElevationProfileBtn.addEventListener('click', () => {
            this.clearElevationProfile();
        });

        // Camera measurement event listeners
        this.cameraReturnBtn.addEventListener('click', () => {
            this.closeCameraMeasurement();
        });

        this.cameraHelpBtn.addEventListener('click', () => {
            this.showCameraHelp();
        });

        this.addMeasurementPointBtn.addEventListener('click', () => {
            this.addMeasurementPoint();
        });

        this.removeLastPointBtn.addEventListener('click', () => {
            this.removeLastMeasurementPoint();
        });

        this.measurementDoneBtn.addEventListener('click', () => {
            this.finishMeasurement();
        });

        // Enter key triggers calculation
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.calculateSunHours();
            }
        });
    }

    setupLanguageSupport() {
        // Set Hebrew as default language
        this.switchLanguage('he');
        this.languageSelector.value = 'he';
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        const html = document.documentElement;
        
        // Update HTML direction
        html.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
        html.setAttribute('lang', lang);
        
        // Update all elements with data attributes
        const elements = document.querySelectorAll('[data-en][data-he]');
        elements.forEach(element => {
            const text = element.getAttribute(`data-${lang}`);
            if (text) {
                element.innerHTML = text;
            }
        });
        
        // Update elevation profile table language
        this.updateElevationTableLanguage();
    }

    setDefaultDate() {
        // Set default date to today
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        this.dateInput.value = dateString;
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser.');
            return;
        }

        const loadingText = this.currentLanguage === 'he' ? '📍 מקבל מיקום...' : '📍 Getting location...';
        const originalText = this.getLocationBtn.textContent;
        
        this.getLocationBtn.textContent = loadingText;
        this.getLocationBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.latitudeInput.value = position.coords.latitude.toFixed(6);
                this.longitudeInput.value = position.coords.longitude.toFixed(6);
                this.getLocationBtn.textContent = originalText;
                this.getLocationBtn.disabled = false;
                
                const successMsg = this.currentLanguage === 'he' ? 
                    'המיקום עודכן בהצלחה!' : 'Location updated successfully!';
                this.showSuccess(successMsg);
            },
            (error) => {
                let errorMessage = this.currentLanguage === 'he' ? 
                    'לא ניתן לקבל מיקום: ' : 'Unable to get location: ';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += this.currentLanguage === 'he' ? 
                            'הגישה למיקום נדחתה על ידי המשתמש.' : 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += this.currentLanguage === 'he' ? 
                            'מידע מיקום לא זמין.' : 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += this.currentLanguage === 'he' ? 
                            'בקשת המיקום פגה.' : 'Location request timed out.';
                        break;
                    default:
                        errorMessage += this.currentLanguage === 'he' ? 
                            'אירעה שגיאה לא ידועה.' : 'Unknown error occurred.';
                        break;
                }
                this.showError(errorMessage);
                this.getLocationBtn.textContent = originalText;
                this.getLocationBtn.disabled = false;
            }
        );
    }

    updateCompassVisualization() {
        const startDir = parseFloat(this.directionStartInput.value) || 0;
        const endDir = parseFloat(this.directionEndInput.value) || 0;
        
        // Update the direction arc visualization
        if (this.directionArc) {
            const normalizedStart = ((startDir % 360) + 360) % 360;
            const normalizedEnd = ((endDir % 360) + 360) % 360;
            
            let gradientString;
            if (normalizedStart <= normalizedEnd) {
                // Normal range (doesn't cross 0°)
                gradientString = `conic-gradient(from 0deg, 
                    transparent 0deg, 
                    transparent ${normalizedStart}deg, 
                    rgba(116, 185, 255, 0.3) ${normalizedStart}deg, 
                    rgba(116, 185, 255, 0.3) ${normalizedEnd}deg, 
                    transparent ${normalizedEnd}deg, 
                    transparent 360deg)`;
            } else {
                // Range crosses 0° (e.g., 350° to 10°)
                gradientString = `conic-gradient(from 0deg, 
                    rgba(116, 185, 255, 0.3) 0deg, 
                    rgba(116, 185, 255, 0.3) ${normalizedEnd}deg, 
                    transparent ${normalizedEnd}deg, 
                    transparent ${normalizedStart}deg, 
                    rgba(116, 185, 255, 0.3) ${normalizedStart}deg, 
                    rgba(116, 185, 255, 0.3) 360deg)`;
            }
            
            this.directionArc.style.background = gradientString;
        }
    }

    calculateSunHours() {
        // Validate inputs
        const latitude = parseFloat(this.latitudeInput.value);
        const longitude = parseFloat(this.longitudeInput.value);
        const directionStart = parseFloat(this.directionStartInput.value);
        const directionEnd = parseFloat(this.directionEndInput.value);
        const minElevation = parseFloat(this.minElevationInput.value) || 0;
        const dateValue = this.dateInput.value;

        if (isNaN(latitude) || isNaN(longitude)) {
            const errorMsg = this.currentLanguage === 'he' ? 
                'אנא הזן ערכי קו רוחב וקו אורך תקינים.' : 'Please enter valid latitude and longitude values.';
            this.showError(errorMsg);
            return;
        }

        if (latitude < -90 || latitude > 90) {
            const errorMsg = this.currentLanguage === 'he' ? 
                'קו הרוחב חייב להיות בין -90 ל-90 מעלות.' : 'Latitude must be between -90 and 90 degrees.';
            this.showError(errorMsg);
            return;
        }

        if (longitude < -180 || longitude > 180) {
            const errorMsg = this.currentLanguage === 'he' ? 
                'קו האורך חייב להיות בין -180 ל-180 מעלות.' : 'Longitude must be between -180 and 180 degrees.';
            this.showError(errorMsg);
            return;
        }

        if (isNaN(directionStart) || isNaN(directionEnd)) {
            const errorMsg = this.currentLanguage === 'he' ? 
                'אנא הזן ערכי כיוון תקינים.' : 'Please enter valid direction values.';
            this.showError(errorMsg);
            return;
        }

        if (!dateValue) {
            const errorMsg = this.currentLanguage === 'he' ? 
                'אנא בחר תאריך.' : 'Please select a date.';
            this.showError(errorMsg);
            return;
        }

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            const errorMsg = this.currentLanguage === 'he' ? 
                'אנא הזן תאריך תקין.' : 'Please enter a valid date.';
            this.showError(errorMsg);
            return;
        }

        // Show loading state
        const loadingText = this.currentLanguage === 'he' ? '🔄 מחשב...' : '🔄 Calculating...';
        const originalText = this.calculateBtn.textContent;
        this.calculateBtn.textContent = loadingText;
        this.calculateBtn.disabled = true;

        // Perform calculation (with small delay to show loading state)
        setTimeout(() => {
            try {
                const results = this.calculator.calculateDirectSunHours(
                    latitude, longitude, date, directionStart, directionEnd, minElevation, this.elevationProfile
                );

                this.displayResults(results, directionStart, directionEnd);

                // Always calculate and display yearly data
                this.calculateAndDisplayYearlyData(latitude, longitude, directionStart, directionEnd, minElevation);

                const successMsg = this.currentLanguage === 'he' ? 
                    'החישוב הושלם בהצלחה!' : 'Calculation completed successfully!';
                this.showSuccess(successMsg);
            } catch (error) {
                console.error('Calculation error:', error);
                const errorMsg = this.currentLanguage === 'he' ? 
                    'אירעה שגיאה במהלך החישוב. אנא בדוק את הנתונים שהזנת.' : 
                    'An error occurred during calculation. Please check your inputs.';
                this.showError(errorMsg);
            } finally {
                this.calculateBtn.textContent = originalText;
                this.calculateBtn.disabled = false;
            }
        }, 100);
    }

    displayResults(results, directionStart, directionEnd) {
        // Show results section
        this.resultsSection.style.display = 'block';

        // Calculate total solar energy for the day
        const totalEnergy = this.calculateTotalSolarEnergy(results.timeInRange);

        // Update result displays
        this.sunHoursDisplay.textContent = `${results.directSunHours.toFixed(2)} ${this.currentLanguage === 'he' ? 'שעות' : 'hours'}`;
        this.sunriseTimeDisplay.textContent = results.sunrise;
        this.sunsetTimeDisplay.textContent = results.sunset;
        this.sunRangeTimeDisplay.textContent = this.calculator.formatTimeRange(results.timeInRange);
        this.timezoneOffsetDisplay.textContent = `UTC${results.timezoneOffset >= 0 ? '+' : ''}${results.timezoneOffset}`;

        // Add solar energy display if it doesn't exist
        if (!document.getElementById('solar-energy')) {
            const energyItem = document.createElement('div');
            energyItem.className = 'result-item';
            energyItem.innerHTML = `
                <span class="label" data-en="Solar Energy:" data-he="אנרגיה סולרית:">Solar Energy:</span>
                <span class="value" id="solar-energy">--</span>
            `;
            document.querySelector('.result-card').appendChild(energyItem);
        }
        
        const solarEnergyDisplay = document.getElementById('solar-energy');
        solarEnergyDisplay.textContent = `${totalEnergy.toFixed(2)} ${this.currentLanguage === 'he' ? 'kWh/m²' : 'kWh/m²'}`;

        // Draw sun path visualization
        this.calculator.drawSunPath(this.sunPathCanvas, results.sunPath, directionStart, directionEnd);

        // Always display the analysis charts
        this.drawDirectionTimeChart(results.sunPath);
        this.drawElevationTimeChart(results.sunPath);
        this.drawIrradianceTimeChart(results.sunPath);

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    calculateTotalSolarEnergy(timeInRange) {
        // Calculate total solar energy in kWh/m² for the time periods when sun is in range
        let totalEnergy = 0;
        
        for (const period of timeInRange) {
            // Each period represents 1 minute, convert irradiance from W/m² to kWh/m²
            // 1 minute = 1/60 hours, so energy = irradiance * (1/60) / 1000
            const energyPerMinute = (period.irradiance || 0) * (1/60) / 1000;
            totalEnergy += energyPerMinute;
        }
        
        return totalEnergy;
    }

    drawDirectionTimeChart(sunPath) {
        const canvas = this.directionTimeChart;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Chart settings
        const margin = { top: 30, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Filter valid sun path points
        const validPoints = sunPath.filter(point => point.elevation > 0);
        if (validPoints.length === 0) return;
        
        // Find min/max values for scaling
        const minAzimuth = Math.min(...validPoints.map(p => p.azimuth));
        const maxAzimuth = Math.max(...validPoints.map(p => p.azimuth));
        
        // Draw axes
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw data line
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        validPoints.forEach((point, index) => {
            const x = margin.left + (index / (validPoints.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - ((point.azimuth - minAzimuth) / (maxAzimuth - minAzimuth)) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Highlight points in range
            if (point.inRange) {
                ctx.fillStyle = '#e17055';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        
        ctx.stroke();
        
        // Add time axis values
        ctx.fillStyle = '#2d3436';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // Draw time markers every 2 hours
        for (let hour = 6; hour <= 18; hour += 2) {
            // Find the closest point to this hour
            let closestIndex = 0;
            let minTimeDiff = Math.abs(validPoints[0].hour - hour);
            
            for (let i = 1; i < validPoints.length; i++) {
                const timeDiff = Math.abs(validPoints[i].hour - hour);
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestIndex = i;
                }
            }
            
            if (minTimeDiff <= 1) { // Only show if within 1 hour
                const x = margin.left + (closestIndex / (validPoints.length - 1)) * chartWidth;
                
                // Draw tick mark
                ctx.beginPath();
                ctx.moveTo(x, margin.top + chartHeight);
                ctx.lineTo(x, margin.top + chartHeight + 5);
                ctx.stroke();
                
                // Draw time label
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                ctx.fillText(timeStr, x, margin.top + chartHeight + 18);
            }
        }
        
        // Add labels
        ctx.font = '12px Arial';
        
        // X-axis label
        ctx.fillText(this.currentLanguage === 'he' ? 'זמן' : 'Time', width / 2, height - 10);
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(this.currentLanguage === 'he' ? 'כיוון (מעלות)' : 'Direction (degrees)', 0, 0);
        ctx.restore();
        
        // Add direction scale
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = margin.top + chartHeight - (i / 4) * chartHeight;
            const direction = (minAzimuth + (maxAzimuth - minAzimuth) * i / 4).toFixed(0);
            ctx.fillText(`${direction}°`, margin.left - 5, y + 4);
        }
    }

    drawElevationTimeChart(sunPath) {
        const canvas = this.elevationTimeChart;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Chart settings
        const margin = { top: 30, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Filter valid sun path points
        const validPoints = sunPath.filter(point => point.elevation > 0);
        if (validPoints.length === 0) return;
        
        // Find max elevation for scaling
        const maxElevation = Math.max(...validPoints.map(p => p.elevation));
        
        // Draw axes
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw terrain elevation line first (behind sun elevation)
        if (this.elevationProfile && this.elevationProfile.length > 0) {
            ctx.strokeStyle = '#636e72';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed line for terrain
            ctx.beginPath();
            
            validPoints.forEach((point, index) => {
                const x = margin.left + (index / (validPoints.length - 1)) * chartWidth;
                const terrainElevation = point.requiredElevation || 0;
                const y = margin.top + chartHeight - (terrainElevation / maxElevation) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            ctx.setLineDash([]); // Reset line dash
        }
        
        // Draw sun elevation line
        ctx.strokeStyle = '#00b894';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        validPoints.forEach((point, index) => {
            const x = margin.left + (index / (validPoints.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - (point.elevation / maxElevation) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Highlight points in range (sun above terrain)
            if (point.inRange) {
                ctx.fillStyle = '#e17055';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        
        ctx.stroke();
        
        // Add time axis values
        ctx.fillStyle = '#2d3436';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // Draw time markers every 2 hours
        for (let hour = 6; hour <= 18; hour += 2) {
            // Find the closest point to this hour
            let closestIndex = 0;
            let minTimeDiff = Math.abs(validPoints[0].hour - hour);
            
            for (let i = 1; i < validPoints.length; i++) {
                const timeDiff = Math.abs(validPoints[i].hour - hour);
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestIndex = i;
                }
            }
            
            if (minTimeDiff <= 1) { // Only show if within 1 hour
                const x = margin.left + (closestIndex / (validPoints.length - 1)) * chartWidth;
                
                // Draw tick mark
                ctx.beginPath();
                ctx.moveTo(x, margin.top + chartHeight);
                ctx.lineTo(x, margin.top + chartHeight + 5);
                ctx.stroke();
                
                // Draw time label
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                ctx.fillText(timeStr, x, margin.top + chartHeight + 18);
            }
        }
        
        // Add labels
        ctx.font = '12px Arial';
        
        // X-axis label
        ctx.fillText(this.currentLanguage === 'he' ? 'זמן' : 'Time', width / 2, height - 10);
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(this.currentLanguage === 'he' ? 'גובה (מעלות)' : 'Elevation (degrees)', 0, 0);
        ctx.restore();
        
        // Add elevation scale
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = margin.top + chartHeight - (i / 4) * chartHeight;
            const elevation = (maxElevation * i / 4).toFixed(0);
            ctx.fillText(`${elevation}°`, margin.left - 5, y + 4);
        }
        
        // Add legend
        ctx.textAlign = 'left';
        ctx.font = '10px Arial';
        const legendY = margin.top + 10;
        
        // Sun elevation line
        ctx.strokeStyle = '#00b894';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width - 150, legendY);
        ctx.lineTo(width - 130, legendY);
        ctx.stroke();
        ctx.fillText(this.currentLanguage === 'he' ? 'גובה השמש' : 'Sun Elevation', width - 125, legendY + 4);
        
        // Terrain elevation line (if profile exists)
        if (this.elevationProfile && this.elevationProfile.length > 0) {
            ctx.strokeStyle = '#636e72';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(width - 150, legendY + 15);
            ctx.lineTo(width - 130, legendY + 15);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillText(this.currentLanguage === 'he' ? 'גובה השטח' : 'Terrain Elevation', width - 125, legendY + 19);
        }
    }

    drawIrradianceTimeChart(sunPath) {
        const canvas = this.irradianceTimeChart;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Chart settings
        const margin = { top: 30, right: 30, bottom: 50, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Filter valid sun path points
        const validPoints = sunPath.filter(point => point.elevation > 0);
        if (validPoints.length === 0) return;
        
        // Find max irradiance for scaling
        const maxIrradiance = Math.max(...validPoints.map(p => p.irradiance || 0));
        if (maxIrradiance === 0) return;
        
        // Draw axes
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw irradiance line
        ctx.strokeStyle = '#fdcb6e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        validPoints.forEach((point, index) => {
            const x = margin.left + (index / (validPoints.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - ((point.irradiance || 0) / maxIrradiance) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Highlight points in range
            if (point.inRange) {
                ctx.fillStyle = '#e17055';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        
        ctx.stroke();
        
        // Add time axis values
        ctx.fillStyle = '#2d3436';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // Draw time markers every 2 hours
        for (let hour = 6; hour <= 18; hour += 2) {
            // Find the closest point to this hour
            let closestIndex = 0;
            let minTimeDiff = Math.abs(validPoints[0].hour - hour);
            
            for (let i = 1; i < validPoints.length; i++) {
                const timeDiff = Math.abs(validPoints[i].hour - hour);
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestIndex = i;
                }
            }
            
            if (minTimeDiff <= 1) { // Only show if within 1 hour
                const x = margin.left + (closestIndex / (validPoints.length - 1)) * chartWidth;
                
                // Draw tick mark
                ctx.beginPath();
                ctx.moveTo(x, margin.top + chartHeight);
                ctx.lineTo(x, margin.top + chartHeight + 5);
                ctx.stroke();
                
                // Draw time label
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                ctx.fillText(timeStr, x, margin.top + chartHeight + 18);
            }
        }
        
        // Add labels
        ctx.font = '12px Arial';
        
        // X-axis label
        ctx.fillText(this.currentLanguage === 'he' ? 'זמן' : 'Time', width / 2, height - 10);
        
        // Y-axis label
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(this.currentLanguage === 'he' ? 'קרינה (W/m²)' : 'Irradiance (W/m²)', 0, 0);
        ctx.restore();
        
        // Add irradiance scale
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = margin.top + chartHeight - (i / 4) * chartHeight;
            const irradiance = (maxIrradiance * i / 4).toFixed(0);
            ctx.fillText(`${irradiance}`, margin.left - 5, y + 4);
        }
    }

    calculateAndDisplayYearlyData(latitude, longitude, directionStart, directionEnd, minElevation) {
        const yearlyData = this.calculator.calculateYearlyData(latitude, longitude, directionStart, directionEnd, minElevation, this.elevationProfile);
        this.displayYearlyChart(yearlyData);
        this.displayYearlyIrradianceChart(yearlyData);
    }

    addElevationPoint() {
        const direction = 0;
        const elevation = 0;
        
        const point = { direction, elevation };
        this.elevationProfile.push(point);
        this.renderElevationProfileTable();
    }

    clearElevationProfile() {
        this.elevationProfile = [];
        this.renderElevationProfileTable();
    }

    removeElevationPoint(index) {
        this.elevationProfile.splice(index, 1);
        this.renderElevationProfileTable();
    }

    updateElevationPoint(index, field, value) {
        if (this.elevationProfile[index]) {
            this.elevationProfile[index][field] = parseFloat(value) || 0;
        }
    }

    renderElevationProfileTable() {
        const tbody = this.elevationProfileTbody;
        tbody.innerHTML = '';

        this.elevationProfile.forEach((point, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="number"
                           value="${point.direction}"
                           min="0"
                           max="360"
                           step="1"
                           onchange="app.updateElevationPoint(${index}, 'direction', this.value)">
                </td>
                <td>
                    <input type="number"
                           value="${point.elevation}"
                           min="0"
                           max="90"
                           step="0.1"
                           onchange="app.updateElevationPoint(${index}, 'elevation', this.value)">
                </td>
                <td>
                    <button type="button"
                            class="remove-btn"
                            onclick="app.removeElevationPoint(${index})"
                            data-en="Remove"
                            data-he="הסר">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update button text based on current language
        this.updateElevationTableLanguage();
    }

    updateElevationTableLanguage() {
        const removeButtons = this.elevationProfileTbody.querySelectorAll('.remove-btn');
        removeButtons.forEach(button => {
            const text = button.getAttribute(`data-${this.currentLanguage}`);
            if (text) {
                button.textContent = text;
            }
        });
    }

    displayYearlyChart(yearlyData) {
        this.yearlyChart.style.display = 'block';
        const canvas = this.yearlyChartCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Chart settings
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Find max sun hours for scaling
        const maxHours = Math.max(...yearlyData.map(d => d.sunHours));
        
        // Draw axes
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw data line
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        yearlyData.forEach((point, index) => {
            const x = margin.left + (index / (yearlyData.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - (point.sunHours / maxHours) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#2d3436';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X-axis labels (months)
        const months = this.currentLanguage === 'he' ? 
            ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'] :
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 0; i < 12; i++) {
            const x = margin.left + (i / 11) * chartWidth;
            ctx.fillText(months[i], x, margin.top + chartHeight + 20);
        }
        
        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + chartHeight - (i / 5) * chartHeight;
            const hours = (maxHours * i / 5).toFixed(1);
            ctx.fillText(`${hours}h`, margin.left - 10, y + 4);
        }
        
        // Chart title
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        const title = this.currentLanguage === 'he' ? 'שעות שמש לאורך השנה' : 'Sun Hours Throughout the Year';
        ctx.fillText(title, width / 2, 25);
    }

    displayYearlyIrradianceChart(yearlyData) {
        this.yearlyIrradianceChart.style.display = 'block';
        const canvas = this.yearlyIrradianceCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Chart settings
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Find max daily irradiance for scaling
        const maxIrradiance = Math.max(...yearlyData.map(d => d.dailyIrradiance || 0));
        if (maxIrradiance === 0) return;
        
        // Draw axes
        ctx.strokeStyle = '#636e72';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        
        // Draw data line
        ctx.strokeStyle = '#fdcb6e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        yearlyData.forEach((point, index) => {
            const x = margin.left + (index / (yearlyData.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - ((point.dailyIrradiance || 0) / maxIrradiance) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#2d3436';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X-axis labels (months)
        const months = this.currentLanguage === 'he' ?
            ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'] :
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        for (let i = 0; i < 12; i++) {
            const x = margin.left + (i / 11) * chartWidth;
            ctx.fillText(months[i], x, margin.top + chartHeight + 20);
        }
        
        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + chartHeight - (i / 5) * chartHeight;
            const irradiance = (maxIrradiance * i / 5).toFixed(2);
            ctx.fillText(`${irradiance}`, margin.left - 10, y + 4);
        }
        
        // Y-axis unit label
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(this.currentLanguage === 'he' ? 'קרינה יומית (kWh/m²)' : 'Daily Irradiance (kWh/m²)', 0, 0);
        ctx.restore();
        
        // Chart title
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        const title = this.currentLanguage === 'he' ? 'קרינת שמש יומית לאורך השנה' : 'Daily Solar Irradiance Throughout the Year';
        ctx.fillText(title, width / 2, 25);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Style the notification
        const isRTL = this.currentLanguage === 'he';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            ${isRTL ? 'left: 20px;' : 'right: 20px;'}
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            transform: translateX(${isRTL ? '-100%' : '100%'});
            transition: transform 0.3s ease;
            ${type === 'error' ? 'background: #e74c3c;' : 'background: #00b894;'}
        `;

        // Add to document
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = `translateX(${isRTL ? '-100%' : '100%'})`;
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Camera Measurement Methods
    async openCameraMeasurement() {
        try {
            // Request camera permission
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use rear camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            this.cameraVideo.srcObject = this.cameraStream;
            this.cameraMeasurement.style.display = 'flex';
            
            // Initialize orientation sensors
            this.initializeOrientationSensors();
            
            // Reset measurement data
            this.measurementPoints = [];
            this.updatePointsCounter();
            
            // Start orientation updates
            this.startOrientationUpdates();
            
        } catch (error) {
            console.error('Camera access error:', error);
            const errorMsg = this.currentLanguage === 'he' ?
                'לא ניתן לגשת למצלמה. אנא בדוק הרשאות.' :
                'Cannot access camera. Please check permissions.';
            this.showError(errorMsg);
        }
    }

    closeCameraMeasurement() {
        // Stop camera stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        // Stop orientation updates
        this.stopOrientationUpdates();
        
        // Hide camera interface
        this.cameraMeasurement.style.display = 'none';
    }

    initializeOrientationSensors() {
        // Check if DeviceOrientationEvent is supported
        if (typeof DeviceOrientationEvent !== 'undefined') {
            // Request permission for iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            this.isOrientationSupported = true;
                        } else {
                            this.showOrientationPermissionError();
                        }
                    })
                    .catch(error => {
                        console.error('Orientation permission error:', error);
                        this.showOrientationPermissionError();
                    });
            } else {
                // Non-iOS devices
                this.isOrientationSupported = true;
            }
        } else {
            this.showOrientationNotSupported();
        }
    }

    startOrientationUpdates() {
        if (!this.isOrientationSupported) return;
        
        this.orientationHandler = (event) => {
            // Get compass direction (alpha)
            let direction = event.alpha;
            if (direction !== null) {
                // Normalize to 0-360
                direction = (360 - direction) % 360;
                this.orientationData.direction = direction;
            }
            
            // Get pitch/elevation (beta)
            let elevation = event.beta;
            if (elevation !== null) {
                // Convert to elevation angle (0° = horizon, 90° = straight up)
                elevation = 90 - Math.abs(elevation);
                this.orientationData.elevation = Math.max(-90, Math.min(90, elevation));
            }
            
            this.updateOrientationDisplay();
        };
        
        window.addEventListener('deviceorientation', this.orientationHandler);
    }

    stopOrientationUpdates() {
        if (this.orientationHandler) {
            window.removeEventListener('deviceorientation', this.orientationHandler);
            this.orientationHandler = null;
        }
    }

    updateOrientationDisplay() {
        const direction = this.orientationData.direction;
        const elevation = this.orientationData.elevation;
        
        if (direction !== null) {
            this.currentDirectionDisplay.textContent = `${Math.round(direction)}°`;
            this.currentDirectionDisplay.style.color = '#00b894';
        } else {
            this.currentDirectionDisplay.textContent = '--°';
            this.currentDirectionDisplay.style.color = '#e17055';
        }
        
        if (elevation !== null) {
            this.currentElevationDisplay.textContent = `${Math.round(elevation)}°`;
            this.currentElevationDisplay.style.color = '#00b894';
        } else {
            this.currentElevationDisplay.textContent = '--°';
            this.currentElevationDisplay.style.color = '#e17055';
        }
    }

    addMeasurementPoint() {
        const direction = this.orientationData.direction;
        const elevation = this.orientationData.elevation;
        
        if (direction === null || elevation === null) {
            const errorMsg = this.currentLanguage === 'he' ?
                'לא ניתן לקרוא נתוני כיוון. אנא בדוק כיול המצפן.' :
                'Cannot read orientation data. Please check compass calibration.';
            this.showError(errorMsg);
            return;
        }
        
        const point = {
            direction: Math.round(direction),
            elevation: Math.round(elevation)
        };
        
        this.measurementPoints.push(point);
        this.updatePointsCounter();
        this.showMeasurementFeedback();
        
        const successMsg = this.currentLanguage === 'he' ?
            `נקודה נוספה: ${point.direction}°, ${point.elevation}°` :
            `Point added: ${point.direction}°, ${point.elevation}°`;
        this.showSuccess(successMsg);
    }

    removeLastMeasurementPoint() {
        if (this.measurementPoints.length === 0) {
            const errorMsg = this.currentLanguage === 'he' ?
                'אין נקודות להסרה.' : 'No points to remove.';
            this.showError(errorMsg);
            return;
        }
        
        const removedPoint = this.measurementPoints.pop();
        this.updatePointsCounter();
        
        const successMsg = this.currentLanguage === 'he' ?
            `נקודה הוסרה: ${removedPoint.direction}°, ${removedPoint.elevation}°` :
            `Point removed: ${removedPoint.direction}°, ${removedPoint.elevation}°`;
        this.showSuccess(successMsg);
    }

    finishMeasurement() {
        if (this.measurementPoints.length === 0) {
            const errorMsg = this.currentLanguage === 'he' ?
                'לא נמדדו נקודות.' : 'No points measured.';
            this.showError(errorMsg);
            return;
        }
        
        this.measurementPoints.forEach(point => {
            this.elevationProfile.push({
                direction: point.direction,
                elevation: point.elevation
            });
        });
        
        this.renderElevationProfileTable();
        this.closeCameraMeasurement();
        
        const successMsg = this.currentLanguage === 'he' ?
            `${this.measurementPoints.length} נקודות נוספו לפרופיל הגובה.` :
            `${this.measurementPoints.length} points added to elevation profile.`;
        this.showSuccess(successMsg);
    }

    updatePointsCounter() {
        this.pointsCountDisplay.textContent = this.measurementPoints.length;
    }

    showMeasurementFeedback() {
        this.addMeasurementPointBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.addMeasurementPointBtn.style.transform = 'scale(1)';
        }, 150);
        
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    showCameraHelp() {
        const helpMsg = this.currentLanguage === 'he' ?
            'הנח את המכשיר כך שהצלב יהיה מכוון לנקודה שברצונך למדוד. הכיוון והגובה יוצגו בזמן אמת. לחץ "הוסף נקודה" כדי לשמור את המדידה.' :
            'Point the device so the crosshair is aimed at the point you want to measure. Direction and elevation will be displayed in real-time. Press "Add Point" to save the measurement.';
        alert(helpMsg);
    }

    showOrientationPermissionError() {
        const errorMsg = this.currentLanguage === 'he' ?
            'נדרשת הרשאה לחיישני כיוון. אנא אפשר גישה בהגדרות הדפדפן.' :
            'Orientation sensor permission required. Please enable access in browser settings.';
        this.showError(errorMsg);
    }

    showOrientationNotSupported() {
        const errorMsg = this.currentLanguage === 'he' ?
            'חיישני כיוון לא נתמכים במכשיר זה.' :
            'Orientation sensors not supported on this device.';
        this.showError(errorMsg);
    }
}

// Global app variable for table callbacks
let app;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new SunHoursApp();
});