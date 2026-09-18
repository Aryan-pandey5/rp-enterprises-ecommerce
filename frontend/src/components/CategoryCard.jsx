import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CategoryCard = ({ 
  title, 
  subtitle, 
  badgeText, 
  icon: Icon, 
  items = [], 
  linkPath = '/products', 
  buttonText 
}) => {
  const { t } = useLanguage();

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-xs hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      
      {/* Background Accent Gradient Effect */}
      <div className="absolute -right-16 -top-16 w-40 h-40 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-2xl group-hover:bg-emerald-100/60 dark:group-hover:bg-emerald-900/30 transition-all duration-300" />

      <div>
        {/* Top Badge & Icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="p-3.5 bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition-colors duration-300 shadow-xs">
            <Icon className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{badgeText}</span>
          </span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors mb-2">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
          {subtitle}
        </p>

        {/* Product / Material Items List */}
        <div className="space-y-2.5 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            {t('featuredOfferings')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{typeof item === 'string' && item.startsWith('t:') ? t(item.replace('t:', '')) : (t(item) !== item ? t(item) : item)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Action Link */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold">{t('activeFactoryCatalog')}</span>
        <Link 
          to={linkPath}
          className="inline-flex items-center space-x-2 bg-slate-900 dark:bg-slate-700 group-hover:bg-emerald-700 dark:group-hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-xs"
        >
          <span>{buttonText || t('exploreProducts')}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

    </div>
  );
};

export default CategoryCard;
