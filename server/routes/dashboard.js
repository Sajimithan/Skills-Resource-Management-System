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

        // 4. Personnel Utilization Forecast (Next 3 Months - Weekly)
        // We'll calculate load for top 5 personnel
        const [assignments] = await db.query(`
            SELECT p.id, p.name, proj.start_date, proj.end_date, pa.allocation_pct
            FROM project_assignments pa
            JOIN personnel p ON pa.personnel_id = p.id
            JOIN projects proj ON pa.project_id = proj.id
            WHERE proj.status IN ('Active', 'Planning')
            AND (proj.end_date >= CURRENT_DATE OR proj.end_date IS NULL)
        `);

        const weeks = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const start = new Date(today);
            start.setDate(today.getDate() + (i * 7));
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            weeks.push({ start, end, label: `W${i + 1}` });
        }

        const forecast = weeks.map(week => {
            const dataPoint = { week: week.label };
            // Group by artist/personnel
            assignments.forEach(asgn => {
                const pStart = asgn.start_date ? new Date(asgn.start_date) : new Date(0);
                const pEnd = asgn.end_date ? new Date(asgn.end_date) : new Date(8640000000000000); // Far future

                // Check overlap
                if (pStart < week.end && pEnd >= week.start) {
                    dataPoint[asgn.name] = (dataPoint[asgn.name] || 0) + (asgn.allocation_pct || 100);
                } else {
                    dataPoint[asgn.name] = dataPoint[asgn.name] || 0;
                }
            });
            return dataPoint;
        });

        // Filter to only include top 5 personnel in forecast keys (to keep chart clean)
        const allPersonnel = [...new Set(assignments.map(a => a.name))];
        const top5 = allPersonnel.slice(0, 5);

        const filteredForecast = forecast.map(f => {
            const clean = { week: f.week };
            top5.forEach(name => { clean[name] = f[name] || 0; });
            return clean;
        });

        res.json({
            utilization,
            projectStatus,
            skillDemand,
            utilizationForecast: filteredForecast,
            forecastKeys: top5
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
