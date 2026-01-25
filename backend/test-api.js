import axios from 'axios';

async function testAPI() {
    try {
        console.log('🧪 Testing API endpoints...\n');
        
        // Test health endpoint
        const health = await axios.get('http://localhost:5000/health');
        console.log('✅ Health check:', health.data.status);
        
        // Test players endpoint
        const players = await axios.get('http://localhost:5000/api/players');
        console.log(`✅ Players endpoint: ${players.data.count} players found`);
        console.log('📋 Sample data:', players.data.data.slice(0, 2));
        
        // Test clubs endpoint
        const clubs = await axios.get('http://localhost:5000/api/clubs');
        console.log(`✅ Clubs endpoint: ${clubs.data.count} clubs found`);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAPI();
