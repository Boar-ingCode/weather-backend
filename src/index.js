const express = require('express');
const axios = require('axios');
const solarService = require('./services/solarService');

const app = express();
const PORT = 3000;

app.get('/weather/forecast', async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required parameters: latitude and longitude'
            });
        }

        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude,
                longitude,
                daily: [
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'weathercode',
                    'sunshine_duration'
                ],
                timezone: 'auto'
            }
        });

        const forecast = response.data.daily.time.map((date, index) => {
            const sunshineDuration = response.data.daily.sunshine_duration[index];
            const generatedEnergy = solarService.calculateEnergyProduction(sunshineDuration);

            return {
                date,
                weather_code: response.data.daily.weathercode[index],
                temp_min: response.data.daily.temperature_2m_min[index],
                temp_max: response.data.daily.temperature_2m_max[index],
                sunshine_duration: sunshineDuration,
                generated_energy: generatedEnergy
            };
        });

        res.json(forecast);

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch weather data',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
