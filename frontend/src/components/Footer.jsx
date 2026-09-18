import React from 'react';
import { Mail, Phone, MapPin, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800 dark:border-slate-900 transition-colors duration-200">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Column 1: Company Profile */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                RP
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                R.P. ENTERPRISES
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('footerDescription')}
            </p>
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full w-fit">
              <Factory className="w-3.5 h-3.5" />
              <span>{t('directManufacturer')}</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              {t('quickLinks')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: t('home'), path: '/' },
                { label: t('disposableProducts'), path: '/disposable-products' },
                { label: t('rawMaterials'), path: '/raw-materials' },
                { label: t('about'), path: '/about' },
                { label: t('contact'), path: '/contact' }
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    to={item.path}
                    className="hover:text-emerald-400 transition-colors duration-200 flex items-center space-x-1 group"
                  >
                    <span className="text-slate-500 group-hover:text-emerald-400">›</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Business Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              {t('ourSpecializations')}
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center justify-between py-1 border-b border-slate-800/50">
                <span>{t('disposableDonaBowls')}</span>
                <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">{t('allSizes')}</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/50">
                <span>{t('disposableThaliPlates')}</span>
                <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">{t('silverKraft')}</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/50">
                <span>{t('silverBafferItems')}</span>
                <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">{t('heavyQuality')}</span>
              </li>
              <li className="flex items-center justify-between py-1">
                <span>{t('rawMaterial')}</span>
                <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded">{t('rollsReels')}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-4" id="contact">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">
              {t('contactInformation')}
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>R.P. Enterprises Industrial Unit, Manufacturing Zone</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>+91 76686 79789 ({t('salesInquiry')})</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>contact@rpenterprises.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar / Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 space-y-4 md:space-y-0">
          <p>{t('allRightsReserved', { year: currentYear })}</p>
          <p className="flex items-center space-x-1">
            <span>{t('designedForWholesale')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
