import React, { useState } from 'react';
import { Shield, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('Engineering');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLogin(true); // reset alert layout
    setError(null);
    setSuccess(null);
    setLoading(true);

    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = isLogin ? `${baseUrl}/api/auth/login` : `${baseUrl}/api/auth/register`;
    const payload = isLogin
      ? { email, password }
      : { name, email, password, role, department };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        onAuthSuccess(data);
      } else {
        setSuccess('Account created successfully! Switching to Login...');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (roleSelected) => {
    if (roleSelected === 'Admin') {
      setEmail('admin@company.com');
      setPassword('admin123');
    } else {
      setEmail('employee@company.com');
      setPassword('employee123');
    }
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded border border-gray-300 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-indigo-600 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {isLogin ? 'Sign in to Workspace' : 'Create Account'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm text-center">
            {success}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <span className="block text-sm font-bold text-gray-700 mb-2">Role</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Employee')}
                    className={`py-2 px-3 text-sm rounded border ${
                      role === 'Employee'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`py-2 px-3 text-sm rounded border ${
                      role === 'Admin'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full rounded border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 border border-transparent rounded text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-indigo-600 hover:underline"
          >
            {isLogin ? 'Create an account' : 'Already have an account? Sign In'}
          </button>
        </div>

        {/* Demo Fast Fill Section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center text-xs text-gray-600 font-bold mb-2">
            Quick Demo Logins
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoFill('Admin')}
              className="py-1 px-2 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-xs text-gray-800"
            >
              Admin Demo
            </button>
            <button
              onClick={() => handleDemoFill('Employee')}
              className="py-1 px-2 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-xs text-gray-800"
            >
              Employee Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
