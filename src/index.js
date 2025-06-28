const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.get('/weather/forecast', async (req, res) => {
    try {
        // Pobierz parametry z query
        const { latitude, longitude } = req.query;

        // Sprawdź czy parametry zostały podane
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required parameters: latitude and longitude'
            });
        }

        // Wywołanie API Open-Meteo
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

        // Wyświetl surowe dane z API
        res.json(response.data);

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
