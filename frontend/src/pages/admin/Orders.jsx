import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import BulkDeleteModal from '../../components/BulkDeleteModal';
import { useBulkSelection } from '../../hooks/useBulkSelection';
import { 
  ShoppingBag, 
  Search, 
  X, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  AlertTriangle 
} from 'lucide-react';

const Orders = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Remove Modal State
  const [orderToRemove, setOrderToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Bulk Remove Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchAdminOrders = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/admin/orders/`;
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load active orders list.');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setError(err.message || 'Error connecting to server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchAdminOrders();
    }
  }, [accessToken, selectedStatus, searchQuery]);

  // Handle inline order status change
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setToast('');
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status.');
      }

      setToast(data.message || 'Order status updated successfully.');
      setTimeout(() => setToast(''), 4000);
      
      fetchAdminOrders();
    } catch (err) {
      setError(err.message);
    }
    setUpdatingId(null);
  };

  // Handle Admin Remove Order
  const handleRemoveOrderConfirm = async () => {
    if (!orderToRemove) return;

    setRemoving(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderToRemove.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setRemoving(false);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove order.');
      }

      setToast(data.message || 'Order removed successfully from active order list.');
      setTimeout(() => setToast(''), 4000);
      setOrderToRemove(null);
      
      // Update local state list immediately
      setOrders((prev) => prev.filter((o) => o.id !== orderToRemove.id));
    } catch (err) {
      setRemoving(false);
      setError(err.message || 'Error removing order.');
      setOrderToRemove(null);
    }
  };

  // Custom hook for managing order bulk selection state and Select All
  const {
    selectedIds,
    isAllSelected,
    isSomeSelected,
    selectAllRef,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    selectedCount
  } = useBulkSelection(orders, 'id');

  const handleBulkRemoveOrders = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setBulkError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/bulk-remove/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to bulk remove orders.');
      }

      setToast(data.message || `${data.deleted_count} order(s) removed successfully.`);
      setTimeout(() => setToast(''), 5000);
      clearSelection();
      setIsBulkModalOpen(false);
      fetchAdminOrders();
    } catch (err) {
      console.error('Error bulk removing orders:', err);
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Out for Delivery' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Order Fulfillment Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Admin Order Management</h1>
        </div>
      </div>

      {/* Success Toast */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
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

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Live Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number or customer name..."
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-emerald-600 cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Select All & Bulk Action Bar */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <span>Select All ({orders.length} active orders)</span>
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
            <span>Remove Selected {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
          </button>
        </div>
      )}

      {/* Admin Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading active customer orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Orders Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">No customer orders match your search or filter criteria.</p>
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
                  <th className="py-4 px-6">Order Number</th>
                  <th className="py-4 px-4">Customer Details</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4 text-center">Items</th>
                  <th className="py-4 px-4 text-right">Total Amount</th>
                  <th className="py-4 px-6 text-center">Status Action</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                {orders.map((ord) => (
                  <tr key={ord.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(ord.id) ? 'bg-emerald-50/30 dark:bg-emerald-950/30' : ''}`}>
                    
                    {/* Checkbox Cell */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ord.id)}
                        onChange={() => handleSelectRow(ord.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                    </td>

                    {/* Order Number */}
                    <td className="py-4 px-6 font-black text-slate-900 dark:text-white">
                      #{ord.order_number}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4 space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white block">{ord.customer_name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">{ord.customer_mobile}</span>
                    </td>

                    {/* Order Date */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {new Date(ord.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>

                    {/* Items Count */}
                    <td className="py-4 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {ord.total_items} items
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 text-right font-black text-emerald-800 dark:text-emerald-400 text-sm">
                      ₹{parseFloat(ord.total_amount).toFixed(2)}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-6 text-center">
                      {updatingId === ord.id ? (
                        <div className="flex items-center justify-center space-x-1 text-slate-400 dark:text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[10px] font-bold">Updating...</span>
                        </div>
                      ) : (
                        <select
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          className={`text-xs font-bold py-1.5 px-3 rounded-xl border cursor-pointer focus:outline-hidden ${
                            ord.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                            ord.status === 'CONFIRMED' ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                            ord.status === 'PROCESSING' ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800' :
                            ord.status === 'SHIPPED' ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800' :
                            ['RECEIVED', 'DELIVERED'].includes(ord.status) ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                            'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Out for Delivery</option>
                          <option value="RECEIVED">Received</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setOrderToRemove(ord)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Remove Order from Active View"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Remove Single Order Confirmation Modal */}
      {orderToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Remove Order #{orderToRemove.order_number}?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Are you sure you want to remove Order <strong className="text-slate-900 dark:text-white">#{orderToRemove.order_number}</strong> from active management view?
            </p>
            <p className="text-[11px] text-slate-400 italic">
              Note: This action removes the order record from the active order table while retaining system audit history logs.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={removing}
                onClick={() => setOrderToRemove(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={handleRemoveOrderConfirm}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {removing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Remove Orders Modal */}
      <BulkDeleteModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onConfirm={handleBulkRemoveOrders}
        selectedCount={selectedCount}
        title="Orders"
        actionLabel="Remove"
        loading={bulkLoading}
        error={bulkError}
      />

    </div>
  );
};

export const AdminOrdersPage = Orders;
export default Orders;
