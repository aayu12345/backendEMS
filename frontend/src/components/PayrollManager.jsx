import React, { useState, useEffect } from 'react';
import { FileText, Edit3, Printer, Landmark, CreditCard } from 'lucide-react';

export default function PayrollManager({ token, role, employeeId, onRefreshReports }) {
  const [payrollLogs, setPayrollLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchMonth, setSearchMonth] = useState('June');
  const [searchYear, setSearchYear] = useState('2026');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const [generateMonth, setGenerateMonth] = useState('June');
  const [generateYear, setGenerateYear] = useState('2026');
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedSlip, setSelectedSlip] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState(null);
  const [bonuses, setBonuses] = useState('');
  const [deductions, setDeductions] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [payRes, empRes] = await Promise.all([
        fetch('/api/payroll', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!payRes.ok || !empRes.ok) {
        throw new Error('Failed to retrieve salary structures and payslips.');
      }

      const payData = await payRes.json();
      const empData = await empRes.json();

      setPayrollLogs(payData);
      setEmployees(empData);

      if (role === 'Employee' && payData.length > 0) {
        const mySlips = payData.filter(p => p.employeeId === employeeId);
        if (mySlips.length > 0) {
          setSelectedSlip(mySlips[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Error pulling data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: generateMonth,
          year: Number(generateYear)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate logs');
      }

      alert(data.message || 'Payroll generated successfully!');
      fetchData();
      onRefreshReports();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenEditModal = (slip) => {
    setEditingSlip(slip);
    setBonuses(slip.bonuses.toString());
    setDeductions(slip.deductions.toString());
    setPaymentStatus(slip.status);
    setUpdateError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateSlip = async (e) => {
    e.preventDefault();
    if (!editingSlip) return;

    setUpdateError(null);
    try {
      const response = await fetch(`/api/payroll/${editingSlip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bonuses: Number(bonuses),
          deductions: Number(deductions),
          status: paymentStatus
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply updates');
      }

      setPayrollLogs(payrollLogs.map(p => p.id === editingSlip.id ? data : p));
      
      if (selectedSlip && selectedSlip.id === editingSlip.id) {
        setSelectedSlip(data);
      }

      setIsEditModalOpen(false);
      onRefreshReports();
    } catch (err) {
      setUpdateError(err.message);
    }
  };

  const handleReleasePayout = async (slipId) => {
    try {
      const response = await fetch(`/api/payroll/${slipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Paid'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error('Verification failed');
      }

      setPayrollLogs(payrollLogs.map(p => p.id === slipId ? data : p));
      
      if (selectedSlip && selectedSlip.id === slipId) {
        setSelectedSlip(data);
      }

      onRefreshReports();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  const filteredSlips = payrollLogs.filter(log => {
    if (role !== 'Admin' && log.employeeId !== employeeId) return false;
    const matchesMonth = log.month === searchMonth;
    const matchesYear = log.year.toString() === searchYear;
    const matchesName = !employeeSearch || log.employeeName?.toLowerCase().includes(employeeSearch.toLowerCase());
    return matchesMonth && matchesYear && matchesName;
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 font-medium">Loading payroll data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner & Generation tools */}
      {role === 'Admin' && (
        <div className="p-4 bg-white border border-gray-200 rounded shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Generate Workspace Pay Structures</h1>
            <p className="text-sm text-gray-500">Initiate payroll files for active employee listings</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              className="text-sm p-2 rounded border border-gray-300 outline-none"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={generateYear}
              onChange={(e) => setGenerateYear(e.target.value)}
              className="text-sm p-2 rounded border border-gray-300 outline-none"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <button
              onClick={handleGeneratePayroll}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded"
            >
              {isGenerating ? 'Pooling...' : 'Build List Logs'}
            </button>
          </div>
        </div>
      )}

      {/* Two column interactive grid: Directory list / payslip details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Payroll Logs List */}
        <div className={`space-y-4 ${role === 'Admin' ? 'xl:col-span-2' : 'xl:col-span-1'}`}>
          
          {/* Header search parameters */}
          <div className="bg-white p-4 border border-gray-200 rounded shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900">Search Payslips Database</h2>
              <FileText className="h-4 w-4 text-gray-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 font-bold mb-1">Target Month</label>
                <select
                  value={searchMonth}
                  onChange={(e) => {
                    setSearchMonth(e.target.value);
                    setSelectedSlip(null);
                  }}
                  className="block w-full text-sm p-2 rounded border border-gray-300 outline-none"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 font-bold mb-1">Target Year</label>
                <select
                  value={searchYear}
                  onChange={(e) => {
                    setSearchYear(e.target.value);
                    setSelectedSlip(null);
                  }}
                  className="block w-full text-sm p-2 rounded border border-gray-300 outline-none"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              {role === 'Admin' && (
                <div>
                  <label className="block text-xs text-gray-600 font-bold mb-1">Search Name</label>
                  <input
                    type="text"
                    placeholder="Search associate..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="block w-full text-sm p-2 rounded border border-gray-300 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* List display */}
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
            {filteredSlips.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12 italic">
                No salary profiles or payslips generated for {searchMonth} {searchYear}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-600">
                      <th className="py-3 px-4">Associate</th>
                      <th className="py-3 px-4">Base Earnings</th>
                      <th className="py-3 px-4">Take Home</th>
                      <th className="py-3 px-4">Status</th>
                      {role === 'Admin' && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSlips.map(slip => {
                      const isTargetInvoice = selectedSlip?.id === slip.id;
                      return (
                        <tr 
                          key={slip.id} 
                          onClick={() => setSelectedSlip(slip)}
                          className={`cursor-pointer transition ${
                            isTargetInvoice ? 'bg-indigo-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-900 block">{slip.employeeName}</span>
                            <span className="text-xs text-gray-500 block">{slip.month} {slip.year}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            ₹{slip.baseSalary.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">
                            ₹{slip.netSalary.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              slip.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {slip.status}
                            </span>
                          </td>
                          {role === 'Admin' && (
                            <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2 text-xs">
                                {slip.status === 'Pending' && (
                                  <button
                                    onClick={() => handleReleasePayout(slip.id)}
                                    className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded border border-green-300"
                                  >
                                    Pay Out
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditModal(slip)}
                                  className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Payslip printable-style invoice */}
        <div className={role === 'Admin' ? 'xl:col-span-1' : 'xl:col-span-2'}>
          {selectedSlip ? (
            <div className="bg-white border-2 border-gray-300 rounded p-6 space-y-6 shadow-sm">
              {/* Invoice top corner */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 font-bold text-gray-900 text-lg">
                    <Landmark className="h-5 w-5 text-indigo-600" /> Organization Co.
                  </div>
                  <p className="text-xs text-gray-500">Headquarters Floor 3, Suite Tech Tower</p>
                </div>
                
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded inline-block ${
                    selectedSlip.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedSlip.status === 'Paid' ? 'Paid & Approved' : 'Scheduled / Pending'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Ref ID: {selectedSlip.id}</p>
                </div>
              </div>

              {/* Title descriptor */}
              <div className="text-center bg-gray-50 py-3 rounded border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Official Payslip Statement</h3>
                <p className="text-xs text-gray-500">Salary statement generated for {selectedSlip.month} {selectedSlip.year}</p>
              </div>

              {/* Recipient info & stats */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-200 pb-4">
                <div>
                  <span className="block text-xs text-gray-500 font-bold uppercase mb-1">To Employee</span>
                  <p className="font-bold text-gray-900">{selectedSlip.employeeName}</p>
                  <p className="text-gray-500 text-xs mt-1">ID Code: {selectedSlip.employeeId}</p>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-500 font-bold uppercase mb-1">Transaction Details</span>
                  <p className="text-gray-700 text-xs">Method: Direct Deposit Bank Wire</p>
                  <p className="text-gray-700 text-xs">Payout date: {selectedSlip.payoutDate || 'TBD (At approval)'}</p>
                </div>
              </div>

              {/* Earnings table structures */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-gray-900">Salary breakdown</h4>

                <div className="space-y-2 border border-gray-200 p-4 rounded text-sm bg-gray-50">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Monthly Base Salary</span>
                    <span className="text-gray-900">₹{selectedSlip.baseSalary.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-green-700">+ Additional Bonus</span>
                    <span className="text-green-700">+ ₹{selectedSlip.bonuses.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-gray-300">
                    <span className="text-red-700">- Deductions</span>
                    <span className="text-red-700">- ₹{selectedSlip.deductions.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between pt-2 font-bold text-gray-900 text-lg">
                    <span>Net Take-Home Salary</span>
                    <span>₹{selectedSlip.netSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer signatures */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-200 text-xs">
                <div className="italic text-gray-500">
                  Automated electronic payslip.
                  <br />Approved by Corporate HR Desk.
                </div>
                
                <button
                  onClick={handlePrintPayslip}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold"
                >
                  <Printer className="h-4 w-4" /> Print Statement
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded p-12 text-center text-gray-500 italic flex flex-col items-center space-y-2">
              <CreditCard className="h-8 w-8 text-gray-400" />
              <span>Select any associate's payslip or roster statement on the left to examine their full pay breakdown.</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin parameters modifier popup */}
      {isEditModalOpen && editingSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded border border-gray-300 w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Adjust Payment</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              Client target: <strong className="text-gray-900">{editingSlip.employeeName}</strong> ({editingSlip.month} {editingSlip.year})
            </p>

            {updateError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded mb-2">{updateError}</div>}

            <form onSubmit={handleUpdateSlip} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Add Bonuses (₹)</label>
                <input
                  type="number"
                  required
                  value={bonuses}
                  onChange={(e) => setBonuses(e.target.value)}
                  className="block w-full rounded border border-gray-300 p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tax / Leave Deductions (₹)</label>
                <input
                  type="number"
                  required
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="block w-full rounded border border-gray-300 p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="block w-full rounded border border-gray-300 p-2 text-sm"
                >
                  <option value="Pending">Pending Audit</option>
                  <option value="Paid">Released & Paid</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-bold"
                >
                  Confirm parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
