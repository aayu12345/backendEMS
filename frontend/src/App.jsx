import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Users, 
  Building2, 
  CalendarCheck, 
  IndianRupee, 
  LayoutDashboard, 
  LogOut, 
  RefreshCw, 
  ChevronRight, 
  Menu, 
  X
} from 'lucide-react';

// Importing modules
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeManager from './components/EmployeeManager';
import DepartmentManager from './components/DepartmentManager';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollManager from './components/PayrollManager';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Mobile drawer trigger
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load session from local storage on first mount
  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      setLoading(true);
      const cached = localStorage.getItem('employee_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        
        // Verify token with backend
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${parsed.token}` }
        });

        if (res.ok) {
          const verifiedUser = await res.json();
          // Update credentials in session
          const updated = { ...parsed, user: verifiedUser.user };
          setSession(updated);
          localStorage.setItem('employee_session', JSON.stringify(updated));
        } else {
          // If token expired, wipe local storage session
          localStorage.removeItem('employee_session');
          setSession(null);
        }
      }
    } catch (e) {
      console.error('Session clearance exception', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (newSession) => {
    setSession(newSession);
    localStorage.setItem('employee_session', JSON.stringify(newSession));
    setActiveTab('Dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('Are you ready to log out of your session?')) {
      localStorage.removeItem('employee_session');
      setSession(null);
    }
  };

  const handleRefreshReports = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="text-indigo-600 mb-4">Loading...</div>
        <p className="text-gray-500">Initializing Organization Vault...</p>
      </div>
    );
  }

  if (!session) {
    return <Login onAuthSuccess={handleAuthSuccess} />;
  }

  // Define tab navigation properties
  const rawRole = session.user?.role || '';
  const role = (rawRole.toUpperCase() === 'ADMIN') ? 'Admin' : 'Employee';
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Employees', icon: Users },
    { name: 'Departments', icon: Building2 },
    { name: 'Attendance', icon: CalendarCheck },
    { name: 'Payroll', icon: IndianRupee },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans border-t-4 border-indigo-600">
      
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-100 border-r border-gray-200 flex-shrink-0">
        
        {/* Workspace Brand Title */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-indigo-700 font-bold">
            <Shield className="h-5 w-5" />
            <span>OrgMaster Suite</span>
          </div>
        </div>

        {/* User Badge Profile info */}
        <div className="p-4 border-b border-gray-200">
          <p className="font-bold text-gray-800">{session.user.name}</p>
          <p className="text-sm text-gray-500 uppercase">{role} Workspace</p>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 p-2 rounded text-sm text-left ${
                  isCurrent 
                    ? 'bg-indigo-600 text-white font-bold' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Bottom logout controls */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-2 rounded text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Logout Session
          </button>
        </div>
      </aside>

      {/* Mobile Sticky Navbar Header */}
      <header className="md:hidden bg-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <Shield className="h-5 w-5" />
          <span>OrgMaster</span>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-100 border-b border-gray-200 p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left p-2 border-b border-gray-200 text-gray-700"
            >
              {item.name}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left p-2 text-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {/* Main content body panel */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Universal Top Bar */}
        <header className="hidden md:flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Org Suite Desktop</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-bold text-indigo-600">{activeTab}</span>
          </div>

          <button
            onClick={() => {
              handleRefreshReports();
              verifySession();
            }}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300"
          >
            {syncing ? 'Syncing...' : 'Sync Database'}
          </button>
        </header>

        {/* Content Panel Frame container */}
        <div className="flex-1 p-4 sm:p-6 w-full max-w-7xl mx-auto">
          {activeTab === 'Dashboard' && (
            <Dashboard 
              token={session.token} 
              role={role} 
              employeeId={session.user.employeeId} 
              onNavigate={(tab) => setActiveTab(tab)} 
            />
          )}
          {activeTab === 'Employees' && (
            <EmployeeManager 
              token={session.token} 
              role={role} 
              employeeId={session.user.employeeId}
              onRefreshReports={handleRefreshReports} 
            />
          )}
          {activeTab === 'Departments' && (
            <DepartmentManager 
              token={session.token} 
              role={role} 
              onRefreshReports={handleRefreshReports} 
            />
          )}
          {activeTab === 'Attendance' && (
            <AttendanceTracker 
              token={session.token} 
              role={role} 
              employeeId={session.user.employeeId} 
              onRefreshReports={handleRefreshReports} 
            />
          )}
          {activeTab === 'Payroll' && (
            <PayrollManager 
              token={session.token} 
              role={role} 
              employeeId={session.user.employeeId} 
              onRefreshReports={handleRefreshReports} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
