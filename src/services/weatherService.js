const axios = require('axios');

class WeatherService {
  constructor() {
    this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
  }

  async getWeatherForecast(latitude, longitude) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          latitude,
          longitude,
          daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'weathercode',
            'sunshine_duration',
            'pressure_msl'
          ],
          timezone: 'auto'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  isRainyWeather(weatherCode) {
    const rainyCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
    return rainyCodes.includes(weatherCode);
  }
}

module.exports = new WeatherService();
