import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import ProductFormModal from '../../components/ProductFormModal';
import CategoryFormModal from '../../components/CategoryFormModal';
import BulkDeleteModal from '../../components/BulkDeleteModal';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { 
  Package, 
  Plus, 
  FolderPlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

const Products = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [toast, setToast] = useState('');
  const [imgErrors, setImgErrors] = useState({});

  const handleImageError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Single delete modal state
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Bulk Delete modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.warn('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/?include_inactive=true`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (err) {
      console.warn('Error fetching products:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [accessToken]);

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleToggleActive = async (productId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/toggle-active/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productToDelete.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product permanently.');
      }
      setToast('Product deleted permanently.');
      setTimeout(() => setToast(''), 4000);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter products by search and section tab
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = (prod.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prod.category_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'DISPOSABLE') return prod.category_type === 'DISPOSABLE';
    if (activeTab === 'RAW_MATERIAL') return prod.category_type === 'RAW_MATERIAL';
    if (activeTab === 'INACTIVE') return !prod.is_active;

    return true;
  });

  // Custom hook for managing bulk selection state and Select All
  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    selectAllRef,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    selectedCount
  } = useBulkSelection(filteredProducts, 'id');

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setBulkError('');
    try {
      const res = await fetch(`${API_BASE_URL}/products/bulk-delete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete selected products.');
      }
      setToast(data.message || `${data.deleted_count} product(s) deleted successfully.`);
      setTimeout(() => setToast(''), 4000);
      clearSelection();
      setIsBulkModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Bulk delete product error:', err);
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const totalProducts = products.length;
  const disposableCount = products.filter(p => p.category_type === 'DISPOSABLE').length;
  const rawMaterialCount = products.filter(p => p.category_type === 'RAW_MATERIAL').length;
  const inactiveCount = products.filter(p => !p.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
            Admin Management Portal
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">
            Product & Inventory Control
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage disposable items, raw materials, bori packaging variants, and active stock.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer border border-slate-300"
          >
            <FolderPlus className="w-4 h-4 text-emerald-700" />
            <span>Add Category</span>
          </button>
          
          <button
            onClick={handleOpenAddProduct}
            className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total Catalog Items</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalProducts}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Disposable Items</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{disposableCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Raw Materials</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{rawMaterialCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-xl">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Inactive Products</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{inactiveCount}</p>
          </div>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Products' },
            { id: 'DISPOSABLE', label: 'Disposable Products' },
            { id: 'RAW_MATERIAL', label: 'Raw Materials' },
            { id: 'INACTIVE', label: 'Inactive' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search product or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-600 text-xs font-medium"
          />
        </div>

      </div>

      {/* Select All & Bulk Action Bar */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <span>Select All ({filteredProducts.length} items)</span>
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

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading catalog items...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Products Found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              No matching items found for the selected category filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4">GSM</th>
                  <th className="py-3.5 px-4">Price / Calculated</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredProducts.map((prod) => {
                  const isRawMat = prod.category_type === 'RAW_MATERIAL';
                  const calcPrice = prod.calculated_price || prod.price;
                  const priceStr = (calcPrice && parseFloat(calcPrice) > 0)
                    ? `₹${parseFloat(calcPrice).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                    : 'Price unavailable';

                  return (
                    <tr key={prod.id} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(prod.id) ? 'bg-emerald-50/30 dark:bg-emerald-950/30' : ''}`}>
                      
                      {/* Checkbox Cell */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(prod.id)}
                          onChange={() => handleSelectRow(prod.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                      </td>
                      
                      {/* Thumbnail & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                            {prod.image_url && !imgErrors[prod.id] ? (
                              <img 
                                src={prod.image_url} 
                                alt={prod.name} 
                                onError={() => handleImageError(prod.id)}
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block leading-tight">{prod.name}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">ID: #{prod.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Section Badge */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{prod.category_name}</span>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                            isRawMat 
                              ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300' 
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {prod.category_type_display || prod.category_type}
                          </span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-4 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {prod.size || '—'}
                      </td>

                      {/* Weight */}
                      <td className="py-4 px-4 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                        {isRawMat ? (prod.weight_display || (prod.weight ? `${prod.weight} kg` : '—')) : '—'}
                      </td>

                      {/* GSM */}
                      <td className="py-4 px-4 text-xs font-bold text-indigo-900 dark:text-indigo-400">
                        {isRawMat ? (
                          prod.gsm_display || (prod.gsm ? `${prod.gsm} GSM` : '—')
                        ) : '—'}
                      </td>

                      {/* Calculated Price / Base Price */}
                      <td className="py-4 px-4 font-black">
                        {isRawMat ? (
                          calcPrice && parseFloat(calcPrice) > 0 ? (
                            <span className="text-slate-900">{priceStr}</span>
                          ) : (
                            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">Price unavailable</span>
                          )
                        ) : (
                          prod.variants && prod.variants.length > 0 ? (
                            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                              {prod.variants.length} Variants (From ₹{Math.min(...prod.variants.map(v => parseFloat(v.price))).toFixed(2)})
                            </span>
                          ) : (
                            <span className="text-slate-900">₹{parseFloat(prod.base_price).toFixed(2)}</span>
                          )
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {prod.is_active ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Available</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Not Available</span>
                          </span>
                        )}
                      </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        
                        {/* Toggle Active / Availability Button */}
                        <button
                          onClick={() => handleToggleActive(prod.id)}
                          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={prod.is_active ? "Mark as Not Available" : "Mark as Available"}
                        >
                          {prod.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Permanently Button */}
                        <button
                          onClick={() => {
                            setProductToDelete(prod);
                            setDeleteError('');
                          }}
                          className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Permanently Delete Product"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={() => {
          fetchCategories();
          fetchProducts();
        }}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
        categories={categories}
        onProductSaved={() => {
          fetchProducts();
        }}
      />

      {/* Permanent Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Permanently Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete <span className="font-bold text-slate-800">"{productToDelete.name}"</span>? This action cannot be undone and will permanently remove the product and its quality variants from the database.
              </p>
            </div>

            {/* Error Message */}
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                disabled={deleteLoading}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleDeleteProduct}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Permanently</span>
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
        onConfirm={handleBulkDelete}
        selectedCount={selectedCount}
        title="Products"
        actionLabel="Delete"
        loading={bulkLoading}
        error={bulkError}
      />

    </div>
  );
};

export const AdminProductsPage = Products;
export default Products;
