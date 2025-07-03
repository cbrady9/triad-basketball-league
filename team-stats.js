// team-stats.js

// No need for SHEET_ID or GID here, they come from config.js and utils.js

const TEAMSTATS_QUERY = 'SELECT *'; // Select all columns for team stats

function renderTeamStatsTable(data) {
    // FIX: Corrected ID to match team-stats.html
    const container = document.getElementById('team-stats-data-container');
    if (!container) {
        console.error("Team stats container not found. Check ID in HTML and JS.");
        return;
    }
    container.innerHTML = ''; // Clear existing content

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No team stats available for this season.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
    const headers = Object.keys(data[0]); // Get headers from the first data object

    headers.forEach(header => {
        // Add sortable class to headers if they are numeric stats (adjust as needed)
        // 'TEAM NAME' is typically a string and might not need numeric sorting.
        const isSortable = ['TEAM NAME', 'GAMES PLAYED'].includes(header.toUpperCase()) ? '' : 'sortable'; // Using toUpperCase for robustness
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

    // Add sorting functionality (assuming sortTable is now in utils.js)
    const sortableHeaders = container.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => sortTable(header, container));
    });
}

async function initializeTeamStatsPage() {
    const currentSeason = getCurrentSeason();
    const teamStatsGID = getGID('TEAM_STATS_GID', currentSeason);

    if (!teamStatsGID) {
        console.error("Team Stats GID not found for current season:", currentSeason);
        // FIX: Corrected ID for error message container
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Error: Team stats data not configured for this season. Please ensure the correct GID is in config.js.</p>';
        return;
    }

    // FIX: Corrected ID for loading message container
    document.getElementById('team-stats-data-container').innerHTML = '<p class="text-gray-600">Loading team stats...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, teamStatsGID, TEAMSTATS_QUERY);
    if (tableData) {
        renderTeamStatsTable(tableData);
    } else {
        // If tableData is null (e.g., due to fetch error), display a generic error
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Failed to load team stats. Please try again later or select a different season.</p>';
    }

    createSeasonSelector(currentSeason); // Add season selector to header
}

document.addEventListener('DOMContentLoaded', initializeTeamStatsPage);
window.initializePage = initializeTeamStatsPage; // Make globally accessible for config.js