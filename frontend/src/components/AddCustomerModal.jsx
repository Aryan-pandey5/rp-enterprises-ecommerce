import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Loader2, Lock, Phone, MapPin, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';

const AddCustomerModal = ({ isOpen, onClose, onCustomerAdded }) => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Customer name cannot be empty.');
      return;
    }

    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    if (cleanedMobile.length < 10 || cleanedMobile.length > 15) {
      setError('Mobile number must contain between 10 and 15 digits.');
      return;
    }

    if (!address.trim()) {
      setError('Delivery address cannot be empty.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          mobile_number: cleanedMobile,
          address: address.trim(),
          password: password,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        let errStr = 'Failed to create customer account.';
        if (data.error) errStr = data.error;
        else if (data.mobile_number) errStr = Array.isArray(data.mobile_number) ? data.mobile_number.join(' ') : data.mobile_number;
        else if (typeof data === 'object') errStr = Object.values(data).flat().join(' ');
        throw new Error(errStr);
      }

      onCustomerAdded(data.customer || data);
      setName('');
      setMobileNumber('');
      setAddress('');
      setPassword('');
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Server connection error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Customer</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Create a customer profile for order placement</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start space-x-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Full Customer Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. Ramesh Chandra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Mobile Number (10 Digits) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Mobile number is used as the customer's login username.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Delivery Address *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <textarea
                placeholder="e.g. Shop 12, Main Wholesale Market, Kanpur, UP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Account Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Password will be securely hashed using Django standards.</p>
          </div>

          {/* Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-sm shadow-sm cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Customer</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddCustomerModal;
