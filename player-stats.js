// player-stats.js

// Keep your specific query as it doesn't change based on season, only the data source does
const PLAYERSTATS_QUERY = 'SELECT A, B, C, P, Q, R, S, T, U, V, W, X';

// Your renderPlayerStatsTable function
function renderPlayerStatsTable(data) {
    const container = document.getElementById('playerstats-data-container');
    if (!container) {
        console.error("Player stats data container not found.");
        return;
    }
    container.innerHTML = ''; // Clear existing content

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No player stats available for this season.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
    const headers = Object.keys(data[0]); // Get headers from the first data object

    headers.forEach(header => {
        // Decide which headers should be sortable. 'PLAYER' is usually text, others are often numbers.
        // Adjust this condition based on your actual column names that contain numbers you want to sort.
        const isSortable = ['PLAYER'].includes(header.toUpperCase()) ? '' : 'sortable'; // Example: Player name not sortable
        tableHTML += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isSortable}" data-column="${header}">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';

    data.forEach(row => {
        tableHTML += '<tr>';
        headers.forEach(header => {
            const value = row[header] !== undefined ? row[header] : '';
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;

    // Add sorting functionality
    const sortableHeaders = container.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
        // Ensure sortTable is defined in utils.js
        header.addEventListener('click', () => sortTable(header, container));
    });
}

// Initialization function
async function initializePlayerStatsPage() {
    const currentSeason = getCurrentSeason();
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);

    if (!playerStatsGID) {
        console.error("Player Stats GID not found for current season:", currentSeason);
        document.getElementById('playerstats-data-container').innerHTML = '<p class="text-red-500">Error: Player stats data not configured for this season.</p>';
        return;
    }

    document.getElementById('playerstats-data-container').innerHTML = '<p class="text-gray-600">Loading player stats...</p>';

    // fetchGoogleSheetData is assumed to be in utils.js
    const tableData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, PLAYERSTATS_QUERY);
    if (tableData) {
        renderPlayerStatsTable(tableData);
    } else {
        document.getElementById('playerstats-data-container').innerHTML = '<p class="text-red-500">Failed to load player stats. Please try again later or select a different season.</p>';
    }

    createSeasonSelector(currentSeason); // Add season selector to header
}

document.addEventListener('DOMContentLoaded', initializePlayerStatsPage);
window.initializePage = initializePlayerStatsPage; // Make globally accessible for config.js