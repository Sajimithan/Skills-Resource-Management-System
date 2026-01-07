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

        // Get Ratings Map
        const [ratings] = await db.query('SELECT personnel_id, skill_id, rating FROM project_skill_ratings');
        const ratingsMap = {};
        ratings.forEach(r => {
            if (!ratingsMap[r.personnel_id]) ratingsMap[r.personnel_id] = {};
            if (!ratingsMap[r.personnel_id][r.skill_id]) ratingsMap[r.personnel_id][r.skill_id] = [];
            ratingsMap[r.personnel_id][r.skill_id].push(r.rating);
        });

        // Get Utilization & Detailed Assignments (to check date overlaps)
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

        // 3. Process Matching Logic - Filter out already assigned
        const processedCandidates = personnel
            .filter(person => !assignedIds.has(person.id))
            .map(person => {
                const pSkills = personnelSkills.filter(ps => ps.personnel_id === person.id);
                const pAsgns = pAssignmentsMap[person.id] || [];
                const activeProjects = pAsgns.length;

                // Date Overlap Detection & Weighted Utilization Calculation
                const targetStart = project.start_date ? new Date(project.start_date) : null;
                const targetEnd = project.end_date ? new Date(project.end_date) : null;

                let utilizationPct = 0;
                let activeProjectsCount = 0; // For pure count display

                // Constraints
                const WEEKLY_CAPACITY_HOURS = 45; // 9hrs * 5 days
                const ESTIMATED_PROJECT_LOAD_HOURS = 15; // Assume 15hrs/week per project
                const LOAD_RATIO = ESTIMATED_PROJECT_LOAD_HOURS / WEEKLY_CAPACITY_HOURS; // 0.333...

                if (targetStart && targetEnd) {
                    const targetDurationTime = targetEnd.getTime() - targetStart.getTime();
                    const targetDurationDays = targetDurationTime / (1000 * 3600 * 24);

                    if (targetDurationDays > 0) {
                        let totalWeightedLoad = 0;

                        pAsgns.forEach(asgn => {
                            const asgnStart = asgn.start_date ? new Date(asgn.start_date) : null;
                            const asgnEnd = asgn.end_date ? new Date(asgn.end_date) : null;

                            if (asgnStart && asgnEnd) {
                                // Check overlap
                                const overlapStart = asgnStart > targetStart ? asgnStart : targetStart;
                                const overlapEnd = asgnEnd < targetEnd ? asgnEnd : targetEnd;

                                if (overlapStart < overlapEnd) {
                                    // There is an overlap
                                    const overlapTime = overlapEnd.getTime() - overlapStart.getTime();
                                    const overlapDays = overlapTime / (1000 * 3600 * 24);

                                    // Calculate how much of the target project's life is affected by this overlap
                                    // ex: Project is 12 weeks. Overlap is 3 weeks. Ratio is 0.25.
                                    const overlapRatio = overlapDays / targetDurationDays;

                                    // Add to total load
                                    // Contribution = (Portion of Time) * (Load Intensity)
                                    totalWeightedLoad += (overlapRatio * LOAD_RATIO);

                                    activeProjectsCount++; // Count this as an active/conflicting project
                                }
                            }
                        });

                        // Convert to Percentage (0.33 -> 33%)
                        utilizationPct = Math.min(Math.round(totalWeightedLoad * 100), 100);
                    }
                } else {
                    // Fallback if no dates set: Use simple count heuristic
                    activeProjectsCount = pAsgns.length;
                    utilizationPct = Math.min(activeProjectsCount * 33, 100);
                }

                let matchScore = 0;
                let totalMaxScore = requirements.length * 5; // Max 5 points per skill
                let currentScore = 0;
                let gaps = [];
                let training = [];
                let matched_skills = [];

                // Performance Score Vars
                let totalRatingPoints = 0;
                let ratedSkillsCount = 0;

                // General historic ratings (fallback)
                let allHistoricRatings = [];
                if (ratingsMap[person.id]) {
                    Object.values(ratingsMap[person.id]).forEach(skillRatings => {
                        allHistoricRatings.push(...skillRatings);
                    });
                }

                requirements.forEach(req => {
                    const pSkill = pSkills.find(ps => ps.skill_id === req.skill_id);

                    // Get average rating for this skill
                    let avgRating = 0;
                    let ratingCount = 0;
                    if (ratingsMap[person.id] && ratingsMap[person.id][req.skill_id]) {
                        const scores = ratingsMap[person.id][req.skill_id];
                        avgRating = scores.reduce((a, b) => a + b, 0) / scores.length;
                        ratingCount = scores.length;

                        totalRatingPoints += avgRating;
                        ratedSkillsCount++;
                    }

                    if (pSkill) {
                        // Has skill
                        if (pSkill.proficiency_level >= req.min_proficiency_level) {
                            // Full Match for this skill
                            currentScore += 5; // Max points
                            matched_skills.push({ ...pSkill, matchType: 'perfect', avgRating: avgRating || null });
                        } else {
                            // Proficiency Gap
                            // Points based on how close they are
                            const diff = req.min_proficiency_level - pSkill.proficiency_level;
                            currentScore += Math.max(0, 5 - (diff * 2)); // Penalty

                            gaps.push({ skill: req.skill_name, type: 'proficiency', current: pSkill.proficiency_level, required: req.min_proficiency_level });
                            training.push(`Upskill ${req.skill_name}: Level ${pSkill.proficiency_level} -> ${req.min_proficiency_level}`);
                            matched_skills.push({ ...pSkill, matchType: 'gap', avgRating: avgRating || null });
                        }
                    } else {
                        // Missing skill
                        gaps.push({ skill: req.skill_name, type: 'missing', required: req.min_proficiency_level });
                        training.push(`Course: ${req.skill_name} Fundamentals`);
                    }
                });

                // Calculate Fit Score (Skill Proficiency Match)
                const fitScore = Math.round((currentScore / totalMaxScore) * 100);

                // Calculate Performance Score (Based on ratings 1-5)
                let performanceScore = null;
                if (ratedSkillsCount > 0) {
                    // Weighted average for the skills needed
                    const avgAcrossRequired = totalRatingPoints / ratedSkillsCount;
                    performanceScore = Math.round((avgAcrossRequired / 5) * 100);
                } else if (allHistoricRatings.length > 0) {
                    // Fallback to general performance across other skills
                    const generalAvg = allHistoricRatings.reduce((a, b) => a + b, 0) / allHistoricRatings.length;
                    performanceScore = Math.round((generalAvg / 5) * 100);
                }

                // Weighted Overall Match
                const availabilityScore = 100 - utilizationPct;
                let overallMatch = 0;

                if (performanceScore !== null) {
                    // If we have history (specific or general)
                    overallMatch = Math.round((fitScore * 0.5) + (availabilityScore * 0.3) + (performanceScore * 0.2));
                } else {
                    // No history at all
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

        // 4. Categorize - Sort by Overall Match now!
        const perfectMatchList = processedCandidates
            .filter(c => c.overallMatch >= 80)
            .sort((a, b) => b.overallMatch - a.overallMatch);

        const nearMatchList = processedCandidates
            .filter(c => c.overallMatch >= 50 && c.overallMatch < 80)
            .sort((a, b) => b.overallMatch - a.overallMatch);

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
