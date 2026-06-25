import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Building2, MapPin, DollarSign, Users, Briefcase, Eye } from 'lucide-react';

export default function DepartmentManager({ token, role, onRefreshReports }) {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewDeptDetails, setViewDeptDetails] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deptRes, empRes] = await Promise.all([
        fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!deptRes.ok || !empRes.ok) {
        throw new Error('Failed to retrieve corporate department structures');
      }

      const deptData = await deptRes.json();
      const empData = await empRes.json();

      setDepartments(deptData);
      setEmployees(empData);
    } catch (err) {
      setError(err.message || 'Failed loading departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName('');
    setManagerId('');
    setBudget('');
    setLocation('');
    setDescription('');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (dept) => {
    setIsEditMode(true);
    setEditingId(dept.id);
    setName(dept.name);
    setManagerId(dept.managerId || '');
    setBudget(dept.budget ? dept.budget.toString() : '');
    setLocation(dept.location || '');
    setDescription(dept.description || '');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deleting this department will reallocate all affiliated employees to remaining department groups. Confirm to proceed?')) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Could not delete department.');
      }

      setDepartments(departments.filter(d => d.id !== id));
      onRefreshReports();
      fetchData();
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
      managerId: managerId || null,
      budget: Number(budget),
      location,
      description
    };

    const url = isEditMode ? `/api/departments/${editingId}` : '/api/departments';
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

      setFormSuccess(isEditMode ? 'Department modified!' : 'Department structured and listed!');
      
      fetchData();
      onRefreshReports();

      setTimeout(() => {
        setIsFormOpen(false);
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 font-medium">Loading department budgets and layouts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Corporate Divisions & Departments</h1>
          <p className="text-sm text-gray-500">Deploy budget allocations and map leadership teams</p>
        </div>
        
        {role === 'Admin' && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Create Department
          </button>
        )}
      </div>

      {/* Main departments grid structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const deptStaff = employees.filter(e => e.departmentId === dept.id);
          const isInspecting = viewDeptDetails === dept.id;

          return (
            <div
              key={dept.id}
              className={`bg-white rounded border p-4 flex flex-col justify-between ${
                isInspecting ? 'border-indigo-600 col-span-1 md:col-span-2' : 'border-gray-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 text-indigo-700 flex items-center justify-center rounded font-bold">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{dept.name}</h3>
                    </div>
                  </div>

                  {role === 'Admin' && (
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded border border-gray-200">
                      <button
                        onClick={() => handleOpenEditForm(dept)}
                        className="p-1 text-gray-600 hover:text-indigo-600 rounded hover:bg-white"
                        title="Edit Department"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-1 text-gray-600 hover:text-red-600 rounded hover:bg-white"
                        title="Delete Department"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-2">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1">
                      <Users className="h-3 w-3" /> Team Size
                    </span>
                    <p className="text-sm font-bold text-gray-900">{dept.headcount || deptStaff.length} Associates</p>
                  </div>
                </div>

                {isInspecting && (
                  <div className="pt-4 mt-2 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      Team Roll ({deptStaff.length})
                    </h4>
                    
                    {deptStaff.length === 0 ? (
                      <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded text-center">
                        No employees currently assigned to this department division.
                      </p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-2">
                        {deptStaff.map(emp => (
                          <div key={emp.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <div>
                              <span className="text-sm font-bold text-gray-900">{emp.name}</span>
                              <p className="text-xs text-gray-500">{emp.role} • {emp.email}</p>
                            </div>
                            <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded border border-gray-300">
                              ₹{emp.salary.toLocaleString()}/yr
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setViewDeptDetails(isInspecting ? null : dept.id)}
                  className="flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Eye className="h-4 w-4" /> {isInspecting ? 'Fold Directory Roll' : 'Inspect Division Team'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border border-gray-300 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditMode ? 'Modify Department Information' : 'Deploy Corporate Division'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            {formError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded mb-4">{formError}</div>}
            {formSuccess && <div className="p-3 bg-green-100 text-green-700 text-sm rounded mb-4">{formSuccess}</div>}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Annual Budget (₹)</label>
                  <input
                    type="number"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Lead Director (Manager)</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                />
              </div>

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
                  {isEditMode ? 'Apply Updates' : 'Deploy Division'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
