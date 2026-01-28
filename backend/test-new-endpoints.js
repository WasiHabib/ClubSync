import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

console.log('🧪 Testing New API Endpoints\n');
console.log('='.repeat(70) + '\n');

async function testEndpoint(name, url, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        console.log(`Testing: ${name}`);
        console.log(`  URL: ${method} ${url}`);

        const response = await fetch(url, options);
        const data = await response.json();

        if (data.success) {
            console.log(`  ✅ Status: ${response.status} - Success`);
            console.log(`  📊 Data: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
            console.log(`  ❌ Status: ${response.status} - Failed`);
            console.log(`  Error: ${data.message}`);
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
}

async function runTests() {
    // Test 1: Player stats per season
    await testEndpoint(
        '1. Player Stats Per Season',
        `${BASE_URL}/players/1/stats/1`
    );

    // Test 2: Attribute search (find fast players)
    await testEndpoint(
        '2. Search Players by Attributes (Pace > 75)',
        `${BASE_URL}/players/search-by-attributes`,
        'POST',
        { minPace: 75 }
    );

    // Test 3: Attribute search (find strikers with good shooting)
    await testEndpoint(
        '3. Search Strikers with Shooting > 70',
        `${BASE_URL}/players/search-by-attributes`,
        'POST',
        { position: 'ST', minShooting: 70 }
    );

    // Test 4: Manager history for a club
    await testEndpoint(
        '4. Manager History for Club 1',
        `${BASE_URL}/clubs/1/manager-history`
    );

    // Test 5: Get all players for a club
    await testEndpoint(
        '5. Get All Players for Club 1',
        `${BASE_URL}/clubs/1/players`
    );

    // Test 6: League table (existing endpoint - verification)
    await testEndpoint(
        '6. League Table (Season 1)',
        `${BASE_URL}/analytics/league-table/1`
    );

    // Test 7: Match details with events (existing endpoint - verification)
    await testEndpoint(
        '7. Match Details with Events (Match 1)',
        `${BASE_URL}/matches/1`
    );

    console.log('='.repeat(70));
    console.log('✅ All endpoint tests completed!\n');
}

runTests().catch(console.error);
