import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  Package, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

const Cart = () => {
  const { cart, itemCount, subtotal, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [updatingId, setUpdatingId] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    await updateQuantity(itemId, newQty);
    setUpdatingId(null);
  };

  const handleRemoveItem = async (itemId) => {
    setUpdatingId(itemId);
    await removeFromCart(itemId);
    setUpdatingId(null);
  };

  const handleImageError = (itemId) => {
    setImgErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  // Empty Cart View
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
          <ShoppingCart className="w-10 h-10" />
        </div>
        
        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('emptyCart')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            {t('emptyCartSubtext')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/disposable-products"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            {t('disposableProducts')}
          </Link>
          <Link
            to="/raw-materials"
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            {t('rawMaterials')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 uppercase">
            R.P. Enterprises
          </span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{t('shoppingCart')}</h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          {t('delete')}
        </button>
      </div>

      {/* Cart Content Layout: Left Table | Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              
              {cart.items.map((item) => {
                const isUpdating = updatingId === item.id;
                
                return (
                  <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    
                    {/* Image & Details */}
                    <div className="flex items-start space-x-4">
                      
                      <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        {item.product_image && !imgErrors[item.id] ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            onError={() => handleImageError(item.id)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            {item.category_name}
                          </span>
                          {item.size && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              Size: {item.size}
                            </span>
                          )}
                          {item.weight_display && (
                            <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                              Weight: {item.weight_display}
                            </span>
                          )}
                        </div>

                        <Link 
                          to={`/products/${item.product_id}`} 
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 text-base leading-snug block"
                        >
                          {item.product_name}
                        </Link>

                        {/* Quality / Packing Variant / GSM Spec */}
                        {item.variant_name ? (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block">
                            Quality/Packing: <strong className="text-slate-800 dark:text-slate-200">{item.variant_name}</strong>
                          </span>
                        ) : item.gsm_display ? (
                          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400 block">
                            GSM Spec: <strong className="text-indigo-900 dark:text-indigo-300 font-extrabold">{item.gsm_display}</strong>
                          </span>
                        ) : null}

                        <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold">
                          Unit Price: ₹{parseFloat(item.unit_price).toFixed(2)}
                        </span>
                      </div>

                    </div>

                    {/* Quantity Controls & Item Total */}
                    <div className="flex items-center justify-between w-full sm:w-auto space-x-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          disabled={isUpdating || item.quantity <= 1}
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 font-bold disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <span className="w-10 text-center text-xs font-black text-slate-900 dark:text-white">
                          {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" /> : item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 shadow-xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 font-bold disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">{t('total')}</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          ₹{parseFloat(item.item_total).toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('continueShopping')}</span>
            </Link>
          </div>

        </div>

        {/* Right Column: Order Summary Box */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-lg space-y-6">
            
            <h2 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
              {t('orderSummary')}
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>{t('quantity')}</span>
                <span className="font-bold text-slate-900 dark:text-white">{itemCount}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>{t('subtotal')}</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{parseFloat(subtotal).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-lg font-black text-slate-900 dark:text-white">
              <span>{t('totalAmount')}</span>
              <span className="text-2xl text-emerald-800 dark:text-emerald-400">₹{parseFloat(subtotal).toFixed(2)}</span>
            </div>

            {/* Active Proceed to Checkout Button */}
            <div className="space-y-3 pt-2">
              <Link
                to="/checkout"
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg transition-colors cursor-pointer"
              >
                <span>{t('proceedToCheckout')}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export const CartPage = Cart;
export default Cart;
