import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import CategoryFormModal from '../../components/CategoryFormModal';
import BulkDeleteModal from '../../components/BulkDeleteModal';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { Layers, Plus, CheckCircle2, Edit3, Trash2, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';

// Admin Category Management Page component
const Categories = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modal State Management
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Delete Confirmation Modal State Management
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Bulk Delete Modal State Management
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Fetch all categories from API
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/categories/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to load categories.');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchCategories();
    }
  }, [accessToken]);

  // Open Create Category Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setShowFormModal(true);
  };

  // Open Edit Category Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setShowFormModal(true);
  };

  // Triggered when Category is saved (Created or Updated)
  const handleCategorySaved = (savedCategory, isEdit) => {
    setToast(isEdit ? `Category '${savedCategory.name}' updated successfully.` : `Category '${savedCategory.name}' created successfully.`);
    setTimeout(() => setToast(''), 4000);
    fetchCategories();
  };

  // Confirm and execute Category Deletion (DELETE /api/categories/<id>/)
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${categoryToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete category.');
      }

      // Success: Remove deleted category from local React state
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      setToast(data.message || `Category '${categoryToDelete.name}' deleted successfully.`);
      setTimeout(() => setToast(''), 4000);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Custom hook for managing category bulk selection state and Select All
  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    selectAllRef,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    selectedCount
  } = useBulkSelection(categories, 'id');

  const handleBulkDeleteCategories = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setBulkError('');
    try {
      const res = await fetch(`${API_BASE_URL}/categories/bulk-delete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to bulk delete categories.');
      }

      setToast(data.message || `${data.deleted_count} category(ies) deleted successfully.`);
      setTimeout(() => setToast(''), 5000);
      clearSelection();
      setIsBulkModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error bulk deleting categories:', err);
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Catalog Classification
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Category Management</h1>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Success Toast Banner */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Management Table & Cards Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Active Business Verticals & Categories</h3>
          <span className="text-xs font-bold text-slate-400">Total: {categories.length}</span>
        </div>

        {/* Select All & Bulk Action Bar */}
        {categories.length > 0 && (
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                ref={selectAllRef}
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span>Select All ({categories.length} categories)</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setBulkError('');
                setIsBulkModalOpen(true);
              }}
              disabled={selectedCount === 0}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                selectedCount > 0
                  ? 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading catalog categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No categories found.</p>
            <button
              onClick={handleOpenCreateModal}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              + Add your first category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                className={`p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  selectedIds.includes(cat.id) ? 'bg-emerald-50/40 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(cat.id)}
                        onChange={() => handleSelectRow(cat.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cat.category_type === 'DISPOSABLE' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                      }`}>
                        {cat.category_type === 'DISPOSABLE' ? 'Disposable Product' : 'Raw Material'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold ${cat.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {cat.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{cat.name}</h4>
                    {cat.description ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-2">{cat.description}</p>
                    ) : (
                      <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-1">No description provided.</p>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons (Edit & Delete) */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold">ID: #{cat.id}</span>

                  <div className="flex items-center space-x-2">
                    {/* Edit Category Button */}
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Category Button */}
                    <button
                      onClick={() => {
                        setCategoryToDelete(cat);
                        setDeleteError('');
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Category Form Modal */}
      {showFormModal && (
        <CategoryFormModal
          isOpen={showFormModal}
          categoryToEdit={editingCategory}
          onClose={() => {
            setShowFormModal(false);
            setEditingCategory(null);
          }}
          onCategorySaved={handleCategorySaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-6">
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Delete Category?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900">'{categoryToDelete.name}'</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Error alert if category has products */}
            {deleteError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Category</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={handleBulkDeleteCategories}
        selectedCount={selectedCount}
        title="Categories"
        actionLabel="Delete"
        loading={bulkLoading}
        error={bulkError}
      />

    </div>
  );
};

export const AdminCategoriesPage = Categories;
export default Categories;
