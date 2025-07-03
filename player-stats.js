// ** Configuration for your Google Sheet **
const SHEET_ID = '18lQt9cD2icb-K6UQxTWqfbI7R4L84cT_l8lvUtiqGDU'; // Your Master Sheet ID
const PLAYERSTATS_GID = '340059940'; // GID for the 'Player Stats (AUTOMATED)' tab

// The Google Visualization API query.
const PLAYERSTATS_QUERY = 'SELECT A, B, C, P, Q, R, S, T, U, V, W, X'; // Adjust as needed!

async function fetchGoogleSheetData(sheetId, gid, query) {
    const baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`;
    const queryParams = new URLSearchParams({
        gid: gid,
        tq: query
    });
    const url = baseUrl + queryParams.toString();

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);

        if (data.table && data.table.rows) {
            return data.table;
        } else {
            console.warn('No data table or rows found in response:', data);
            return null;
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Global variables to keep track of sorting state
let currentSortColumn = -1; // -1 means no column sorted
let currentSortDirection = 'asc'; // 'asc' or 'desc'
let originalTableData = null; // Store the original fetched data for re-sorting

function renderPlayerStatsTable(tableData) {
    const container = document.getElementById('playerstats-data-container');
    if (!container || !tableData || !tableData.rows || tableData.rows.length === 0) {
        container.innerHTML = '<p class="text-gray-600">No player stats data available.</p>';
        return;
    }

    // Store the original data globally for sorting
    originalTableData = tableData;

    // Clear previous table if any
    container.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200 shadow overflow-hidden sm:rounded-lg';

    // Create table header
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    const headerRow = document.createElement('tr');

    const headers = tableData.cols.map(col => col.label || col.id);

    headers.forEach((headerText, index) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable';
        th.textContent = headerText;
        th.dataset.columnIndex = index;
        
        // Add click event listener for sorting
        th.addEventListener('click', () => {
            // Pass the original tableData.rows to sortTable
            sortTable(table, index, originalTableData.rows);
        });

        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    tbody.id = 'player-stats-tbody';
    table.appendChild(tbody);

    // Initial population of the table body with original data
    populateTableBody(tbody, originalTableData.rows);
    
    container.appendChild(table);
}

// Helper function to populate/re-populate tbody
function populateTableBody(tbody, rows) {
    tbody.innerHTML = ''; // Clear existing rows

    rows.forEach(rowData => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        // Assuming rowData.c contains the cells for the row
        rowData.c.forEach(cell => {
            const td = document.createElement('td');
            td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';

            if (cell) {
                td.textContent = cell.f !== undefined ? cell.f : (cell.v !== undefined ? cell.v : '');
                // Store raw value for sorting, preferring raw 'v' then formatted 'f'
                td.dataset.sortValue = cell.v !== undefined ? cell.v : (cell.f !== undefined ? cell.f : '');
            } else {
                td.textContent = '';
                td.dataset.sortValue = '';
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

// Sorting function (corrected)
function sortTable(table, columnIndex, dataRows) {
    const tbody = document.getElementById('player-stats-tbody');
    if (!tbody || !dataRows) return;

    const headers = Array.from(table.querySelectorAll('th.sortable'));

    // Determine sort direction
    if (currentSortColumn === columnIndex) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc'; // Default to ascending for new column
        currentSortColumn = columnIndex;
    }

    // Remove existing sort indicators
    headers.forEach(th => {
        th.classList.remove('asc', 'desc');
    });

    // Add sort indicator to current column
    const currentHeader = headers[columnIndex];
    if (currentHeader) {
        currentHeader.classList.add(currentSortDirection);
    }

    // Sort the original dataRows array
    dataRows.sort((rowA, rowB) => {
        const cellA = rowA.c[columnIndex];
        const cellB = rowB.c[columnIndex];

        let valA = cellA ? (cellA.v !== undefined ? cellA.v : (cellA.f !== undefined ? cellA.f : '')) : '';
        let valB = cellB ? (cellB.v !== undefined ? cellB.v : (cellB.f !== undefined ? cellB.f : '')) : '';

        // Attempt to convert to number for numerical sorting
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
            // Numeric comparison
            return currentSortDirection === 'asc' ? numA - numB : numB - numA;
        } else {
            // String comparison (case-insensitive)
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        }
    });

    // Re-populate the table body with the now sorted dataRows
    populateTableBody(tbody, dataRows);
}

// Function to run when the DOM is fully loaded
async function initializePlayerStatsPage() {
    const tableData = await fetchGoogleSheetData(SHEET_ID, PLAYERSTATS_GID, PLAYERSTATS_QUERY);
    if (tableData) {
        renderPlayerStatsTable(tableData);
    }
}

// Attach the initialization function to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', initializePlayerStatsPage);