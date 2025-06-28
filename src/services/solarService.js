class SolarService {
    constructor() {
        this.INSTALLATION_POWER = 2.5; // kW
        this.PANEL_EFFICIENCY = 0.2;
    }

    calculateEnergyProduction(sunshineDuration) {
        const sunshineHours = sunshineDuration / 3600;
        
        const energyKWh = this.INSTALLATION_POWER * 
                         sunshineHours * 
                         this.PANEL_EFFICIENCY;
        
        return Number(energyKWh.toFixed(2));
    }
}

module.exports = new SolarService();
