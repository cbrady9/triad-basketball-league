// team-stats.js

// No need for SHEET_ID or GID here, they come from config.js and utils.js

const TEAMSTATS_QUERY = 'SELECT *'; // Select all columns for team stats

function renderTeamStatsTable(data) {
    const container = document.getElementById('teamstats-data-container');
    if (!container) {
        console.error("Team stats container not found.");
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
        const isSortable = ['TEAM NAME', 'GAMES PLAYED'].includes(header) ? '' : 'sortable';
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

// Basic sorting function (you might have a more complex one already)
function sortTable(header, container) {
    const table = container.querySelector('table');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const column = header.dataset.column;
    const isAsc = header.classList.contains('asc');

    rows.sort((a, b) => {
        const aText = a.querySelector(`td:nth-child(${Array.from(header.parentNode.children).indexOf(header) + 1})`).textContent.trim();
        const bText = b.querySelector(`td:nth-child(${Array.from(header.parentNode.children).indexOf(header) + 1})`).textContent.trim();

        // Try to convert to number for numeric sorting, otherwise do string comparison
        const aValue = parseFloat(aText);
        const bValue = parseFloat(bText);

        if (!isNaN(aValue) && !isNaN(bValue)) {
            return isAsc ? aValue - bValue : bValue - aValue;
        } else {
            return isAsc ? aText.localeCompare(bText) : bText.localeCompare(aText);
        }
    });

    // Clear existing sort classes
    sortableHeaders.forEach(h => {
        h.classList.remove('asc', 'desc');
    });

    // Apply new sort class
    header.classList.toggle(isAsc ? 'desc' : 'asc');

    rows.forEach(row => tbody.appendChild(row));
}

async function initializeTeamStatsPage() {
    const currentSeason = getCurrentSeason();
    const teamStatsGID = getGID('TEAM_STATS_GID', currentSeason);

    if (!teamStatsGID) {
        console.error("Team Stats GID not found for current season:", currentSeason);
        document.getElementById('teamstats-data-container').innerHTML = '<p class="text-red-500">Error: Team stats data not configured for this season. Please ensure the correct GID is in config.js.</p>';
        return;
    }

    document.getElementById('teamstats-data-container').innerHTML = '<p class="text-gray-600">Loading team stats...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, teamStatsGID, TEAMSTATS_QUERY);
    if (tableData) {
        renderTeamStatsTable(tableData);
    }
    createSeasonSelector(currentSeason); // Add season selector to header
}

document.addEventListener('DOMContentLoaded', initializeTeamStatsPage);
window.initializePage = initializeTeamStatsPage; // Make globally accessible for config.js