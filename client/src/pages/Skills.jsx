import React, { useEffect, useState } from 'react';
import { skillsApi } from '../services/api';
import { Plus, Trash, X } from 'lucide-react';
import Magnet from '../components/Magnet';

const Skills = () => {
    const [skills, setSkills] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', category: '', description: '' });

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const res = await skillsApi.getAll();
            setSkills(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure?')) {
            try {
                await skillsApi.delete(id);
                fetchSkills();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await skillsApi.create(formData);
            setIsModalOpen(false);
            fetchSkills();
            setFormData({ name: '', category: '', description: '' });
        } catch (err) {
            alert("Error: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl mb-2">Skills Catalog</h1>
                    <p className="text-text-muted">Define the skills available in your organization.</p>
                </div>
                <Magnet padding={50} disabled={false} magnetStrength={20}>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                        <Plus size={16} /> Add Skill
                    </button>
                </Magnet>
            </div>

            <div className="grid-cols-3">
                {skills.map(skill => (
                    <div key={skill.id} className="card hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className="badge badge-blue">{skill.category}</span>
                            <button onClick={() => handleDelete(skill.id)} className="text-text-muted hover:text-red-500"><Trash size={16} /></button>
                        </div>
                        <h3 className="font-bold text-lg mb-1">{skill.name}</h3>
                        <p className="text-sm text-text-muted line-clamp-2">{skill.description}</p>
                    </div>
                ))}
            </div>

            {/* Add Skill Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md animate-fade-in shadow-xl">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-bold">Add New Skill</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Skill Name</label>
                                <input required className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input required className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Frontend" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Skills;
