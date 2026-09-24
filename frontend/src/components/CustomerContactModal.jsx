import React, { useState, useEffect } from 'react';
import { X, Phone, User, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import en from '../translations/en';
import hi from '../translations/hi';

const ADMIN_WHATSAPP_NUMBER = '919305616979';
const STORAGE_KEY = 'rp_contact_popup_dismissed';

const CustomerContactModal = () => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Do not show popup if auth status is still loading or if user is logged in
    if (loading || isAuthenticated) {
      setIsOpen(false);
      return;
    }

    // Check if popup was already closed/submitted during this session
    const isDismissed = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (isDismissed) {
      return;
    }

    // 15-second timer before opening popup
    const timer = setTimeout(() => {
      // Re-verify user is still logged out before showing
      if (!isAuthenticated && sessionStorage.getItem(STORAGE_KEY) !== 'true') {
        setIsOpen(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, loading]);

  if (!isOpen) return null;

  const handleClose = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    setError('');
  };

  const validateMobile = (mobile) => {
    let cleaned = mobile.replace(/\D/g, '');
    // If entered with country code 91 (12 digits) or leading 0 (11 digits), clean to 10 digits
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    // Valid Indian mobile numbers start with 6, 7, 8, or 9 and have 10 digits
    return /^[6-9]\d{9}$/.test(cleaned) ? cleaned : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('errNameRequired') || 'Please enter your full name.');
      return;
    }

    const validatedMobile = validateMobile(mobileNumber);
    if (!validatedMobile) {
      setError(t('errInvalidMobile') || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    // Build WhatsApp click-to-chat message text
    const message = `New Customer Enquiry\n\nName: ${trimmedName}\nMobile Number: ${validatedMobile}\n\nCustomer visited R.P. Enterprises website and requested product/details information.\n\nPlease contact the customer.`;

    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in a new tab (click-to-chat flow)
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    // Dismiss modal for this session
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
              <MessageCircle className="w-5 h-5 text-emerald-100" />
            </div>
            <h3 className="text-lg font-bold tracking-tight">
              {t('contactPopupTitle')}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors focus:outline-hidden"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6">
          <div className="space-y-2 mb-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
              {en.contactPopupDescription}
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-200/80 dark:border-slate-700/80 pt-2">
              {hi.contactPopupDescription}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-2 text-red-600 dark:text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('contactNameLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('contactNamePlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-hidden transition-all"
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('contactMobileLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder={t('contactMobilePlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-hidden transition-all"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors focus:outline-hidden"
              >
                {t('close')}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-hidden flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('sendDetails')}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default CustomerContactModal;
