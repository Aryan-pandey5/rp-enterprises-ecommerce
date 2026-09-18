import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Layers, Tag, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  const { t } = useLanguage();

  const isDisposable = product.category_type === 'DISPOSABLE';
  const variantCount = product.variants?.length || 0;

  // Price determination
  let priceDisplay = '0.00';
  let isPriceAvailable = true;

  if (isDisposable) {
    const prices = [
      parseFloat(product.base_price || 0),
      ...(product.variants?.map((v) => parseFloat(v.price)) || [])
    ].filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    priceDisplay = `₹${minPrice.toFixed(2)}`;
  } else {
    // Raw Material product automatic price calculation
    const calcPrice = product.calculated_price || product.price;
    if (calcPrice && parseFloat(calcPrice) > 0) {
      priceDisplay = `₹${parseFloat(calcPrice).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    } else {
      isPriceAvailable = false;
      priceDisplay = t('priceUnavailable');
    }
  }

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
      
      <div>
        {/* Product Image Area */}
        <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/60 overflow-hidden flex items-center justify-center">
          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-1">
              <Package className="w-10 h-10 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">R.P. Product</span>
            </div>
          )}

          {/* Section & Availability Badge Overlay */}
          <div className="absolute top-3 left-3 flex items-center space-x-1.5">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-md ${
              isDisposable
                ? 'bg-emerald-800/90 text-white'
                : 'bg-indigo-900/90 text-white'
            }`}>
              {isDisposable ? t('disposableProducts') : t('rawMaterials')}
            </span>
            {!product.is_active && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs bg-rose-800/90 text-white backdrop-blur-md">
                {t('outOfStock')}
              </span>
            )}
          </div>

          {/* Variant Count Badge Overlay */}
          {variantCount > 0 && (
            <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
              {variantCount} {isDisposable ? 'Bori' : 'Packing'}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          
          {/* Category */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[180px]">
              {product.category_name}
            </span>
            {isDisposable && product.size && (
              <span className="inline-flex items-center space-x-1 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-[11px] font-medium">
                <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>{product.size}</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Description Snippet */}
          {product.description && (
            <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Raw Material Specs vs Disposable Quality */}
          {!isDisposable ? (
            <div className="pt-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5">
              {product.size && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">{t('size')}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{product.size}</span>
                </div>
              )}
              {product.weight_display && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">{t('weight')}:</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">{product.weight_display}</span>
                </div>
              )}
              {product.gsm_display && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">GSM:</span>
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded">{product.gsm_display}</span>
                </div>
              )}
            </div>
          ) : (
            product.variants && product.variants.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 rounded-lg p-2 flex items-center justify-between">
                  <span className="font-medium truncate">{product.variants[0].variant_name}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 ml-1">₹{parseFloat(product.variants[0].price).toFixed(2)}</span>
                </div>
              </div>
            )
          )}

        </div>
      </div>

      {/* Card Footer */}
      <div className="p-5 pt-0 border-t border-slate-100/60 dark:border-slate-700/60 mt-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block">
            {t('price')}
          </span>
          <span className={`text-lg font-black ${isPriceAvailable ? 'text-slate-900 dark:text-white' : 'text-amber-700 dark:text-amber-400 text-xs'}`}>
            {priceDisplay}
          </span>
        </div>

        <Link
          to={`/products/${product.id}`}
          className="inline-flex items-center space-x-1.5 bg-slate-900 dark:bg-slate-700 group-hover:bg-emerald-700 dark:group-hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-xs"
        >
          <span>{t('viewDetails')}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

    </div>
  );
};

export default ProductCard;
