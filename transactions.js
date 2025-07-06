document.addEventListener('DOMContentLoaded', initializeTransactionsPage);
window.initializePage = initializeTransactionsPage;

function renderTransactions(data) {
    const container = document.getElementById('transactions-container');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <img src="https://images.undraw.co/undraw_transfer_money_re_6o1h.svg" alt="No transactions" class="mx-auto w-40 h-40 mb-4 opacity-50">
                <p class="text-lg text-gray-400">No transactions have been recorded yet.</p>
            </div>
        `;
        return;
    }

    // Group all movements by their Transaction ID
    const groupedTransactions = data.reduce((acc, row) => {
        const id = row['Transaction ID'];
        if (!acc[id]) {
            acc[id] = {
                date: row['Date'],
                type: row['Type'],
                moves: []
            };
        }
        acc[id].moves.push(row);
        return acc;
    }, {});

    container.innerHTML = ''; // Clear loading message

    // Loop through each grouped transaction and build a card
    for (const id in groupedTransactions) {
        const transaction = groupedTransactions[id];
        const teamsInvolved = {};

        // Figure out which players each team acquired and lost
        transaction.moves.forEach(move => {
            const oldTeam = move['Old Team'];
            const newTeam = move['New Team'];
            const playerName = move['Player Name'];

            if (oldTeam) {
                if (!teamsInvolved[oldTeam]) teamsInvolved[oldTeam] = { acquired: [], lost: [] };
                teamsInvolved[oldTeam].lost.push(playerName);
            }
            if (newTeam) {
                if (!teamsInvolved[newTeam]) teamsInvolved[newTeam] = { acquired: [], lost: [] };
                teamsInvolved[newTeam].acquired.push(playerName);
            }
        });

        // Build the HTML for the card
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
            transactionCard += `
                <div class="bg-gray-700/50 p-3 rounded-md">
                    <h4 class="font-semibold text-gray-200 mb-2">${teamName}</h4>
                    <div class="text-sm space-y-1">
            `;
            if (moves.acquired.length > 0) {
                transactionCard += `<p class="text-gray-400">Acquired:</p>`;
                moves.acquired.forEach(player => {
                    transactionCard += `<p class="text-green-400 ml-2">&#x25B2; ${player}</p>`;
                });
            }
            if (moves.lost.length > 0) {
                transactionCard += `<p class="text-gray-400 ${moves.acquired.length > 0 ? 'mt-2' : ''}">Lost:</p>`;
                moves.lost.forEach(player => {
                    transactionCard += `<p class="text-red-400 ml-2">&#x25BC; ${player}</p>`;
                });
            }
            transactionCard += `</div></div>`;
        }

        transactionCard += `</div></div>`;
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