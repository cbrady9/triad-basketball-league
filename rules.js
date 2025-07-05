document.addEventListener('DOMContentLoaded', () => {
    const currentSeason = getCurrentSeason();
    const container = document.getElementById('rules-container');
    if (!container) return;

    // This object holds the HTML content for each season's rules
    const RULES_CONTENT = {
        "S01": `
            <h2 class="text-3xl font-bold mb-6 text-gray-100">Season 1 Rules</h2>
            <div class="prose prose-invert max-w-none text-gray-300">
                <blockquote>
                    <p>All rules can be modified by a "gentleman's agreement" between both teams before the game begins. If no agreement is made, these official guidelines apply.</p>
                </blockquote>
                
                <h3>Scoring & Game Flow</h3>
                <ul>
                    <li><strong>Possession:</strong> Games are "make-it, take-it."</li>
                    <li><strong>Game Point:</strong> The first team to 15 points wins. You must win by 2.</li>
                    <li><strong>Scoring System:</strong> Baskets are worth 1 and 2 points.</li>
                    <li><strong>Checking Up:</strong> The ball is live and can be scored immediately after being checked at the top of the key.</li>
                    <li><strong>Score Confirmation:</strong> Both teams must agree on the current score before each check-up.</li>
                    <li><strong>Halftime:</strong> A brief halftime may be called when the first team reaches 7 points, if either team requests it.</li>
                </ul>

                <h3 class="mt-8">Clearing the Ball</h3>
                <ul>
                    <li>After a defensive rebound where the shot <li><strong>hits the rim</strong>, the ball must be taken back (cleared) behind the two-point line.</li>
                    <li>On a defensive rebound where the shot <li><strong>does not hit the rim</strong> (an "airball"), the ball does not need to be cleared and can be scored immediately.</li>
                </ul>

                <h3 class="mt-8">Fouls & Disputes</h3>
                <ul>
                    <li><strong>Officiating:</strong> Players are expected to call their own fouls.</li>
                    <li><strong>Stoppages:</strong> Any other stoppage of play must be agreed upon by both teams.</li>
                    <li><strong>Dispute Resolution:</strong> If teams cannot agree on a call, the "prosecuting" party (the team that wants the call) will shoot one free throw. If the shot is made, the call goes their way. If the shot is missed, the call goes to the "defending" party.</li>
                </ul>
            </div>
        `,
        "S02": `
            <h2 class="text-3xl font-bold mb-6 text-gray-100">Season 2 Rules</h2>
            <p class="text-gray-400">Rules for Season 2 have not yet been determined.</p>
        `
    };

    // Display the content for the current season, or a default message
    const contentToDisplay = RULES_CONTENT[currentSeason] || '<p class="text-red-500">Rules for this season are not available.</p>';
    container.innerHTML = contentToDisplay;
});