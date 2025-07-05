// config.js

// YOUR GOOGLE SHEET ID (the long string in the URL after /d/ and before /edit)
// REMOVE 'const' TO MAKE IT GLOBALLY ACCESSIBLE
SHEET_ID = '18lQt9cD2icb-K6UQxTWqfbI7R4L84cT_l8lvUtiqGDU'; // <--- CHANGE THIS LINE

// Configuration for each season's Google Sheet GIDs
// ... (rest of your SEASON_CONFIGS object remains the same)
const SEASON_CONFIGS = {
    "S01": { // Your first season
        "PLAYER_STATS_GID": "340059940",
        "TEAM_STATS_GID": "1640890982",
        "SCHEDULE_GID": "1956260076",
        "STANDINGS_GID": "2001178505",
        "PLAYERS_GID": "0",
        "TEAMS_GID": "2001178505",
        "GAME_LOG_GID": "306053944",
        "TRANSACTIONS_GID": "548202372",
        "WEEKLY_AWARDS_GID": "1562174280",
        "SEASON_AWARDS_GID": "334782"
    },
    /*"S02": { // Your newly duplicated second season
        "PLAYER_STATS_GID": "1449243249",
        "TEAM_STATS_GID": "636058703",
        "SCHEDULE_GID": "2096810957",
        "STANDINGS_GID": "1736699475",
        "PLAYERS_GID": "1745355445",
        "TEAMS_GID": "1866940250",
        "GAME_LOG_GID": "1933650257",
        "TRANSACTIONS_GID": "680517263"
    }
    // Add more seasons as you create them*/
};
// Function to get the current season from localStorage or default

// UPDATED getGID function to correctly handle GID 0
function getGID(type, season) {
    const config = SEASON_CONFIGS[season];
    // Check if the property exists on the config object, allowing 0 as a valid GID
    if (config && Object.prototype.hasOwnProperty.call(config, type)) {
        return config[type];
    }
    console.warn(`GID not found for type: ${type}, season: ${season}. Configuration:`, config);
    return null;
}

console.log('config.js loaded. SHEET_ID defined:', typeof SHEET_ID !== 'undefined', 'SEASON_CONFIGS defined:', typeof SEASON_CONFIGS !== 'undefined');