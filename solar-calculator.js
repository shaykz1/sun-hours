/**
 * Solar Position Calculator
 * Based on NREL's Solar Position Algorithm (SPA)
 * Calculates sun position and direct sun hours for given location, direction range, and date
 */

class SolarCalculator {
    constructor() {
        this.EARTH_RADIUS = 6371; // km
        this.SOLAR_CONSTANT = 1367; // W/m²
    }

    /**
     * Get timezone offset for a given longitude
     */
    getTimezoneOffset(longitude) {
        // Approximate timezone from longitude (15 degrees per hour)
        return Math.round(longitude / 15);
    }

    /**
     * Convert UTC time to local time based on timezone offset
     */
    utcToLocal(utcMinutes, timezoneOffset) {
        return utcMinutes + (timezoneOffset * 60);
    }

    /**
     * Calculate Julian Day Number
     */
    getJulianDay(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        let a = Math.floor((14 - month) / 12);
        let y = year - a;
        let m = month + 12 * a - 3;
        
        return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
    }

    /**
     * Calculate solar declination angle
     */
    getSolarDeclination(dayOfYear) {
        // More accurate solar declination calculation
        // Using the formula: δ = 23.45° × sin(360° × (284 + n) / 365.25)
        // where n is the day of year
        return 23.45 * Math.sin(this.toRadians(360 * (284 + dayOfYear) / 365.25));
    }

    /**
     * Calculate equation of time
     */
    getEquationOfTime(dayOfYear) {
        // More accurate equation of time calculation
        const B = this.toRadians(360 * (dayOfYear - 81) / 365.25);
        return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    }

    /**
     * Calculate solar hour angle
     */
    getSolarHourAngle(localTime, longitude, equationOfTime) {
        const solarTime = localTime + (4 * longitude) + equationOfTime;
        return 15 * (solarTime / 60 - 12);
    }

    /**
     * Calculate solar elevation angle
     */
    getSolarElevation(latitude, declination, hourAngle) {
        const latRad = this.toRadians(latitude);
        const decRad = this.toRadians(declination);
        const hourRad = this.toRadians(hourAngle);
        
        return this.toDegrees(Math.asin(
            Math.sin(latRad) * Math.sin(decRad) + 
            Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad)
        ));
    }

    /**
     * Calculate solar azimuth angle
     */
    getSolarAzimuth(latitude, declination, hourAngle, elevation) {
        const latRad = this.toRadians(latitude);
        const decRad = this.toRadians(declination);
        const hourRad = this.toRadians(hourAngle);
        const elevRad = this.toRadians(elevation);
        
        let azimuth = this.toDegrees(Math.atan2(
            Math.sin(hourRad),
            Math.cos(hourRad) * Math.sin(latRad) - Math.tan(decRad) * Math.cos(latRad)
        ));
        
        // Convert to 0-360 range
        azimuth = (azimuth + 180) % 360;
        return azimuth;
    }

    /**
     * Calculate solar irradiance (flux) based on elevation angle
     * Uses simplified atmospheric model
     */
    getSolarIrradiance(elevation, dayOfYear) {
        if (elevation <= 0) return 0;
        
        // Solar constant adjusted for Earth-Sun distance variation
        const earthSunDistance = 1 + 0.033 * Math.cos(this.toRadians(360 * dayOfYear / 365.25));
        const solarConstant = this.SOLAR_CONSTANT * earthSunDistance;
        
        // Air mass calculation (simplified Kasten-Young formula)
        const elevationRad = this.toRadians(elevation);
        const airMass = 1 / (Math.sin(elevationRad) + 0.50572 * Math.pow(elevation + 6.07995, -1.6364));
        
        // Atmospheric transmission (simplified clear sky model)
        // Assumes clear sky conditions with typical atmospheric absorption
        const transmission = Math.pow(0.7, Math.pow(airMass, 0.678));
        
        // Direct normal irradiance
        const directNormalIrradiance = solarConstant * transmission;
        
        // Direct horizontal irradiance
        const directHorizontalIrradiance = directNormalIrradiance * Math.sin(elevationRad);
        
        return Math.max(0, directHorizontalIrradiance);
    }

    /**
     * Calculate sunrise and sunset times
     */
    getSunriseSunset(latitude, longitude, date) {
        const dayOfYear = this.getDayOfYear(date);
        const declination = this.getSolarDeclination(dayOfYear);
        const equationOfTime = this.getEquationOfTime(dayOfYear);
        
        const latRad = this.toRadians(latitude);
        const decRad = this.toRadians(declination);
        
        // Hour angle at sunrise/sunset (when elevation = 0)
        const hourAngle = this.toDegrees(Math.acos(-Math.tan(latRad) * Math.tan(decRad)));
        
        // Solar time in minutes from solar noon (UTC)
        const sunriseMinutesUTC = 720 - 4 * longitude - equationOfTime - 4 * hourAngle;
        const sunsetMinutesUTC = 720 - 4 * longitude - equationOfTime + 4 * hourAngle;
        
        // Convert to local time
        const timezoneOffset = this.getTimezoneOffset(longitude);
        const sunriseMinutes = this.utcToLocal(sunriseMinutesUTC, timezoneOffset);
        const sunsetMinutes = this.utcToLocal(sunsetMinutesUTC, timezoneOffset);
        
        return {
            sunrise: this.minutesToTime(sunriseMinutes),
            sunset: this.minutesToTime(sunsetMinutes),
            sunriseMinutes: sunriseMinutes,
            sunsetMinutes: sunsetMinutes,
            timezoneOffset: timezoneOffset
        };
    }

    /**
     * Calculate direct sun hours for given direction range
     */
    calculateDirectSunHours(latitude, longitude, date, directionStart, directionEnd, minElevation = 0, elevationProfile = null) {
        const dayOfYear = this.getDayOfYear(date);
        const declination = this.getSolarDeclination(dayOfYear);
        const equationOfTime = this.getEquationOfTime(dayOfYear);
        
        const sunTimes = this.getSunriseSunset(latitude, longitude, date);
        
        let totalMinutes = 0;
        const sunPath = [];
        const timeInRange = [];
        const samplingData = [];
        
        // Check every minute from sunrise to sunset
        for (let minutes = sunTimes.sunriseMinutes; minutes <= sunTimes.sunsetMinutes; minutes += 1) {
            const hourAngle = this.getSolarHourAngle(minutes - sunTimes.timezoneOffset * 60, longitude, equationOfTime);
            const elevation = this.getSolarElevation(latitude, declination, hourAngle);
            
            if (elevation > minElevation) { // Sun is above minimum elevation
                const azimuth = this.getSolarAzimuth(latitude, declination, hourAngle, elevation);
                
                // Calculate solar irradiance
                const irradiance = this.getSolarIrradiance(elevation, dayOfYear);
                
                // Get the required elevation for this direction from the elevation profile
                const requiredElevation = this.getInterpolatedElevation(azimuth, elevationProfile) || minElevation;
                
                // Check if azimuth is within the specified range AND sun is above required elevation
                const inRange = this.isAzimuthInRange(azimuth, directionStart, directionEnd) && elevation >= requiredElevation;
                if (inRange) {
                    totalMinutes++;
                    timeInRange.push({
                        time: this.minutesToTime(minutes),
                        azimuth: azimuth,
                        elevation: elevation,
                        requiredElevation: requiredElevation,
                        irradiance: irradiance
                    });
                }
                
                sunPath.push({
                    time: minutes,
                    hour: minutes / 60, // Add hour property for chart drawing
                    azimuth: azimuth,
                    elevation: elevation,
                    requiredElevation: requiredElevation,
                    irradiance: irradiance,
                    inRange: inRange
                });
            }
        }
        
        return {
            directSunHours: totalMinutes / 60,
            totalMinutes: totalMinutes,
            sunrise: sunTimes.sunrise,
            sunset: sunTimes.sunset,
            timeInRange: timeInRange,
            sunPath: sunPath,
            samplingData: samplingData,
            timezoneOffset: sunTimes.timezoneOffset
        };
    }

    /**
     * Calculate sun hours for entire year (daily values)
     */
    calculateYearlyData(latitude, longitude, directionStart, directionEnd, minElevation = 0, elevationProfile = null) {
        const yearlyData = [];
        const currentYear = new Date().getFullYear();
        
        // Calculate for every 5 days to reduce computation while maintaining accuracy
        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day += 5) {
                const date = new Date(currentYear, month, day);
                const result = this.calculateDirectSunHours(latitude, longitude, date, directionStart, directionEnd, minElevation, elevationProfile);
                
                // Calculate total daily solar irradiance (kWh/m²)
                let totalDailyIrradiance = 0;
                for (const period of result.timeInRange) {
                    // Each period represents 1 minute, convert irradiance from W/m² to kWh/m²
                    const energyPerMinute = (period.irradiance || 0) * (1/60) / 1000;
                    totalDailyIrradiance += energyPerMinute;
                }
                
                yearlyData.push({
                    dayOfYear: this.getDayOfYear(date),
                    date: date.toISOString().split('T')[0],
                    sunHours: result.directSunHours,
                    dailyIrradiance: totalDailyIrradiance,
                    sunrise: result.sunrise,
                    sunset: result.sunset,
                    month: month + 1,
                    day: day
                });
            }
        }
        
        return yearlyData;
    }

    /**
     * Get interpolated elevation for a given azimuth from elevation profile
     */
    getInterpolatedElevation(azimuth, elevationProfile) {
        if (!elevationProfile || elevationProfile.length === 0) {
            return null;
        }
        
        // Normalize azimuth to 0-360
        azimuth = ((azimuth % 360) + 360) % 360;
        
        // Sort elevation profile by direction
        const sortedProfile = [...elevationProfile].sort((a, b) => a.direction - b.direction);
        
        // Find the two closest points for interpolation
        let beforePoint = null;
        let afterPoint = null;
        
        for (let i = 0; i < sortedProfile.length; i++) {
            const point = sortedProfile[i];
            const pointDir = ((point.direction % 360) + 360) % 360;
            
            if (pointDir <= azimuth) {
                beforePoint = { ...point, direction: pointDir };
            }
            if (pointDir >= azimuth && !afterPoint) {
                afterPoint = { ...point, direction: pointDir };
                break;
            }
        }
        
        // Handle wrap-around case (e.g., azimuth = 10°, points at 350° and 30°)
        if (!beforePoint && sortedProfile.length > 0) {
            beforePoint = { ...sortedProfile[sortedProfile.length - 1], direction: sortedProfile[sortedProfile.length - 1].direction - 360 };
        }
        if (!afterPoint && sortedProfile.length > 0) {
            afterPoint = { ...sortedProfile[0], direction: sortedProfile[0].direction + 360 };
        }
        
        // If we have exact match, return it
        if (beforePoint && Math.abs(beforePoint.direction - azimuth) < 0.1) {
            return beforePoint.elevation;
        }
        if (afterPoint && Math.abs(afterPoint.direction - azimuth) < 0.1) {
            return afterPoint.elevation;
        }
        
        // If we only have one point or points are the same, return that elevation
        if (!beforePoint && afterPoint) return afterPoint.elevation;
        if (!afterPoint && beforePoint) return beforePoint.elevation;
        if (!beforePoint && !afterPoint) return null;
        
        // Linear interpolation between the two points
        const directionDiff = afterPoint.direction - beforePoint.direction;
        const elevationDiff = afterPoint.elevation - beforePoint.elevation;
        const ratio = (azimuth - beforePoint.direction) / directionDiff;
        
        return beforePoint.elevation + (ratio * elevationDiff);
    }

    /**
     * Check if azimuth is within the specified range
     */
    isAzimuthInRange(azimuth, start, end) {
        // Normalize angles to 0-360
        azimuth = ((azimuth % 360) + 360) % 360;
        start = ((start % 360) + 360) % 360;
        end = ((end % 360) + 360) % 360;
        
        if (start <= end) {
            return azimuth >= start && azimuth <= end;
        } else {
            // Range crosses 0° (e.g., 350° to 10°)
            return azimuth >= start || azimuth <= end;
        }
    }

    /**
     * Get day of year (1-365/366)
     */
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * Convert minutes since midnight to HH:MM format
     */
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Convert radians to degrees
     */
    toDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    /**
     * Format time range for display
     */
    formatTimeRange(timeInRange) {
        if (timeInRange.length === 0) {
            return "No direct sun in specified direction";
        }
        
        const firstTime = timeInRange[0].time;
        const lastTime = timeInRange[timeInRange.length - 1].time;
        
        if (firstTime === lastTime) {
            return `Around ${firstTime}`;
        }
        
        return `${firstTime} - ${lastTime}`;
    }

    /**
     * Draw sun path visualization
     */
    drawSunPath(canvas, sunPath, directionStart, directionEnd) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw compass circle
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw compass directions
        ctx.fillStyle = '#636e72';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('N', centerX, centerY - radius + 15);
        ctx.fillText('S', centerX, centerY + radius - 5);
        ctx.textAlign = 'left';
        ctx.fillText('E', centerX + radius - 10, centerY + 5);
        ctx.textAlign = 'right';
        ctx.fillText('W', centerX - radius + 10, centerY + 5);
        
        // Draw direction range arc
        if (directionStart !== null && directionEnd !== null) {
            ctx.strokeStyle = 'rgba(116, 185, 255, 0.5)';
            ctx.fillStyle = 'rgba(116, 185, 255, 0.2)';
            ctx.lineWidth = 3;
            
            const startAngle = this.toRadians(directionStart - 90); // Adjust for canvas coordinate system
            const endAngle = this.toRadians(directionEnd - 90);
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Draw sun path
        if (sunPath && sunPath.length > 0) {
            ctx.strokeStyle = '#fdcb6e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            let firstPoint = true;
            for (const point of sunPath) {
                if (point.elevation > 0) {
                    // Convert azimuth and elevation to canvas coordinates
                    const angle = this.toRadians(point.azimuth - 90);
                    const distance = radius * (1 - point.elevation / 90); // Scale by elevation
                    const x = centerX + distance * Math.cos(angle);
                    const y = centerY + distance * Math.sin(angle);
                    
                    if (firstPoint) {
                        ctx.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(x, y);
                    }
                    
                    // Draw point
                    ctx.fillStyle = point.inRange ? '#e17055' : '#fdcb6e';
                    ctx.beginPath();
                    ctx.arc(x, y, point.inRange ? 4 : 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
            ctx.stroke();
        }
        
        // Draw legend
        ctx.fillStyle = '#2d3436';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🟡 Sun path', 10, height - 30);
        ctx.fillText('🔴 Sun in range', 10, height - 15);
    }
}