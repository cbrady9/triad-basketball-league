document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('season-links-container');
    if (!container) return;

    container.innerHTML = ''; // Clear loading message

    // Get all season keys from your config file (e.g., "S01", "S02")
    const seasons = Object.keys(SEASON_CONFIGS).sort();

    seasons.forEach(seasonId => {
        const seasonName = `Season ${parseInt(seasonId.substring(1))}`;

        const link = document.createElement('a');
        link.href = 'home.html'; // All links go to the main dashboard page
        link.className = 'block w-64 mx-auto bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-sky-500 transition duration-300';
        link.textContent = seasonName;

        // Add an event listener to save the selected season
        link.addEventListener('click', (event) => {
            // We don't need to prevent default, as it's navigating to a new page
            localStorage.setItem('selectedSeason', seasonId);
        });

        container.appendChild(link);
    });
});