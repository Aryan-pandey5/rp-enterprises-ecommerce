import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Package, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

// Customer Checkout Page component
const Checkout = () => {
  const { user, accessToken } = useAuth();
  const { cart, itemCount, subtotal, fetchCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Delivery information form state pre-filled from customer profile
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerMobile, setCustomerMobile] = useState(user?.mobile_number || '');
  const [customerAddress, setCustomerAddress] = useState(user?.address || '');

  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imgErrors, setImgErrors] = useState({});

  const handleImageError = (itemId) => {
    setImgErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  // Place Order submission handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerMobile.trim()) {
      setErrorMessage('Please provide a valid mobile number.');
      return;
    }
    if (!customerAddress.trim()) {
      setErrorMessage('Please provide a complete delivery address.');
      return;
    }

    setPlacingOrder(true);
    try {
      // Call Django REST API POST /api/orders/ to place order within atomic transaction
      const res = await fetch(`${API_BASE_URL}/orders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_mobile: customerMobile,
          customer_address: customerAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      // Refresh cart state to clear cart badge count
      await fetchCart();

      // Navigate customer to Order Success page
      navigate(`/order-success/${data.order.id}`, { state: { order: data.order } });
    } catch (err) {
      setErrorMessage(err.message);
    }
    setPlacingOrder(false);
  };

  // Guard: Empty Cart Protection
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('emptyCart')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t('emptyCartSubtext')}
          </p>
        </div>
        <div>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('allCatalog')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 uppercase">
          R.P. Enterprises
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{t('proceedToCheckout')}</h1>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Customer Delivery Details Form */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            
            <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{t('deliveryDetails')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('deliveryNote')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('fullName')} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-emerald-600"
                    placeholder={t('enterFullName')}
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('mobileNumber')} *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-emerald-600"
                    placeholder={t('enterMobileNumber')}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('deliveryAddress')} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-semibold focus:outline-hidden focus:border-emerald-600 leading-relaxed"
                  placeholder={t('enterDeliveryAddress')}
                />
              </div>
            </div>

          </div>

          {/* Cart Items List Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              {t('items')} ({itemCount})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cart.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center overflow-hidden">
                      {item.product_image && !imgErrors[item.id] ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          onError={() => handleImageError(item.id)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.product_name}</h4>
                      {item.variant_name && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.variant_name}</p>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{t('quantity')}: {item.quantity} x ₹{parseFloat(item.unit_price).toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">₹{parseFloat(item.item_total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Place Order CTA */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-lg space-y-6 sticky top-24">
            
            <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
              {t('orderSummary')}
            </h2>

            <div className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>{t('quantity')}</span>
                <span className="text-slate-900 dark:text-white font-bold">{itemCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('subtotal')}</span>
                <span className="text-slate-900 dark:text-white font-bold">₹{parseFloat(subtotal).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-lg font-black text-slate-900 dark:text-white">
              <span>{t('totalAmount')}</span>
              <span className="text-2xl text-emerald-800 dark:text-emerald-400">₹{parseFloat(subtotal).toFixed(2)}</span>
            </div>

            {/* Submit Place Order Button */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={placingOrder}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('processing')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('placeOrder')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </form>

    </div>
  );
};

export const CheckoutPage = Checkout;
export default Checkout;
