// player-stats.js

// 1. Remove hardcoded SHEET_ID and GID
// const SHEET_ID = 'YOUR_MASTER_SHEET_ID_HERE'; // REMOVE THIS LINE
// const PLAYERSTATS_GID = 'YOUR_PLAYER_STATS_GID_HERE'; // REMOVE THIS LINE

// Keep your specific query as it doesn't change based on season, only the data source does
const PLAYERSTATS_QUERY = 'SELECT A, B, C, P, Q, R, S, T, U, V, W, X'; // <--- Change 'u' to 'U' // **Keep your actual query here**

// Your fetchGoogleSheetData function (this stays the same)
// It will now use SHEET_ID which is globally available from config.js
// and the GID passed dynamically.
async function fetchGoogleSheetData(sheetId, gid, query) {
    const URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&tq=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(URL);
        const text = await response.text();
        const json = JSON.parse(text.substring(47, text.length - 2)); // Adjust substring if needed
        const columns = json.table.cols.map(col => col.label);
        const rows = json.table.rows.map(row => row.c.map(cell => cell ? cell.v : ''));

        // Combine columns and rows into an array of objects
        const data = rows.map(row => {
            let obj = {};
            columns.forEach((col, index) => {
                obj[col] = row[index];
            });
            return obj;
        });
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        // Display user-friendly error message on the page
        const container = document.getElementById('playerstats-data-container');
        if (container) {
            container.innerHTML = '<p class="text-red-500">Failed to load player stats. Please try again later or select a different season.</p>';
        }
        return null;
    }
}

// Your renderPlayerStatsTable function (this stays the same)
function renderPlayerStatsTable(data) {
    // ... (your existing render function code) ...
    // Make sure this function clears previous content before rendering new data
    const container = document.getElementById('playerstats-data-container');
    if (container) {
        container.innerHTML = ''; // Clear existing content
        // ... then build and append the table
        // For example:
        if (data && data.length > 0) {
            let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
            // Assuming your first data object has the headers
            Object.keys(data[0]).forEach(key => {
                tableHTML += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable">${key}</th>`;
            });
            tableHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
            data.forEach(row => {
                tableHTML += '<tr>';
                Object.values(row).forEach(value => {
                    tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } else {
            container.innerHTML = '<p class="text-gray-700">No player stats available for this season.</p>';
        }
    }
}

// 2. Create an initialization function that uses the config.js GIDs
async function initializePlayerStatsPage() {
    // Use the global SHEET_ID (from config.js) and dynamically get the GID for player stats
    const currentSeason = getCurrentSeason(); // Function from config.js
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason); // Function from config.js

    if (!playerStatsGID) {
        console.error("Player Stats GID not found for current season:", currentSeason);
        document.getElementById('playerstats-data-container').innerHTML = '<p class="text-red-500">Error: Player stats data not configured for this season.</p>';
        return; // Stop execution if GID is missing
    }

    // Clear previous data before loading new data
    document.getElementById('playerstats-data-container').innerHTML = '<p class="text-gray-600">Loading player stats...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, PLAYERSTATS_QUERY);
    if (tableData) {
        renderPlayerStatsTable(tableData);
    }
}

// 3. Call the initialization function when the DOM is loaded AND when the season changes
document.addEventListener('DOMContentLoaded', initializePlayerStatsPage);

// Make this function globally accessible so config.js can call it on season change
window.initializePage = initializePlayerStatsPage; // Assign it to window.initializePage for config.js to use