// ==================== ITI ADMISSION DATABASE ====================
// Version: 1.0
// Last Updated: 2024-12-06
// Created by: Anand Kathalewar
// Region: Nagpur (Nagpur, Bhandara, Chandrapur, Gadchiroli, Gondia, Wardha)
// Total ITIs: 235 | Total Seats: 26,484

const ITI_ADMISSION_DATABASE = {
    metadata: {
        version: "1.0",
        lastUpdated: "2024-12-06",
        totalRegions: 6,
        availableRegions: ["Nagpur"],
        pendingRegions: ["Amravati", "Chhatrapati Sambhajinagar", "Pune", "Nashik", "Mumbai"],
        dataSource: "Official ITI Admission Data 2024-25",
        author: "Anand Kathalewar, Govt ITI Nagpur"
    },
    
    // Region data will be loaded from external JSON file
    // This keeps the main file clean and allows easy updates
    regions: null,
    
    // Initialize function to load data
    init: async function() {
        try {
            console.log('📚 Loading ITI Admission Database...');
            
            // For now, data will be embedded here
            // In production, can load from separate JSON file
            this.regions = await this.loadRegionData();
            
            console.log('✅ Admission Database loaded successfully!');
            console.log(`📊 Available Regions: ${this.metadata.availableRegions.join(', ')}`);
            console.log(`📈 Total ITIs: ${this.getStatistics().totalITIs}`);
            console.log(`🎓 Total Seats: ${this.getStatistics().totalSeats}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to load admission database:', error);
            return false;
        }
    },
    
    // Load region data (embedded for now)
    loadRegionData: async function() {
        // This will be populated with actual data
        return window.ADMISSION_REGION_DATA || {};
    },
    
    // Get overall statistics
    getStatistics: function() {
        if (!this.regions || !this.regions.Nagpur) {
            return {
                totalITIs: 0,
                totalSeats: 0,
                availableRegions: 0
            };
        }
        
        return {
            totalITIs: this.regions.Nagpur.statistics.totalITIs,
            governmentITIs: this.regions.Nagpur.statistics.governmentITIs,
            privateITIs: this.regions.Nagpur.statistics.privateITIs,
            totalSeats: this.regions.Nagpur.statistics.totalSeats,
            governmentSeats: this.regions.Nagpur.statistics.governmentSeats,
            privateSeats: this.regions.Nagpur.statistics.privateSeats,
            totalTrades: this.regions.Nagpur.statistics.totalTrades,
            availableRegions: this.metadata.availableRegions.length,
            pendingRegions: this.metadata.pendingRegions.length
        };
    },
    
    // Check if region is available
    isRegionAvailable: function(regionName) {
        return this.metadata.availableRegions.includes(regionName);
    },
    
    // Get welcome message
    getWelcomeMessage: function() {
        const stats = this.getStatistics();
        
        return `🎓 **Welcome to ITI Admissions Assistant!**

📍 **Currently Available: Nagpur Region**
Districts: Nagpur, Bhandara, Chandrapur, Gadchiroli, Gondia, Wardha

📊 **Database Statistics:**
• Total ITIs: ${stats.totalITIs} (${stats.governmentITIs} Govt + ${stats.privateITIs} Pvt)
• Total Seats: ${stats.totalSeats.toLocaleString()} (${stats.governmentSeats.toLocaleString()} Govt + ${stats.privateSeats.toLocaleString()} Pvt)
• Available Trades: ${stats.totalTrades}+

**Ask me anything about ITI admissions:**
• "Which ITIs offer COPA in Nagpur?"
• "How many seats for Electrician trade?"
• "Show Government ITIs in Wardha district"
• "List all trades in Chandrapur"
• "Compare Government vs Private ITI seats"

🔜 **Coming Soon:** Amravati, Chhatrapati Sambhajinagar, Pune, Nashik, Mumbai regions

💡 Try asking your question now!`;
    }
};

// Make globally available
window.ITI_ADMISSION_DATABASE = ITI_ADMISSION_DATABASE;

console.log('✅ ITI Admission Database module loaded');
