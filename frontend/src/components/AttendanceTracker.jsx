import React, { useState, useEffect } from 'react';
import { Clock, Coffee } from 'lucide-react';

export default function AttendanceTracker({ token, role, employeeId, onRefreshReports }) {
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchName, setSearchName] = useState('');

  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchData();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/attendance', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!empRes.ok || !attRes.ok) {
        throw new Error('Failed to load corporate attendance register logs.');
      }

      const empData = await empRes.json();
      const attData = await attRes.json();

      setEmployees(empData);
      setAttendanceLogs(attData);
    } catch (err) {
      setError(err.message || 'Fetching log files failed');
    } finally {
      setLoading(false);
    }
  };

  const todayString = new Date().toISOString().split('T')[0];
  const myTodayLog = attendanceLogs.find(a => a.employeeId === employeeId && a.date === todayString);

  const handleClockIn = async () => {
    setIsSubmitting(true);
    setSuccessMsg(null);

    const now = new Date();
    const clockInStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const calculatedStatus = isLate ? 'Late' : 'Present';

    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayString,
          status: calculatedStatus,
          clockIn: clockInStr
        })
      });

      if (!response.ok) {
        throw new Error('Could not register clock in.');
      }

      setSuccessMsg(`Successfully Clocked In at ${clockInStr}! Current state: ${calculatedStatus}`);
      fetchData();
      onRefreshReports();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    setIsSubmitting(true);
    setSuccessMsg(null);

    const clockOutStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayString,
          status: myTodayLog?.status || 'Present',
          clockIn: myTodayLog?.clockIn,
          clockOut: clockOutStr
        })
      });

      if (!response.ok) {
        throw new Error('Failed to register checkout.');
      }

      setSuccessMsg(`Successfully Clocked Out at ${clockOutStr}!`);
      fetchData();
      onRefreshReports();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      alert('Specify leave description or sick details');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayString,
          status: 'Leave',
          leaveReason: leaveReason
        })
      });

      if (!response.ok) {
        throw new Error('On leave log registration failed.');
      }

      setSuccessMsg('Active Leave logged successfully for today.');
      setLeaveReason('');
      fetchData();
      onRefreshReports();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminMarkStatus = async (empId, itemStatus) => {
    try {
      let clockIn = undefined;
      let clockOut = undefined;

      if (itemStatus === 'Present') {
        clockIn = '09:00';
        clockOut = '17:00';
      } else if (itemStatus === 'Late') {
        clockIn = '10:00';
        clockOut = '17:00';
      }

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: empId,
          date: searchDate,
          status: itemStatus,
          clockIn,
          clockOut,
          leaveReason: itemStatus === 'Leave' ? 'Designated Admin Outage' : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      fetchData();
      onRefreshReports();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredLogs = attendanceLogs.filter(log => {
    const matchesDate = !searchDate || log.date === searchDate;
    const matchesName = !searchName || log.employeeName?.toLowerCase().includes(searchName.toLowerCase());
    return matchesDate && matchesName;
  });

  const activeEmployees = employees.filter(e => e.status === 'Active');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500 font-medium">Loading attendance registers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Employee Quick Clock-In Center */}
      {role === 'Employee' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 md:col-span-2 relative">
            <div className="absolute top-0 right-0 p-2 bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center gap-1 rounded-bl">
              <Clock className="h-4 w-4" /> Real-time Clock
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-500 uppercase">Current Daily Session</p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{currentTime}</h2>
              <p className="text-sm text-gray-600">{new Date().toDateString()}</p>
            </div>

            {successMsg && (
              <div className="p-3 bg-green-100 border border-green-200 text-green-800 font-bold rounded text-sm w-full max-w-sm">
                {successMsg}
              </div>
            )}

            <div className="flex gap-4 w-full max-w-sm">
              <button
                onClick={handleClockIn}
                disabled={isSubmitting || !!myTodayLog?.clockIn || myTodayLog?.status === 'Leave'}
                className="flex-1 py-3 px-4 bg-green-600 font-bold text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {myTodayLog?.clockIn ? `In: ${myTodayLog.clockIn}` : 'Clock In Session'}
              </button>

              <button
                onClick={handleClockOut}
                disabled={isSubmitting || !myTodayLog?.clockIn || !!myTodayLog?.clockOut}
                className="flex-1 py-3 px-4 bg-yellow-600 font-bold text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
              >
                {myTodayLog?.clockOut ? `Out: ${myTodayLog.clockOut}` : 'Clock Out Session'}
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Standard shifts: 09:00 AM to 05:00 PM. Clock-ins after 09:15 AM are automatically 'Late'.
            </div>
          </div>

          <div className="bg-white p-5 rounded border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Coffee className="h-4 w-4 text-indigo-600" /> Log Outage / Sick Day
            </h3>
            
            <form onSubmit={handleLeaveRequest} className="space-y-3">
              <input
                type="text"
                required
                disabled={!!myTodayLog}
                placeholder="e.g. Sick leave..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full text-sm p-2 rounded border border-gray-300"
              />
              <button
                type="submit"
                disabled={isSubmitting || !!myTodayLog}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold text-sm rounded"
              >
                File Leave
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Panel: Quick attendance registers */}
      {role === 'Admin' && (
        <div className="bg-white p-5 rounded border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daily Roster ({searchDate})</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-600">Pick Target Date:</span>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="text-sm p-2 rounded border border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEmployees.map(emp => {
              const dayLog = attendanceLogs.find(a => a.employeeId === emp.id && a.date === searchDate);

              return (
                <div key={emp.id} className="p-4 border border-gray-200 rounded bg-gray-50 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900">{emp.name}</h4>
                      <p className="text-xs text-gray-500">{emp.role}</p>
                    </div>
                    {dayLog ? (
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                        dayLog.status === 'Present' ? 'bg-green-100 text-green-800' :
                        dayLog.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                        dayLog.status === 'Leave' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dayLog.status}
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase text-gray-500 bg-white border border-gray-300 px-2 py-1 rounded">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                    <span className="text-xs text-gray-500">Change Status:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Present')}
                        className="px-2 py-1 text-xs font-bold rounded border border-gray-300 bg-white hover:bg-gray-100"
                      >
                        Pre
                      </button>
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Late')}
                        className="px-2 py-1 text-xs font-bold rounded border border-gray-300 bg-white hover:bg-gray-100"
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Leave')}
                        className="px-2 py-1 text-xs font-bold rounded border border-gray-300 bg-white hover:bg-gray-100"
                      >
                        Lea
                      </button>
                      <button
                        onClick={() => handleAdminMarkStatus(emp.id, 'Absent')}
                        className="px-2 py-1 text-xs font-bold rounded border border-gray-300 bg-white hover:bg-gray-100"
                      >
                        Abs
                      </button>
                    </div>
                  </div>
                  
                  {dayLog && (dayLog.clockIn || dayLog.leaveReason) && (
                    <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 mt-2">
                      {dayLog.leaveReason ? `Memo: ${dayLog.leaveReason}` : `Hours: ${dayLog.clockIn || '--'} to ${dayLog.clockOut || 'active'}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Logs */}
      <div className="bg-white p-5 rounded border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Historical Attendance Logs</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-600">Filters:</span>
            <input
              type="text"
              placeholder="Search associate..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="text-sm p-2 rounded border border-gray-300"
            />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="text-sm p-2 rounded border border-gray-300"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center bg-gray-50 rounded">
            No historical logs found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Associate</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Clock In</th>
                  <th className="py-3 px-4 font-bold">Clock Out</th>
                  <th className="py-3 px-4 font-bold">Memo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{log.date}</td>
                    <td className="py-3 px-4 text-gray-800">{log.employeeName || log.employeeId}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block py-1 px-2 rounded font-bold text-xs ${
                        log.status === 'Present' ? 'bg-green-100 text-green-800' :
                        log.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                        log.status === 'Leave' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{log.clockIn || '--'}</td>
                    <td className="py-3 px-4 text-gray-600">{log.clockOut || '--'}</td>
                    <td className="py-3 px-4 text-gray-500">{log.leaveReason || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
