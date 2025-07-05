document.addEventListener('DOMContentLoaded', initializeAwardsPage);
window.initializePage = initializeAwardsPage;

function renderAwardsHistory(data) {
    const container = document.getElementById('awards-history-container');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <img src="https://images.undraw.co/undraw_winners_re_wr1l.svg" alt="No awards yet" class="mx-auto w-40 h-40 mb-4 opacity-50">
                <p class="text-lg text-gray-400">No weekly awards have been given out yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ''; // Clear loading message

    data.forEach(award => {
        const playerName = award['Player of the Week'];
        const teamName = award['Team of the Week'];
        const playerLink = `player-detail.html?playerName=${encodeURIComponent(playerName)}`;
        const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;

        const awardCard = `
            <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 class="text-2xl font-semibold mb-4 text-sky-400 border-b border-gray-600 pb-2">${award.Week} Awards</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                        <p class="text-sm font-bold uppercase tracking-wider text-gray-400">Player of the Week</p>
                        <a href="${playerLink}" class="text-xl font-semibold text-gray-100 hover:underline mt-1 inline-block">${playerName}</a>
                        <p class="text-sm text-gray-300 mt-1 italic">"${award['Player Blurb']}"</p>
                    </div>
                    <div>
                        <p class="text-sm font-bold uppercase tracking-wider text-gray-400">Team of the Week</p>
                        <a href="${teamLink}" class="text-xl font-semibold text-gray-100 hover:underline mt-1 inline-block">${teamName}</a>
                        <p class="text-sm text-gray-300 mt-1 italic">"${award['Team Blurb']}"</p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += awardCard;
    });
}

async function initializeAwardsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const weeklyAwardsGID = getGID('WEEKLY_AWARDS_GID', currentSeason);
    if (!weeklyAwardsGID) {
        document.getElementById('awards-history-container').innerHTML = '<p class="text-red-500">Weekly Awards not configured for this season.</p>';
        return;
    }

    // Fetch all awards, ordered by Week descending so the newest is at the top
    const awardsData = await fetchGoogleSheetData(SHEET_ID, weeklyAwardsGID, 'SELECT * ORDER BY A DESC');

    if (awardsData) {
        renderAwardsHistory(awardsData);
    } else {
        document.getElementById('awards-history-container').innerHTML = '<p class="text-red-500">Failed to load awards history.</p>';
    }
}