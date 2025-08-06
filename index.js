// Example: Display Live Updates for the Leaderboard
const leaderboard = document.getElementById('leaderboard');

function updateLeaderboard() {
    leaderboard.innerHTML = `
        <h2>Leaderboard</h2>
        <ul>
            <li>Team A: 10 Points</li>
            <li>Team B: 8 Points</li>
            <li>Team C: 5 Points</li>
        </ul>
    `;
}

// Simulate an update every 5 seconds
setInterval(updateLeaderboard, 5000);