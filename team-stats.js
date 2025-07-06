document.addEventListener('DOMContentLoaded', initializeTeamStatsPage);
window.initializePage = initializeTeamStatsPage;

// --- UPDATED: This function now accepts the main team data to get logo URLs ---
function renderTeamStatsTable(statsData, teamsData) {
    const container = document.getElementById('team-stats-data-container');
    if (!container) return;

    if (!statsData || statsData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <img src="https://images.undraw.co/undraw_no_data_re_kwbl.svg" alt="No stats available" class="mx-auto w-40 h-40 mb-4 opacity-50">
                <p class="text-lg text-gray-400">No team stats available yet.</p>
            </div>
        `;
        return;
    }

    let tableHTML = '<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800">';
    tableHTML += '<tr>';

    const headers = Object.keys(statsData[0]);
    const statsToFormat = ['PPG FOR', 'PPG AGAINST', 'RPG', 'APG', 'SPG', 'BPG', 'TPG'];

    headers.forEach(header => {
        const isSortable = ['TEAM NAME', 'GAMES PLAYED'].includes(header.toUpperCase()) ? '' : 'sortable';
        tableHTML += `<th scope="col" class="px-6 py-3 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${isSortable}">${header}</th>`;
    });
    tableHTML += '</tr></thead>';

    tableHTML += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

    statsData.forEach(row => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        headers.forEach(header => {
            let value = row[header] !== undefined ? row[header] : '';
            let displayValue = value;

            if (statsToFormat.includes(header)) {
                displayValue = formatStat(value);
            }

            if (header.toUpperCase() === 'TEAM NAME') {
                const teamName = value;

                // --- NEW: Using a direct .find() method for a more robust lookup ---
                const teamInfo = teamsData.find(t => t['Team Name'] === teamName);
                const logoUrl = teamInfo ? teamInfo['Logo URL'] : 'https://i.imgur.com/p3nQp25.png';

                const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
                displayValue = `
                    <a href="${teamLink}" class="flex items-center group">
                        <img src="${logoUrl}" onerror="this.onerror=null; this.src='https://i.imgur.com/p3nQp25.png';" class="w-8 h-8 mr-3 object-contain">
                        <span class="text-sky-400 group-hover:underline font-semibold">${teamName}</span>
                    </a>
                `;
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

// --- UPDATED: This now fetches data from two sheets ---
async function initializeTeamStatsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);
    document.getElementById('team-stats-data-container').innerHTML = '<p class="text-gray-400">Loading team stats...</p>';

    const teamStatsGID = getGID('TEAM_STATS_GID', currentSeason);
    const teamsGID = getGID('TEAMS_GID', currentSeason);

    if (!teamStatsGID || !teamsGID) {
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Error: Page not configured correctly.</p>';
        return;
    }

    try {
        const [teamStatsData, teamsData] = await Promise.all([
            fetchGoogleSheetData(SHEET_ID, teamStatsGID, 'SELECT *'),
            fetchGoogleSheetData(SHEET_ID, teamsGID, 'SELECT A, H')
        ]);

        if (teamStatsData && teamsData) {
            // --- UPDATED: This now trims spaces from the team name for a reliable match ---
            const renamedTeamsData = teamsData.map(team => ({
                'Team Name': team['A'] ? team['A'].trim() : '', // Trim whitespace here
                'Logo URL': team['H']
            }));

            renderTeamStatsTable(teamStatsData, renamedTeamsData);
        } else {
            throw new Error("One or more datasets failed to load.");
        }
    } catch (error) {
        console.error("Failed to initialize team stats page:", error);
        document.getElementById('team-stats-data-container').innerHTML = '<p class="text-red-500">Failed to load team stats.</p>';
    }
}