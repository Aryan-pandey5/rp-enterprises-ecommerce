import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';
import { CheckCircle2, Package, ArrowRight, FileText, MapPin, Phone, Loader2 } from 'lucide-react';

// Order Success Confirmation Page component
const OrderSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const { accessToken } = useAuth();
  const { t } = useLanguage();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    // If order state wasn't passed through location, fetch from API
    if (!order && accessToken) {
      const fetchOrderDetails = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setOrder(data);
          }
        } catch (err) {
          console.error('Error fetching order confirmation:', err);
        }
        setLoading(false);
      };
      fetchOrderDetails();
    }
  }, [orderId, accessToken, order]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-center">
      
      {/* Success Badge & Message */}
      <div className="space-y-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {t('confirmed')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Order Placed Successfully!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            Thank you for ordering from <strong className="text-slate-900">R.P. Enterprises</strong>. Your order is registered in our manufacturing queue.
          </p>
        </div>
      </div>

      {/* Order Details Summary Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl text-left space-y-6 max-w-2xl mx-auto">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Order Reference</span>
              <span className="text-xl font-black text-emerald-800">{order.order_number}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status</span>
              <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                <span>{order.status_display}</span>
              </span>
            </div>
          </div>

          {/* Delivery Details Snapshot */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong className="text-slate-800">Address:</strong> {order.customer_address}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong className="text-slate-800">Contact:</strong> {order.customer_mobile} ({order.customer_name})</span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Purchased Items:</span>
            <div className="space-y-2 divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.product_name}</span>
                    {item.variant_name && <span className="text-slate-500">{item.variant_name}</span>}
                    <span className="text-slate-400 block">Qty: {item.quantity} x ₹{parseFloat(item.price).toFixed(2)}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">₹{parseFloat(item.item_total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-base font-black text-slate-900">
            <span>Total Payable</span>
            <span className="text-xl text-emerald-800">₹{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>

        </div>
      )}

      {/* Navigation CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/orders"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>View My Orders</span>
        </Link>

        <Link
          to="/products"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};

export const OrderSuccessPage = OrderSuccess;
export default OrderSuccess;
