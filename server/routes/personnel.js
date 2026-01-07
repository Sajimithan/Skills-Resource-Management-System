const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all personnel
// Get all personnel with their skills
router.get('/', async (req, res) => {
    try {
        // 1. Fetch all personnel
        const [personnel] = await db.query('SELECT * FROM personnel');

        // 2. Fetch all personnel skills
        const [allSkills] = await db.query(`
            SELECT ps.personnel_id, s.name, ps.proficiency_level
            FROM personnel_skills ps
            JOIN skills s ON ps.skill_id = s.id
        `);

        // 3. Map skills to personnel
        const results = personnel.map(p => {
            const rowSkills = allSkills
                .filter(ps => ps.personnel_id == p.id) // Use loose equality for safety
                .map(ps => ({
                    name: ps.name,
                    level: ps.proficiency_level
                }));
            return { ...p, skills: rowSkills };
        });

        console.log(`Mapped ${results.length} personnel with skills.`);
        if (results.length > 0) console.log("Example record skills:", JSON.stringify(results[0].skills));

        res.json(results);
    } catch (err) {
        console.error("Fetch Personnel Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get single personnel with skills
router.get('/:id', async (req, res) => {
    try {
        const [personnel] = await db.query('SELECT * FROM personnel WHERE id = ?', [req.params.id]);
        if (personnel.length === 0) return res.status(404).json({ message: 'Personnel not found' });

        const [skills] = await db.query(`
            SELECT s.id, s.name, s.category, ps.proficiency_level 
            FROM skills s
            JOIN personnel_skills ps ON s.id = ps.skill_id
            WHERE ps.personnel_id = ?
        `, [req.params.id]);

        res.json({ ...personnel[0], skills });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create personnel
router.post('/', async (req, res) => {
    const { name, email, role, experience_level } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and Email are required' });

    try {
        const [result] = await db.query(
            'INSERT INTO personnel (name, email, role, experience_level) VALUES (?, ?, ?, ?)',
            [name, email, role, experience_level || 'Junior']
        );
        res.status(201).json({ id: result.insertId, name, email, role, experience_level });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update personnel
router.put('/:id', async (req, res) => {
    const { name, email, role, experience_level } = req.body;
    try {
        await db.query(
            'UPDATE personnel SET name = ?, email = ?, role = ?, experience_level = ? WHERE id = ?',
            [name, email, role, experience_level, req.params.id]
        );
        res.json({ message: 'Personnel updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete personnel
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM personnel WHERE id = ?', [req.params.id]);
        res.json({ message: 'Personnel deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign skill to personnel
router.post('/:id/skills', async (req, res) => {
    const { skill_id, proficiency_level } = req.body;
    // expect skill_id is numeric ID.
    // proficiency_level: 1-5 or Text? Convert if text.
    let level = proficiency_level;

    // Simple text to number mapping just in case
    const levels = { 'Beginner': 1, 'Junior': 2, 'Intermediate': 3, 'Advanced': 4, 'Expert': 5 };
    if (typeof proficiency_level === 'string' && levels[proficiency_level]) {
        level = levels[proficiency_level];
    }

    try {
        await db.query(
            'INSERT INTO personnel_skills (personnel_id, skill_id, proficiency_level) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE proficiency_level = ?',
            [req.params.id, skill_id, level, level]
        );
        res.status(201).json({ message: 'Skill assigned successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
