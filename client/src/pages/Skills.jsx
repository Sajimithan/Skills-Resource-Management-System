import React, { useEffect, useState } from 'react';
import { skillsApi } from '../services/api';
import { Plus, Trash, X } from 'lucide-react';
import Magnet from '../components/Magnet';

const Skills = () => {
    const [skills, setSkills] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', category: '', description: '' });

    // Suggestion states
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

    // Popular skills for auto-suggestion
    const popularSkills = [
        "React.js", "Node.js", "Python", "JavaScript", "TypeScript", "Java", "AWS", "Docker", "Kubernetes",
        "SQL", "MongoDB", "UI/UX Design", "Figma", "DevOps", "Cybersecurity", "Project Management",
        "Agile", "GraphQL", "Redis", "Terraform", "PHP", "Angular", "Vue.js", "C#", ".NET Core"
    ];

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

    // Get unique categories (case-insensitive & singular/plural deduplication)
    const categories = Array.from(
        skills.reduce((map, s) => {
            if (!s.category) return map;
            const normalized = s.category.trim();
            // Create a key that ignores casing and trailing 's' (plural)
            // e.g., "Soft Skills" and "Soft skill" both become "soft skill"
            let key = normalized.toLowerCase();
            if (key.endsWith('s') && key.length > 4 && !key.endsWith('ss')) {
                key = key.slice(0, -1);
            }

            if (!map.has(key)) {
                map.set(key, normalized);
            }
            return map;
        }, new Map()).values()
    );

    // Filtering logic
    const filteredSkills = popularSkills.filter(s =>
        s.toLowerCase().includes(formData.name.toLowerCase()) &&
        s.toLowerCase() !== formData.name.toLowerCase()
    );

    const filteredCategories = categories.filter(c =>
        c.toLowerCase().includes(formData.category.toLowerCase()) &&
        c.toLowerCase() !== formData.category.toLowerCase()
    );

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
                <div className="fixed inset-0 bg-black-50 flex items-center justify-center z-50" onClick={() => { setShowSkillSuggestions(false); setShowCategorySuggestions(false); }}>
                    <div className="bg-surface p-6 rounded-lg w-full max-w-md animate-fade-in shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 text-text-muted">
                            <h2 className="text-lg font-bold text-text-main">Add New Skill</h2>
                            <button onClick={() => setIsModalOpen(false)} className="btn-icon hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} strokeWidth={1.5} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group relative">
                                <label className="form-label">Skill Name</label>
                                <input
                                    required
                                    autoComplete="off"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => {
                                        setFormData({ ...formData, name: e.target.value });
                                        setShowSkillSuggestions(true);
                                    }}
                                    onFocus={() => {
                                        setShowSkillSuggestions(true);
                                        setShowCategorySuggestions(false);
                                    }}
                                    onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                                    placeholder="Start typing a skill..."
                                />
                                {showSkillSuggestions && filteredSkills.length > 0 && (
                                    <div className="suggestions-dropdown border border-border">
                                        {filteredSkills.map((s, i) => (
                                            <div
                                                key={i}
                                                className="suggestion-item"
                                                onMouseDown={(e) => {
                                                    e.preventDefault(); // Prevent input blur
                                                    setFormData({ ...formData, name: s });
                                                    setShowSkillSuggestions(false);
                                                }}
                                            >
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="form-group relative">
                                <label className="form-label">Category</label>
                                <input
                                    required
                                    autoComplete="off"
                                    className="form-input"
                                    value={formData.category}
                                    onChange={e => {
                                        setFormData({ ...formData, category: e.target.value });
                                        setShowCategorySuggestions(true);
                                    }}
                                    onFocus={() => {
                                        setShowCategorySuggestions(true);
                                        setShowSkillSuggestions(false);
                                    }}
                                    onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                                    placeholder="e.g. Frontend"
                                />
                                {showCategorySuggestions && filteredCategories.length > 0 && (
                                    <div className="suggestions-dropdown border border-border">
                                        {filteredCategories.map((c, i) => (
                                            <div
                                                key={i}
                                                className="suggestion-item"
                                                onMouseDown={(e) => {
                                                    e.preventDefault(); // Prevent input blur
                                                    setFormData({ ...formData, category: c });
                                                    setShowCategorySuggestions(false);
                                                }}
                                            >
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="form-group relative">
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
