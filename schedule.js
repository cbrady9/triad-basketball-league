// schedule.js

function renderSchedule(data) {
    const container = document.getElementById('schedule-data-container');
    if (!container) {
        console.error("Schedule container not found.");
        return;
    }
    container.innerHTML = ''; // Clear existing content

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-700">No schedule or results available for this season.</p>';
        return;
    }

    // Create a responsive grid for the game cards
    const scheduleGrid = document.createElement('div');
    scheduleGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    data.forEach(game => {
        const gameId = game['Game ID'];
        const team1 = game['Team 1'];
        const team2 = game['Team 2'];
        const team1Score = game['Team 1 Score'];
        const team2Score = game['Team 2 Score'];
        const gameDate = game['Date'];
        const gameTime = game['Time'];
        const location = game['Location'];
        const hasBeenPlayed = (game['Winner'] !== null && game['Winner'] !== '');

        let scoreOrTime;
        let resultClass = 'bg-gray-200 text-gray-800'; // Default for upcoming games

        if (hasBeenPlayed) {
            scoreOrTime = `<span class="font-bold">${team1Score} - ${team2Score}</span>`;
            // Highlight the winner
            if (team1Score > team2Score) {
                resultClass = 'bg-green-100 text-green-800';
            } else {
                resultClass = 'bg-green-100 text-green-800'; // Could be different for loser if desired
            }
        } else {
            scoreOrTime = `<span>${gameDate} - ${gameTime}</span>`;
        }

        // Each game is a clickable card
        const gameCard = `
            <a href="game-detail.html?gameId=${gameId}" class="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden">
                <div class="p-4">
                    <p class="text-sm text-gray-500 text-center mb-2">${location}</p>
                    <div class="flex justify-between items-center text-lg">
                        <span class="font-semibold">${team1}</span>
                        <span class="font-semibold">${team2}</span>
                    </div>
                </div>
                <div class="px-4 py-2 text-center text-sm ${resultClass}">
                    ${scoreOrTime}
                </div>
            </a>
        `;
        scheduleGrid.innerHTML += gameCard;
    });

    container.appendChild(scheduleGrid);
}

async function initializeSchedulePage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason); // Initialize season selector

    const scheduleGID = getGID('SCHEDULE_GID', currentSeason);

    if (!scheduleGID) {
        console.error("Schedule GID not found for current season:", currentSeason);
        document.getElementById('schedule-data-container').innerHTML = '<p class="text-red-500">Error: Schedule data not configured for this season.</p>';
        return;
    }

    document.getElementById('schedule-data-container').innerHTML = '<p class="text-gray-600">Loading schedule...</p>';

    // IMPORTANT: We now select specific columns, including 'Game ID' (column A) for linking
    const SCHEDULE_QUERY = 'SELECT A, B, C, D, E, F, G, H, I';
    const tableData = await fetchGoogleSheetData(SHEET_ID, scheduleGID, SCHEDULE_QUERY);

    if (tableData) {
        renderSchedule(tableData);
    } else {
        document.getElementById('schedule-data-container').innerHTML = '<p class="text-red-500">Failed to load schedule. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initializeSchedulePage);
window.initializePage = initializeSchedulePage; // For season selector