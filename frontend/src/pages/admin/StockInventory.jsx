import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import BulkDeleteModal from '../../components/BulkDeleteModal';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { 
  Boxes, 
  Plus, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Loader2, 
  AlertCircle, 
  Search, 
  Filter, 
  RefreshCw,
  Trash2
} from 'lucide-react';

const StockInventory = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();

  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State for stock adjustment
  const [showModal, setShowModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adjustmentMode, setAdjustmentMode] = useState('SET'); // 'SET' or 'ADD'
  const [stockValue, setStockValue] = useState('');
  const [reason, setReason] = useState('MANUAL_ADJUSTMENT');

  // Bulk delete state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Debounce search input typing (400ms) to prevent excessive backend API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Inventory Data from Django REST API with server-side search and filters
  const fetchStockData = async () => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearch.trim(),
        section: sectionFilter,
        category: categoryFilter,
        status: statusFilter,
      });

      const res = await fetch(`${API_BASE_URL}/admin/stock/?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load inventory data.');

      const data = await res.json();
      setVariants(data.variants || []);
      if (data.categories) setCategories(data.categories);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error loading stock:', err);
      setError(err.message || 'Error connecting to backend server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchStockData();
    }
  }, [accessToken, debouncedSearch, sectionFilter, categoryFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSectionFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
  };

  // Custom hook for managing stock variant bulk selection state and Select All
  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    selectAllRef,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    selectedCount
  } = useBulkSelection(variants, 'id');

  const handleBulkDeleteStock = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setBulkError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stock/bulk-delete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to bulk delete stock items.');
      }

      setToast(data.message || `${data.deleted_count} stock item(s) deleted successfully.`);
      setTimeout(() => setToast(''), 5000);
      clearSelection();
      setIsBulkModalOpen(false);
      fetchStockData();
    } catch (err) {
      console.error('Error bulk deleting stock items:', err);
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const openAdjustModal = (variant) => {
    setSelectedVariant(variant);
    setStockValue(variant.stock.toString());
    setAdjustmentMode('SET');
    setReason('MANUAL_ADJUSTMENT');
    setShowModal(true);
  };

  // Submit Stock Update handler
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setToast('');

    const payload = {
      variant_id: selectedVariant.id,
      reason,
    };

    if (adjustmentMode === 'SET') {
      payload.new_stock = parseInt(stockValue);
    } else {
      payload.add_quantity = parseInt(stockValue);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/stock/update/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock.');

      setToast(data.message);
      setTimeout(() => setToast(''), 4000);
      setShowModal(false);
      fetchStockData();
    } catch (err) {
      setError(err.message);
    }
    setUpdating(false);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Factory Warehouse Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Stock & Inventory Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time stock level tracking, low-stock threshold alerts, and manual inventory adjustments.
          </p>
        </div>

        <button
          onClick={fetchStockData}
          className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-300 shadow-2xs shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-emerald-700" />
          <span>Refresh Live Stock</span>
        </button>
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Live Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name or variant quality..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            
            {/* Section Filter */}
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Sections</option>
              <option value="DISPOSABLE">Disposable Products</option>
              <option value="RAW_MATERIAL">Raw Materials</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-emerald-600 cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>

            {/* Stock Availability Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="IN_STOCK">In Stock (&gt; 10 units)</option>
              <option value="LOW_STOCK">Low Stock (1 - 10 units)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0 units)</option>
            </select>

            {(searchQuery || sectionFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}

          </div>

        </div>

      </div>

      {/* Select All & Bulk Action Bar */}
      {variants.length > 0 && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <span>Select All ({variants.length} inventory items)</span>
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

      {/* Stock Variants Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading live inventory metrics...</p>
          </div>
        ) : variants.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Inventory Items Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No product variants match the selected section, category, or stock availability filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-6">Product / Material</th>
                  <th className="py-4 px-4">Variant / Quality</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4 text-center">Current Stock</th>
                  <th className="py-4 px-4 text-center">Stock Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                {variants.map((v) => (
                  <tr key={v.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(v.id) ? 'bg-emerald-50/30 dark:bg-emerald-950/30' : ''}`}>
                    
                    {/* Checkbox Cell */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(v.id)}
                        onChange={() => handleSelectRow(v.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                    </td>

                    {/* Product Name & Section Badge */}
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">{v.product_name}</span>
                        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded ${
                          v.category_type === 'DISPOSABLE' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                        }`}>
                          {v.category_type_display || v.category_type}
                        </span>
                      </div>
                    </td>

                    {/* Variant Quality Name */}
                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {v.variant_name}
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {v.category_name}
                    </td>

                    {/* Current Stock Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {v.stock}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
                        {v.unit_packing || 'units'}
                      </span>
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-4 px-4 text-center">
                      {v.stock === 0 ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          <span>Out of Stock</span>
                        </span>
                      ) : v.stock <= 10 ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Low Stock Alert</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>In Stock</span>
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openAdjustModal(v)}
                        className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Update Stock</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Stock Adjust Modal */}
      {showModal && selectedVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Inventory Adjustment
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{selectedVariant.product_name}</h3>
                <p className="text-xs text-slate-500 font-medium">Quality Variant: {selectedVariant.variant_name}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              
              {/* Adjustment Mode Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('SET')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      adjustmentMode === 'SET'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Set New Total Quantity
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentMode('ADD')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      adjustmentMode === 'ADD'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    + Add New Manufactured Stock
                  </button>
                </div>
              </div>

              {/* Stock Quantity Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {adjustmentMode === 'SET' ? 'Absolute Stock Quantity *' : 'Quantity to Add to Current Stock *'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  placeholder={adjustmentMode === 'SET' ? 'Enter exact stock count' : 'e.g. 50'}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:outline-hidden focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Current stock in warehouse: <strong>{selectedVariant.stock} units</strong>
                </p>
              </div>

              {/* Adjustment Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Audit Log Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="MANUAL_ADJUSTMENT">Manual Stock Count Adjustment</option>
                  <option value="FACTORY_RESTOCK">New Factory Batch Produced</option>
                  <option value="DAMAGED_ITEMS">Damaged / Defective Stock Removed</option>
                  <option value="CUSTOMER_RETURN">Returned Order Restocked</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Stock...</span>
                    </>
                  ) : (
                    <span>Confirm & Update Inventory</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={handleBulkDeleteStock}
        selectedCount={selectedCount}
        title="Stock Items"
        actionLabel="Delete"
        loading={bulkLoading}
        error={bulkError}
      />

    </div>
  );
};

export const AdminStockPage = StockInventory;
export default StockInventory;
