import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Users, Briefcase, TrendingUp } from 'lucide-react';
import MagicBento from '../components/MagicBento';

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E'];

const Dashboard = () => {
    const [stats, setStats] = useState({
        utilization: [],
        projectStatus: [],
        skillDemand: [],
        utilizationForecast: [],
        forecastKeys: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await dashboardApi.getStats();
            setStats(res.data);
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };



    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-text-main">Dashboard</h1>
                <p className="text-text-muted text-lg">Overview of resource utilization and project status.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid-cols-3 mb-10">
                <div className="card flex items-center gap-5 border-l-4 border-l-blue-500 shadow-lg transform hover:scale-[1.02] transition-transform">
                    <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl shadow-inner border border-blue-500/20">
                        <Users size={28} />
                    </div>
                    <div>
                        <div className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Top Performer</div>
                        <div className="text-2xl font-extrabold text-blue-100">{stats.topPerformer || 'N/A'}</div>
                    </div>
                </div>
                <div className="card flex items-center gap-5 border-l-4 border-l-green-500 shadow-lg transform hover:scale-[1.02] transition-transform">
                    <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl shadow-inner border border-green-500/20">
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <div className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Active Projects</div>
                        <div className="text-3xl font-extrabold text-green-100">
                            {stats.projectStatus.find(s => s.status === 'Active')?.count || 0}
                        </div>
                    </div>
                </div>
                <div className="card flex items-center gap-5 border-l-4 border-l-purple-500 shadow-lg transform hover:scale-[1.02] transition-transform">
                    <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl shadow-inner border border-purple-500/20">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <div className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Peak Skill Demand</div>
                        <div className="text-2xl font-extrabold text-purple-100">{stats.skillDemand[0]?.name || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="grid-cols-2 gap-8 mb-10">
                {/* Utilization Chart */}
                <div className="card shadow-xl border border-white/5">
                    <div className="mb-6">
                        <h2 className="text-xl font-extrabold text-blue-400">Personnel Utilization</h2>
                        <p className="text-text-muted text-xs">Workload distribution across active project assignments.</p>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.utilization} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" fontSize={11} stroke="#64748B" />
                                <YAxis dataKey="name" type="category" width={100} fontSize={11} stroke="#64748B" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="project_count" fill="#3B82F6" name="Active Projects" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Status Chart */}
                <div className="card shadow-xl border border-white/5">
                    <div className="mb-6">
                        <h2 className="text-xl font-extrabold text-green-400">Project Portfolio</h2>
                        <p className="text-text-muted text-xs">Current distribution of projects by operational status.</p>
                    </div>
                    <div className="h-64 flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.projectStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="status"
                                    strokeWidth={0}
                                >
                                    {stats.projectStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>







            {/* Skill Demand Trends Section */}
            <div className="grid-cols-1 gap-8 mb-10">
                <div className="card border-t-4 border-t-primary shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-text-main">Skill Demand Trends</h2>
                            <p className="text-text-muted text-sm">Identifying the most sought-after competencies in current projects.</p>
                        </div>
                    </div>
                    <div className="table-container rounded-xl">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest text-text-muted">Skill Name</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest text-text-muted">Total Demand</th>
                                    <th className="py-4 px-6 text-left text-xs font-bold uppercase tracking-widest text-text-muted">Growth Analytics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.skillDemand && stats.skillDemand.length > 0 ? stats.skillDemand.map((skill, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-text-main">{skill.name}</td>
                                        <td className="py-4 px-6">
                                            <span className="badge badge-blue px-3 py-1 font-bold">
                                                {skill.demand_count} Req.
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(141,21,58,0.3)]"
                                                        style={{ width: `${(skill.demand_count / (stats.skillDemand[0]?.demand_count || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-primary w-10">
                                                    {Math.round((skill.demand_count / (stats.skillDemand[0]?.demand_count || 1)) * 100)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="py-10 text-center text-text-muted italic">No data available yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Organization Skill Heatmap */}
            <div className="card shadow-xl border border-white/5 mb-10 border-l-4 border-l-amber-500">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-amber-500">Resource Skill Matrix Heatmap</h2>
                    <p className="text-text-muted text-sm">Visualizing expertise density across the entire workforce.</p>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Heatmap implementation using CSS Grid */}
                        <div className="flex mb-4">
                            <div className="w-32 flex-shrink-0"></div>
                            <div className="flex-1 flex">
                                {stats.skillDemand.map(s => (
                                    <div key={s.name} className="flex-1 text-[10px] text-center font-bold text-text-muted uppercase tracking-tighter truncate px-1">
                                        {s.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {stats.utilization.map(person => (
                            <div key={person.name} className="flex items-center mb-1 group">
                                <div className="w-32 text-xs font-semibold text-text-main truncate pr-2 group-hover:text-amber-400 transition-colors">
                                    {person.name}
                                </div>
                                <div className="flex-1 flex gap-1 h-8">
                                    {stats.skillDemand.map(skill => {
                                        // Use real proficiency level from personnel data
                                        const intensity = person.skills[skill.id] || 0;
                                        const opacities = [0.05, 0.3, 0.45, 0.65, 0.85, 1];
                                        return (
                                            <div
                                                key={`${person.id}-${skill.id}`}
                                                className="flex-1 rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 shadow-sm"
                                                style={{
                                                    backgroundColor: intensity > 0 ? `rgba(245, 158, 11, ${opacities[intensity]})` : 'rgba(255,255,255,0.03)',
                                                    border: intensity > 3 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                                }}
                                                title={`${person.name} | ${skill.name}: Level ${intensity}`}
                                            ></div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4">
                    <span className="text-[10px] text-text-muted uppercase font-bold">Expertise Level:</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: i === 0 ? 'rgba(255,255,255,0.03)' : `rgba(245, 158, 11, ${[0.05, 0.2, 0.4, 0.6, 0.8, 1][i]})` }}></div>
                        ))}
                    </div>
                </div>
            </div>

        </div >
    );
};

export default Dashboard;
