// standings.js

const STANDINGS_QUERY = 'SELECT *'; // Select all columns for standings

function renderStandingsTable(data) {
    const container = document.getElementById('standings-data-container');
    if (!container) {
        console.error("Standings container not found.");
        return;
    }
    container.innerHTML = ''; // Clear existing content

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No team standings available for this season.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
    const headers = Object.keys(data[0]);

    headers.forEach(header => {
        const isSortable = ['TEAM NAME'].includes(header) ? '' : 'sortable'; // Example: make WINS, LOSSES sortable
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