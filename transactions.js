// transactions.js

// transactions.js (example - do this for each relevant page's JS file)

document.addEventListener('DOMContentLoaded', () => {
    // Get the current season (will now correctly come from utils.js)
    const currentSeason = getCurrentSeason();

    // Initialize the season selector dropdown
    createSeasonSelector(currentSeason);

    // Call your page-specific initialization function here
    // This function should then use 'currentSeason' to fetch and display data
    // For example:
    // initializeHomePage(currentSeason); // If you have a specific function
    // Or if the page just loads data based on getCurrentSeason()
    // loadPageData();
});

// OPTIONAL: If you want the page to re-render data immediately when season changes
// You must make your page's main initialization function globally accessible.
// Replace 'initializeHomePage' with the actual name of your main page function.
// If you don't have a specific `initializePage` function for this page,
// you might need to structure your page's data loading inside this global function.
window.initializePage = async function () {
    console.log('Re-initializing page for new season...');
    const newSeason = getCurrentSeason(); // Get the updated season
    // Add code here to clear existing data and reload content for the newSeason
    // For example:
    // document.getElementById('data-container').innerHTML = 'Loading...';
    // await fetchDataAndRender(newSeason); // Call your data fetching/rendering function
};

const TRANSACTIONS_QUERY = 'SELECT A, B, C, D'; // Select all columns for transactions

function renderTransactionsTable(data) {
    const container = document.getElementById('transactions-data-container');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <img src="https://images.undraw.co/undraw_transfer_money_re_6o1h.svg" alt="No transactions" class="mx-auto w-40 h-40 mb-4 opacity-50">
                <p class="text-lg text-gray-400">No transactions have been recorded yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    let tableHTML = '<div class="overflow-x-auto border border-gray-700 rounded-lg"><table class="min-w-full divide-y divide-gray-700">';
    tableHTML += '<thead class="bg-gray-800">';
    tableHTML += '<tr>';
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        tableHTML += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody class="bg-gray-800 divide-y divide-gray-700">';

    data.forEach(row => {
        tableHTML += '<tr class="hover:bg-gray-700">';
        headers.forEach(header => {
            // UPDATED: This now handles null values correctly
            const value = row[header] ?? ''; // Use the nullish coalescing operator
            tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${value}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></div>';
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