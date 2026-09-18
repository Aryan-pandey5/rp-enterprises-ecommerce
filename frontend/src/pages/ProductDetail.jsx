import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';
import { 
  Package, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Tag, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Factory, 
  AlertCircle, 
  Loader2,
  XCircle
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedGsm, setSelectedGsm] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}/`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('Product not found.');
          throw new Error('Failed to load product details.');
        }

        const data = await res.json();
        setProduct(data);

        if (data.category_type === 'RAW_MATERIAL') {
          if (data.gsms && data.gsms.length > 0) {
            setSelectedGsm(data.gsms[0].gsm);
          }
        } else if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (err) {
        console.error('Error loading product details:', err);
        setError(err.message || 'Unable to load product information.');
      }
      setLoading(false);
    };

    fetchProductDetail();
  }, [id]);

  const isRawMaterial = product?.category_type === 'RAW_MATERIAL';
  const displayPrice = isRawMaterial 
    ? (product?.calculated_price || product?.price || 0)
    : (selectedVariant ? selectedVariant.price : product?.base_price || 0);

  const isPriceValid = displayPrice && parseFloat(displayPrice) > 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    setAddingToCart(true);
    setToastMessage('');
    try {
      const variantId = !isRawMaterial && selectedVariant ? selectedVariant.id : null;
      const gsmVal = isRawMaterial ? (product?.gsm || selectedGsm) : null;

      await addToCart(product.id, variantId, quantity, gsmVal);
      setToastMessage(t('successAdded'));
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert(err.message || 'Failed to add product to cart.');
    }
    setAddingToCart(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || 'Product Not Found'}</h2>
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('allCatalog')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white text-sm font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Link
            to="/cart"
            className="px-3.5 py-1.5 bg-white text-emerald-800 rounded-xl text-xs font-black hover:bg-emerald-50 transition-colors"
          >
            {t('cart')} →
          </Link>
        </div>
      )}

      {/* Breadcrumb Back Action */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('allCatalog')}</span>
        </button>
      </div>

      {/* Main Grid: Left Image | Right Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Product Image View */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-4/3 bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-center relative">
            {product.image_url && !imgError ? (
              <img
                src={product.image_url}
                alt={product.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Package className="w-16 h-16" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">R.P. Product</span>
              </div>
            )}

            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${
                isRawMaterial 
                  ? 'bg-indigo-900/90 text-white' 
                  : 'bg-emerald-800/90 text-white'
              }`}>
                {isRawMaterial ? t('rawMaterials') : t('disposableProducts')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Specifications & Add to Cart Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {product.category_name}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Price & Stock Display */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
                {isRawMaterial 
                  ? t('calculatedPrice')
                  : t('price')
                }
              </span>
              <span className={`text-3xl font-black ${isPriceValid ? 'text-slate-900 dark:text-white' : 'text-amber-700 dark:text-amber-400 text-lg'}`}>
                {isPriceValid ? `₹${parseFloat(displayPrice).toFixed(2)}` : t('priceUnavailable')}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">{t('status')}</span>
              {selectedVariant ? (
                selectedVariant.stock > 0 ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('available')}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2.5 py-1 rounded-full">
                    {t('outOfStock')}
                  </span>
                )
              ) : (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full">
                  {t('available')}
                </span>
              )}
            </div>
          </div>

          {/* INTERACTIVE SELECTION / SPECS BREAKDOWN */}
          {isRawMaterial ? (
            <div className="space-y-4 bg-indigo-50/50 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/60">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">{t('size')}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{product.size || 'N/A'}</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">{t('weight')}</span>
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{product.weight_display || 'N/A'}</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">GSM</span>
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{product.gsm_display || 'N/A'}</span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">{t('pricePerKg')}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {product.gsm_price_per_kg ? `₹${parseFloat(product.gsm_price_per_kg).toFixed(2)}/kg` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{v.variant_name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{v.unit_packing || 'Standard'}</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{parseFloat(v.price).toFixed(2)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {/* Quantity Controls */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t('quantity')}
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 shadow-xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-black text-slate-900 dark:text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 shadow-xs text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('total')}: <span className="font-bold text-slate-900 dark:text-white">
                  {isPriceValid ? `₹${(parseFloat(displayPrice) * quantity).toFixed(2)}` : t('priceUnavailable')}
                </span>
              </div>
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                {product.description}
              </p>
            </div>
          )}

          {/* Action / Add to Cart Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {!product.is_active ? (
              <button
                disabled
                className="w-full py-4 bg-slate-200 text-slate-500 font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 border border-slate-300 cursor-not-allowed"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
                <span>{t('outOfStock')}</span>
              </button>
            ) : !isPriceValid ? (
              <button
                disabled
                className="w-full py-4 bg-amber-100 text-amber-800 font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 border border-amber-300 cursor-not-allowed"
              >
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>{t('priceUnavailable')}</span>
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg transition-colors cursor-pointer disabled:opacity-60"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                <span>
                  {addingToCart 
                    ? t('processing') 
                    : t('addToCart')}
                </span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export const ProductDetailPage = ProductDetail;
export default ProductDetail;
