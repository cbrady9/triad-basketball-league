// transactions.js

const TRANSACTIONS_QUERY = 'SELECT *'; // Select all columns for transactions

function renderTransactionsTable(data) {
    const container = document.getElementById('transactions-data-container');
    if (!container) {
        console.error("Transactions container not found.");
        return;
    }
    container.innerHTML = ''; // Clear existing content

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No transactions available for this season.</p>';
        return;
    }

    let tableHTML = '<table class="min-w-full divide-y divide-gray-200"><thead><tr>';
    const headers = Object.keys(data[0]);

    headers.forEach(header => {
        tableHTML += `<th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${header}</th>`;
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
}

async function initializeTransactionsPage() {
    const currentSeason = getCurrentSeason();
    const transactionsGID = getGID('TRANSACTIONS_GID', currentSeason);

    if (!transactionsGID) {
        console.error("Transactions GID not found for current season:", currentSeason);
        document.getElementById('transactions-data-container').innerHTML = '<p class="text-red-500">Error: Transactions data not configured for this season. Please ensure the correct GID is in config.js.</p>';
        return;
    }

    document.getElementById('transactions-data-container').innerHTML = '<p class="text-gray-600">Loading transactions...</p>';

    const tableData = await fetchGoogleSheetData(SHEET_ID, transactionsGID, TRANSACTIONS_QUERY);
    if (tableData) {
        renderTransactionsTable(tableData);
    }
    createSeasonSelector(currentSeason);
}

document.addEventListener('DOMContentLoaded', initializeTransactionsPage);
window.initializePage = initializeTransactionsPage;