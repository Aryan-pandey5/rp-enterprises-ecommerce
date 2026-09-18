import React, { useState, useEffect } from 'react';
import { Layers, Save, CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';

const FIXED_GSM_VALUES = [80, 90, 100, 120, 140];

const GSMPrices = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();

  const [gsmPrices, setGsmPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchGsmPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/gsm-prices/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load global GSM prices.');
      const data = await res.json();
      
      // Ensure all 5 fixed GSMs exist in state
      const gsmMap = {};
      data.forEach(item => {
        gsmMap[item.gsm] = item.price;
      });

      const initializedPrices = FIXED_GSM_VALUES.map(g => ({
        gsm: g,
        gsm_display: `${g} GSM`,
        price: gsmMap[g] !== undefined ? String(gsmMap[g]) : '0.00'
      }));

      setGsmPrices(initializedPrices);
    } catch (err) {
      console.error('Error fetching GSM prices:', err);
      setError(err.message || 'Failed to connect to backend server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchGsmPrices();
    }
  }, [accessToken]);

  const handlePriceChange = (gsmVal, newPrice) => {
    setGsmPrices((prev) =>
      prev.map((item) => (item.gsm === gsmVal ? { ...item, price: newPrice } : item))
    );
  };

  const handleSavePrices = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate prices
    for (let item of gsmPrices) {
      const priceNum = parseFloat(item.price || 0);
      if (isNaN(priceNum) || priceNum < 0) {
        setError(`Global price for ${item.gsm} GSM cannot be negative or invalid.`);
        return;
      }
    }

    setSaving(true);

    try {
      const payload = gsmPrices.map((item) => ({
        gsm: item.gsm,
        price: item.price.trim() === '' ? '0.00' : String(parseFloat(item.price)),
      }));

      const res = await fetch(`${API_BASE_URL}/gsm-prices/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      setSaving(false);

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save global GSM prices.');
      }

      setSuccessMessage('Global GSM prices updated successfully! All Raw Material products now use these updated rates.');
      setTimeout(() => setSuccessMessage(''), 5000);

      if (resData.gsm_prices) {
        const gsmMap = {};
        resData.gsm_prices.forEach((item) => {
          gsmMap[item.gsm] = item.price;
        });

        setGsmPrices(
          FIXED_GSM_VALUES.map((g) => ({
            gsm: g,
            gsm_display: `${g} GSM`,
            price: gsmMap[g] !== undefined ? String(gsmMap[g]) : '0.00',
          }))
        );
      }
    } catch (err) {
      setSaving(false);
      setError(err.message || 'Error updating prices.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
            Raw Material Pricing Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">Global Raw Material GSM Prices</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Configure global prices per GSM choice for paper/raw material products.
          </p>
        </div>

        <button
          onClick={fetchGsmPrices}
          className="inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
          <span>Reload Rates</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Pricing Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Standard Fixed GSM Rate Card</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Updating a price here will immediately recalculate prices across all raw material catalog items assigned to that GSM.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading GSM rate card...</p>
          </div>
        ) : (
          <form onSubmit={handleSavePrices} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gsmPrices.map((item) => (
                <div 
                  key={item.gsm} 
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 dark:text-white bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 px-3 py-1 rounded-xl">
                      {item.gsm} GSM
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fixed Rate</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Price per Unit (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 dark:text-slate-500 text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => handlePriceChange(item.gsm, e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 text-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving GSM Rates...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Global GSM Rates</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>

    </div>
  );
};

export const AdminGSMPricesPage = GSMPrices;
export default GSMPrices;
