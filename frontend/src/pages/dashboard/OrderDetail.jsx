import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';
import { 
  Package, 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  XCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

// Customer Order Details & Timeline Page component
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    // Fetch single order details by ID from Django REST API
    const fetchOrderDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/orders/${id}/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          if (res.status === 404) throw new Error('Order not found or access denied.');
          throw new Error('Failed to load order details.');
        }

        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order detail:', err);
        setError(err.message);
      }
      setLoading(false);
    };

    if (accessToken) {
      fetchOrderDetail();
    }
  }, [id, accessToken]);

  // Order Cancellation handler
  const handleCancelOrder = async () => {
    if (!window.confirm(`Are you sure you want to cancel Order #${order.order_number}?`)) {
      return;
    }

    setCancelling(true);
    setMessage('');
    setError('');

    try {
      // Call Django REST API POST /api/orders/<id>/cancel/ to cancel order & restore stock
      const res = await fetch(`${API_BASE_URL}/orders/${id}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order.');
      }

      setOrder(data.order);
      setMessage(data.message || 'Order cancelled successfully.');
    } catch (err) {
      setError(err.message);
    }
    setCancelling(false);
  };

  const handleImageError = (itemId) => {
    setImgErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  // Order Status Workflow Steps definition
  const statusSteps = [
    { key: 'PENDING', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Out for Delivery' },
    { key: 'RECEIVED', label: 'Received' },
  ];

  const getStepIndex = (statusKey) => {
    if (statusKey === 'DELIVERED') return 4;
    return statusSteps.findIndex((s) => s.key === statusKey);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{error || 'Order Not Found'}</h1>
        <div>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Order History</span>
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStepIdx = getStepIndex(order.status);
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-emerald-700">Home</Link>
          <span>/</span>
          <Link to="/orders" className="hover:text-emerald-700">My Orders</Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">#{order.order_number}</span>
        </div>

        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
          >
            <XCircle className="w-4 h-4" />
            <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Order Details Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-lg space-y-8">
        
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Order Reference</span>
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

        {/* Visual Status Timeline Stepper */}
        <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Order Status Timeline</h3>
          
          {isCancelled ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-3">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <span className="block text-sm">Order Cancelled</span>
                <span className="font-normal text-rose-600">This order has been cancelled and any reserved stock has been restored to factory inventory.</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div 
                    key={step.key}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-md'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                        : 'bg-white text-slate-400 border-slate-200 font-medium'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1">
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className="text-xs truncate w-full">{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery Address & Customer Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
              <span>Recipient Contact Information</span>
            </h4>
            <p className="text-xs text-slate-700 font-semibold">Name: {order.customer_name}</p>
            <p className="text-xs text-slate-700 font-semibold">Mobile: {order.customer_mobile}</p>
          </div>
        </div>

        {/* Snapshot Order Items Table */}
        <div className="space-y-4 pt-2">
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

export const OrderDetailPage = OrderDetail;
export default OrderDetail;
