document.addEventListener('DOMContentLoaded', initializeSeasonAwardsPage);
window.initializePage = initializeSeasonAwardsPage;

function renderSeasonAwards(data) {
    const container = document.getElementById('season-awards-container');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 col-span-full">
                <img src="https://images.undraw.co/undraw_winners_re_wr1l.svg" alt="No awards yet" class="mx-auto w-40 h-40 mb-4 opacity-50">
                <p class="text-lg text-gray-400">No season awards have been announced yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = ''; // Clear loading message

    data.forEach(award => {
        const winnerName = award['Winner Name'];
        const winnerLink = `player-detail.html?playerName=${encodeURIComponent(winnerName)}`;
        const headshotUrl = award['Winner Headshot URL'] || 'https://i.imgur.com/8so6K5A.png';

        const awardCard = `
            <div class="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center">
                <h3 class="text-xl font-bold text-sky-400 uppercase tracking-wider">${award['Award Name']}</h3>
                <img src="${headshotUrl}" alt="${winnerName}" class="w-24 h-24 rounded-full mx-auto my-4 border-2 border-gray-600 object-cover bg-gray-700">
                <a href="${winnerLink}" class="text-2xl font-semibold text-white hover:underline">${winnerName}</a>
                <p class="text-gray-400 mt-2 italic">"${award['Winner Blurb']}"</p>
            </div>
        `;
        container.innerHTML += awardCard;
    });
}

async function initializeSeasonAwardsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const seasonAwardsGID = getGID('SEASON_AWARDS_GID', currentSeason);
    if (!seasonAwardsGID) {
        document.getElementById('season-awards-container').innerHTML = '<p class="text-red-500">Season Awards not configured.</p>';
        return;
    }

    // Fetch awards only for the current season
    const awardsData = await fetchGoogleSheetData(SHEET_ID, seasonAwardsGID, `SELECT * WHERE A = '${currentSeason}'`);

    if (awardsData) {
        renderSeasonAwards(awardsData);
    } else {
        document.getElementById('season-awards-container').innerHTML = '<p class="text-red-500">Failed to load season awards.</p>';
    }
}