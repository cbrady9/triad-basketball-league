// team-stats.js

const TEAMSTATS_QUERY = 'SELECT *';

function renderTeamStatsTable(data) {
    const container = document.getElementById('team-stats-data-container');
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-300">No team stats available for this season.</p>';
        return;
    }

    let tableHTML = '<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800">';
    tableHTML += '<tr>';

    const headers = Object.keys(data[0]);
    // --- CORRECTED: This now matches your sheet's exact headers ---
    const statsToFormat = ['PPG FOR', 'PPG AGAINST', 'RPG', 'APG', 'SPG', 'BPG', 'TPG'];

    headers.forEach(header => {
        const isSortable = ['TEAM NAME', 'GAMES PLAYED'].includes(header.toUpperCase()) ? '' : 'sortable';
        tableHTML += `<th scope="col" class="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${isSortable}">${header}</th>`;
    });
    tableHTML += '</tr></thead>';

    tableHTML += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

    data.forEach(row => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;

            // This check will now work correctly with the new header names
            if (statsToFormat.includes(header)) {
                displayValue = formatStat(value);
            }

            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table></div>';
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