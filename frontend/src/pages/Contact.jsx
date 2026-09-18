import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Building2, ShieldCheck, Award, HeartHandshake } from 'lucide-react';
import ContactCard from '../components/ContactCard';
import founderImg from '../assets/founder.jpg';
import { useLanguage } from '../context/LanguageContext';

// Main Contact & Factory Leadership page component for R.P. Enterprises
const Contact = () => {
  const [imgError, setImgError] = useState(false);
  const [closingImgError, setClosingImgError] = useState(false);
  const { t } = useLanguage();

  // Contact phone numbers
  const contactNumbers = [
    '7668679789',
    '8299897022',
    '9305616979',
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 sm:py-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Top Hero Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>R.P. Enterprises</span>
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('contactHeading')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {t('getInTouch')}
          </p>
        </div>

        {/* Displays the founder information and company welcome message. */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 items-center">
            
            {/* Left Column: Founder Image (approx 40-45% width on desktop) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full aspect-4/5 max-w-md bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md group">
                {!imgError ? (
                  <img
                    src={founderImg}
                    alt="Rajkumar Pandey — Founder of R.P. Enterprises"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-900 text-white p-6 text-center space-y-3">
                    <User className="w-20 h-20 text-emerald-300" />
                    <div>
                      <span className="text-xl font-bold block">Rajkumar Pandey</span>
                      <span className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">Founder — R.P. Enterprises</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-4 text-white text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Leadership</span>
                  <span className="text-base font-extrabold block">Rajkumar Pandey</span>
                </div>
              </div>
            </div>

            {/* Right Column: Founder Name, Title & Welcome Message */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-5">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800 inline-block">
                  Leadership Greeting
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Rajkumar Pandey
                </h2>
                <p className="text-sm sm:text-base font-bold text-indigo-900 dark:text-indigo-300">
                  Founder — R.P. Enterprises
                </p>
              </div>

              {/* Welcome Message */}
              <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('welcome')} {t('aboutHeading')}
                </h3>

                <p>
                  {t('aboutSubheading')}
                </p>

                <p>
                  {t('disposableDescription')} {t('rawMaterialDescription')}
                </p>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('ourCommitment')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('whyChooseUs')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('deliveryService')}</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Displays direct contact numbers and action buttons for calls and WhatsApp messages. */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Get In Touch
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Have a question, need product information, or want to place an enquiry? Feel free to contact us.
            </p>
          </div>

          {/* 3 Contact Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactNumbers.map((num) => (
              <ContactCard key={num} number={num} />
            ))}
          </div>
        </section>

        {/* Displays closing brand statement and company commitment banner. */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Closing Image / Banner Asset */}
          {!closingImgError ? (
            <img
              src="/assets/contact-closing.jpg"
              alt="R.P. Enterprises Quality Assurance"
              onError={() => setClosingImgError(true)}
              className="absolute inset-0 w-full h-full object-cover opacity-15"
            />
          ) : null}

          <div className="relative z-10 text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
              R.P. Enterprises Commitment
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Quality • Reliability • Trust
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              We look forward to serving your disposable product and raw material requirements with consistent quality and dependable service.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Contact;
