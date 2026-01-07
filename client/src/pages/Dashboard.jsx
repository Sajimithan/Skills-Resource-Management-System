import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
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
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                        <div className="text-2xl font-extrabold text-blue-100">{stats.utilization[0]?.name || 'N/A'}</div>
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

            {/* Utilization Forecast Chart */}
            <div className="card shadow-xl border border-white/5 mb-10">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-purple-400">Resource Load Forecast (3 Months)</h2>
                    <p className="text-text-muted text-sm">Projected weekly allocation percentage for top personnel.</p>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.utilizationForecast}>
                            <defs>
                                {stats.forecastKeys.map((key, i) => (
                                    <linearGradient key={`grad-${i}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                            />
                            <Legend />
                            {stats.forecastKeys.map((key, i) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={COLORS[i % COLORS.length]}
                                    fillOpacity={1}
                                    fill={`url(#color-${i})`}
                                    strokeWidth={3}
                                    stackId="1"
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>



            <div className="mb-8">
                <MagicBento items={bentoItems} spotlightRadius={200} />
            </div>

            {/* Skill Demand Trends Section */}
            <div className="card mt-10 border-t-4 border-t-primary shadow-lg">
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
                            {stats.skillDemand.length > 0 ? stats.skillDemand.map((skill, i) => (
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

        </div >
    );
};

export default Dashboard;
