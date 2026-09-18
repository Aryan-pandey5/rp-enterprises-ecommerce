import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import { Package, FileText, ArrowRight, Calendar, Loader2, AlertCircle } from 'lucide-react';

// Customer Order History Page component
const Orders = () => {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch customer's placed orders from Django REST API
    const fetchOrderHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/orders/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load order history.');

        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError(err.message);
      }
      setLoading(false);
    };

    if (accessToken) {
      fetchOrderHistory();
    }
  }, [accessToken]);

  // Status Badge styling helper
  const getStatusBadge = (status, statusDisplay) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300/80 px-3 py-1 rounded-full text-xs font-bold">{statusDisplay}</span>;
      case 'CONFIRMED':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300/80 px-3 py-1 rounded-full text-xs font-bold">{statusDisplay}</span>;
      case 'PROCESSING':
        return <span className="bg-indigo-100 text-indigo-900 border border-indigo-300/80 px-3 py-1 rounded-full text-xs font-bold">{statusDisplay}</span>;
      case 'SHIPPED':
        return <span className="bg-purple-100 text-purple-900 border border-purple-300/80 px-3 py-1 rounded-full text-xs font-bold">{statusDisplay || 'Out for Delivery'}</span>;
      case 'RECEIVED':
      case 'DELIVERED':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-full text-xs font-bold">Received</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">{statusDisplay}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{statusDisplay}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 uppercase">
          Order Management
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-1">My Orders</h1>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Orders Found</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
            You haven't placed any wholesale disposable product or raw material orders yet.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <span>Explore Product Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Order Cards List */
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              
              {/* Left Order Information */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-base font-black text-slate-900">
                    Order #{order.order_number}
                  </span>
                  {getStatusBadge(order.status, order.status_display)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.total_items} Items</span>
                  </span>
                  <span className="text-slate-700 font-semibold">
                    Recipient: {order.customer_name} ({order.customer_mobile})
                  </span>
                </div>
              </div>

              {/* Right Price & View Details Action */}
              <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-6 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Amount</span>
                  <span className="text-lg font-black text-emerald-800">
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export const OrderHistoryPage = Orders;
export default Orders;
