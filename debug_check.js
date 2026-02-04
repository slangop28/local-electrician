const fetch = require('node-fetch');

async function checkDebug() {
    try {
        // We need to pass a city that we expect the electrician to be in. 
        // I'll try fetching without a city first to see all candidates, then with a common one if needed.
        // Actually the API I wrote takes ?city=... but returns all 'broadcastCandidates' regardless, just annotates 'matchCityQuery'.
        const res = await fetch('http://localhost:3000/api/debug-broadcast?city=test');
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error fetching debug:', e);
    }
}

checkDebug();
