// team-stats.js

const TEAMSTATS_QUERY = 'SELECT *';

function renderTeamStatsTable(data) {
    const container = document.getElementById('team-stats-data-container');
    if (!container) {
        console.error("Team stats container not found. Check ID in HTML and JS.");
        return;
    }
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No team stats available for this season.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
    const headers = Object.keys(data[0]);

    // Define which columns are percentages and how many decimal places to show
    const percentageColumns = ['FG%', '2P%', 'FT%'];
    const decimalPlaces = 1; // For example, 1 decimal place (e.g., 66.7%)

    headers.forEach(header => {
        const isSortable = ['TEAM NAME', 'GAMES PLAYED'].includes(header.toUpperCase()) ? '' : 'sortable';
        tableHTML += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isSortable}" data-column="${header}">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';

    data.forEach(row => {
        tableHTML += '<tr class="odd:bg-white even:bg-gray-50 hover:bg-blue-100">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;

            // Format percentage columns
            if (percentageColumns.includes(header)) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    displayValue = (numValue * 100).toFixed(decimalPlaces) + '%';
                } else {
                    displayValue = ''; // Handle non-numeric or empty values gracefully
                }
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

async function initializeTeamStatsPage() {
    const currentSeason = getCurrentSeason();
    const teamStatsGID = getGID('TEAM_STATS_GID', currentSeason);

    if (!teamStatsGID) {
        console.error("Team Stats GID not found for current season:", currentSeason);
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Error: Team stats data not configured for this season. Please ensure the correct GID is in config.js.</p>';
        return;
    }

    document.getElementById('team-stats-data-container').innerHTML = '<p class="text-gray-600">Loading team stats...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, teamStatsGID, TEAMSTATS_QUERY);
    if (tableData) {
        renderTeamStatsTable(tableData);
    } else {
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Failed to load team stats. Please try again later or select a different season.</p>';
    }

    createSeasonSelector(currentSeason);
}

document.addEventListener('DOMContentLoaded', initializeTeamStatsPage);
window.initializePage = initializeTeamStatsPage;