// standings.js

// standings.js (example - do this for each relevant page's JS file)

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

const STANDINGS_QUERY = 'SELECT A, B, C, D, E, F, G'; // Select all columns for standings

function renderStandingsTable(data) {
    const container = document.getElementById('standings-data-container');
    if (!container) {
        console.error("Standings container not found.");
        return;
    }
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No team standings available for this season.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
    const headers = Object.keys(data[0]);

    headers.forEach(header => {
        const isSortable = ['Team Name'].includes(header) ? '' : 'sortable';
        tableHTML += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isSortable}" data-column="${header}">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';

    data.forEach(row => {
        // Added zebra-striping and hover effect class here!
        tableHTML += '<tr class="odd:bg-white even:bg-gray-50 hover:bg-blue-100">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;

            // --- NEW FORMATTING LOGIC ---
            if (header === 'Win %') {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    displayValue = (numValue * 100).toFixed(0) + '%';
                }
            } else if (header === 'Point Differential') {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 0) {
                    displayValue = '+' + numValue;
                }
            }
            // --- END NEW FORMATTING LOGIC ---

            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;

    const sortableHeaders = container.querySelectorAll('th.sortable');
    sortableHeaders.forEach(h => {
        h.addEventListener('click', () => sortTable(h, container));
    });
}

// Re-use or copy the sortTable function from utils.js or team-stats.js if not already global
// For now, including it here for completeness


async function initializeStandingsPage() {
    const currentSeason = getCurrentSeason();
    const standingsGID = getGID('STANDINGS_GID', currentSeason);

    if (!standingsGID) {
        console.error("Standings GID not found for current season:", currentSeason);
        document.getElementById('standings-data-container').innerHTML = '<p class="text-red-500">Error: Standings data not configured for this season. Please ensure the correct GID is in config.js.</p>';
        return;
    }

    document.getElementById('standings-data-container').innerHTML = '<p class="text-gray-600">Loading standings...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, standingsGID, STANDINGS_QUERY);
    if (tableData) {
        renderStandingsTable(tableData);
    }
    createSeasonSelector(currentSeason);
}

document.addEventListener('DOMContentLoaded', initializeStandingsPage);
window.initializePage = initializeStandingsPage;