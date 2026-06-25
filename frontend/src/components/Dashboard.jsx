import React, { useEffect, useState } from 'react';
import { Users, Building2, UserCheck, CalendarCheck, IndianRupee, Award, Target, TrendingUp, Briefcase } from 'lucide-react';

export default function Dashboard({ token, role, employeeId, onNavigate }) {
  const [reports, setReports] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const [repRes, empRes, deptRes] = await Promise.all([
        fetch(`${baseUrl}/api/reports`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/employees`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/departments`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!repRes.ok || !empRes.ok || !deptRes.ok) {
        throw new Error('Failed to retrieve analytical reports');
      }

      const repData = await repRes.json();
      const empData = await empRes.json();
      const deptData = await deptRes.json();

      setReports(repData);
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err) {
      setError(err.message || 'Failed loading reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 font-medium">Loading workspace metrics...</p>
      </div>
    );
  }

  if (error || !reports) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-center my-6 max-w-xl mx-auto">
        <p className="font-semibold">{error || 'Could not load data'}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-3 px-4 py-2 bg-red-600 text-white font-medium text-sm rounded hover:bg-red-700"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // Find top performance score employee (5 out of 5)
  const stellarEmployees = employees.filter(e => e.performanceScore === 5);
  const departmentCount = departments.length;

  return (
    <div className="space-y-6 font-sans">
      {/* Simple welcome banner */}
      <div className="bg-indigo-700 p-6 rounded text-white shadow-sm">
        <div className="space-y-2">
          <span className="text-xs font-bold tracking-wider uppercase bg-indigo-800 px-2 py-1 rounded">
            {role === 'Admin' ? 'Management Dashboard' : 'Associate Workspace'}
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to Organization Center
          </h1>
          <p className="text-sm text-indigo-100">
            {role === 'Admin' 
              ? 'Real-time operational dashboard for headcount audits, department performance checks, daily clock-in details, and payroll releases.'
              : 'Clock-in, review company profile directory, monitor department lists, and review your latest payslips.'}
          </p>
        </div>
      </div>

      {/* Quick Numbers Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'Admin' ? (
          <>
            {/* Metric 1 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold rounded">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Total Employees</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{reports.totalEmployees}</h3>
                <p className="text-xs text-green-600 mt-1">{reports.statusSummary.active} Active Associates</p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 text-blue-700 flex items-center justify-center font-bold rounded">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Departments</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{departmentCount}</h3>
                <p className="text-xs text-blue-600 mt-1">Active blocks</p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 text-green-700 flex items-center justify-center font-bold rounded">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Attendance Today</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  {reports.attendanceSummary.totalTracked > 0 
                    ? `${reports.attendanceSummary.present + reports.attendanceSummary.late} / ${reports.attendanceSummary.totalTracked}`
                    : '100%'}
                </h3>
                <p className="text-xs text-yellow-600 mt-1">
                  {reports.attendanceSummary.late} late
                </p>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 text-purple-700 flex items-center justify-center font-bold rounded">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Averaged Salary</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  ₹{reports.averageSalaryGlobal.toLocaleString()} <span className="text-xs text-gray-400">/ yr</span>
                </h3>
                <p className="text-xs text-purple-600 mt-1">
                  Est. Monthly: ₹{(reports.payrollCost.monthlyAverage).toLocaleString()}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Employee Metric 1 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold rounded">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">My Position</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  {(() => {
                    const emp = employees.find(e => e.id === employeeId);
                    return emp ? (emp.position || emp.role || 'Unknown') : 'Unknown';
                  })()}
                </h3>
              </div>
            </div>

            {/* Employee Metric 2 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 text-blue-700 flex items-center justify-center font-bold rounded">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">My Department</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  {employees.find(e => e.id === employeeId)?.departmentId || 'Unassigned'}
                </h3>
              </div>
            </div>

            {/* Employee Metric 3 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 text-purple-700 flex items-center justify-center font-bold rounded">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Base Salary</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  ₹{employees.find(e => e.id === employeeId)?.salary?.toLocaleString() || 0}
                </h3>
              </div>
            </div>

            {/* Employee Metric 4 */}
            <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 text-green-700 flex items-center justify-center font-bold rounded">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Current Status</p>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  {employees.find(e => e.id === employeeId)?.status || 'Active'}
                </h3>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Section */}
      {role === 'Admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Simple Department List */}
          <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Department Distribution</h2>
            </div>

            <div className="space-y-4">
              {reports.deptDistribution.map(dept => (
                <div key={dept.id} className="border-b border-gray-100 pb-2">
                  <div className="flex justify-between text-sm font-bold text-gray-700">
                    <span>{dept.name}</span>
                    <span>{dept.employeeCount} Associates</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Avg Salary: ₹{dept.averageSalary.toLocaleString()}</span>
                    <span>Budget: ₹{dept.budget?.toLocaleString() || 0}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 mt-2 flex justify-end">
              <button 
                onClick={() => onNavigate('Departments')}
                className="text-sm text-indigo-600 hover:underline"
              >
                Manage Departments
              </button>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Attendance (Today)</h2>
            </div>

            {reports.attendanceSummary.totalTracked === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">No attendance registered for today.</p>
                <button
                  onClick={() => onNavigate('Attendance')}
                  className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Mark Attendance
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-lg font-bold">
                  Presence: {Math.round(((reports.attendanceSummary.present + reports.attendanceSummary.late) / reports.attendanceSummary.totalTracked) * 100)}%
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 border border-gray-200 rounded text-center">
                    <span className="text-xs text-gray-500">Present</span>
                    <div className="text-lg font-bold text-green-700">{reports.attendanceSummary.present}</div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded text-center">
                    <span className="text-xs text-gray-500">Late</span>
                    <div className="text-lg font-bold text-yellow-700">{reports.attendanceSummary.late}</div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded text-center">
                    <span className="text-xs text-gray-500">On Leave</span>
                    <div className="text-lg font-bold text-blue-700">{reports.attendanceSummary.leave}</div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded text-center">
                    <span className="text-xs text-gray-500">Absent</span>
                    <div className="text-lg font-bold text-red-700">{reports.attendanceSummary.absent}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: Secondary analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payroll Summary - Only for Admin */}
        {role === 'Admin' ? (
          <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Monthly Payroll</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Disbursed Funds</span>
                <span className="font-bold text-green-700">₹{reports.payrollCost.paid.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Pending Approval</span>
                <span className="font-bold text-red-700">₹{reports.payrollCost.pending.toLocaleString()}</span>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => onNavigate('Payroll')}
                  className="w-full py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  Go to Payroll Manager
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center space-y-3">
             <div className="h-12 w-12 bg-indigo-50 text-indigo-500 rounded-full flex justify-center items-center">
               <CalendarCheck className="h-6 w-6" />
             </div>
             <div>
               <h3 className="font-bold text-gray-900">Your Action Required</h3>
               <p className="text-sm text-gray-500 mt-1">Don't forget to mark your attendance today!</p>
             </div>
             <button 
                onClick={() => onNavigate('Attendance')}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded hover:bg-indigo-700"
              >
                Go to Attendance
              </button>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 mb-4">
            <h2 className="text-lg font-bold text-gray-800">Quick Links</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {role === 'Admin' ? (
              <>
                <button 
                  onClick={() => onNavigate('Employees')}
                  className="p-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                  Manage Employees
                </button>
                <button 
                  onClick={() => onNavigate('Departments')}
                  className="p-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                  Manage Departments
                </button>
                <button 
                  onClick={() => onNavigate('Attendance')}
                  className="p-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                  Audit Attendance
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('Attendance')}
                  className="p-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                  Clock In / Attendance
                </button>
                <button 
                  onClick={() => onNavigate('Payroll')}
                  className="p-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                  View Payslips
                </button>
                <button 
                  onClick={() => onNavigate('Employees')}
                  className="p-2 text-sm text-left text-gray-700 hover:bg-gray-100 rounded border border-gray-200"
                >
                  Company Directory
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
