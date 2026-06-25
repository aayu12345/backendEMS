import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, Filter, Mail, Phone, Star, Building2 } from 'lucide-react';

export default function EmployeeManager({ token, role, employeeId, onRefreshReports }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Form states (Add/Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [systemRole, setSystemRole] = useState('Employee');
  const [position, setPosition] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState('Active');
  const [joinDate, setJoinDate] = useState('');
  const [address, setAddress] = useState('');
  const [performanceScore, setPerformanceScore] = useState('4');
  const [createAccount, setCreateAccount] = useState(false);
  const [initialPassword, setInitialPassword] = useState('employee123');

  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empRes, deptRes] = await Promise.all([
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!empRes.ok || !deptRes.ok) {
        throw new Error('Could not pull staff directory details');
      }

      const empData = await empRes.json();
      const deptData = await deptRes.json();

      setEmployees(empData);
      setDepartments(deptData);

      if (deptData.length > 0) {
        setDepartmentId(deptData[0].id);
      }
    } catch (err) {
      setError(err.message || 'Fetching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setSystemRole('Employee');
    setPosition('');
    setSalary('');
    setStatus('Active');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setAddress('');
    setPerformanceScore('4');
    setCreateAccount(false);
    setInitialPassword('employee123');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (emp) => {
    setIsEditMode(true);
    setEditingId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone || '');
    setSystemRole(emp.role === 'Admin' ? 'Admin' : 'Employee');
    setPosition(emp.position || '');
    setDepartmentId(emp.departmentId || '');
    setSalary(emp.salary ? emp.salary.toString() : '');
    setStatus(emp.status);
    setJoinDate(emp.joinDate || '');
    setAddress(emp.address || '');
    setPerformanceScore(emp.performanceScore ? emp.performanceScore.toString() : '4');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to offboard this employee?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete employee');
      }

      setEmployees(employees.filter(e => e.id !== id));
      onRefreshReports();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      name,
      email,
      phone,
      role: systemRole,
      position,
      departmentId,
      salary: Number(salary),
      status,
      joinDate,
      address,
      performanceScore: Number(performanceScore),
      createAccount,
      initialPassword
    };

    const url = isEditMode ? `/api/employees/${editingId}` : '/api/employees';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setFormSuccess(isEditMode ? 'Employee updated successfully!' : 'New Employee created and indexed!');
      
      // Update employee list state
      if (isEditMode) {
        setEmployees(employees.map(e => e.id === editingId ? data : e));
      } else {
        setEmployees([...employees, data]);
      }

      onRefreshReports();

      // Delay modal closing slightly for visual success confirmation
      setTimeout(() => {
        setIsFormOpen(false);
      }, 1000);

    } catch (err) {
      setFormError(err.message || 'Operation failed');
    }
  };

  // Directory Filter Computations
  const filteredEmployees = employees.filter(emp => {
    const searchString = (emp.name + ' ' + emp.email + ' ' + (emp.position || '') + ' ' + emp.role).toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'All' || emp.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 font-medium">Loading staff directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner and Navigation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employee Records Directory</h1>
          <p className="text-sm text-gray-500">Total: {filteredEmployees.length} records</p>
        </div>
        
        {role === 'Admin' && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" /> Onboard Associate
          </button>
        )}
      </div>

      {/* Directory Filter Panel */}
      <div className="bg-white p-4 rounded border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employees..."
            className="block w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="block w-full rounded border border-gray-300 py-2 px-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full rounded border border-gray-300 py-2 px-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-x-auto">
        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No employees found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600">
                <th className="py-3 px-4 font-semibold">Name & Bio</th>
                <th className="py-3 px-4 font-semibold">Contact</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Annual Base</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                {role === 'Admin' && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {filteredEmployees.map(emp => {
                const dept = departments.find(d => d.id === emp.departmentId);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{emp.name}</div>
                      <div className="text-gray-500 text-xs font-medium">{emp.position || emp.role}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      <div>{emp.email}</div>
                      <div>{emp.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {dept ? dept.name : 'Unknown'}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {(role === 'Admin' || emp.id === employeeId) ? `₹${emp.salary.toLocaleString()}` : <span className="text-gray-400 font-normal italic">Confidential</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-xs px-2 py-1 rounded ${
                        emp.status === 'Active' ? 'bg-green-100 text-green-800' :
                        emp.status === 'On Leave' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    {role === 'Admin' && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditForm(emp)}
                          className="text-indigo-600 hover:text-indigo-900 mx-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Onboarding Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border border-gray-300 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditMode ? 'Modify Employee' : 'Onboard Employee'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>

            {formError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-green-100 text-green-700 text-sm rounded mb-4">{formSuccess}</div>}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Access Role</label>
                  <select
                    value={systemRole}
                    onChange={(e) => setSystemRole(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Job Position</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  >
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Join Date</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Rating</label>
                  <select
                    value={performanceScore}
                    onChange={(e) => setPerformanceScore(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                <textarea
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>

              {!isEditMode && (
                <div className="bg-gray-100 p-3 rounded">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="rounded"
                    />
                    Generate Login Account
                  </label>
                  {createAccount && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 mb-1">Initial Password</label>
                      <input
                        type="text"
                        value={initialPassword}
                        onChange={(e) => setInitialPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  {isEditMode ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
