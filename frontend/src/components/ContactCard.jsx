import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ContactCard component for rendering individual phone and WhatsApp contact action cards.
const ContactCard = ({ number, title = "Direct Contact & Sales" }) => {
  const { t } = useLanguage();

  // Format number for display e.g. +91 76686 79789
  const formattedDisplay = `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  
  // Direct telephone call URL
  const telLink = `tel:${number}`;

  // WhatsApp click-to-chat URL with Indian country code (+91)
  const whatsappLink = `https://wa.me/91${number}`;

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 hover:border-emerald-300 dark:hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between">
      
      {/* Contact Details Header */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
              {title}
            </span>
            <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {formattedDisplay}
            </h4>
          </div>
        </div>
      </div>

      {/* Action Buttons: Call & WhatsApp */}
      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100 dark:border-slate-700/60 mt-6">
        
        {/* Direct Call Link Button */}
        <a
          href={telLink}
          className="inline-flex items-center justify-center space-x-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          title={`Call ${number}`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{t('callUs')}</span>
        </a>

        {/* WhatsApp Link Button */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          title={`Chat on WhatsApp with ${number}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{t('whatsappUs')}</span>
        </a>

      </div>

    </div>
  );
};

export default ContactCard;
