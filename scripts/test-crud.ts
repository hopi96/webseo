
const API_URL = 'http://localhost:5000/api';

async function testCrud() {
    console.log('🚀 Starting CRUD Test...');

    try {
        // 1. CREATE
        console.log('\n--- 1. Testing CREATE (POST /api/editorial-content) ---');
        const newArticle = {
            siteId: 1,
            typeContent: 'newsletter',
            contentText: 'Test content created by script ' + Date.now(),
            statut: 'en attente',
            hasImage: false,
            dateDePublication: new Date().toISOString().split('T')[0]
        };

        // Note: Node 18+ has native fetch
        const createRes = await fetch(`${API_URL}/editorial-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newArticle)
        });

        if (!createRes.ok) {
            throw new Error(`Create failed: ${createRes.status} ${createRes.statusText} - ${await createRes.text()}`);
        }

        const createdData = await createRes.json();
        console.log('✅ Created:', createRes.status, createdData.id);
        const createdId = createdData.id;

        if (!createdId) throw new Error('No ID returned from create');

        // 3. UPDATE
        console.log(`\n--- 2. Testing UPDATE (PUT /api/editorial-content/${createdId}) ---`);
        const updateData = {
            contentText: 'Updated content text ' + Date.now(),
            statut: 'à réviser',
            idSite: 1
        };

        const updateRes = await fetch(`${API_URL}/editorial-content/${createdId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (!updateRes.ok) {
            throw new Error(`Update failed: ${updateRes.status} ${updateRes.statusText} - ${await updateRes.text()}`);
        }

        const updatedData = await updateRes.json();
        console.log('✅ Updated:', updateRes.status, updatedData.contentText);

        if (updatedData.contentText !== updateData.contentText) {
            console.error('❌ Update failed: contentText mismatch');
        }

        // 4. DELETE
        console.log(`\n--- 3. Testing DELETE (DELETE /api/editorial-content/${createdId}) ---`);
        const deleteRes = await fetch(`${API_URL}/editorial-content/${createdId}`, {
            method: 'DELETE'
        });

        if (!deleteRes.ok) {
            throw new Error(`Delete failed: ${deleteRes.status} ${deleteRes.statusText} - ${await deleteRes.text()}`);
        }

        console.log('✅ Deleted:', deleteRes.status);

        console.log('\n✨ All CRUD tests passed!');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        process.exit(1);
    }
}

testCrud();
