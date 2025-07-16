document.addEventListener('DOMContentLoaded', initializeTransactionsPage);
window.initializePage = initializeTransactionsPage;

function renderTransactions(data) {
    const container = document.getElementById('transactions-container');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-center py-12"><img src="https://images.undraw.co/undraw_transfer_money_re_6o1h.svg" ...></div>`;
        return;
    }

    const groupedTransactions = data.reduce((acc, row) => {
        const id = row['Transaction ID'];
        if (!acc[id]) {
            acc[id] = { date: row['Date'], type: row['Type'], moves: [] };
        }
        acc[id].moves.push(row);
        return acc;
    }, {});

    container.innerHTML = '';

    for (const id in groupedTransactions) {
        const transaction = groupedTransactions[id];
        const teamsInvolved = {};
        const otherAssets = [];

        // Separate player movements from other assets like picks/swaps
        transaction.moves.forEach(move => {
            if (move['Asset Type'] === 'Player') {
                const fromTeam = move['From Team'];
                const toTeam = move['To Team'];
                const playerName = move['Asset Details'];

                if (fromTeam) {
                    if (!teamsInvolved[fromTeam]) teamsInvolved[fromTeam] = { acquired: [], lost: [] };
                    teamsInvolved[fromTeam].lost.push(playerName);
                }
                if (toTeam) {
                    if (!teamsInvolved[toTeam]) teamsInvolved[toTeam] = { acquired: [], lost: [] };
                    teamsInvolved[toTeam].acquired.push(playerName);
                }
            } else {
                // It's a pick or a swap, add it to our other assets list
                otherAssets.push(move);
            }
        });

        let transactionCard = `
            <div class="border border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-center border-b border-gray-600 pb-2 mb-3">
                    <h3 class="font-bold text-lg text-sky-400">${transaction.type}</h3>
                    <p class="text-sm text-gray-400">${transaction.date}</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        `;

        for (const teamName in teamsInvolved) {
            const moves = teamsInvolved[teamName];
            const teamLink = `team-detail.html?teamName=${encodeURIComponent(teamName)}`;
            transactionCard += `
                <div class="bg-gray-700/50 p-3 rounded-md">
                    <a href="${teamLink}" class="font-semibold text-gray-200 mb-2 inline-block hover:underline">${teamName}</a>
                    <div class="text-sm space-y-1">
            `;
            if (moves.acquired.length > 0) {
                transactionCard += `<p class="text-gray-400">Acquired:</p>`;
                moves.acquired.forEach(player => {
                    const playerLink = `player-detail.html?playerName=${encodeURIComponent(player)}`;
                    transactionCard += `<p class="text-green-400 ml-2">&#x25B2; <a href="${playerLink}" class="hover:underline">${player}</a></p>`;
                });
            }
            if (moves.lost.length > 0) {
                transactionCard += `<p class="text-gray-400 ${moves.acquired.length > 0 ? 'mt-2' : ''}">Lost:</p>`;
                moves.lost.forEach(player => {
                    const playerLink = `player-detail.html?playerName=${encodeURIComponent(player)}`;
                    transactionCard += `<p class="text-red-400 ml-2">&#x25BC; <a href="${playerLink}" class="hover:underline">${player}</a></p>`;
                });
            }
            transactionCard += `</div></div>`;
        }
        transactionCard += `</div>`;

        // --- NEW: Section to display other traded assets like picks ---
        if (otherAssets.length > 0) {
            transactionCard += `<div class="mt-4 border-t border-gray-700 pt-3">
                <h4 class="font-semibold text-sm text-gray-300 mb-2">Other Assets:</h4>
                <ul class="list-disc list-inside text-sm text-gray-400 space-y-1">
            `;
            otherAssets.forEach(asset => {
                transactionCard += `<li>${asset['To Team']} acquired the ${asset['Asset Details']} from ${asset['From Team']}.</li>`;
            });
            transactionCard += `</ul></div>`;
        }
        transactionCard += `</div>`;
        container.innerHTML += transactionCard;
    }
}

async function initializeTransactionsPage() {
    const currentSeason = getCurrentSeason();
    createSeasonSelector(currentSeason);

    const transactionsGID = getGID('TRANSACTIONS_GID', currentSeason);
    if (!transactionsGID) {
        document.getElementById('transactions-container').innerHTML = '<p class="text-red-500">Transactions not configured for this season.</p>';
        return;
    }

    const transactionsData = await fetchGoogleSheetData(SHEET_ID, transactionsGID, 'SELECT * WHERE B IS NOT NULL ORDER BY B DESC');

    if (transactionsData) {
        renderTransactions(transactionsData);
    } else {
        document.getElementById('transactions-container').innerHTML = '<p class="text-red-500">Failed to load transactions.</p>';
    }
}