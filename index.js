// index.js (example - do this for each relevant page's JS file)

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
window.initializePage = async function() {
    console.log('Re-initializing page for new season...');
    const newSeason = getCurrentSeason(); // Get the updated season
    // Add code here to clear existing data and reload content for the newSeason
    // For example:
    // document.getElementById('data-container').innerHTML = 'Loading...';
    // await fetchDataAndRender(newSeason); // Call your data fetching/rendering function
};