import React, { useEffect, useState } from 'react';
import { projectsApi, skillsApi, matchingApi } from '../services/api';
import { Plus, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MagicBento from '../components/MagicBento';

const Projects = () => {
    const projectBentoItems = [
        { title: 'Project Tracking', description: 'Real-time status updates at a glance.', label: 'Management' },
        { title: 'Skill Matching', description: 'Find the perfect personnel for every task.', label: 'AI Tools' },
        { title: 'Timeline Views', description: 'Stay on top of critical deadlines.', label: 'Efficiency' }
    ];

    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [skills, setSkills] = useState([]);
    const [formData, setFormData] = useState({ name: '', description: '', start_date: '', end_date: '', status: 'Planning', requirements: [] });

    // Requirement inputs in modal
    const [newReq, setNewReq] = useState({ skill_id: '', min_proficiency_level: '1' });

    // Matching State
    const [matchingProject, setMatchingProject] = useState(null);
    const [matchResults, setMatchResults] = useState({ perfectMatch: [], nearMatch: [] });
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('perfect'); // 'perfect' or 'near'
    const [expandedMatchingRows, setExpandedMatchingRows] = useState({});
    const [activeProjectTab, setActiveProjectTab] = useState('active'); // 'active' or 'completed'

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
            alert("Error updating status: " + err.message);
        }
    };

    const handleFindMatch = async (project) => {
        setMatchingProject(project);
        setIsMatchModalOpen(true);
        setMatchResults({ perfectMatch: [], nearMatch: [] }); // clear previous
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

    const handleAssignMatch = async (personId) => {
        if (!matchingProject) return;
        try {
            await projectsApi.assignPersonnel(matchingProject.id, { personnel_id: personId });
            alert("Assigned successfully!");
            setIsMatchModalOpen(false);
            // Optional: refresh matches or project list
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    }

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
                <MagicBento items={projectBentoItems} spotlightRadius={200} textAutoHide={false} />
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border mb-8 overflow-x-auto">
                <button
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeProjectTab === 'active'
                            ? 'text-primary border-primary bg-primary/5'
                            : 'text-text-muted border-transparent hover:text-text-main hover:bg-gray-50'
                        }`}
                    onClick={() => setActiveProjectTab('active')}
                >
                    Planning & In Progress ({projects.filter(p => p.status !== 'Completed').length})
                </button>
                <button
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${activeProjectTab === 'completed'
                            ? 'text-primary border-primary bg-primary/5'
                            : 'text-text-muted border-transparent hover:text-text-main hover:bg-gray-50'
                        }`}
                    onClick={() => setActiveProjectTab('completed')}
                >
                    Completed Projects ({projects.filter(p => p.status === 'Completed').length})
                </button>
            </div>

            {/* Active & Planning Projects Tab */}
            {activeProjectTab === 'active' && (
                <div className="animate-fade-in">
                    <div className="grid-cols-2">
                        {projects.filter(p => p.status !== 'Completed').map(p => (
                            <div key={p.id} className="card">
                                <div className="flex justify-between mb-2">
                                    <select
                                        className={`text-xs font-bold px-2 py-1 rounded border-none cursor-pointer outline-none ${p.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            'bg-yellow-100 text-yellow-700'
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

                                <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                                    <div className="text-sm">
                                        <strong>Timeline:</strong><br />
                                        {p.start_date ? new Date(p.start_date).toLocaleDateString() : 'TBD'} - {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'TBD'}
                                    </div>
                                    <button onClick={() => handleFindMatch(p)} className="btn btn-primary text-sm">Find Match</button>
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

            {/* Completed Projects Tab */}
            {activeProjectTab === 'completed' && (
                <div className="animate-fade-in">
                    <div className="grid-cols-2 opacity-90 transition-all">
                        {projects.filter(p => p.status === 'Completed').map(p => (
                            <div key={p.id} className="card">
                                <div className="flex justify-between mb-2">
                                    <select
                                        className="text-xs font-bold px-2 py-1 rounded border-none cursor-pointer outline-none bg-gray-100 text-gray-700"
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

                                <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                                    <div className="text-sm text-text-muted">
                                        <strong>Project Finalized</strong><br />
                                        Completed on {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'recent date'}
                                    </div>
                                    <button onClick={() => handleFindMatch(p)} className="btn btn-secondary text-sm">Review Matches</button>
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
                <div className="fixed inset-0 bg-black-50 flex items-center justify-center z-50 overflow-y-auto">
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
                <div className="fixed inset-0 bg-black-50 flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col animate-fade-in shadow-xl">
                        <div className="flex justify-between items-center mb-4 text-text-muted flex-shrink-0">
                            <h2 className="text-xl font-bold text-text-main">Matching Personnel for {matchingProject?.name}</h2>
                            <button onClick={() => setIsMatchModalOpen(false)} className="btn-icon hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} strokeWidth={1.5} />
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
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-text-muted">Fit:</span>
                                                        <span className={`font-bold ${m.fitScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{m.fitScore}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-text-muted">Availability:</span>
                                                        <span className={`font-bold ${m.utilizationPct > 80 ? 'text-red-500' : m.utilizationPct > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                                                            {m.utilizationPct > 80 ? 'Overbooked' : `${100 - m.utilizationPct}% Free`}
                                                        </span>
                                                        <span className="text-xs text-text-muted">({m.active_projects_count} active projects)</span>
                                                    </div>
                                                </div>

                                                {/* Skills & Gaps */}
                                                <div className="mb-3">
                                                    {(expandedMatchingRows[m.id] ? m.matched_skills : m.matched_skills.slice(0, 5)).map((ms, i) => (
                                                        <span key={i} className="badge badge-green text-xs mr-1 mb-1 inline-block">
                                                            {ms.skill_name || ms.name} (Lvl {ms.proficiency_level})
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

                                                {/* Training Suggestions (Only for near matches) */}
                                                {m.training.length > 0 && (
                                                    <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100">
                                                        <strong>💡 Recommended Training:</strong>
                                                        <ul className="list-disc pl-4 mt-1">
                                                            {m.training.map((t, i) => <li key={i}>{t}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
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
        </div>
    );
};

export default Projects;
