import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import { 
  Users, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Bell,
  X,
  CheckCheck
} from 'lucide-react';

const Dashboard = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Unread Alerts Modal State
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch live dashboard analytics from Django REST API (GET /api/admin/dashboard/)
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error('Admin privileges required.');
        throw new Error('Failed to load dashboard metrics.');
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.message || 'Unable to load dashboard statistics. Please try again.');
    }
    setLoading(false);
  };

  // Fetch unread notifications for alerts modal
  const fetchUnreadAlerts = async () => {
    setLoadingAlerts(true);
    setAlertsError('');
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/?admin=true`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const result = await res.json();
        const unread = (result.results || result).filter((n) => !n.is_read);
        setAlerts(unread);
      }
    } catch (err) {
      console.error('Error fetching admin alerts:', err);
      setAlertsError('Failed to load unread alerts.');
    }
    setLoadingAlerts(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData();

      // Automatically refresh metrics when browser window regains focus
      const handleFocus = () => {
        fetchDashboardData();
      };
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [accessToken]);

  const handleOpenAlertsModal = () => {
    setShowAlertsModal(true);
    fetchUnreadAlerts();
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/read-all/?admin=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        setAlerts([]);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
    setMarkingAll(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || 'Unable to load dashboard statistics.'}</h2>
        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, sales_chart, status_counts, low_stock_products, recent_orders } = data;
  const maxSales = Math.max(...sales_chart.map((d) => d.sales), 100);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Dashboard Title Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            R.P. Enterprises
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{t('adminDashboard')}</h1>
        </div>

        <Link
          to="/admin/orders"
          className="inline-flex items-center space-x-2 bg-slate-900 dark:bg-slate-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          <span>{t('viewAllOrders')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 1. Summary Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">{t('totalSales')}</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white block">₹{summary.total_sales.toFixed(2)}</span>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">{t('totalOrders')}</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-lg"><ShoppingBag className="w-4 h-4" /></div>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white block">{summary.total_orders}</span>
        </div>

        {/* Pending Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">{t('pendingOrders')}</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded-lg"><Clock className="w-4 h-4" /></div>
          </div>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">{summary.pending_orders}</span>
        </div>

        {/* Received Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">{t('receivedOrders')}</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 block">{summary.received_orders}</span>
        </div>

        {/* Total Customers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">{t('totalCustomers')}</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-lg"><Users className="w-4 h-4" /></div>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white block">{summary.total_customers}</span>
        </div>

        {/* Unread Alerts Button Card */}
        <button
          onClick={handleOpenAlertsModal}
          className="bg-white dark:bg-slate-900 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 shadow-xs space-y-2 text-left transition-all cursor-pointer group"
          title="Click to view unread admin alerts"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">Unread Alerts</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded-lg group-hover:scale-110 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 block">{summary.unread_admin_notifications || 0}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold underline">View Alerts →</span>
          </div>
        </button>

      </div>

      {/* 2. Charts Section: 7-Day Sales Overview & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Overview SVG Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">7-Day Sales Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily sales revenue trends calculated from valid orders.</p>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            {sales_chart.map((day, idx) => {
              const heightPercent = maxSales > 0 ? (day.sales / maxSales) * 100 : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                    ₹{day.sales.toFixed(2)} ({day.orders} orders)
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-36 flex items-end overflow-hidden">
                    <div 
                      className="w-full bg-emerald-600 dark:bg-emerald-500 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-400 rounded-t-lg transition-all duration-300"
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Order Status Distribution</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Active status distribution across all active orders.</p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200">
              <span>Pending</span>
              <span className="font-bold">{status_counts.PENDING || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200">
              <span>Confirmed</span>
              <span className="font-bold">{status_counts.CONFIRMED || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200">
              <span>Processing</span>
              <span className="font-bold">{status_counts.PROCESSING || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200">
              <span>Out for Delivery</span>
              <span className="font-bold">{status_counts.SHIPPED || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200">
              <span>Received</span>
              <span className="font-bold">{status_counts.RECEIVED || status_counts.DELIVERED || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200">
              <span>Cancelled</span>
              <span className="font-bold">{status_counts.CANCELLED || 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Grid: Low Stock Alert Warnings & Recent Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Low Stock Warning List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">Low Stock Warnings</h3>
            </div>
            <Link to="/admin/stock" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">View Stock</Link>
          </div>

          {low_stock_products.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">All product variant stock levels are healthy.</p>
          ) : (
            <div className="space-y-3">
              {low_stock_products.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{item.product_name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.variant_name}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    item.stock === 0 ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                  }`}>
                    {item.stock} units left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Preview */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Recent Customer Orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">View All Orders</Link>
          </div>

          {recent_orders.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No orders placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Order No</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">#{ord.order_number}</td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">{ord.customer_name}</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">₹{parseFloat(ord.total_amount).toFixed(2)}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {ord.status_display}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link to={`/admin/orders/${ord.id}`} className="text-indigo-700 dark:text-indigo-400 font-bold hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Unread Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-4 text-slate-900 dark:text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Unread Admin Alerts ({alerts.length})</h3>
              </div>

              <div className="flex items-center space-x-2">
                {alerts.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markingAll}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{markingAll ? 'Updating...' : 'Mark All as Read'}</span>
                  </button>
                )}
                
                <button
                  onClick={() => setShowAlertsModal(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {alertsError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold">
                {alertsError}
              </div>
            )}

            {loadingAlerts ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-rose-600 dark:text-rose-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading unread alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No unread alerts</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">All admin notifications have been reviewed.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                {alerts.map((al) => (
                  <div key={al.id} className="py-3 flex items-start justify-between gap-3 group">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{al.title}</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{al.message}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
                        {new Date(al.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleMarkAsRead(al.id)}
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer"
                    >
                      Mark as Read
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export const AdminDashboardPage = Dashboard;
export default Dashboard;
