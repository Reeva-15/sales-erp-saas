import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { ShieldCheck, KeyRound, User, UserCheck, Building2, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';

export const PrivacySecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'SALESPERSONS' | 'CUSTOMERS'>('SALESPERSONS');
  const [data, setData] = useState<{ users: any[]; salespersons: any[]; customers: any[] }>({
    users: [],
    salespersons: [],
    customers: []
  });
  const [loading, setLoading] = useState(true);

  // Reset Modal State
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountType, setAccountType] = useState<'USER' | 'SALESPERSON' | 'CUSTOMER'>('SALESPERSON');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/app/privacy-security/accounts');
      setData(res || { users: [], salespersons: [], customers: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleOpenResetModal = (account: any, type: 'USER' | 'SALESPERSON' | 'CUSTOMER') => {
    setSelectedAccount(account);
    setAccountType(type);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordText(false);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowPasswordText(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ApiService.post('/app/privacy-security/reset-password', {
        accountType,
        accountId: selectedAccount.id,
        newPassword
      });
      alert(res?.message || 'Password reset successfully!');
      setSelectedAccount(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-marron-800" />
            <h1 className="text-2xl font-bold text-marron-800">Privacy & Security Controls</h1>
          </div>
          <p className="text-xs text-gray-500">Manage credentials, password security, and account access policies for internal users, salespersons, and client accounts.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-warm-200 text-xs font-semibold">
        {[
          { id: 'SALESPERSONS', label: 'Salespersons', icon: UserCheck, count: data.salespersons.length },
          { id: 'CUSTOMERS', label: 'Customer Portal Accounts', icon: Building2, count: data.customers.length },
          { id: 'USERS', label: 'Internal Organization Users', icon: User, count: data.users.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition ${
                isActive
                  ? 'border-marron-800 text-marron-800 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-marron-100 text-marron-800' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Accounts List Container */}
      <div className="glass-card rounded-2xl p-4">
        {loading ? (
          <p className="text-xs text-gray-500 text-center py-6">Loading security accounts...</p>
        ) : (
          <div className="divide-y divide-warm-100">
            {activeTab === 'SALESPERSONS' &&
              (data.salespersons.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No salesperson records found.</p>
              ) : (
                data.salespersons.map((sp) => (
                  <div key={sp.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-marron-900 text-sm">{sp.name}</p>
                        <p className="text-gray-500">
                          Code: <span className="font-mono text-gray-800 font-semibold">{sp.code}</span> | Email: {sp.email || 'No email attached'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenResetModal(sp, 'SALESPERSON')}
                      className="px-3 py-1.5 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition flex items-center gap-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                ))
              ))}

            {activeTab === 'CUSTOMERS' &&
              (data.customers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No customer accounts found.</p>
              ) : (
                data.customers.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-marron-900 text-sm">{c.customerName}</p>
                        <p className="text-gray-500">
                          Code: <span className="font-mono text-gray-800 font-semibold">{c.customerCode}</span> | Email: {c.email || 'No portal email'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenResetModal(c, 'CUSTOMER')}
                      className="px-3 py-1.5 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition flex items-center gap-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                ))
              ))}

            {activeTab === 'USERS' &&
              (data.users.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No internal organization users found.</p>
              ) : (
                data.users.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-marron-900 text-sm">{u.name}</p>
                        <p className="text-gray-500">
                          Username: <span className="font-mono text-gray-800 font-semibold">{u.username}</span> | Role: {u.role?.name || 'Standard User'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenResetModal(u, 'USER')}
                      className="px-3 py-1.5 text-xs font-semibold text-marron-800 bg-marron-50 hover:bg-marron-100 rounded-lg border border-marron-200 transition flex items-center gap-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                ))
              ))}
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-warm-200">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-5 w-5 text-marron-800" />
              <h3 className="text-lg font-bold text-marron-800">Reset Account Password</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Updating credentials for: <span className="font-bold text-marron-900">{selectedAccount.name || selectedAccount.customerName}</span> ({accountType})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-gray-700">New Password *</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-marron-800 bg-marron-50 hover:bg-marron-100 px-2 py-0.5 rounded font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Auto-Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password..."
                    className="w-full p-2 pr-10 bg-warm-50 border rounded-lg font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-800"
                  >
                    {showPasswordText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700">Confirm Password *</label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full mt-1 p-2 bg-warm-50 border rounded-lg font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-marron-800 hover:bg-marron-700 text-white font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
