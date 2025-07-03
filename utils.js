// utils.js

// Function to fetch data from Google Sheet
async function fetchGoogleSheetData(sheetId, gid, query) {
    if (!sheetId || !gid || !query) {
        console.error("Missing sheetId, gid, or query for data fetch.");
        return null;
    }
    const URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&tq=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(URL);
        const text = await response.text();
        // Adjust substring if needed based on the Google API response format
        // Common is 47, but sometimes 42 or other values might be needed if format changes
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const columns = json.table.cols.map(col => col.label);
        const rows = json.table.rows.map(row => row.c.map(cell => cell ? cell.v : ''));

        const data = rows.map(row => {
            let obj = {};
            columns.forEach((col, index) => {
                obj[col] = row[index];
            });
            return obj;
        });
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// Function to create and manage the season selector dropdown
function createSeasonSelector(currentSeason) {
    const headerNav = document.querySelector('header nav ul'); // Assuming your nav list is in header nav ul
    if (!headerNav) {
        console.error("Header navigation not found to append season selector.");
        return;
    }

    // Check if selector already exists to prevent duplicates on partial page reloads
    let existingSelector = document.getElementById('season-selector-li');
    if (existingSelector) {
        existingSelector.remove();
    }

    const seasons = Object.keys(SEASON_CONFIGS).sort((a, b) => parseInt(b) - parseInt(a)); // Sort seasons descending
    if (seasons.length < 2) { // Only create if there's more than one season to choose from
        return;
    }

    const seasonSelectorLi = document.createElement('li');
    seasonSelectorLi.id = 'season-selector-li'; // Add an ID to easily find and remove
    const select = document.createElement('select');
    select.id = 'season-dropdown';
    select.className = 'bg-blue-700 text-white p-2 rounded'; // Tailwind classes

    seasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = `Season ${season}`;
        if (season === currentSeason) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    select.addEventListener('change', (event) => {
        const selectedSeason = event.target.value;
        localStorage.setItem('selectedSeason', selectedSeason);
        // Reload the current page to apply the new season or call initialization function
        // Check if the current page has an initializePage function and call it
        if (typeof window.initializePage === 'function') {
            window.initializePage();
        } else {
            // Fallback for pages that might not have a specific initializePage (e.g., if you add more later)
            // or if initializePage isn't assigned globally for some reason
            console.warn("window.initializePage not found, page might not update dynamically. Reloading...");
            location.reload();
        }
    });

    seasonSelectorLi.appendChild(select);
    headerNav.appendChild(seasonSelectorLi);
}

// Function to get the current selected season from localStorage or default
function getCurrentSeason() {
    // Default to the highest season if nothing is stored
    const seasons = Object.keys(SEASON_CONFIGS).sort((a, b) => parseInt(b) - parseInt(a));
    const defaultSeason = seasons.length > 0 ? seasons[0] : null;
    return localStorage.getItem('selectedSeason') || defaultSeason;
}

// Function to get the GID for a specific data type and season
function getGID(dataType, season) {
    return SEASON_CONFIGS[season] ? SEASON_CONFIGS[season][dataType] : null;

    // Add this to your utils.js file

function sortTable(header, container) {
    const table = container.querySelector('table');
    if (!table) {
        console.error("Table element not found for sorting.");
        return;
    }
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error("Table body not found for sorting.");
        return;
    }
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(header.parentNode.children).indexOf(header);
    const isAsc = header.classList.contains('asc');

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
            return isAsc ? aText.localeCompare(bText, undefined, { sensitivity: 'base' }) : bText.localeCompare(aText, undefined, { sensitivity: 'base' });
        }
    });

    // Clear existing sort classes from all headers
    const allSortableHeaders = container.querySelectorAll('th.sortable');
    allSortableHeaders.forEach(h => {
        h.classList.remove('asc', 'desc');
    });

    // Apply new sort class to the clicked header
    header.classList.toggle(isAsc ? 'desc' : 'asc');

    // Re-append sorted rows to the tbody
    rows.forEach(row => tbody.appendChild(row));
}
}