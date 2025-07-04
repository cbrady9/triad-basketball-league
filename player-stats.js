// player-stats.js

// player-stats.js (example - do this for each relevant page's JS file)

document.addEventListener('DOMContentLoaded', () => {
    // Get the current season (will now correctly come from utils.js)
    const currentSeason = getCurrentSeason();

    // Initialize the season selector dropdown
    createSeasonSelector(currentSeason);

    // Call your page-specific initialization function here
    // This function should then use 'currentSeason' to fetch and display data
    // For example:
    // initializeHomePage(currentSeason); // If you have a specific function
    // Or if the page just loads data based on getCurrentSeason()
    // loadPageData();
});

// OPTIONAL: If you want the page to re-render data immediately when season changes
// You must make your page's main initialization function globally accessible.
// Replace 'initializeHomePage' with the actual name of your main page function.
// If you don't have a specific `initializePage` function for this page,
// you might need to structure your page's data loading inside this global function.
window.initializePage = async function() {
    console.log('Re-initializing page for new season...');
    const newSeason = getCurrentSeason(); // Get the updated season
    // Add code here to clear existing data and reload content for the newSeason
    // For example:
    // document.getElementById('data-container').innerHTML = 'Loading...';
    // await fetchDataAndRender(newSeason); // Call your data fetching/rendering function
};

const PLAYERSTATS_QUERY = 'SELECT A, B, C, P, Q, R, S, T, U, V, W, X';

function renderPlayerStatsTable(data) {
    const container = document.getElementById('playerstats-data-container');
    if (!container) {
        console.error("Player stats data container not found.");
        return;
    }
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No player stats available for this season.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
    const headers = Object.keys(data[0]);

    headers.forEach(header => {
        const isSortable = ['PLAYER'].includes(header.toUpperCase()) ? '' : 'sortable';
        tableHTML += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isSortable}" data-column="${header}">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';

    data.forEach(row => {
        tableHTML += '<tr class="odd:bg-white even:bg-gray-50 hover:bg-blue-100">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;

            // If the current column is the player's name, make it a link
            if (header.toUpperCase() === 'PLAYER') {
                const encodedPlayerName = encodeURIComponent(value);
                displayValue = `<a href="player-detail.html?playerName=${encodedPlayerName}" class="text-blue-600 hover:underline font-semibold">${value}</a>`;
            }

            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;

    const sortableHeaders = container.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => sortTable(header, container));
    });
}

async function initializePlayerStatsPage() {
    const currentSeason = getCurrentSeason();
    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);

    if (!playerStatsGID) {
        console.error("Player Stats GID not found for current season:", currentSeason);
        document.getElementById('playerstats-data-container').innerHTML = '<p class="text-red-500">Error: Player stats data not configured for this season.</p>';
        return;
    }

    document.getElementById('playerstats-data-container').innerHTML = '<p class="text-gray-600">Loading player stats...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, PLAYERSTATS_QUERY);
    if (tableData) {
        renderPlayerStatsTable(tableData);
    } else {
        document.getElementById('playerstats-data-container').innerHTML = '<p class="text-red-500">Failed to load player stats. Please try again later or select a different season.</p>';
    }

    createSeasonSelector(currentSeason);
}

document.addEventListener('DOMContentLoaded', initializePlayerStatsPage);
window.initializePage = initializePlayerStatsPage;