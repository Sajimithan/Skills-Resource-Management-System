import React, { useEffect, useState } from 'react';
import { personnelApi, skillsApi } from '../services/api';
import { Plus, X, Trash } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const Personnel = () => {
    const [personnel, setPersonnel] = useState([]);
    const [skills, setSkills] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', type: 'success', onConfirm: null });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        experience_level: 'Junior',
        initialSkills: [] // [{ skill_id, proficiency_level, skillName }]
    });
    const [skillFormData, setSkillFormData] = useState({ skill_id: '', proficiency_level: '1' });
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
    const [newPersonnelSkill, setNewPersonnelSkill] = useState({ skill_id: '', proficiency_level: '1' });

    // Filtering State
    const [filters, setFilters] = useState({
        search: '',
        experience: 'All',
        skillId: '',
        minLvl: 1
    });

    useEffect(() => {
        fetchPersonnel();
        fetchSkills();
    }, []);

    // Get unique roles for auto-suggestion
    const existingRoles = Array.from(new Set(personnel.map(p => p.role?.trim()).filter(Boolean)));
    const filteredRoles = existingRoles.filter(r =>
        r.toLowerCase().includes(formData.role.toLowerCase()) &&
        r.toLowerCase() !== formData.role.toLowerCase()
    );

    const fetchPersonnel = async () => {
        try {
            const res = await personnelApi.getAll();
            console.log("Personnel data received:", res.data);
            setPersonnel(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSkills = async () => {
        try {
            const res = await skillsApi.getAll();
            setSkills(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    const handleDelete = async (id) => {
        setConfirmModal({
            isOpen: true,
            message: 'Are you sure you want to delete this person?',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await personnelApi.delete(id);
                    fetchPersonnel();
                    setConfirmModal({ isOpen: true, message: 'Personnel deleted successfully!', type: 'success' });
                } catch (err) {
                    setConfirmModal({ isOpen: true, message: 'Error: ' + err.message, type: 'error' });
                }
            }
        });
    };

    const handleAddInitialSkill = () => {
        if (!newPersonnelSkill.skill_id) return;
        const skill = skills.find(s => s.id == newPersonnelSkill.skill_id);
        setFormData({
            ...formData,
            initialSkills: [...formData.initialSkills, { ...newPersonnelSkill, skillName: skill?.name }]
        });
        setNewPersonnelSkill({ skill_id: '', proficiency_level: '1' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Create the person
            const res = await personnelApi.create(formData);
            const newPersonId = res.data.id;

            // 2. Assign initial skills if any
            if (formData.initialSkills.length > 0) {
                for (const s of formData.initialSkills) {
                    await personnelApi.assignSkill(newPersonId, {
                        skill_id: s.skill_id,
                        proficiency_level: s.proficiency_level
                    });
                }
            }

            setIsModalOpen(false);
            setFormData({
                name: '',
                email: '',
                role: '',
                experience_level: 'Junior',
                initialSkills: []
            });
            fetchPersonnel();
            setConfirmModal({ isOpen: true, message: 'Personnel added with skills!', type: 'success' });

        } catch (err) {
            setConfirmModal({ isOpen: true, message: 'Error: ' + (err.response?.data?.message || err.message), type: 'error' });
        }
    };

    const [expandedRows, setExpandedRows] = useState({});

    const toggleSkills = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAssignSkill = async (e) => {
        e.preventDefault();
        try {
            console.log("Assigning skill:", skillFormData, "to ID:", selectedPerson.id);
            await personnelApi.assignSkill(selectedPerson.id, skillFormData);
            setIsSkillModalOpen(false);
            setSkillFormData({ skill_id: '', proficiency_level: '1' }); // Reset skill form
            await fetchPersonnel();
            setConfirmModal({ isOpen: true, message: 'Skill assigned successfully!', type: 'success' });
        } catch (err) {
            setConfirmModal({ isOpen: true, message: 'Error: ' + (err.response?.data?.message || err.message), type: 'error' });
        }
    }

    const openAssignSkill = (person) => {
        setSelectedPerson(person);
        setIsSkillModalOpen(true);
    }

    // Computed Filtered List
    const filteredPersonnel = personnel.filter(p => {
        const matchesSearch = !filters.search ||
            (p.name?.toLowerCase().includes(filters.search.toLowerCase())) ||
            (p.role?.toLowerCase().includes(filters.search.toLowerCase())) ||
            (p.email?.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesExp = filters.experience === 'All' || p.experience_level === filters.experience;

        const matchesSkill = !filters.skillId || (Array.isArray(p.skills) && p.skills.some(s =>
            s.id == filters.skillId && (parseInt(s.level, 10) || 0) >= parseInt(filters.minLvl, 10)
        ));

        return matchesSearch && matchesExp && matchesSkill;
    });

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 text-text-main">Personnel Management</h1>
                    <p className="text-text-muted">Manage system users and their skills.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                    <Plus size={16} /> Add Personnel
                </button>
            </div>

            {/* Powerful Filters Section */}
            <div className="card mb-6 border border-border/50 bg-surface/50 backdrop-blur-sm p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest block mb-1.5 ml-1">Search Personnel</label>
                        <input
                            type="text"
                            className="form-input w-full bg-background"
                            placeholder="Find by name, role, or email..."
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <div className="w-40">
                        <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest block mb-1.5 ml-1">Experience</label>
                        <select
                            className="form-select w-full bg-background"
                            value={filters.experience}
                            onChange={e => setFilters({ ...filters, experience: e.target.value })}
                        >
                            <option value="All">All Levels</option>
                            <option value="Junior">Junior</option>
                            <option value="Mid-Level">Mid-Level</option>
                            <option value="Senior">Senior</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest block mb-1.5 ml-1">Skill Filter</label>
                        <div className="flex gap-2">
                            <select
                                className="form-select flex-1 bg-background"
                                value={filters.skillId}
                                onChange={e => setFilters({ ...filters, skillId: e.target.value })}
                            >
                                <option value="">Any Skill</option>
                                {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            {filters.skillId && (
                                <select
                                    className="form-select w-24 bg-background"
                                    value={filters.minLvl}
                                    onChange={e => setFilters({ ...filters, minLvl: e.target.value })}
                                >
                                    <option value="1">Lv1+</option>
                                    <option value="2">Lv2+</option>
                                    <option value="3">Lv3+</option>
                                    <option value="4">Lv4+</option>
                                    <option value="5">Lv5</option>
                                </select>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilters({ search: '', experience: 'All', skillId: '', minLvl: 1 })}
                            className="btn btn-secondary h-[42px] px-4 rounded-xl flex items-center gap-2"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Skills</th>
                                <th>Experience</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPersonnel.map((p) => (
                                <tr key={p.id}>
                                    <td className="font-medium">{p.name}</td>
                                    <td>{p.role}</td>
                                    <td>
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {p.skills && p.skills.length > 0 ? (
                                                <>
                                                    {(expandedRows[p.id] ? p.skills : p.skills.slice(0, 5)).map((s, i) => (
                                                        <span key={i} className="badge badge-gray text-xs px-1 py-0.5">
                                                            {s.name} <span className="text-text-muted text-[10px]">({s.level})</span>
                                                        </span>
                                                    ))}
                                                    {p.skills.length > 5 && (
                                                        <button
                                                            onClick={() => toggleSkills(p.id)}
                                                            className="text-[10px] text-muted hover:text-primary hover:underline cursor-pointer ml-1"
                                                        >
                                                            {expandedRows[p.id] ? 'Hide' : `+${p.skills.length - 5} more`}
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-text-muted text-xs font-italic">No skills assigned</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${p.experience_level === 'Senior' ? 'badge-blue' :
                                            p.experience_level === 'Mid-Level' ? 'badge-green' : 'badge-gray'
                                            }`}>
                                            {p.experience_level}
                                        </span>
                                    </td>
                                    <td>{p.email}</td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => openAssignSkill(p)} className="btn btn-secondary text-xs">
                                                + Skill
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="btn btn-icon text-muted hover:text-red-500">
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Personnel Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md animate-fade-in shadow-xl">
                        <div className="flex justify-between items-center mb-4 text-text-muted">
                            <h2 className="text-lg font-bold text-text-main">Add New Personnel</h2>
                            <button onClick={() => setIsModalOpen(false)} className="btn-icon hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input required className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group relative">
                                <label className="form-label">Role</label>
                                <input
                                    className="form-input"
                                    autoComplete="off"
                                    value={formData.role}
                                    onChange={e => {
                                        setFormData({ ...formData, role: e.target.value });
                                        setShowRoleSuggestions(true);
                                    }}
                                    onFocus={() => setShowRoleSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                                    placeholder="e.g. Frontend Dev"
                                />
                                {showRoleSuggestions && filteredRoles.length > 0 && (
                                    <div className="suggestions-dropdown border border-border">
                                        {filteredRoles.map((r, i) => (
                                            <div
                                                key={i}
                                                className="suggestion-item"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setFormData({ ...formData, role: r });
                                                    setShowRoleSuggestions(false);
                                                }}
                                            >
                                                {r}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Experience</label>
                                <select className="form-select" value={formData.experience_level} onChange={e => setFormData({ ...formData, experience_level: e.target.value })}>
                                    <option value="Junior">Junior</option>
                                    <option value="Mid-Level">Mid-Level</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            </div>

                            {/* Skills Section */}
                            <div className="mt-4 border-t border-border pt-4">
                                <label className="form-label mb-2">Assign Initial Skills</label>
                                <div className="flex gap-2 mb-3">
                                    <select
                                        className="form-select flex-1"
                                        style={{ minWidth: '0' }}
                                        value={newPersonnelSkill.skill_id}
                                        onChange={e => setNewPersonnelSkill({ ...newPersonnelSkill, skill_id: e.target.value })}
                                    >
                                        <option value="">Select Skill</option>
                                        {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <select
                                        className="form-select w-20 text-center"
                                        style={{ width: '80px', minWidth: '80px' }}
                                        value={newPersonnelSkill.proficiency_level}
                                        onChange={e => setNewPersonnelSkill({ ...newPersonnelSkill, proficiency_level: e.target.value })}
                                    >
                                        {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Lv{l}</option>)}
                                    </select>
                                    <button type="button" onClick={handleAddInitialSkill} className="btn btn-secondary px-3">Add</button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {formData.initialSkills.map((s, i) => (
                                        <div key={i} className="badge badge-blue flex items-center gap-1">
                                            {s.skillName} (Lvl {s.proficiency_level})
                                            <button
                                                type="button"
                                                className="hover:text-red-500"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    initialSkills: formData.initialSkills.filter((_, idx) => idx !== i)
                                                })}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Personnel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Skill Modal */}
            {isSkillModalOpen && (
                <div
                    className="fixed inset-0 bg-black-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.target === e.currentTarget && setIsSkillModalOpen(false)}
                >
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md animate-fade-in shadow-xl">
                        <div className="flex justify-between items-center mb-4 text-text-muted">
                            <h2 className="text-lg font-bold text-text-main">Assign Skill to {selectedPerson?.name}</h2>
                            <button onClick={() => setIsSkillModalOpen(false)} className="btn-icon hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={handleAssignSkill}>
                            <div className="form-group">
                                <label className="form-label">Skill</label>
                                <select required className="form-select" value={skillFormData.skill_id} onChange={e => setSkillFormData({ ...skillFormData, skill_id: e.target.value })}>
                                    <option value="">Select Skill...</option>
                                    {skills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Proficiency (1-5)</label>
                                <select className="form-select" value={skillFormData.proficiency_level} onChange={e => setSkillFormData({ ...skillFormData, proficiency_level: e.target.value })}>
                                    <option value="1">1 - Beginner</option>
                                    <option value="2">2 - Junior</option>
                                    <option value="3">3 - Intermediate</option>
                                    <option value="4">4 - Advanced</option>
                                    <option value="5">5 - Expert</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsSkillModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Assign</button>
                            </div>
                        </form>
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

export default Personnel;
