import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import { 
  Users, 
  Search, 
  X, 
  UserPlus, 
  Trash2, 
  Eye, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpDown, 
  AlertTriangle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AddCustomerModal from '../../components/AddCustomerModal';
import BulkDeleteModal from '../../components/BulkDeleteModal';
import { useBulkSelection } from '../../hooks/useBulkSelection';

const Customers = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date_joined_desc'); // default: All Customers (Newest First)

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk delete state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const fetchCustomers = async (search = searchQuery, sortOpt = sortOption) => {
    setLoading(true);
    setError('');

    let sortParam = 'date_joined';
    let orderParam = 'desc';

    if (sortOpt === 'total_purchase_desc') {
      sortParam = 'total_purchase';
      orderParam = 'desc';
    } else if (sortOpt === 'total_purchase_asc') {
      sortParam = 'total_purchase';
      orderParam = 'asc';
    } else if (sortOpt === 'total_orders_desc') {
      sortParam = 'total_orders';
      orderParam = 'desc';
    } else if (sortOpt === 'total_orders_asc') {
      sortParam = 'total_orders';
      orderParam = 'asc';
    } else if (sortOpt === 'name_asc') {
      sortParam = 'name';
      orderParam = 'asc';
    } else if (sortOpt === 'date_joined_asc') {
      sortParam = 'date_joined';
      orderParam = 'asc';
    }

    try {
      const queryParams = new URLSearchParams({
        search: search.trim(),
        sort: sortParam,
        order: orderParam,
      });

      const res = await fetch(`${API_BASE_URL}/admin/customers/?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load customer list.');

      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Error connecting to backend server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchCustomers();
    }
  }, [accessToken, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(searchQuery, sortOption);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    fetchCustomers('', sortOption);
  };

  const handleCustomerAdded = (newCustomer) => {
    setSuccessMessage(`Customer account created successfully.`);
    setTimeout(() => setSuccessMessage(''), 5000);
    fetchCustomers();
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    setDeleting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers/${customerToDelete.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setDeleting(false);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete customer.');
      }

      setSuccessMessage(data.message || `Customer '${customerToDelete.name}' deleted successfully. Historical orders preserved.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      setDeleting(false);
      setError(err.message || 'Error deleting customer.');
      setCustomerToDelete(null);
    }
  };

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
  } = useBulkSelection(customers, 'id');

  const handleBulkDeleteCustomers = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setBulkError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers/bulk-delete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids: selectedIds })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to bulk delete customer accounts.');
      }

      setSuccessMessage(data.message || `${data.deleted_count} customer account(s) deleted successfully.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      clearSelection();
      setIsBulkModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error('Error bulk deleting customer accounts:', err);
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            Account Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Customer Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Register new wholesale customers, view purchase histories, and manage registered user accounts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, mobile, or address..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs font-medium focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Sorting Selector Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <ArrowUpDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Sort By:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl focus:outline-hidden focus:border-emerald-600 cursor-pointer"
          >
            <option value="date_joined_desc">Joined Date (Newest First)</option>
            <option value="date_joined_asc">Joined Date (Oldest First)</option>
            <option value="total_purchase_desc">Total Spent (Highest First)</option>
            <option value="total_purchase_asc">Total Spent (Lowest First)</option>
            <option value="total_orders_desc">Total Orders (Highest First)</option>
            <option value="total_orders_asc">Total Orders (Lowest First)</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
        </div>

      </div>

      {/* Select All & Bulk Action Bar */}
      {customers.length > 0 && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <span>Select All ({customers.length} customer accounts)</span>
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

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading registered customer accounts...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Customers Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No registered customers match your current search query or filter selection.
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
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-4">Mobile Number</th>
                  <th className="py-4 px-4">Delivery Address</th>
                  <th className="py-4 px-4 text-center">Orders Placed</th>
                  <th className="py-4 px-4 text-right">Total Purchased</th>
                  <th className="py-4 px-4">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                {customers.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(c.id) ? 'bg-emerald-50/30 dark:bg-emerald-950/30' : ''}`}>
                    
                    {/* Checkbox Cell */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => handleSelectRow(c.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                    </td>

                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-900 dark:text-white">{c.name}</span>
                          {c.is_staff && (
                            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              STAFF / ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {c.mobile_number}
                    </td>

                    {/* Address */}
                    <td className="py-4 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300" title={c.address}>
                      {c.address || <span className="italic text-slate-400 dark:text-slate-500">Not provided</span>}
                    </td>

                    {/* Total Orders Count */}
                    <td className="py-4 px-4 text-center font-bold text-slate-900 dark:text-white">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
                        {c.total_orders} orders
                      </span>
                    </td>

                    {/* Total Purchase Amount */}
                    <td className="py-4 px-4 text-right font-black text-emerald-800 dark:text-emerald-400">
                      ₹{parseFloat(c.total_purchase).toFixed(2)}
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(c.date_joined).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/customers/${c.id}`}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                          title="View Customer Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setCustomerToDelete(c)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Customer Account"
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

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Single Customer Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Delete Customer Account?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Are you sure you want to delete the account for <strong className="text-slate-900 dark:text-white">{customerToDelete.name}</strong> ({customerToDelete.mobile_number})?
            </p>
            <p className="text-[11px] text-slate-400 italic">
              Note: Deleting a customer will prevent future logins. Existing placed order history will remain preserved in audit logs.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
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
        onConfirm={handleBulkDeleteCustomers}
        selectedCount={selectedCount}
        title="Customer Accounts"
        actionLabel="Delete"
        loading={bulkLoading}
        error={bulkError}
      />

    </div>
  );
};

export const AdminCustomersPage = Customers;
export default Customers;
