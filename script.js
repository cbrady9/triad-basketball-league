// script.js (for index.html)

async function initializeHomePage() {
    const currentSeason = getCurrentSeason(); // Function from utils.js
    createSeasonSelector(currentSeason);     // Function from utils.js

    // Add any other specific initialization logic for your homepage here if needed.
    // For example, if you fetch some summary data or populate dynamic content
    // on your homepage, you would do it here.
}

document.addEventListener('DOMContentLoaded', initializeHomePage);
window.initializePage = initializeHomePage; // Make globally accessible for config.js