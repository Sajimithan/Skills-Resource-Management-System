const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Advanced Matching Algorithm
// This route calculates a multi-dimensional "Match Score" for personnel against a project.
// Drivers are:
// 1. Skill Fit (50-60%): Do they have the required skills at the right level?
// 2. Availability (30-40%): Do they have overlapping projects during the target timeframe?
// 3. Performance (20%): How have they been rated on these specific skills in the past?
router.get('/:projectId', async (req, res) => {
    const projectId = req.params.projectId;

    try {
        // ------------------------------------------------------------------
        // 1. Data Gathering Phase
        // Fetch project details, requirements, all personnel, and assignments
        // ------------------------------------------------------------------
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
            // Edge Case: Project has no requirements defined yet. Return everyone as a 100% fit.
            const [allPersonnel] = await db.query('SELECT * FROM personnel');
            return res.json({
                perfectMatch: allPersonnel.map(p => ({ ...p, fitScore: 100, utilization: 0, gaps: [], training: [] })),
                nearMatch: []
            });
        }

        const [personnel] = await db.query('SELECT * FROM personnel');

        // Identify who is already assigned to avoid duplicate recommendations
        const [alreadyAssigned] = await db.query(`
            SELECT personnel_id 
            FROM project_assignments 
            WHERE project_id = ?
        `, [projectId]);
        const assignedIds = new Set(alreadyAssigned.map(a => a.personnel_id));

        // Maps for fast lookups
        const [personnelSkills] = await db.query(`
            SELECT ps.personnel_id, ps.skill_id, ps.proficiency_level, s.name as skill_name
            FROM personnel_skills ps
            JOIN skills s ON ps.skill_id = s.id
        `);

        // Load historical performance data
        const [ratings] = await db.query('SELECT personnel_id, skill_id, rating FROM project_skill_ratings');
        const ratingsMap = {};
        ratings.forEach(r => {
            if (!ratingsMap[r.personnel_id]) ratingsMap[r.personnel_id] = {};
            if (!ratingsMap[r.personnel_id][r.skill_id]) ratingsMap[r.personnel_id][r.skill_id] = [];
            ratingsMap[r.personnel_id][r.skill_id].push(r.rating);
        });

        // Load existing assignments for date overlap calculation
        const [allAssignments] = await db.query(`
            SELECT pa.personnel_id, p.start_date, p.end_date, p.name as project_name, p.status
            FROM project_assignments pa
            JOIN projects p ON pa.project_id = p.id
            WHERE p.status IN ('Active', 'Planning')
        `);

        const pAssignmentsMap = {};
        allAssignments.forEach(a => {
            if (!pAssignmentsMap[a.personnel_id]) pAssignmentsMap[a.personnel_id] = [];
            pAssignmentsMap[a.personnel_id].push(a);
        });

        // ------------------------------------------------------------------
        // 2. Scoring Logic Phase
        // Iterate through every candidate and calculate metrics
        // ------------------------------------------------------------------
        const processedCandidates = personnel
            .filter(person => !assignedIds.has(person.id))
            .map(person => {
                const pSkills = personnelSkills.filter(ps => ps.personnel_id === person.id);
                const pAsgns = pAssignmentsMap[person.id] || [];
                const activeProjects = pAsgns.length;

                // --- Metric A: Time-Weighted Utilization ---
                // Calculates percentage of time blocked by other concurrent projects.
                const targetStart = project.start_date ? new Date(project.start_date) : null;
                const targetEnd = project.end_date ? new Date(project.end_date) : null;

                let utilizationPct = 0;
                let activeProjectsCount = 0;

                // Constants for Load heuristics (e.g., 1 project = 33% load)
                const WEEKLY_CAPACITY_HOURS = 45;
                const ESTIMATED_PROJECT_LOAD_HOURS = 15;
                const LOAD_RATIO = ESTIMATED_PROJECT_LOAD_HOURS / WEEKLY_CAPACITY_HOURS;

                if (targetStart && targetEnd) {
                    const targetDurationTime = targetEnd.getTime() - targetStart.getTime();
                    const targetDurationDays = targetDurationTime / (1000 * 3600 * 24);

                    if (targetDurationDays > 0) {
                        let totalWeightedLoad = 0;

                        pAsgns.forEach(asgn => {
                            const asgnStart = asgn.start_date ? new Date(asgn.start_date) : null;
                            const asgnEnd = asgn.end_date ? new Date(asgn.end_date) : null;

                            if (asgnStart && asgnEnd) {
                                // Calculate exact overlap window
                                const overlapStart = asgnStart > targetStart ? asgnStart : targetStart;
                                const overlapEnd = asgnEnd < targetEnd ? asgnEnd : targetEnd;

                                if (overlapStart < overlapEnd) {
                                    const overlapTime = overlapEnd.getTime() - overlapStart.getTime();
                                    const overlapDays = overlapTime / (1000 * 3600 * 24);

                                    // Weighted contribution to total load
                                    const overlapRatio = overlapDays / targetDurationDays;
                                    totalWeightedLoad += (overlapRatio * LOAD_RATIO);
                                    activeProjectsCount++;
                                }
                            }
                        });
                        utilizationPct = Math.min(Math.round(totalWeightedLoad * 100), 100);
                    }
                } else {
                    // Fallback: Simple count heuristic if dates are missing
                    activeProjectsCount = pAsgns.length;
                    utilizationPct = Math.min(activeProjectsCount * 33, 100);
                }

                // --- Metric B: Skill Fit Score ---
                // Evaluation of skill possession and proficiency levels.
                let totalMaxScore = requirements.length * 5; // Max 5 points per skill
                let currentScore = 0;
                let gaps = [];
                let training = [];
                let matched_skills = [];

                let totalRatingPoints = 0;
                let ratedSkillsCount = 0;

                // Collect historic ratings for generic performance fallback
                let allHistoricRatings = [];
                if (ratingsMap[person.id]) {
                    Object.values(ratingsMap[person.id]).forEach(skillRatings => {
                        allHistoricRatings.push(...skillRatings);
                    });
                }

                requirements.forEach(req => {
                    const pSkill = pSkills.find(ps => ps.skill_id === req.skill_id);

                    // Get specific performance history for THIS skill
                    let avgRating = 0;
                    if (ratingsMap[person.id] && ratingsMap[person.id][req.skill_id]) {
                        const scores = ratingsMap[person.id][req.skill_id];
                        avgRating = scores.reduce((a, b) => a + b, 0) / scores.length;

                        totalRatingPoints += avgRating;
                        ratedSkillsCount++;
                    }

                    if (pSkill) {
                        if (pSkill.proficiency_level >= req.min_proficiency_level) {
                            // Perfect Match: +5 points
                            currentScore += 5;
                            matched_skills.push({ ...pSkill, matchType: 'perfect', avgRating: avgRating || null });
                        } else {
                            // Proficiency Gap: Penalize score based on diff
                            const diff = req.min_proficiency_level - pSkill.proficiency_level;
                            currentScore += Math.max(0, 5 - (diff * 2));

                            gaps.push({ skill: req.skill_name, type: 'proficiency', current: pSkill.proficiency_level, required: req.min_proficiency_level });
                            training.push(`Upskill ${req.skill_name}: Level ${pSkill.proficiency_level} -> ${req.min_proficiency_level}`);
                            matched_skills.push({ ...pSkill, matchType: 'gap', avgRating: avgRating || null });
                        }
                    } else {
                        // Missing Skill: 0 points
                        gaps.push({ skill: req.skill_name, type: 'missing', required: req.min_proficiency_level });
                        training.push(`Course: ${req.skill_name} Fundamentals`);
                    }
                });

                const fitScore = Math.round((currentScore / totalMaxScore) * 100);

                // --- Metric C: Performance Score ---
                // Based on proven track record (manager ratings)
                let performanceScore = null;
                if (ratedSkillsCount > 0) {
                    const avgAcrossRequired = totalRatingPoints / ratedSkillsCount;
                    performanceScore = Math.round((avgAcrossRequired / 5) * 100); // 5-star scale
                } else if (allHistoricRatings.length > 0) {
                    const generalAvg = allHistoricRatings.reduce((a, b) => a + b, 0) / allHistoricRatings.length;
                    performanceScore = Math.round((generalAvg / 5) * 100);
                }

                // --- Final Calculation: Overall Efficiency ---
                const availabilityScore = 100 - utilizationPct;
                let overallMatch = 0;

                if (performanceScore !== null) {
                    // With History: Fit (50%) + Avail (30%) + Perf (20%)
                    overallMatch = Math.round((fitScore * 0.5) + (availabilityScore * 0.3) + (performanceScore * 0.2));
                } else {
                    // Without History: Fit (60%) + Avail (40%)
                    overallMatch = Math.round((fitScore * 0.6) + (availabilityScore * 0.4));
                }

                return {
                    ...person,
                    fitScore,
                    utilizationPct,
                    performanceScore: ratedSkillsCount > 0 ? performanceScore : null,
                    overallMatch,
                    active_projects_count: activeProjectsCount,
                    gaps,
                    training,
                    matched_skills
                };
            });

        // ------------------------------------------------------------------
        // 3. Categorization Phase
        // Sort and group candidates based on Fit Score thresholds
        // ------------------------------------------------------------------
        const perfectMatchList = processedCandidates
            .filter(c => c.fitScore >= 80)
            .sort((a, b) => b.fitScore - a.fitScore);

        const nearMatchList = processedCandidates
            .filter(c => c.fitScore >= 50 && c.fitScore < 80)
            .sort((a, b) => b.fitScore - a.fitScore);

        res.json({
            project,
            requirements,
            perfectMatch: perfectMatchList,
            nearMatch: nearMatchList
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
