const express = require('express');
const WeatherService = require('./services/weatherService');
const solarService = require('./services/solarService');

const app = express();
const PORT = process.env.PORT || 3000;

const validateCoordinates = (req, res, next) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing required parameters: latitude and longitude'
        });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid latitude. Must be between -90 and 90'
        });
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid longitude. Must be between -180 and 180'
        });
    }

    req.coordinates = { latitude: lat, longitude: lon };
    next();
};

const errorHandler = (error, req, res, next) => {
    console.error('API Error:', error);
    res.status(error.status || 500).json({
        status: 'error',
        message: error.message || 'Internal server error'
    });
};

app.get('/weather/forecast', validateCoordinates, async (req, res, next) => {
    try {
        const { latitude, longitude } = req.coordinates;
        const weatherData = await WeatherService.getWeatherData(latitude, longitude);
        
        if (!weatherData?.daily) {
            throw new Error('Invalid weather data received');
        }

        const dailyForecasts = weatherData.daily.time.map((date, index) => {
            const sunshineDuration = weatherData.daily.sunshine_duration[index];
            const generatedEnergy = solarService.calculateEnergyProduction(sunshineDuration);

            return {
                date,
                weather_code: weatherData.daily.weathercode[index],
                temp_min: Number(weatherData.daily.temperature_2m_min[index].toFixed(1)),
                temp_max: Number(weatherData.daily.temperature_2m_max[index].toFixed(1)),
                sunshine_duration: Number((sunshineDuration / 3600).toFixed(2)),
                generated_energy: Number(generatedEnergy.toFixed(2))
            };
        });

        res.json({
            status: 'success',
            data: {
                location: { latitude, longitude },
                forecasts: dailyForecasts
            }
        });

    } catch (error) {
        next(error);
    }
});

app.get('/weather/summary', validateCoordinates, async (req, res, next) => {
    try {
        const { latitude, longitude } = req.coordinates;
        const weatherData = await WeatherService.getWeatherData(latitude, longitude);
        
        if (!weatherData) {
            throw new Error('Failed to fetch weather data');
        }

        const summary = WeatherService.calculateWeeklySummary(weatherData);

        res.json({
            status: 'success',
            data: {
                location: { latitude, longitude },
                summary: {
                    ...summary,
                    pressure: {
                        current: WeatherService.getCurrentHourPressure(weatherData),
                        unit: 'hPa'
                    }
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`
Server is running on port ${PORT}

Available endpoints:
- Forecast: http://localhost:${PORT}/weather/forecast?latitude=52.23&longitude=21.01
- Summary:  http://localhost:${PORT}/weather/summary?latitude=52.23&longitude=21.01
    `);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
