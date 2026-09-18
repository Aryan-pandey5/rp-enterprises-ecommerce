import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, Phone, MapPin, Save, CheckCircle2, AlertCircle, Bell, ArrowRight } from 'lucide-react';

// Customer Profile Management Page
const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    setSaving(true);
    const res = await updateProfile({ name, address });
    setSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Profile details updated successfully!' });
    } else {
      setMessage({ type: 'error', text: res.error });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-lg space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
          <div className="h-14 w-14 bg-emerald-700 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{user?.name || 'Customer Profile'}</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center space-x-2 mt-0.5">
              <span>Mobile ID: {user?.mobile_number}</span>
              {user?.is_staff && (
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  ADMIN STAFF
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Notifications Quick Access Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Account Notifications</h4>
              <p className="text-[11px] text-slate-500">Track order updates & manufacturing status</p>
            </div>
          </div>

          <Link
            to="/notifications"
            className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`p-4 rounded-xl flex items-start space-x-3 text-sm border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Registered Mobile Number (Identifier)
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={user?.mobile_number || ''}
                disabled
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Mobile number is your primary account identifier and cannot be changed directly.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Shipping & Delivery Address
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
                placeholder="Enter complete shipping address"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export const ProfilePage = Profile;
export default Profile;
