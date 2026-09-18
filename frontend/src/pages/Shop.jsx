import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { API_BASE_URL } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Package, Search, Layers, X, Loader2, ArrowUpDown } from 'lucide-react';

const Shop = ({ section = 'ALL' }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('DEFAULT');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch categories
        const catRes = await fetch(`${API_BASE_URL}/categories/`);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }

        // Fetch products
        let url = `${API_BASE_URL}/products/`;
        if (section !== 'ALL') {
          url += `?category_type=${section}`;
        }
        const prodRes = await fetch(url);
        if (!prodRes.ok) throw new Error('Failed to load products from API.');
        
        const prodData = await prodRes.json();
        setProducts(prodData);
      } catch (err) {
        console.error('Error loading product listing:', err);
        setError('Unable to load products. Please check if the Django backend is running.');
      }
      setLoading(false);
    };

    fetchData();
  }, [section]);

  // Filter categories relevant to section
  const availableCategories = categories.filter((cat) => {
    if (section === 'ALL') return true;
    return cat.category_type === section;
  });

  // Filter products by search and selected category
  let filteredProducts = products.filter((prod) => {
    // Section check
    if (section !== 'ALL' && prod.category_type !== section) {
      return false;
    }

    // Category filter
    if (selectedCategory && prod.category !== parseInt(selectedCategory)) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = prod.name.toLowerCase().includes(q);
      const matchesCat = prod.category_name?.toLowerCase().includes(q);
      const matchesDesc = prod.description?.toLowerCase().includes(q);
      if (!matchesName && !matchesCat && !matchesDesc) return false;
    }

    return true;
  });

  // Apply Sorting
  if (sortBy === 'PRICE_LOW_HIGH') {
    filteredProducts.sort((a, b) => parseFloat(a.base_price) - parseFloat(b.base_price));
  } else if (sortBy === 'PRICE_HIGH_LOW') {
    filteredProducts.sort((a, b) => parseFloat(b.base_price) - parseFloat(a.base_price));
  } else if (sortBy === 'NEWEST') {
    filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const getPageTitle = () => {
    if (section === 'DISPOSABLE') return t('disposableProducts');
    if (section === 'RAW_MATERIAL') return t('rawMaterials');
    return t('allCatalog');
  };

  const getPageDescription = () => {
    if (section === 'DISPOSABLE') {
      return t('disposableDescription');
    }
    if (section === 'RAW_MATERIAL') {
      return t('rawMaterialDescription');
    }
    return t('aboutSubheading');
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>R.P. Enterprises</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            {getPageDescription()}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Search, Category Filters, and Sort Controls Bar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown & Stats */}
            <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {filteredProducts.length} {t('allCatalog')}
              </span>

              <div className="flex items-center space-x-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="DEFAULT">{t('sortBy')}</option>
                  <option value="PRICE_LOW_HIGH">{t('price')}: Low - High</option>
                  <option value="PRICE_HIGH_LOW">{t('price')}: High - Low</option>
                </select>
              </div>
            </div>

          </div>

          {/* Category Filter Pills */}
          {availableCategories.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                {t('category')}:
              </span>
              
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === ''
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Categories
              </button>

              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id.toString()
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              {(selectedCategory || searchQuery || sortBy !== 'DEFAULT') && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchQuery('');
                    setSortBy('DEFAULT');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center space-x-1 shrink-0 ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-2">
            <p className="font-bold text-base">{error}</p>
            <p className="text-xs text-rose-600">Ensure `python manage.py runserver 8000` is running in the backend directory.</p>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
                <div className="aspect-4/3 bg-slate-200 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded-xl pt-2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Products Available</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              There are currently no products matching your selected search terms or filters. Try clearing your filters or selecting a different category.
            </p>
            {(selectedCategory || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          /* Product Grid: 4 columns desktop, 3 laptop, 2 tablet, 1 mobile */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>

    </div>
  );
};

export const ProductListingPage = Shop;
export default Shop;
