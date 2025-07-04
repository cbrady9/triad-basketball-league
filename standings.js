document.addEventListener('DOMContentLoaded', initializeStandingsPage);
window.initializePage = initializeStandingsPage;

function renderStandingsTable(data) {
    const container = document.getElementById('standings-data-container');
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-300">No team standings available for this season.</p>';
        return;
    }

    // --- NEW: Multi-level sorting for accurate rankings ---
    data.sort((a, b) => {
        // First, sort by Win % descending
        const winPctDiff = (b['Win %'] || 0) - (a['Win %'] || 0);
        if (winPctDiff !== 0) {
            return winPctDiff;
        }
        // If Win % is tied, sort by Point Differential descending
        return (b['Point Differential'] || 0) - (a['Point Differential'] || 0);
    });

    // A map to rename headers for display
    const headerMap = {
        'Games Played (Internal)': 'GP' // Renaming to GP for a cleaner look
    };

    // Define the exact order of headers to display
    const orderedHeaders = ['Rank', 'Team Name', 'Games Played (Internal)', 'Wins', 'Losses', 'Win %', 'Point Differential'];

    let tableHTML = '<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800">';
    tableHTML += '<tr>';

    orderedHeaders.forEach(header => {
        const displayHeader = headerMap[header] || header;
        tableHTML += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">${displayHeader}</th>`;
    });
    tableHTML += '</tr></thead>';

    tableHTML += '<tbody class="bg-gray-800 divide-y divide-gray-700">';

    // Loop through the now-sorted data
    data.forEach((row, index) => {
        tableHTML += '<tr class="hover:bg-gray-700">';

        // Loop through our ordered headers to build the row
        orderedHeaders.forEach(header => {
            let displayValue = '';

            if (header === 'Rank') {
                // Generate the rank based on the sorted index
                displayValue = index + 1;
            } else {
                const value = row[header] !== undefined ? row[header] : '';
                displayValue = value;

                // Add a '+' to positive Point Differentials
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

    // --- UPDATED to select all columns for a complete table ---
    const tableData = await fetchGoogleSheetData(SHEET_ID, standingsGID, 'SELECT *');
    if (tableData) {
        renderStandingsTable(tableData);
    }
}