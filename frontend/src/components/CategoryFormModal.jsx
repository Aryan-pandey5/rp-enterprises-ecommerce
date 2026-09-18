import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Edit, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';

// Category Add & Edit Modal component (Step 11)
// Handles both category creation (POST) and category editing (PUT)
const CategoryFormModal = ({ isOpen, onClose, onCategorySaved, categoryToEdit = null }) => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    category_type: 'DISPOSABLE',
    description: '',
    is_active: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when categoryToEdit changes or modal opens
  useEffect(() => {
    if (categoryToEdit) {
      setFormData({
        name: categoryToEdit.name || '',
        category_type: categoryToEdit.category_type || 'DISPOSABLE',
        description: categoryToEdit.description || '',
        is_active: categoryToEdit.is_active !== undefined ? categoryToEdit.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        category_type: 'DISPOSABLE',
        description: '',
        is_active: true,
      });
    }
    setError('');
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(categoryToEdit && categoryToEdit.id);

  // Handle Submit for Category Creation or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    setSubmitting(true);

    try {
      const url = isEditing 
        ? `${API_BASE_URL}/categories/${categoryToEdit.id}/` 
        : `${API_BASE_URL}/categories/`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        throw new Error(data.name?.[0] || data.error || `Failed to ${isEditing ? 'update' : 'create'} category.`);
      }

      const returnedCategory = data.category || data;
      onCategorySaved(returnedCategory, isEditing);
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <Edit className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <FolderPlus className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            )}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? `Edit Category (${categoryToEdit.name})` : 'Add New Category'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification Alert */}
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
              Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Disposable Thalis & Plates"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-600 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category Section *
            </label>
            <select
              value={formData.category_type}
              onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-600 text-sm font-medium"
            >
              <option value="DISPOSABLE">Disposable Products (Finished Items)</option>
              <option value="RAW_MATERIAL">Raw Materials (Reels, Foil, Stock)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Short category description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-600 text-sm font-medium"
            />
          </div>

          {/* Status Checkbox (Only in Edit Mode) */}
          {isEditing && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                Active Category (Visible to customers)
              </label>
            </div>
          )}

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
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-sm cursor-pointer disabled:opacity-60"
            >
              {submitting 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Category' : 'Save Category')
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CategoryFormModal;
