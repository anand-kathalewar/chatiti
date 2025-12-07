// ==================== ITI ADMISSION QUERY ENGINE ====================
// Intelligent search and filter system for admission data
// Version: 1.0

const AdmissionQueryEngine = {
    
    // Search ITIs by trade name
    searchByTrade: function(tradeName, region = "Nagpur", type = "all") {
        const regionData = ITI_ADMISSION_DATABASE.regions[region];
        if (!regionData) return [];
        
        const tradeNameLower = tradeName.toLowerCase().trim();
        let results = [];
        
        // Search in government ITIs
        if (type === "all" || type === "government") {
            const govtResults = regionData.government.filter(iti => 
                iti["TRADE NAME"].toLowerCase().includes(tradeNameLower)
            );
            results = results.concat(govtResults);
        }
        
        // Search in private ITIs
        if (type === "all" || type === "private") {
            const pvtResults = regionData.private.filter(iti => 
                iti["TRADE NAME"].toLowerCase().includes(tradeNameLower)
            );
            results = results.concat(pvtResults);
        }
        
        return results;
    },
    
    // Search ITIs by district
    searchByDistrict: function(districtName, region = "Nagpur", type = "all") {
        const regionData = ITI_ADMISSION_DATABASE.regions[region];
        if (!regionData) return [];
        
        const districtNameLower = districtName.toLowerCase().trim();
        let results = [];
        
        if (type === "all" || type === "government") {
            const govtResults = regionData.government.filter(iti => 
                iti.District.toLowerCase() === districtNameLower
            );
            results = results.concat(govtResults);
        }
        
        if (type === "all" || type === "private") {
            const pvtResults = regionData.private.filter(iti => 
                iti.District.toLowerCase() === districtNameLower
            );
            results = results.concat(pvtResults);
        }
        
        return results;
    },
    
    // Search by ITI name
    searchByITIName: function(itiName, region = "Nagpur") {
        const regionData = ITI_ADMISSION_DATABASE.regions[region];
        if (!regionData) return [];
        
        const nameLower = itiName.toLowerCase().trim();
        let results = [];
        
        const govtResults = regionData.government.filter(iti => 
            iti["ITI Name"].toLowerCase().includes(nameLower)
        );
        const pvtResults = regionData.private.filter(iti => 
            iti["ITI Name"].toLowerCase().includes(nameLower)
        );
        
        return govtResults.concat(pvtResults);
    },
    
    // Combined search (trade + district)
    searchByTradeAndDistrict: function(tradeName, districtName, region = "Nagpur", type = "all") {
        const regionData = ITI_ADMISSION_DATABASE.regions[region];
        if (!regionData) return [];
        
        const tradeNameLower = tradeName.toLowerCase().trim();
        const districtNameLower = districtName.toLowerCase().trim();
        let results = [];
        
        if (type === "all" || type === "government") {
            const govtResults = regionData.government.filter(iti => 
                iti["TRADE NAME"].toLowerCase().includes(tradeNameLower) &&
                iti.District.toLowerCase() === districtNameLower
            );
            results = results.concat(govtResults);
        }
        
        if (type === "all" || type === "private") {
            const pvtResults = regionData.private.filter(iti => 
                iti["TRADE NAME"].toLowerCase().includes(tradeNameLower) &&
                iti.District.toLowerCase() === districtNameLower
            );
            results = results.concat(pvtResults);
        }
        
        return results;
    },
    
    // Get total seats for a trade
    getTotalSeatsForTrade: function(tradeName, region = "Nagpur") {
        const results = this.searchByTrade(tradeName, region);
        return results.reduce((sum, iti) => sum + (iti["Seat Available"] || 0), 0);
    },
    
    // Get unique ITIs for a trade
    getUniqueITIsForTrade: function(tradeName, region = "Nagpur") {
        const results = this.searchByTrade(tradeName, region);
        const uniqueITIs = new Set(results.map(iti => iti["ITI Code"]));
        return uniqueITIs.size;
    },
    
    // Get all trades in a district
    getTradesInDistrict: function(districtName, region = "Nagpur") {
        const results = this.searchByDistrict(districtName, region);
        const trades = new Set(results.map(iti => iti["TRADE NAME"]));
        return Array.from(trades).sort();
    },
    
    // Get all ITIs in a district
    getITIsInDistrict: function(districtName, region = "Nagpur", type = "all") {
        const results = this.searchByDistrict(districtName, region, type);
        const uniqueITIs = {};
        
        results.forEach(row => {
            const code = row["ITI Code"];
            if (!uniqueITIs[code]) {
                uniqueITIs[code] = {
                    code: code,
                    name: row["ITI Name"],
                    district: row.District,
                    taluka: row.Taluka,
                    category: row["UNIT CATEGORY"],
                    trades: []
                };
            }
            uniqueITIs[code].trades.push({
                name: row["TRADE NAME"],
                seats: row["Seat Available"]
            });
        });
        
        return Object.values(uniqueITIs);
    },
    
    // Compare Government vs Private
    compareGovtVsPrivate: function(region = "Nagpur") {
        const regionData = ITI_ADMISSION_DATABASE.regions[region];
        if (!regionData) return null;
        
        return {
            government: {
                totalITIs: regionData.statistics.governmentITIs,
                totalSeats: regionData.statistics.governmentSeats,
                records: regionData.government.length
            },
            private: {
                totalITIs: regionData.statistics.privateITIs,
                totalSeats: regionData.statistics.privateSeats,
                records: regionData.private.length
            },
            combined: {
                totalITIs: regionData.statistics.totalITIs,
                totalSeats: regionData.statistics.totalSeats
            }
        };
    },
    
    // Format results for AI response
    formatResultsForAI: function(results, queryType = "search") {
        if (!results || results.length === 0) {
            return "No ITIs found matching your criteria.";
        }
        
        // Group by ITI
        const grouped = {};
        results.forEach(row => {
            const code = row["ITI Code"];
            if (!grouped[code]) {
                grouped[code] = {
                    code: code,
                    name: row["ITI Name"],
                    district: row.District,
                    taluka: row.Taluka,
                    category: row["UNIT CATEGORY"],
                    type: code.startsWith('G') ? 'Government' : 'Private',
                    trades: []
                };
            }
            grouped[code].trades.push({
                name: row["TRADE NAME"],
                seats: row["Seat Available"]
            });
        });
        
        const itiList = Object.values(grouped);
        
        // Calculate totals
        const totalITIs = itiList.length;
        const totalSeats = results.reduce((sum, row) => sum + (row["Seat Available"] || 0), 0);
        
        // Create formatted response
        let response = `**Found ${totalITIs} ITI${totalITIs > 1 ? 's' : ''} with ${totalSeats} total seats:**\n\n`;
        
        itiList.forEach((iti, index) => {
            response += `**${index + 1}. ${iti.name}**\n`;
            response += `   • Code: ${iti.code}\n`;
            response += `   • Type: ${iti.type}\n`;
            response += `   • District: ${iti.district}, Taluka: ${iti.taluka}\n`;
            response += `   • Category: ${iti.category}\n`;
            response += `   • Trades:\n`;
            iti.trades.forEach(trade => {
                response += `      - ${trade.name}: ${trade.seats} seats\n`;
            });
            response += `\n`;
        });
        
        return response;
    },
    
    // Generate AI context for admission queries
    generateAIContext: function() {
        if (!ITI_ADMISSION_DATABASE.regions || !ITI_ADMISSION_DATABASE.regions.Nagpur) {
            return "";
        }
        
        const stats = ITI_ADMISSION_DATABASE.getStatistics();
        const nagpur = ITI_ADMISSION_DATABASE.regions.Nagpur;
        
        return `
ITI ADMISSION DATABASE (Nagpur Region):
- Available Districts: ${nagpur.districts.join(', ')}
- Total ITIs: ${stats.totalITIs} (${stats.governmentITIs} Government + ${stats.privateITIs} Private)
- Total Seats: ${stats.totalSeats} (${stats.governmentSeats} Government + ${stats.privateSeats} Private)
- Total Trades: ${stats.totalTrades}+

Government ITI codes start with 'G', Private ITI codes start with 'P'.

When answering admission queries:
1. Search the database for exact matches
2. Provide specific ITI names, codes, and seat counts
3. Group results by ITI (one ITI can have multiple trades)
4. Always mention district and taluka
5. Distinguish between Government and Private ITIs
6. If asked about unavailable regions, politely inform that only Nagpur region data is currently available
7. Format responses clearly with proper structure

The database contains ${nagpur.government.length} government ITI records and ${nagpur.private.length} private ITI records.
`;
    }
};

// Make globally available
window.AdmissionQueryEngine = AdmissionQueryEngine;

console.log('✅ Admission Query Engine loaded');
