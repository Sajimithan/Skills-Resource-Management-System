import React, { useEffect, useState } from 'react';
import { projectsApi, skillsApi, matchingApi } from '../services/api';
import { Plus, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MagicBento from '../components/MagicBento';
import PillNav from '../components/PillNav';
import ConfirmationModal from '../components/ConfirmationModal';

const Projects = () => {
    const projectBentoItems = [
        { title: 'Project Tracking', description: 'Real-time status updates at a glance.', label: 'Management' },
        { title: 'Skill Matching', description: 'Find the perfect personnel for every task.', label: 'AI Tools' },
        {
            title: 'Timeline Views',
            description: 'Stay on top of critical deadlines.',
            label: 'Efficiency',
            onClick: () => setActiveProjectTab('timeline')
        }
    ];

    const [projects, setProjects] = useState([]);
    const [ratings, setRatings] = useState({}); // { personnelId: { skillId: rating } }
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [skills, setSkills] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '', start_date: '', end_date: '', status: 'Planning', requirements: [] });

    // Requirement inputs in modal
    const [newReq, setNewReq] = useState({ skill_id: '', min_proficiency_level: '1' });

    // Matching State
    const [matchingProject, setMatchingProject] = useState(null);
    const [matchResults, setMatchResults] = useState({ perfectMatch: [], nearMatch: [], requirements: [] });
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('perfect'); // 'perfect' or 'near'
    const [expandedMatchingRows, setExpandedMatchingRows] = useState({});
    const [activeProjectTab, setActiveProjectTab] = useState('active'); // 'active' or 'completed'

    // Team View State
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [teamProject, setTeamProject] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', type: 'success', onConfirm: null });

    const toggleMatchingSkills = (id) => {
        setExpandedMatchingRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        fetchProjects();
        fetchSkills();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectsApi.getAll();
            setProjects(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchSkills = async () => {
        try {
            const res = await skillsApi.getAll();
            setSkills(res.data);
        } catch (err) { console.error(err); }
    }

    const handleAddRequirement = () => {
        if (!newReq.skill_id) return;
        setFormData({
            ...formData,
            requirements: [...formData.requirements, { ...newReq, skillName: skills.find(s => s.id == newReq.skill_id)?.name }]
        });
        setNewReq({ skill_id: '', min_proficiency_level: '1' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await projectsApi.create(formData);
            setIsModalOpen(false);
            fetchProjects();
            setFormData({ name: '', description: '', start_date: '', end_date: '', status: 'Planning', requirements: [] });
        } catch (err) { alert(err.message); }
    };

    const handleStatusChange = async (projectId, newStatus) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        try {
            await projectsApi.update(projectId, { ...project, status: newStatus });
            fetchProjects();
        } catch (err) {
            setConfirmModal({ isOpen: true, message: 'Error: ' + err.message, type: 'error' });
        }
    };

    // Rating Logic
    const handleRatingChange = (personnelId, skillId, value) => {
        setRatings(prev => ({
            ...prev,
            [personnelId]: {
                ...(prev[personnelId] || {}),
                [skillId]: value
            }
        }));
    };

    const submitRatings = async () => {
        if (!teamProject) return;

        // Flatten ratings map to array
        const payload = [];
        Object.keys(ratings).forEach(pId => {
            Object.keys(ratings[pId]).forEach(sId => {
                payload.push({
                    personnel_id: parseInt(pId),
                    skill_id: parseInt(sId),
                    rating: ratings[pId][sId]
                });
            });
        });

        if (payload.length === 0) {
            setConfirmModal({ isOpen: true, message: 'No ratings selected to submit.', type: 'error' });
            return;
        }

        try {
            await projectsApi.rateSkills(teamProject.id, payload);
            setConfirmModal({ isOpen: true, message: 'Performance ratings submitted successfully!', type: 'success' });
            setIsTeamModalOpen(false);
        } catch (err) {
            setConfirmModal({ isOpen: true, message: 'Failed to submit ratings: ' + err.message, type: 'error' });
        }
    };

    const handleFindMatch = async (project) => {
        setMatchingProject(project);
        setIsMatchModalOpen(true);
        setMatchResults({ perfectMatch: [], nearMatch: [], requirements: [] }); // clear previous
        try {
            const res = await matchingApi.getMatches(project.id);
            if (res.data && res.data.perfectMatch) {
                setMatchResults(res.data);
                setActiveTab(res.data.perfectMatch.length > 0 ? 'perfect' : 'near');
            } else {
                console.error("Invalid response format:", res.data);
                // Fallback to avoid crash
                setMatchResults({ perfectMatch: [], nearMatch: [] });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleViewTeam = async (project) => {
        setTeamProject(project);
        setIsTeamModalOpen(true);
        setRatings({}); // Clear while loading
        try {
            const res = await projectsApi.getById(project.id);
            const team = res.data.assignments || [];
            setTeamMembers(team);

            // Pre-fill ratings from DB
            const initialRatings = {};
            if (res.data.existingRatings) {
                res.data.existingRatings.forEach(r => {
                    if (!initialRatings[r.personnel_id]) initialRatings[r.personnel_id] = {};
                    initialRatings[r.personnel_id][r.skill_id] = r.rating;
                });
            }
            setRatings(initialRatings);
        } catch (err) {
            console.error(err);
            setTeamMembers([]);
        }
    };

    const handleUnassign = async (personnelId) => {
        if (!teamProject) return;
        if (!confirm('Remove this person from the project?')) return;
        try {
            await projectsApi.unassign(teamProject.id, personnelId);
            // Refresh team
            const res = await projectsApi.getById(teamProject.id);
            setTeamMembers(res.data.assignments || []);
            fetchProjects(); // Refresh main list
        } catch (err) {
            setConfirmModal({ isOpen: true, message: 'Error removing team member: ' + err.message, type: 'error' });
        }
    };

    const handleAssignMatch = async (personId) => {
        if (!matchingProject) return;
        try {
            await projectsApi.assignPersonnel(matchingProject.id, { personnel_id: personId });
            setConfirmModal({ isOpen: true, message: 'Personnel assigned successfully!', type: 'success' });
            setIsMatchModalOpen(false);
            fetchProjects();
        } catch (err) {
            setConfirmModal({ isOpen: true, message: 'Error: ' + err.message, type: 'error' });
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl mb-2">Projects</h1>
                    <p className="text-text-muted">Manage projects and find the right team.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                    <Plus size={16} /> New Project
                </button>
            </div>

            <div className="mb-8">
                <MagicBento
                    items={projectBentoItems}
                    spotlightRadius={150}
                    textAutoHide={false}
                    glowColor="220, 38, 38"
                />
            </div>

            {/* Premium Pill Navigation */}
            <div className="mb-8">
                <PillNav
                    items={[
                        {
                            label: `Planning & In Progress (${projects.filter(p => p.status !== 'Completed').length})`,
                            href: '#active',
                            onClick: () => setActiveProjectTab('active')
                        },
                        {
                            label: `Efficiency Timeline`,
                            href: '#timeline',
                            onClick: () => setActiveProjectTab('timeline')
                        },
                        {
                            label: `Completed Projects (${projects.filter(p => p.status === 'Completed').length})`,
                            href: '#completed',
                            onClick: () => setActiveProjectTab('completed')
                        }
                    ]}
                    activeHref={activeProjectTab === 'active' ? '#active' : activeProjectTab === 'timeline' ? '#timeline' : '#completed'}
                    baseColor="#8D153A"  /* Maroon container */
                    pillColor="#1a1a4a"  /* Sapphire pills */
                    pillTextColor="#94A3B8" /* Muted text */
                    hoveredPillTextColor="#ffffff" /* Bright on hover */
                    initialLoadAnimation={true}
                />
            </div>

            {/* Active & Planning Projects Tab */}
            {activeProjectTab === 'active' && (
                <div className="animate-fade-in">
                    <div className="grid-cols-2">
                        {projects.filter(p => p.status !== 'Completed').map(p => (
                            <div key={p.id} className="card">
                                <div className="flex justify-between mb-2">
                                    <select
                                        className={`text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 cursor-pointer outline-none transition-all ${p.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                            p.status === 'Planning' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-white/5 text-text-muted'
                                            }`}
                                        value={p.status}
                                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                    <div className="text-xs text-text-muted">{new Date(p.created_at).toLocaleDateString()}</div>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                                <p className="text-text-muted mb-4">{p.description}</p>

                                <div className="flex justify-between items-center border-t border-border pt-4 mt-2 gap-3">
                                    <div className="text-sm">
                                        <strong>Timeline:</strong><br />
                                        {p.start_date ? new Date(p.start_date).toLocaleDateString() : 'TBD'} - {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'TBD'}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleViewTeam(p)} className="btn btn-secondary text-sm rounded-full px-6">View Team</button>
                                        <button onClick={() => handleFindMatch(p)} className="btn btn-primary text-sm rounded-full px-6">Find Match</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {projects.filter(p => p.status !== 'Completed').length === 0 && (
                        <div className="py-20 text-center bg-surface border-2 border-dashed border-border rounded-xl text-text-muted">
                            No active projects. Start by creating a new one!
                        </div>
                    )}
                </div>
            )}

            {/* Timeline View Tab */}
            {activeProjectTab === 'timeline' && (
                <div className="animate-fade-in">
                    <div className="card shadow-xl border border-white/5 p-6 overflow-hidden">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">Project Roadmap</h2>
                                <p className="text-text-muted text-sm">Visualizing active project schedules.</p>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500/50 border border-green-400"></span> Active</span>
                                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-400"></span> Planning</span>
                            </div>
                        </div>

                        {(() => {
                            const timelineProjects = projects
                                .filter(p => p.status !== 'Completed' && p.start_date && p.end_date)
                                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

                            if (timelineProjects.length === 0) {
                                return (
                                    <div className="py-20 text-center text-text-muted italic border-2 border-dashed border-border rounded-xl">
                                        No active projects with defined dates to display on timeline.
                                    </div>
                                );
                            }

                            // Calculate Timeline Bounds
                            const dates = timelineProjects.flatMap(p => [new Date(p.start_date), new Date(p.end_date)]);
                            const minDate = new Date(Math.min(...dates));
                            const maxDate = new Date(Math.max(...dates));

                            // Add buffer (15 days)
                            minDate.setDate(minDate.getDate() - 15);
                            maxDate.setDate(maxDate.getDate() + 15);

                            const totalDuration = maxDate - minDate;

                            // Ticks (Example: 5 ticks)
                            const ticks = [];
                            for (let i = 0; i <= 5; i++) {
                                ticks.push(new Date(minDate.getTime() + (totalDuration * (i / 5))));
                            }

                            return (
                                <div className="relative w-full">
                                    {/* Timeline Header (Ticks) */}
                                    <div className="flex justify-between border-b border-white/10 pb-2 mb-4 text-xs text-text-muted uppercase tracking-wider font-bold">
                                        {ticks.map((t, i) => (
                                            <span key={i}>{t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        ))}
                                    </div>

                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 top-8 z-0 flex justify-between pointer-events-none opacity-20">
                                        {ticks.map((_, i) => (
                                            <div key={i} className="h-full border-r border-dashed border-white"></div>
                                        ))}
                                    </div>

                                    {/* Project Rows */}
                                    <div className="space-y-3 relative z-10">
                                        {timelineProjects.map(p => {
                                            const start = new Date(p.start_date);
                                            const end = new Date(p.end_date);
                                            const left = ((start - minDate) / totalDuration) * 100;
                                            const width = ((end - start) / totalDuration) * 100;

                                            return (
                                                <div key={p.id} className="relative h-12 flex items-center group">
                                                    {/* Row Label (Desktop) */}
                                                    <div className="w-48 flex-shrink-0 pr-4 truncate text-sm font-medium text-text-muted group-hover:text-text-main transition-colors hidden md:block">
                                                        {p.name}
                                                    </div>

                                                    {/* Bar Container */}
                                                    <div className="flex-1 h-full relative bg-white/5 rounded-lg overflow-hidden group-hover:bg-white/10 transition-colors">
                                                        <div
                                                            className={`absolute top-2 bottom-2 rounded-md shadow-lg flex items-center px-3 whitespace-nowrap overflow-hidden transition-all duration-500 hover:scale-[1.01] cursor-pointer ${p.status === 'Active'
                                                                ? 'bg-gradient-to-r from-green-500/80 to-green-600/80 border border-green-400/30 text-white'
                                                                : 'bg-gradient-to-r from-yellow-500/80 to-yellow-600/80 border border-yellow-400/30 text-white'
                                                                }`}
                                                            style={{
                                                                left: `${left}%`,
                                                                width: `${width}%`,
                                                                minWidth: '4px'
                                                            }}
                                                            title={`${p.name}: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`}
                                                            onClick={() => handleViewTeam(p)}
                                                        >
                                                            <span className="text-xs font-bold drop-shadow-md truncate">{p.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Current Date Indicator (if visible) */}
                                    {(() => {
                                        const now = new Date();
                                        if (now >= minDate && now <= maxDate) {
                                            const nowLeft = ((now - minDate) / totalDuration) * 100;
                                            return (
                                                <div
                                                    className="absolute top-0 bottom-0 border-l-2 border-red-500 z-20 pointer-events-none"
                                                    style={{ left: `${nowLeft}%` }}
                                                >
                                                    <div className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-b absolute -top-1 -left-4 font-bold tracking-widest uppercase">Today</div>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Completed Projects Tab */}
            {activeProjectTab === 'completed' && (
                <div className="animate-fade-in">
                    <div className="grid-cols-2 opacity-90 transition-all">
                        {projects.filter(p => p.status === 'Completed').map(p => (
                            <div key={p.id} className="card">
                                <div className="flex justify-between mb-2">
                                    <select
                                        className={`text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 cursor-pointer outline-none transition-all ${p.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                            p.status === 'Planning' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-white/5 text-text-muted'
                                            }`}
                                        value={p.status}
                                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                    <div className="text-xs text-text-muted">{new Date(p.created_at).toLocaleDateString()}</div>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-text-muted">{p.name}</h3>
                                <p className="text-text-muted mb-4 text-sm">{p.description}</p>

                                <div className="flex justify-between items-center border-t border-border pt-4 mt-2 gap-3">
                                    <div className="text-sm text-text-muted">
                                        <strong>Project Finalized</strong><br />
                                        Completed on {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'recent date'}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleViewTeam(p)} className="btn btn-secondary text-sm rounded-full px-6">View Team</button>
                                        <button onClick={() => handleFindMatch(p)} className="btn btn-secondary text-sm rounded-full px-6">Review Matches</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {projects.filter(p => p.status === 'Completed').length === 0 && (
                        <div className="py-20 text-center text-text-muted italic border-2 border-dashed border-border rounded-xl">
                            Projects you complete will appear here.
                        </div>
                    )}
                </div>
            )}

            {/* Create Project Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black-50 flex items-center justify-center z-1000 overflow-y-auto"
                    onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="bg-surface p-6 rounded-lg w-full max-w-2xl animate-fade-in shadow-xl m-4">
                        <h2 className="text-lg font-bold mb-4">Create New Project</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Project Name</label>
                                    <input required className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option>Planning</option>
                                        <option>Active</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" className="form-input" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="mt-4 border-t border-border pt-4">
                                <label className="form-label mb-2">Required Skills</label>
                                <div className="flex gap-2 mb-2">
                                    <select className="form-select" value={newReq.skill_id} onChange={e => setNewReq({ ...newReq, skill_id: e.target.value })}>
                                        <option value="">Select Skill</option>
                                        {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <input type="number" min="1" max="5" className="form-input w-24" placeholder="Lvl" value={newReq.min_proficiency_level} onChange={e => setNewReq({ ...newReq, min_proficiency_level: e.target.value })} />
                                    <button type="button" onClick={handleAddRequirement} className="btn btn-secondary">Add</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.requirements.map((r, i) => (
                                        <span key={i} className="badge badge-blue gap-1 px-2 py-1">
                                            {r.skillName} (Lvl {r.min_proficiency_level})
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Matching Modal */}
            {isMatchModalOpen && (
                <div
                    className="fixed inset-0 bg-black-50 flex items-center justify-center z-1000 p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsMatchModalOpen(false)}
                >
                    <div className="bg-surface p-6 rounded-lg w-full max-w-4xl h-[700px] max-h-[90vh] flex flex-col animate-fade-in shadow-xl">
                        <div className="flex justify-between items-start mb-2 px-1 flex-shrink-0">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-text-main tracking-tight">{matchingProject?.name}</h2>
                                    <span className="badge badge-gray text-[10px] px-2 py-0.5">{matchingProject?.status}</span>
                                </div>
                                <p className="text-text-muted text-xs mt-1 line-clamp-1 max-w-2xl">{matchingProject?.description}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Project Requirements</span>
                                        <div className="mt-1 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-2 custom-scrollbar border-l-2 border-white/5 pl-3">
                                            {matchResults.requirements?.map((req, idx) => (
                                                <span key={idx} className="badge badge-yellow text-[9px] px-1.5 py-0.5 uppercase tracking-tighter font-bold">
                                                    {req.skill_name} (Lvl {req.min_proficiency_level})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-white/5"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Timeline</span>
                                        <span className="text-xs text-text-main mt-1 font-mono">
                                            {matchingProject?.start_date ? new Date(matchingProject.start_date).toLocaleDateString() : 'TBD'} - {matchingProject?.end_date ? new Date(matchingProject.end_date).toLocaleDateString() : 'TBD'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMatchModalOpen(false)}
                                className="hover:bg-red-500/10 hover:text-red-400 text-text-muted rounded-full transition-all ml-4 p-2 bg-white/5 flex-shrink-0 w-8 h-8 flex items-center justify-center"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex border-b border-border mb-4">
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'perfect' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-main'}`}
                                onClick={() => setActiveTab('perfect')}
                            >
                                Best Fits ({matchResults.perfectMatch.length})
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${activeTab === 'near' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-main'}`}
                                onClick={() => setActiveTab('near')}
                            >
                                Near Matches ({matchResults.nearMatch.length})
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {matchResults[activeTab + 'Match'].length === 0 ? (
                                <div className="text-center text-text-muted mt-10">No candidates in this category.</div>
                            ) : (
                                <div className="space-y-4">
                                    {matchResults[activeTab + 'Match'].map(m => (
                                        <div key={m.id} className="card border border-border p-4 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg">{m.name}</h3>
                                                    <span className="badge badge-gray text-xs">{m.role}</span>
                                                </div>

                                                <div className="flex gap-4 mb-3 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-text-muted text-xs font-medium">Efficiency Score:</span>
                                                            <span className={`font-black text-xl ${m.overallMatch >= 80 ? 'text-primary' : m.overallMatch >= 50 ? 'text-yellow-500' : 'text-text-muted'}`}>
                                                                {m.overallMatch}%
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-3 text-[10px] text-text-muted">
                                                            <span title="Skill Fit">Fit: <b className="text-text-main">{m.fitScore}%</b></span>
                                                            <span title="Availability">Avail: <b className="text-text-main">{m.utilizationPct > 80 ? '0%' : `${100 - m.utilizationPct}%`}</b></span>
                                                            {m.performanceScore !== null && (
                                                                <span title="Past Performance">Perf: <b className="text-text-main">{m.performanceScore}%</b></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Skills & Gaps */}
                                                <div className="mb-3">
                                                    {(expandedMatchingRows[m.id] ? m.matched_skills : m.matched_skills.slice(0, 5)).map((ms, i) => (
                                                        <span key={i} className="badge badge-green text-xs mr-1 mb-1 inline-block">
                                                            {ms.skill_name || ms.name} (Lvl {ms.proficiency_level})
                                                            {ms.avgRating && <span className="ml-1 text-[9px] text-yellow-200">★ {(ms.avgRating).toFixed(1)}</span>}
                                                        </span>
                                                    ))}
                                                    {m.matched_skills.length > 5 && (
                                                        <button
                                                            onClick={() => toggleMatchingSkills(m.id)}
                                                            className="text-[10px] text-muted hover:text-primary hover:underline cursor-pointer ml-1"
                                                        >
                                                            {expandedMatchingRows[m.id] ? 'Hide' : `+${m.matched_skills.length - 5} more`}
                                                        </button>
                                                    )}
                                                    {m.gaps.map((gap, i) => (
                                                        <span key={i} className="badge badge-yellow text-xs mr-1 mb-1 inline-block border border-red-200">
                                                            Missing: {gap.skill}
                                                        </span>
                                                    ))}
                                                </div>

                                            </div>

                                            <button
                                                onClick={() => handleAssignMatch(m.id)}
                                                className="btn btn-primary whitespace-nowrap"
                                                disabled={m.utilizationPct >= 100}
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Team View Modal */}
            {isTeamModalOpen && (
                <div
                    className="fixed inset-0 bg-black-50 flex items-center justify-center z-1000"
                    onClick={(e) => e.target === e.currentTarget && setIsTeamModalOpen(false)}
                >
                    <div className="bg-surface p-6 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col animate-fade-in shadow-xl">
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main">Team: {teamProject?.name}</h2>
                                <p className="text-text-muted text-sm">
                                    {teamProject?.status === 'Completed' ? 'Rate team performance on used skills' : 'Assigned personnel and their fit scores'}
                                </p>
                            </div>
                            <button onClick={() => setIsTeamModalOpen(false)} className="btn-icon hover:bg-white/5 rounded-full transition-colors">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {teamMembers.length === 0 ? (
                                <div className="text-center text-text-muted py-20 border-2 border-dashed border-border rounded-xl">
                                    No team members assigned yet. Use "Find Match" to discover candidates.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {teamMembers.map(member => (
                                        <div key={member.id} className="card border border-border p-5 flex flex-col gap-4 hover:border-primary/30 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg text-text-main">{member.name}</h3>
                                                    <span className="badge badge-gray text-xs">{member.role}</span>
                                                    <span className={`badge text-xs font-bold ${member.fitScore >= 80 ? 'badge-green' : 'badge-yellow'}`}>
                                                        {member.fitScore}% Match
                                                    </span>
                                                </div>
                                                {teamProject.status !== 'Completed' && (
                                                    <button
                                                        onClick={() => handleUnassign(member.id)}
                                                        className="btn btn-secondary text-xs rounded-full px-4 hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/30 transition-all"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="">
                                                <span className="text-xs text-text-muted font-semibold uppercase tracking-wider block mb-2">Skills Used:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {member.skills && member.skills.length > 0 ? (
                                                        member.skills.map((skill, i) => (
                                                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${teamProject.status === 'Completed' ? 'border-primary/20 bg-primary/5' : 'border-border bg-surface'}`}>
                                                                <span className="text-sm font-medium">{skill.name}</span>

                                                                {teamProject.status === 'Completed' && (
                                                                    <div className="flex gap-0.5 ml-2">
                                                                        {[1, 2, 3, 4, 5].map(star => (
                                                                            <button
                                                                                key={star}
                                                                                type="button"
                                                                                onClick={() => handleRatingChange(member.id, skill.id, star)}
                                                                                className={`text-lg transition-all hover:scale-125 focus:outline-none cursor-pointer ${(ratings[member.id]?.[skill.id] || 0) >= star ? 'text-yellow-400' : 'text-gray-400 opacity-30 hover:opacity-100'
                                                                                    }`}
                                                                            >
                                                                                ★
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-text-muted italic">No skills listed</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {teamProject.status === 'Completed' && teamMembers.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-border flex justify-end">
                                <button
                                    onClick={submitRatings}
                                    className="btn btn-primary"
                                >
                                    Submit Performance Ratings
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                message={confirmModal.message}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
};

export default Projects;
