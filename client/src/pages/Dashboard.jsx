import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Users, Briefcase, TrendingUp } from 'lucide-react';
import SplitText from '../components/SplitText';
import MagicBento from '../components/MagicBento';

const COLORS = ['#4F46E5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const Dashboard = () => {
    const [stats, setStats] = useState({ utilization: [], projectStatus: [], skillDemand: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await dashboardApi.getStats();
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnimationComplete = () => {
        console.log('All letters have animated!');
    };

    const bentoItems = [
        { title: 'Analytics', description: 'Monitor resource allocation trends.', label: 'Insights' },
        { title: 'Automated Matching', description: 'AI-driven skill pairing for projects.', label: 'AI Core' },
        { title: 'Team Synergy', description: 'Build balanced teams effortlessly.', label: 'Collaboration' }
    ];

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <SplitText
                    text="Dashboard"
                    className="text-2xl font-semibold mb-2"
                    delay={100}
                    duration={0.6}
                    ease="power3.out"
                    splitType="chars"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0.1}
                    rootMargin="-100px"
                    textAlign="left"
                    tag="h1"
                    onLetterAnimationComplete={handleAnimationComplete}
                />
                <p className="text-text-muted">Overview of resource utilization and project status.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid-cols-3 mb-8">
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <Users size={24} color="#2563EB" />
                    </div>
                    <div>
                        <div className="text-text-muted text-sm font-medium">Top Performer</div>
                        <div className="text-xl">{stats.utilization[0]?.name || 'N/A'}</div>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <Briefcase size={24} color="#059669" />
                    </div>
                    <div>
                        <div className="text-text-muted text-sm font-medium">Active Projects</div>
                        <div className="text-xl">
                            {stats.projectStatus.find(s => s.status === 'Active')?.count || 0}
                        </div>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <TrendingUp size={24} color="#7C3AED" />
                    </div>
                    <div>
                        <div className="text-text-muted text-sm font-medium">Top Skill Demand</div>
                        <div className="text-xl">{stats.skillDemand[0]?.name || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="grid-cols-2 gap-4">
                {/* Utilization Chart */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Personnel Utilization</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.utilization} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="project_count" fill="#4F46E5" name="Active Projects" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Status Chart */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Project Status</h2>
                    <div className="h-64 flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.projectStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="status"
                                >
                                    {stats.projectStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>



            <div className="mb-8">
                <MagicBento items={bentoItems} spotlightRadius={200} />
            </div>

            {/* Skill Demand Table */}
            <div className="card mt-8">
                <h2 className="text-lg font-semibold mb-4">Skill Demand Trends</h2>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Skill Name</th>
                            <th>Demand (Project Req.)</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.skillDemand.map((skill, i) => (
                            <tr key={i}>
                                <td>{skill.name}</td>
                                <td>{skill.demand_count}</td>
                                <td>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(skill.demand_count / (stats.skillDemand[0]?.demand_count || 1)) * 100}%` }}></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div >
    );
};

export default Dashboard;
