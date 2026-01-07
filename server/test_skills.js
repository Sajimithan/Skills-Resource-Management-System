const db = require('./config/db');

async function testSkillFlow() {
    try {
        console.log("1. Creating Test Person...");
        const [res] = await db.query('INSERT INTO personnel (name, email, role, experience_level) VALUES (?, ?, ?, ?)',
            ['Test script User', 'testscript@example.com', 'Tester', 'Junior']);
        const personId = res.insertId;
        console.log("Created Person ID:", personId);

        console.log("2. Assigning Skill ID 1 (React) to Person...");
        await db.query(
            'INSERT INTO personnel_skills (personnel_id, skill_id, proficiency_level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE proficiency_level = ?',
            [personId, 1, 5, 5]
        );
        console.log("Skill Assigned.");

        console.log("3. Fetching with Aggregation Query...");
        const query = `
            SELECT p.*, 
                   GROUP_CONCAT(CONCAT(s.name, ':', ps.proficiency_level) SEPARATOR ',') as skills_string
            FROM personnel p
            LEFT JOIN personnel_skills ps ON p.id = ps.personnel_id
            LEFT JOIN skills s ON ps.skill_id = s.id
            WHERE p.id = ?
            GROUP BY p.id
        `;
        const [rows] = await db.query(query, [personId]);
        console.log("Raw Row:", rows[0]);

        if (rows[0].skills_string) {
            console.log("Validation: SUCCESS. Skills found:", rows[0].skills_string);
        } else {
            console.error("Validation: FAILED. No skills string found.");
        }

        console.log("4. Cleanup...");
        await db.query('DELETE FROM personnel WHERE id = ?', [personId]);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}

testSkillFlow();
