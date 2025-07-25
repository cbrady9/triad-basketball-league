document.addEventListener('DOMContentLoaded', initializeStandingsPage);
window.initializePage = initializeStandingsPage;

function renderStandingsTable(data) {
    const container = document.getElementById('standings-data-container');
    if (!container) return;

    const filteredData = data.filter(team => team['Team Name'] !== 'Reserve');
    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = `<div class="text-center py-12"><img src="https://images.undraw.co/undraw_people_re_8spw.svg" alt="No teams found" class="mx-auto w-40 h-40 mb-4 opacity-50"><p class="text-lg text-gray-400">No team standings available yet.</p></div>`;
        return;
    }

    filteredData.sort((a, b) => {
        const winPctA = parseFloat(a['Win %']) || 0;
        const winPctB = parseFloat(b['Win %']) || 0;
        const winPctDiff = winPctB - winPctA;
        if (winPctDiff !== 0) return winPctDiff;
        const pdA = parseFloat(a['Point Differential']) || 0;
        const pdB = parseFloat(b['Point Differential']) || 0;
        return pdB - pdA;
    });

    const headerMap = { 'Games Played': 'GP' };
    const orderedHeaders = ['Rank', 'Team Name', 'Games Played', 'Wins', 'Losses', 'Win %', 'Point Differential'];

    let tableHTML = '<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800"><tr>';

    orderedHeaders.forEach(header => {
        const displayHeader = headerMap[header] || header;
        tableHTML += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">${displayHeader}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-gray-800 divide-y divide-gray-700">';

    filteredData.forEach((row, index) => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        orderedHeaders.forEach(header => {
            let displayValue = '';
            if (header === 'Rank') {
                displayValue = index + 1;
            } else if (header === 'Team Name') {
                // --- NEW: Logic to display logo next to team name ---
                const teamName = row[header] || '';
                const logoUrl = row['Logo URL'] || 'https://i.imgur.com/p3nQp25.png';
                displayValue = `
                    <a href="team-detail.html?teamName=${encodeURIComponent(teamName)}" class="flex items-center group">
                        <img src="${logoUrl}" onerror="this.onerror=null; this.src='https://i.imgur.com/p3nQp25.png';" class="w-8 h-8 mr-3 object-contain">
                        <span class="text-sky-400 group-hover:underline font-semibold">${teamName}</span>
                    </a>
                `;
            } else {
                const value = row[header] !== undefined ? row[header] : '';
                displayValue = value;
                if (header === 'Point Differential') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 0) { displayValue = '+' + numValue; }
                }
            }
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></div>';
    container.innerHTML = tableHTML;
}

async function initializeStandingsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const standingsGID = getGID('STANDINGS_GID', currentSeason);
    if (!standingsGID) {
        document.getElementById('standings-data-container').innerHTML = '<p class="text-red-500">Standings data not configured.</p>';
        return;
    }

    document.getElementById('standings-data-container').innerHTML = '<p class="text-gray-300">Loading standings...</p>';

    // Use SELECT * to ensure we get the Logo URL column
    const tableData = await fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT *');
    if (tableData) {
        renderStandingsTable(tableData);
    }
}