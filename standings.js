document.addEventListener('DOMContentLoaded', initializeStandingsPage);
window.initializePage = initializeStandingsPage;

function renderStandingsTable(data) {
    const container = document.getElementById('standings-data-container');
    if (!container) return;

    // --- NEW: Filter out the "Reserve" team ---
    const filteredData = data.filter(team => team['Team Name'] !== 'Reserve');

    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = '<p class="text-gray-300">No team standings available for this season.</p>';
        return;
    }

    filteredData.sort((a, b) => (a['Rank'] || 99) - (b['Rank'] || 99));

    const headerMap = { 'Games Played (Internal)': 'GP' };
    const orderedHeaders = ['Rank', 'Team Name', 'Games Played (Internal)', 'Wins', 'Losses', 'Win %', 'Point Differential'];
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
            } else {
                const value = row[header] !== undefined ? row[header] : '';
                displayValue = value;
                if (header === 'Point Differential') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        displayValue = '+' + numValue;
                    }
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
        document.getElementById('standings-data-container').innerHTML = '<p class="text-red-500">Error: Standings data not configured.</p>';
        return;
    }

    document.getElementById('standings-data-container').innerHTML = '<p class="text-gray-300">Loading standings...</p>';

    // UPDATED to select all columns for reliability
    const tableData = await fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT A, B, C, D, E, F, G');
    if (tableData) {
        renderStandingsTable(tableData);
    }
}