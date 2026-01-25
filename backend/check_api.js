import fetch from 'node-fetch';

const checkApi = async () => {
    try {
        console.log('📡 Checking API: http://localhost:5000/api/players');
        const response = await fetch('http://localhost:5000/api/players');

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Status: OK');
            console.log(`📊 Player Count: ${data.count}`);
        } else {
            console.log(`❌ API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            try {
                const json = JSON.parse(text);
                console.log('Error Message:', json.message);
                console.log('Stack Trace:', json.stack);
            } catch (e) {
                console.log('Response Body:', text);
            }
        }
    } catch (error) {
        console.error('❌ Connection Error:', error.message);
    }
};

checkApi();
