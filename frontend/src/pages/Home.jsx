import React, { useEffect, useState } from 'react';
import CategoryCard from '../components/CategoryCard';
import { API_BASE_URL } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Package, Layers, ShieldCheck, Truck, Cpu, Server, ArrowRight } from 'lucide-react';

const Home = () => {
  const [apiStatus, setApiStatus] = useState({ loading: true, success: false, message: '' });
  const { t } = useLanguage();

  // Check Django Backend REST API endpoint GET /api/
  useEffect(() => {
    fetch(`${API_BASE_URL}/`)
      .then((res) => res.json())
      .then((data) => {
        setApiStatus({
          loading: false,
          success: true,
          message: data.message || 'API Connected',
        });
      })
      .catch((err) => {
        console.warn('Django API fetch error (ensure server is running):', err);
        setApiStatus({
          loading: false,
          success: false,
          message: 'Backend server offline (Run `python manage.py runserver`)',
        });
      });
  }, []);

  const disposableItems = [
    'paperDonaAllSizes',
    'disposableThaliFullHalf',
    'disposableBowlsKatori',
    'silverBafferItems',
    'heavyQualityPlates',
    'partyEventSupplies'
  ];

  const rawMaterialItems = [
    'donaRawPaperRolls',
    'peCoatedPaperReels',
    'silverFoilPaperRolls',
    'printedThaliRawSheets',
    'kraftPaperReels',
    'bafferQualityRawPaper'
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-lg">
        <div className="max-w-7xl mx-auto">
          
          {/* Backend API Connection Indicator Badge */}
          <div className="flex justify-center mb-6">
            <div className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
              apiStatus.loading 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                : apiStatus.success
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-400/40 text-rose-300'
            }`}>
              <Server className="w-4 h-4" />
              <span>
                Django API Status:{' '}
                {apiStatus.loading ? t('loading') : apiStatus.message}
              </span>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="px-3.5 py-1 bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
              R.P. Enterprises
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              {t('disposableProducts')} & <span className="text-emerald-400">{t('rawMaterials')}</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              {t('aboutSubheading')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#categories"
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>{t('exploreProducts')}</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Main Categories Section Foundation */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800">
            {t('coreBusinessVerticals')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {t('allCatalog')}
          </h2>
        </div>

        {/* 2-Column Grid: Left (Disposable Products) | Right (Raw Materials) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          
          {/* LEFT: Disposable Products */}
          <CategoryCard
            title={t('disposableProducts')}
            subtitle={t('disposableDescription')}
            badgeText={t('finishedProducts')}
            icon={Package}
            items={disposableItems}
            buttonText={t('exploreProducts')}
            linkPath="/disposable-products"
          />

          {/* RIGHT: Raw Materials */}
          <CategoryCard
            title={t('rawMaterials')}
            subtitle={t('rawMaterialDescription')}
            badgeText={t('industrialRawSupplies')}
            icon={Layers}
            items={rawMaterialItems}
            buttonText={t('exploreProducts')}
            linkPath="/raw-materials"
          />

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            
            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto md:mx-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Food-Grade Quality</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hygiene-certified paper materials ensuring safe and durable serving products for hot & cold items.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto md:mx-0">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">In-House Manufacturing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Modern high-speed machine setup ensuring consistent supply, uniform dimensions, and competitive wholesale pricing.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto md:mx-0">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Bulk Order Dispatch</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Reliable logistics setup for bori/bundle bulk deliveries across regional wholesale distributors and manufacturers.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export const HomePage = Home;
export default Home;
