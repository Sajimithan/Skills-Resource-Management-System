const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Advanced Matching Algorithm
router.get('/:projectId', async (req, res) => {
    const projectId = req.params.projectId;

    try {
        // 1. Fetch Project Details & Requirements
        const [projectRows] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (projectRows.length === 0) return res.status(404).json({ error: 'Project not found' });
        const project = projectRows[0];

        const [requirements] = await db.query(`
            SELECT pr.skill_id, pr.min_proficiency_level, s.name as skill_name
            FROM project_requirements pr
            JOIN skills s ON pr.skill_id = s.id
            WHERE pr.project_id = ?
        `, [projectId]);

        if (requirements.length === 0) {
            // No requirements, everyone is a candidate
            const [allPersonnel] = await db.query('SELECT * FROM personnel');
            return res.json({
                perfectMatch: allPersonnel.map(p => ({ ...p, fitScore: 100, utilization: 0, gaps: [], training: [] })),
                nearMatch: []
            });
        }

        // 2. Fetch All Personnel with their Skills & Utilization
        // Get Basic Info
        const [personnel] = await db.query('SELECT * FROM personnel');

        // Get already assigned personnel for THIS project
        const [alreadyAssigned] = await db.query(`
            SELECT personnel_id 
            FROM project_assignments 
            WHERE project_id = ?
        `, [projectId]);

        const assignedIds = new Set(alreadyAssigned.map(a => a.personnel_id));

        // Get Skills Map
        const [personnelSkills] = await db.query(`
            SELECT ps.personnel_id, ps.skill_id, ps.proficiency_level, s.name as skill_name
            FROM personnel_skills ps
            JOIN skills s ON ps.skill_id = s.id
        `);

        // Get Utilization (Active Projects Count)
        // Assuming 'Active' or 'Planning' projects count towards utilization
        const [assignments] = await db.query(`
            SELECT pa.personnel_id, COUNT(*) as active_count
            FROM project_assignments pa
            JOIN projects p ON pa.project_id = p.id
            WHERE p.status IN ('Active', 'Planning')
            GROUP BY pa.personnel_id
        `);

        const utilizationMap = {};
        assignments.forEach(a => utilizationMap[a.personnel_id] = a.active_count);

        // 3. Process Matching Logic - Filter out already assigned
        const processedCandidates = personnel
            .filter(person => !assignedIds.has(person.id))
            .map(person => {
                const pSkills = personnelSkills.filter(ps => ps.personnel_id === person.id);
                const activeProjects = utilizationMap[person.id] || 0;

                // Utilization Score (Heuristic: 1 project = 33%, 3 = 100%)
                const utilizationPct = Math.min(activeProjects * 33, 100);

                let matchScore = 0;
                let totalMaxScore = requirements.length * 5; // Max 5 points per skill
                let currentScore = 0;
                let gaps = [];
                let training = [];
                let matched_skills = [];

                requirements.forEach(req => {
                    const pSkill = pSkills.find(ps => ps.skill_id === req.skill_id);

                    if (pSkill) {
                        // Has skill
                        if (pSkill.proficiency_level >= req.min_proficiency_level) {
                            // Full Match for this skill
                            currentScore += 5; // Max points
                            matched_skills.push({ ...pSkill, matchType: 'perfect' });
                        } else {
                            // Proficiency Gap
                            // Points based on how close they are
                            const diff = req.min_proficiency_level - pSkill.proficiency_level;
                            currentScore += Math.max(0, 5 - (diff * 2)); // Penalty

                            gaps.push({ skill: req.skill_name, type: 'proficiency', current: pSkill.proficiency_level, required: req.min_proficiency_level });
                            training.push(`Upskill ${req.skill_name}: Level ${pSkill.proficiency_level} -> ${req.min_proficiency_level}`);
                            matched_skills.push({ ...pSkill, matchType: 'gap' });
                        }
                    } else {
                        // Missing skill
                        gaps.push({ skill: req.skill_name, type: 'missing', required: req.min_proficiency_level });
                        training.push(`Course: ${req.skill_name} Fundamentals`);
                    }
                });

                // Calculate Fit Score
                const fitScore = Math.round((currentScore / totalMaxScore) * 100);

                return {
                    ...person,
                    fitScore,
                    utilizationPct,
                    active_projects_count: activeProjects,
                    gaps,
                    training,
                    matched_skills
                };
            });

        // 4. Categorize
        const perfectMatch = processedCandidates.filter(c => c.gaps.length === 0 && c.fitScore >= 80).sort((a, b) => b.fitScore - a.fitScore);
        const nearMatch = processedCandidates.filter(c => c.gaps.length > 0 && c.fitScore > 40).sort((a, b) => b.fitScore - a.fitScore);

        res.json({
            project,
            requirements,
            perfectMatch,
            nearMatch
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
