const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        // 1. Personnel Data & Skill Proficiency (for Heatmap and Top Performers)
        // We'll get the top 10 personnel by project count, but also their skill proficiencies
        const [personnelRows] = await db.query(`
            SELECT p.id, p.name, COUNT(pa.project_id) as project_count
            FROM personnel p
            LEFT JOIN project_assignments pa ON p.id = pa.personnel_id
            LEFT JOIN projects proj ON pa.project_id = proj.id
            WHERE proj.status IN ('Active', 'Planning') OR proj.id IS NULL
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
            SELECT s.id, s.name, COUNT(pr.project_id) as demand_count
            FROM skills s
            JOIN project_requirements pr ON s.id = pr.skill_id
            GROUP BY s.id
            ORDER BY demand_count DESC
            LIMIT 6
        `);

        // 4. Fetch Proficiencies for these top personnel and skills (The Heatmap Data)
        const personIds = personnelRows.map(p => p.id);
        const skillIds = skillDemand.map(s => s.id);

        let matrix = {};
        if (personIds.length > 0 && skillIds.length > 0) {
            const [proficiencyRows] = await db.query(`
                SELECT personnel_id, skill_id, proficiency_level
                FROM personnel_skills
                WHERE personnel_id IN (?) AND skill_id IN (?)
            `, [personIds, skillIds]);

            // Organize into a map: {personId: {skillId: level}}
            proficiencyRows.forEach(row => {
                if (!matrix[row.personnel_id]) matrix[row.personnel_id] = {};
                matrix[row.personnel_id][row.skill_id] = row.proficiency_level;
            });
        }

        // Attach skills to personnel objects
        const utilization = personnelRows.map(p => ({
            ...p,
            skills: matrix[p.id] || {}
        }));

        // 5. Calculate Top Performer based on Ratings (instead of just project count)
        const [topPerformerRows] = await db.query(`
            SELECT p.name, AVG(psr.rating) as avg_rating
            FROM personnel p
            JOIN project_skill_ratings psr ON p.id = psr.personnel_id
            GROUP BY p.id
            ORDER BY avg_rating DESC
            LIMIT 1
        `);
        const topPerformer = topPerformerRows.length > 0 ? topPerformerRows[0].name : (utilization[0]?.name || 'N/A');

        // 6. Personnel Utilization Forecast (Next 3 Months - Weekly)
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
            assignments.forEach(asgn => {
                const pStart = asgn.start_date ? new Date(asgn.start_date) : new Date(0);
                const pEnd = asgn.end_date ? new Date(asgn.end_date) : new Date(8640000000000000);

                if (pStart < week.end && pEnd >= week.start) {
                    dataPoint[asgn.name] = (dataPoint[asgn.name] || 0) + (asgn.allocation_pct || 100);
                } else {
                    dataPoint[asgn.name] = dataPoint[asgn.name] || 0;
                }
            });
            return dataPoint;
        });

        const allPersonnelNames = [...new Set(assignments.map(a => a.name))];
        const top5 = allPersonnelNames.slice(0, 5);

        const filteredForecast = forecast.map(f => {
            const clean = { week: f.week };
            top5.forEach(name => { clean[name] = f[name] || 0; });
            return clean;
        });

        res.json({
            utilization,
            projectStatus,
            skillDemand,
            topPerformer,
            utilizationForecast: filteredForecast,
            forecastKeys: top5
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
