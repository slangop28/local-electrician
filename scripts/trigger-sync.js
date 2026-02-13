async function run() {
    try {
        console.log('Triggering sync...');
        const response = await fetch('http://localhost:3000/api/admin/sync-all?secret=admin-sync-secret-123', {
            method: 'POST'
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
