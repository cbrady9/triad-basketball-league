// google-sheets-api.js

/**
 * Fetches data from a specific Google Sheet tab using the Google Sheets API.
 * Requires public access to the sheet.
 * @param {string} sheetId The ID of the Google Spreadsheet.
 * @param {string} gid The GID (tab ID) of the specific sheet/tab.
 * @param {string} query A Google Visualization API Query Language string (e.g., "SELECT *").
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of objects,
 * where each object represents a row and keys are column headers.
 */
async function fetchGoogleSheetData(sheetId, gid, query) {
    // Construct the Google Sheets API URL for the specified GID and query
    // This uses the Google Visualization API endpoint which allows for SQL-like queries
    const baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}`;
    const url = `${baseUrl}&tq=${encodeURIComponent(query)}`;

    console.log("Fetching data from URL:", url);

    try {
        const response = await fetch(url);
        // Google Visualization API returns data in a specific format, typically starting with "google.visualization.Query.setResponse("
        const text = await response.text();

        // Extract the JSON part from the response
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}') + 1;
        const jsonString = text.substring(jsonStartIndex, jsonEndIndex);

        const data = JSON.parse(jsonString);
        if (data.status === 'ok' && data.table) {
            const columns = data.table.cols.map(col => col.label || col.id); // Use label if available, otherwise id
            const rows = data.table.rows;

            const parsedData = rows.map(row => {
                const rowObject = {};
                row.c.forEach((cell, index) => {
                    // cell.v is the value, cell.f is the formatted value (useful for dates, numbers)
                    // Use cell.f if it exists, otherwise fall back to cell.v
                    rowObject[columns[index]] = cell && cell.v !== null ? (cell.f !== undefined ? cell.f : cell.v) : null;
                });
                return rowObject;
            });
            return parsedData;
        } else {
            console.error('Google Sheets API response status not OK or table not found:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching or parsing Google Sheets data:', error);
        return null;
    }
}