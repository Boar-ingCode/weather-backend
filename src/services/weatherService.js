const axios = require('axios');

class WeatherService {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
        this.precipitationCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]);
    }

    async getWeatherData(latitude, longitude) {
        try {
            console.log('Requesting weather data for:', { latitude, longitude });
            
            const response = await axios.get(this.baseUrl, {
                params: {
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    timezone: 'auto',
                    daily: [
                        'temperature_2m_max',
                        'temperature_2m_min',
                        'weathercode',
                        'sunshine_duration'
                    ].join(','),
                    hourly: 'surface_pressure' 
                }
            });

            console.log('API Response status:', response.status);
            return response.data;
        } catch (error) {
            console.error('API Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error(`Failed to fetch weather data: ${error.message}`);
        }
    }

    getCurrentHourPressure(weatherData) {
        try {
            if (!weatherData?.hourly?.surface_pressure || !weatherData?.hourly?.time) {
                throw new Error('Invalid weather data structure');
            }

            const now = new Date();
            const currentTimeString = now.toISOString().split('.')[0];

            const hourIndex = weatherData.hourly.time.findIndex(time => 
                time >= currentTimeString
            );

            const pressureIndex = hourIndex !== -1 ? hourIndex : 0;
            return Number(weatherData.hourly.surface_pressure[pressureIndex].toFixed(2));
        } catch (error) {
            console.error('Error getting current pressure:', error);
            return null;
        }
    }

    isRainyDay(weatherCode) {
        return this.precipitationCodes.has(weatherCode);
    }

    analyzeWeatherPattern(weatherCodes) {
        if (!Array.isArray(weatherCodes) || weatherCodes.length === 0) {
            throw new Error('Invalid weather codes data');
        }

        const rainyDays = weatherCodes.filter(code => this.isRainyDay(code)).length;
        const totalDays = weatherCodes.length;
        const rainyDaysPercentage = (rainyDays / totalDays) * 100;

        console.log(`Dni z opadami: ${rainyDays} z ${totalDays} (${rainyDaysPercentage.toFixed(1)}%)`);

        return {
            type: rainyDays >= 4 ? 'z opadami' : 'bez opadów',
            rainyDays,
            totalDays
        };
    }

    calculateWeeklySummary(weatherData) {
        try {
            if (!weatherData?.daily) {
                throw new Error('Invalid weather data structure');
            }

            const daily = weatherData.daily;
            
            const avgSunshineHours = daily.sunshine_duration.reduce((sum, duration) => 
                sum + duration, 0) / (daily.sunshine_duration.length * 3600);
            
            const currentPressure = this.getCurrentHourPressure(weatherData);
            const minTemperature = Math.min(...daily.temperature_2m_min);
            const maxTemperature = Math.max(...daily.temperature_2m_max);
            
            const weatherPattern = this.analyzeWeatherPattern(daily.weathercode);

            return {
                current_pressure: currentPressure,
                avg_sunshine_hours: Number(avgSunshineHours.toFixed(2)),
                min_temperature: Number(minTemperature.toFixed(2)),
                max_temperature: Number(maxTemperature.toFixed(2)),
                weather_type: weatherPattern.type,
                weather_details: {
                    rainy_days: weatherPattern.rainyDays,
                    total_days: weatherPattern.totalDays,
                    percentage_rainy: Number(((weatherPattern.rainyDays / weatherPattern.totalDays) * 100).toFixed(1))
                }
            };
        } catch (error) {
            console.error('Error calculating summary:', error);
            throw new Error('Failed to calculate weather summary');
        }
    }
}

module.exports = new WeatherService();
