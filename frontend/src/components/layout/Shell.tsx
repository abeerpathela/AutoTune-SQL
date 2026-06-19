import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Clock,
  Brain,
  Terminal,
  Database
} from 'lucide-react';

const NavItem = ({
  to,
  icon: Icon,
  label,
  active
}: {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  active: boolean;
}) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Shell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Overview' },
    { to: '/connections', icon: Database, label: 'Database Connections' },
    { to: '/studio', icon: Zap, label: 'Optimization Studio' },
    { to: '/history', icon: Clock, label: 'Query History' },
    { to: '/ml-stats', icon: Brain, label: 'ML Model Stats' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AutoTune-SQL</h1>
            <p className="text-xs text-gray-500">AI Query Optimizer</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              active={location.pathname === item.to}
            />
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};
