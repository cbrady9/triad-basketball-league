// ** Configuration for your Google Sheet **
const SHEET_ID = '18lQt9cD2icb-K6UQxTWqfbI7R4L84cT_l8lvUtiqGDU'; // Your Master Sheet ID (This should be consistent across all your JS files)
const TEAMSTATS_GID = '1640890982'; // GID for the 'Team Stats (AUTOMATED)' tab. <--- IMPORTANT: Replace this!

// The Google Visualization API query.
// Adjust these column letters based on where your data is in the 'Team Stats (AUTOMATED)' sheet.
const TEAMSTATS_QUERY = 'SELECT A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X'; // Adjust as needed for your Team Stats columns!

// Global variables to keep track of sorting state
let currentSortColumn = -1; // -1 means no column sorted
let currentSortDirection = 'asc'; // 'asc' or 'desc'
let originalTableData = null; // Store the original fetched data for re-sorting

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

function renderTeamStatsTable(tableData) { // <-- Function name changed
    const container = document.getElementById('team-stats-data-container'); // <-- ID changed
    if (!container || !tableData || !tableData.rows || tableData.rows.length === 0) {
        container.innerHTML = '<p class="text-gray-600">No team stats data available.</p>'; // Updated message
        return;
    }

    originalTableData = tableData; // Store original data

    container.innerHTML = ''; // Clear previous table if any

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200 shadow overflow-hidden sm:rounded-lg';

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
        
        th.addEventListener('click', () => {
            sortTable(table, index, originalTableData.rows); // Pass original data rows
        });

        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    tbody.id = 'team-stats-tbody'; // <-- ID changed
    table.appendChild(tbody);

    populateTableBody(tbody, originalTableData.rows); // Initial population
    
    container.appendChild(table);
}

// Helper function to populate/re-populate tbody
function populateTableBody(tbody, rows) {
    tbody.innerHTML = ''; // Clear existing rows

    rows.forEach(rowData => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        rowData.c.forEach(cell => {
            const td = document.createElement('td');
            td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';

            if (cell) {
                td.textContent = cell.f !== undefined ? cell.f : (cell.v !== undefined ? cell.v : '');
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

// Sorting function
function sortTable(table, columnIndex, dataRows) {
    const tbody = document.getElementById('team-stats-tbody'); // <-- ID changed
    if (!tbody || !dataRows) return;

    const headers = Array.from(table.querySelectorAll('th.sortable'));

    if (currentSortColumn === columnIndex) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc';
        currentSortColumn = columnIndex;
    }

    headers.forEach(th => {
        th.classList.remove('asc', 'desc');
    });

    const currentHeader = headers[columnIndex];
    if (currentHeader) {
        currentHeader.classList.add(currentSortDirection);
    }

    dataRows.sort((rowA, rowB) => {
        const cellA = rowA.c[columnIndex];
        const cellB = rowB.c[columnIndex];

        let valA = cellA ? (cellA.v !== undefined ? cellA.v : (cellA.f !== undefined ? cellA.f : '')) : '';
        let valB = cellB ? (cellB.v !== undefined ? cellB.v : (cellB.f !== undefined ? cellB.f : '')) : '';

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
            return currentSortDirection === 'asc' ? numA - numB : numB - numA;
        } else {
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        }
    });

    populateTableBody(tbody, dataRows); // Re-populate with sorted data
}

// Function to run when the DOM is fully loaded
async function initializeTeamStatsPage() { // <-- Function name changed
    const tableData = await fetchGoogleSheetData(SHEET_ID, TEAMSTATS_GID, TEAMSTATS_QUERY);
    if (tableData) {
        renderTeamStatsTable(tableData); // <-- Function call changed
    }
}

// Attach the initialization function to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', initializeTeamStatsPage);