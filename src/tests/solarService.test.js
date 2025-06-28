const solarService = require('../services/solarService');

describe('SolarService', () => {
    test('should calculate energy production correctly', () => {
        expect(solarService.calculateEnergyProduction(3600)).toBe(0.50);
        
        expect(solarService.calculateEnergyProduction(7200)).toBe(1.00);
        
        expect(solarService.calculateEnergyProduction(0)).toBe(0.00);
    });
});
