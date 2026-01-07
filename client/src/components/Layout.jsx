import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, Book, Briefcase, LayoutDashboard, Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

const Layout = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex h-screen bg-background text-text-main">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-border flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-border flex items-center gap-2">
                    <div className="bg-primary text-white p-2 rounded-lg">
                        <Zap size={20} />
                    </div>
                    <span className="font-bold text-lg">SkillMatrix</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 ml-2">Main</div>

                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/personnel" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        <span>Personnel</span>
                    </NavLink>

                    <NavLink to="/skills" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Book size={20} />
                        <span>Skills Catalog</span>
                    </NavLink>

                    <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <Briefcase size={20} />
                        <span>Projects</span>
                    </NavLink>


                    {/* Add more links if needed */}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary font-bold" style={{ backgroundColor: '#FFBE29', color: '#8D153A' }}>
                                SP
                            </div>
                            <div className="text-sm">
                                <div className="font-medium">Sajith Perera</div>
                                <div className="text-text-muted text-xs">Project Manager</div>
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-black/5 text-text-muted hover:text-primary transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
