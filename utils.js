// utils.js
console.log('utils.js loaded and executing.');

// fetchGoogleSheetData: Fetches data from a Google Sheet and parses it into an array of objects.
async function fetchGoogleSheetData(sheetId, gid, query) {
    const URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&headers=1&tq=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(URL);
        const text = await response.text();

        // This regex extracts the JSON part from the Google Visualization API response
        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
        if (jsonMatch && jsonMatch[1]) {
            const json = JSON.parse(jsonMatch[1]);

            if (json.status === 'error') {
                console.error("Google Sheets API Error:", json.errors);
                return null; // Return null on API error
            }

            const columns = json.table.cols.map(col => col.label || col.id); // Use label or id for column name
            const rows = json.table.rows.map(row => row.c.map(cell => cell ? (cell.f !== undefined ? cell.f : cell.v) : ''));

            const data = rows.map(row => {
                let obj = {};
                columns.forEach((col, index) => {
                    obj[col] = row[index];
                });
                return obj;
            });
            return data;
        } else {
            console.error("Failed to parse Google Sheets response:", text);
            return null;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// getCurrentSeason: Gets the current season, FORCING S01 for now.
function getCurrentSeason() {
    console.log('Inside getCurrentSeason. Forcing S01 for all interactions.');
    const forcedSeason = 'S01'; // <-- Set your desired default/forced season key here (e.g., 'S01')
    localStorage.setItem('selectedSeason', forcedSeason); // Make sure localStorage reflects this
    console.log('getCurrentSeason returning (forced):', forcedSeason);
    return forcedSeason;
}

// getGID: Retrieves the GID for a specific tab and season from SEASON_CONFIGS.
function getGID(tabName, season) {
    if (typeof SEASON_CONFIGS === 'undefined') {
        console.error("SEASON_CONFIGS is not defined.");
        return null;
    }
    if (!SEASON_CONFIGS[season]) {
        console.warn(`Configuration for season "${season}" not found.`);
        return null;
    }
    return SEASON_CONFIGS[season][tabName];
}

// createSeasonSelector: Creates and appends a season dropdown to the header, showing only S01 for now.
function createSeasonSelector(currentSeason) {
}


// sortTable: Generic function to sort an HTML table by a clicked header.
function sortTable(header, container) {
    const table = container.querySelector('table');
    if (!table) {
        console.error("Sortable table element not found within container.");
        return;
    }
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error("Table body not found for sorting.");
        return;
    }
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(header.parentNode.children).indexOf(header);
    const isAsc = header.classList.contains('asc'); // Check if currently ascending

    rows.sort((a, b) => {
        const aText = a.children[columnIndex].textContent.trim();
        const bText = b.children[columnIndex].textContent.trim();

        // Try to convert to number for numeric sorting, otherwise do string comparison
        const aValue = parseFloat(aText);
        const bValue = parseFloat(bText);

        if (!isNaN(aValue) && !isNaN(bValue)) {
            // If both are numbers, sort numerically
            return isAsc ? aValue - bValue : bValue - aValue;
        } else {
            // Otherwise, sort alphabetically (case-insensitive for robustness)
            // localeCompare handles various character sets and sorting rules
            return isAsc ? aText.localeCompare(bText, undefined, { sensitivity: 'base' }) : bText.localeCompare(aText, undefined, { sensitivity: 'base' });
        }
    });

    // Clear existing sort classes from all headers in the same table
    const allSortableHeaders = header.parentNode.querySelectorAll('th.sortable');
    allSortableHeaders.forEach(h => {
        h.classList.remove('asc', 'desc');
    });

    // Apply new sort class to the clicked header
    // If it was ascending, next click will be descending, and vice-versa
    header.classList.toggle(isAsc ? 'desc' : 'asc');

    // Re-append sorted rows to the tbody
    rows.forEach(row => tbody.appendChild(row));
}

function initializeMobileMenu() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// Ensure the mobile menu is initialized on every page load
document.addEventListener('DOMContentLoaded', initializeMobileMenu);
// Formats a number to one decimal place (e.g., 15 -> "15.0")
function formatStat(value) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return value; // Return original value if it's not a number (like 'N/A')
    }
    return num.toFixed(1);
}