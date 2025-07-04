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
window.initializePage = async function () {
    console.log('Re-initializing page for new season...');
    const newSeason = getCurrentSeason(); // Get the updated season
    // Add code here to clear existing data and reload content for the newSeason
    // For example:
    // document.getElementById('data-container').innerHTML = 'Loading...';
    // await fetchDataAndRender(newSeason); // Call your data fetching/rendering function
};

const STANDINGS_QUERY = 'SELECT A, B, C, D, E'; // Select all columns for standings

function renderStandingsTable(data) {
    const container = document.getElementById('standings-data-container');
    if (!container) {
        console.error("Standings container not found.");
        return;
    }
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-300">No team standings available for this season.</p>';
        return;
    }

    // Add a subtle outer border and hide overflow for clean rounded corners
    let tableHTML = '<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';

    // --- THEAD STYLING ---
    // Changed background to bg-gray-800 and text to text-gray-300
    tableHTML += '<thead class="bg-gray-800">';
    tableHTML += '<tr>';

    const headers = Object.keys(data[0]);

    headers.forEach(header => {
        const isSortable = ['Team Name', 'Player Name'].includes(header) ? '' : 'sortable';
        tableHTML += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">${header}</th>`;
    });
    tableHTML += '</tr></thead>';

    // --- TBODY STYLING ---
    // Changed background color and hover effect
    tableHTML += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

    data.forEach(row => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;

            if (header === 'Point Differential') {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 0) {
                    displayValue = '+' + numValue;
                }
            }

            // --- TD STYLING ---
            // Changed text color to text-gray-300
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;

    // Add sorting functionality
    const sortableHeaders = container.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => sortTable(header, container));
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