// ** Configuration for your Google Sheet **
const SHEET_ID = '18lQt9cD2icb-K6UQxTWqfbI7R4L84cT_l8lvUtiqGDU'; // Your Master Sheet ID
const TEAMS_GID = '2001178505'; // GID for the 'Teams (AUTOMATED)' tab

// The Google Visualization API query.
// 'SELECT A, B, C, D' means select columns A, B, C, and D.
// Adjust these column letters based on where your data is in the 'Teams (AUTOMATED)' sheet.
// For example, if 'Team Name' is in column A, 'Wins' in B, 'Losses' in C, 'Point Differential' in D.
const TEAMS_QUERY = 'SELECT A, B, C, D'; // Adjust as needed!

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
        // The Google Visualization API response wraps JSON in a function call
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);

        if (data.table && data.table.rows) {
            return data.table; // Returns the table object containing cols and rows
        } else {
            console.warn('No data table or rows found in response:', data);
            return null;
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

function renderTeamsTable(tableData) {
    const container = document.getElementById('teams-data-container');
    if (!container || !tableData || !tableData.rows || tableData.rows.length === 0) {
        container.innerHTML = '<p class="text-gray-600">No team data available.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200 shadow overflow-hidden sm:rounded-lg';

    // Create table header
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    const headerRow = document.createElement('tr');

    // Extract column labels from tableData.cols
    const headers = tableData.cols.map(col => col.label || col.id); // Use label if available, otherwise id

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';

    tableData.rows.forEach(rowData => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50'; // Add hover effect

        // Iterate through cells for each row
        rowData.c.forEach(cell => {
            const td = document.createElement('td');
            td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';

            // Check if cell exists and has a formatted value 'f' or raw value 'v'
            if (cell) {
                td.textContent = cell.f !== undefined ? cell.f : (cell.v !== undefined ? cell.v : '');
            } else {
                td.textContent = ''; // Handle empty cells
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

// Function to run when the DOM is fully loaded
async function initializeTeamsPage() {
    const tableData = await fetchGoogleSheetData(SHEET_ID, TEAMS_GID, TEAMS_QUERY);
    if (tableData) {
        renderTeamsTable(tableData);
    }
}

// Attach the initialization function to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', initializeTeamsPage);