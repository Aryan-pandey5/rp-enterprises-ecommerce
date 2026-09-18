import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';
import { 
  Package, 
  ArrowLeft, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

// Admin Order Detail Inspection Page component
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [imgErrors, setImgErrors] = useState({});

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Order not found or access denied.');

      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error('Error loading admin order detail:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchOrderDetail();
    }
  }, [id, accessToken]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setToast('');
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${id}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status.');

      setOrder(data.order);
      setToast(data.message);
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setError(err.message);
    }
    setUpdating(false);
  };

  const handleImageError = (itemId) => {
    setImgErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  const statusChoices = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading order record...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{error || 'Order Not Found'}</h2>
        <button
          onClick={() => navigate('/admin/orders')}
          className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          Back to Orders List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link to="/admin/orders" className="hover:text-emerald-700 flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders List</span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Change Status:</span>
          {updating ? (
            <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
          ) : (
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer focus:outline-hidden focus:border-emerald-600 shadow-xs"
            >
              {statusChoices.map((st) => (
                <option key={st.key} value={st.key}>{st.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-lg space-y-8">
        
        {/* Order Meta Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Admin Order View</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              #{order.order_number}
            </h1>
            <span className="text-xs text-slate-500 font-medium">
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Order Total</span>
            <span className="text-2xl font-black text-emerald-800">
              ₹{parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Customer Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Snapshot Delivery Address</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {order.customer_address}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Recipient Information</span>
            </h4>
            <p className="text-xs text-slate-700 font-semibold">Name: {order.customer_name}</p>
            <p className="text-xs text-slate-700 font-semibold">Mobile: {order.customer_mobile}</p>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordered Products & Materials Snapshot</h3>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {order.items?.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {item.product_image && !imgErrors[item.id] ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        onError={() => handleImageError(item.id)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.product_name}</h4>
                    {item.variant_name && (
                      <span className="text-xs text-slate-600 font-medium block">
                        Variant/Quality: <strong>{item.variant_name}</strong>
                      </span>
                    )}
                    {item.size && (
                      <span className="text-[11px] text-slate-400 block">Size: {item.size}</span>
                    )}
                    <span className="text-xs text-slate-500 font-semibold">
                      ₹{parseFloat(item.price).toFixed(2)} x {item.quantity} units
                    </span>
                  </div>
                </div>

                <div className="text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Subtotal</span>
                  <span className="text-base font-black text-slate-900">
                    ₹{parseFloat(item.item_total).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export const AdminOrderDetailPage = OrderDetail;
export default OrderDetail;
