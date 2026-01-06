const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all skills
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM skills');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create skill
router.post('/', async (req, res) => {
    const { name, category, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Skill name is required' });

    try {
        const [result] = await db.query(
            'INSERT INTO skills (name, category, description) VALUES (?, ?, ?)',
            [name, category, description]
        );
        res.status(201).json({ id: result.insertId, name, category, description });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Skill already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update skill
router.put('/:id', async (req, res) => {
    const { name, category, description } = req.body;
    try {
        await db.query(
            'UPDATE skills SET name = ?, category = ?, description = ? WHERE id = ?',
            [name, category, description, req.params.id]
        );
        res.json({ message: 'Skill updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete skill
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM skills WHERE id = ?', [req.params.id]);
        res.json({ message: 'Skill deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
