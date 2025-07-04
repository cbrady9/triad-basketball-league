// player-stats.js

document.addEventListener('DOMContentLoaded', () => {
    initializePlayerStatsPage();
});

window.initializePage = async function() {
    console.log('Re-initializing page for new season...');
    await initializePlayerStatsPage();
};

function renderPlayerStatsTable(data) {
    const container = document.getElementById('playerstats-data-container');
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No player stats available for this season.</p>';
        return;
    }

    const headers = Object.keys(data[0]);
    // THIS IS THE SPECIAL DEBUGGING LINE
    console.log('The headers are:', headers);

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';

    headers.forEach(header => {
        const isSortable = header.trim().toUpperCase() === 'PLAYER' ? '' : 'sortable';
        tableHTML += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isSortable}">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';

    data.forEach(row => {
        tableHTML += '<tr class="odd:bg-white even:bg-gray-50 hover:bg-blue-100">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;

            if (header.trim().toUpperCase() === 'PLAYER') {
                const encodedPlayerName = encodeURIComponent(value);
                displayValue = `<a href="player-detail.html?playerName=${encodedPlayerName}" class="text-blue-600 hover:underline font-semibold">${value}</a>`;
            }

            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;

    container.querySelectorAll('th.sortable').forEach(header => {
        header.addEventListener('click', () => sortTable(header, container));
    });
}

async function initializePlayerStatsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    if (!playerStatsGID) {
        document.getElementById('playerstats-data-container').innerHTML = '<p class="text-red-500">Error: Player stats data not configured.</p>';
        return;
    }

    document.getElementById('playerstats-data-container').innerHTML = '<p class="text-gray-600">Loading player stats...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT A, B, C, P, Q, R, S, T, U, V, W, X');
    if (tableData) {
        renderPlayerStatsTable(tableData);
    } else {
        document.getElementById('playerstats-data-container').innerHTML = '<p class="text-red-500">Failed to load player stats.</p>';
    }
}