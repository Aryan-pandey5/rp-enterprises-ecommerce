import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Reusable Confirmation Modal for Admin Bulk Delete & Bulk Remove Operations.
 * Displays total count, large operation warnings (> 25 items), action buttons, and loading spinner.
 */
const BulkDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount = 0,
  title = "Items",
  actionLabel = "Delete",
  loading = false,
  error = ""
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const isLargeOperation = selectedCount > 25;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              {t('deleteConfirmTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('deleteConfirmMessage')}
            </p>
          </div>
        </div>

        {/* Large Operation Warning (> 25 Items) */}
        {isLargeOperation && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">{t('warning')}</span>
              <span>{selectedCount} items selected.</span>
            </div>
          </div>
        )}

        {/* Default Reversibility Notice */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl text-slate-600 dark:text-slate-300 text-xs font-medium">
          {t('note')}: {selectedCount} records.
        </div>

        {/* Error message display */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || selectedCount === 0}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{t('processing')}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-white" />
                <span>{t('deleteSelected')} ({selectedCount})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BulkDeleteModal;
