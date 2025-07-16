// player-stats.js

document.addEventListener('DOMContentLoaded', () => {
    initializePlayerStatsPage();
});

window.initializePage = async function () {
    console.log('Re-initializing page for new season...');
    await initializePlayerStatsPage();
};

function renderPlayerStatsTable(statsData, playersData) {
    const container = document.getElementById('playerstats-data-container');
    if (!container) return;

    if (!statsData || statsData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <img src="https://images.undraw.co/undraw_no_data_re_kwbl.svg" alt="No stats available" class="mx-auto w-40 h-40 mb-4 opacity-50">
                <p class="text-lg text-gray-400">No player stats available yet.</p>
            </div>
        `;
        return;
    }

    // ... rest of the function remains the same ...
    const headshotMap = new Map(playersData.map(p => [p['Player Name'], p['Headshot URL']]));
    const headers = Object.keys(statsData[0]);
    const statsToFormat = ['PPG', 'RPG', 'APG', 'SPG', 'BPG', 'TPG'];

    let tableHTML = '<div class="overflow-x-auto max-h-[75vh] overflow-y-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800 sticky top-0"><tr>';
    headers.forEach(header => {
        const isSortable = header.trim().toUpperCase() !== 'PLAYER NAME' ? 'sortable' : '';
        tableHTML += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${isSortable}">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-gray-800 divide-y divide-gray-700">';

    statsData.forEach(row => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;
            if (header.trim().toUpperCase() === 'PLAYER NAME') {
                const encodedPlayerName = encodeURIComponent(value);
                const headshotUrl = headshotMap.get(value) || 'https://i.imgur.com/8so6K5A.png';
                displayValue = `<a href="player-detail.html?playerName=${encodedPlayerName}" class="flex items-center group"><img src="${headshotUrl}" class="w-8 h-8 rounded-full mr-3 object-cover"><span class="text-sky-400 group-hover:underline font-semibold">${value}</span></a>`;
            } else {
                if (statsToFormat.includes(header)) {
                    displayValue = formatStat(value);
                }
            }
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;

    container.querySelectorAll('th.sortable').forEach(header => {
        header.addEventListener('click', () => sortTable(header, container));
    });
}

async function initializePlayerStatsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const playerStatsContainer = document.getElementById('playerstats-data-container');
    playerStatsContainer.innerHTML = '<p class="text-gray-400">Loading player stats...</p>';

    const playerStatsGID = getGID('PLAYER_STATS_GID', currentSeason);
    const playersGID = getGID('PLAYERS_GID', currentSeason);

    if (!playerStatsGID || !playersGID) {
        playerStatsContainer.innerHTML = '<p class="text-red-500">Error: Player stats data not configured.</p>';
        return;
    }

    // --- UPDATED: Both queries now use SELECT * for reliability ---
    const [statsData, playersData] = await Promise.all([
        fetchGoogleSheetData(SHEET_ID, playerStatsGID, 'SELECT *'),
        fetchGoogleSheetData(SHEET_ID, playersGID, 'SELECT *')
    ]);

    if (statsData && playersData) {
        // Pass both datasets to the rendering function
        renderPlayerStatsTable(statsData, playersData);
    } else {
        playerStatsContainer.innerHTML = '<p class="text-red-500">Failed to load player stats.</p>';
    }
}