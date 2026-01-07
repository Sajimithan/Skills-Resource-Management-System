const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        // 1. Personnel Utilization (Active Projects Count per Person)
        const [utilization] = await db.query(`
            SELECT p.name, COUNT(pa.project_id) as project_count
            FROM personnel p
            LEFT JOIN project_assignments pa ON p.id = pa.personnel_id
            LEFT JOIN projects proj ON pa.project_id = proj.id
            WHERE proj.status = 'Active' OR proj.status IS NULL
            GROUP BY p.id
            ORDER BY project_count DESC
            LIMIT 10
        `);

        // 2. Project Status Distribution
        const [projectStatus] = await db.query(`
            SELECT status, COUNT(*) as count
            FROM projects
            GROUP BY status
        `);

        // 3. Skill Demand (Most required skills)
        const [skillDemand] = await db.query(`
            SELECT s.name, COUNT(pr.project_id) as demand_count
            FROM skills s
            JOIN project_requirements pr ON s.id = pr.skill_id
            GROUP BY s.id
            ORDER BY demand_count DESC
            LIMIT 5
        `);

        res.json({
            utilization,
            projectStatus,
            skillDemand
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
