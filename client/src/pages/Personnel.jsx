import React, { useEffect, useState } from 'react';
import { personnelApi, skillsApi } from '../services/api';
import { Plus, Trash, Search, X } from 'lucide-react';

const Personnel = () => {
    const [personnel, setPersonnel] = useState([]);
    const [skills, setSkills] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);

    const [formData, setFormData] = useState({ name: '', email: '', role: '', experience_level: 'Junior' });
    const [skillFormData, setSkillFormData] = useState({ skill_id: '', proficiency_level: '1' });

    useEffect(() => {
        fetchPersonnel();
        fetchSkills();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const res = await personnelApi.getAll();
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
        if (confirm('Are you sure?')) {
            try {
                await personnelApi.delete(id);
                fetchPersonnel();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await personnelApi.create(formData);
            setIsModalOpen(false);
            fetchPersonnel();
            setFormData({ name: '', email: '', role: '', experience_level: 'Junior' });
        } catch (err) {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    const handleAssignSkill = async (e) => {
        e.preventDefault();
        try {
            await personnelApi.assignSkill(selectedPerson.id, skillFormData);
            setIsSkillModalOpen(false);
            // Ideally fetch personnel details again or just alert success
            alert("Skill Assigned!");
        } catch (err) {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    }

    const openAssignSkill = (person) => {
        setSelectedPerson(person);
        setIsSkillModalOpen(true);
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl mb-2">Personnel Management</h1>
                    <p className="text-text-muted">Manage system users and their skills.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                    <Plus size={16} /> Add Personnel
                </button>
            </div>

            <div className="card overflow-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Experience</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {personnel.map((p) => (
                            <tr key={p.id}>
                                <td className="font-medium">{p.name}</td>
                                <td>{p.role}</td>
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

            {/* Add Personnel Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md animate-fade-in shadow-xl">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-bold">Add New Personnel</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
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
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="e.g. Frontend Dev" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Experience</label>
                                <select className="form-select" value={formData.experience_level} onChange={e => setFormData({ ...formData, experience_level: e.target.value })}>
                                    <option value="Junior">Junior</option>
                                    <option value="Mid-Level">Mid-Level</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Skill Modal */}
            {isSkillModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md animate-fade-in shadow-xl">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-bold">Assign Skill to {selectedPerson?.name}</h2>
                            <button onClick={() => setIsSkillModalOpen(false)}><X size={20} /></button>
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

        </div>
    );
};

export default Personnel;
