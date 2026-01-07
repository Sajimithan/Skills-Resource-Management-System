import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, Book, Briefcase, LayoutDashboard, Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

const Layout = () => {
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-text-main flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="mobile-header-bar">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-text-muted hover:text-primary">
                        <LayoutDashboard size={24} />
                    </button>
                    <span className="font-bold text-lg">SkillMatrix</span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-black/5 text-text-muted hover:text-primary transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* Backdrop Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`app-sidebar flex flex-col ${isSidebarOpen ? 'open' : ''}`}>
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-white p-2 rounded-lg">
                            <Zap size={20} />
                        </div>
                        <span className="font-bold text-lg">SkillMatrix</span>
                    </div>
                    {/* Close Button (Mobile Only) */}

                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">


                    <NavLink
                        to="/"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/personnel"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Users size={20} />
                        <span>Personnel</span>
                    </NavLink>

                    <NavLink
                        to="/skills"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Book size={20} />
                        <span>Skills Catalog</span>
                    </NavLink>

                    <NavLink
                        to="/projects"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Briefcase size={20} />
                        <span>Projects</span>
                    </NavLink>
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
                            className="p-2 rounded-full hover:bg-black/5 text-text-muted hover:text-primary transition-colors desktop-only hidden md:block" // Hidden on mobile, shown in header instead
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
