import React, { useState } from 'react';
import { 
  Building2, 
  Package, 
  Layers, 
  ShieldCheck, 
  Truck, 
  Users, 
  CheckCircle2, 
  Award, 
  Sparkles,
  HeartHandshake,
  TrendingUp,
  Info,
  Calendar,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Leadership photos
import founderImg from '../assets/founder.jpg';
import pradeepImg from '../assets/pradeep-pandey.jpg';
import aryanImg from '../assets/aryan-pandey.jpg';

// Main About Page component for R.P. Enterprises — Original Full Version
const About = () => {
  const [founderErr, setFounderErr] = useState(false);
  const [pradeepErr, setPradeepErr] = useState(false);
  const [aryanErr, setAryanErr] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 sm:py-16 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* 1. PAGE HERO SECTION */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('established2019')}</span>
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('aboutHeroTitle')}
          </h1>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {t('aboutHeroSubtitle')}
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {t('companyBeginningText')}
          </p>
        </div>

        {/* 2. OUR STORY & COMPANY TIMELINE (2019 -> 2020 -> Today) */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-10 lg:p-12 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800 inline-block">
              {t('ourStory')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('storyTitle')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {t('storySubtext')}
            </p>
          </div>

          {/* Timeline Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            
            {/* 2019 Milestone */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 relative hover:border-emerald-300 dark:hover:border-emerald-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-xl">
                  2019
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{t('story2019Title')}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('story2019Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('story2019Desc')}
              </p>
            </div>

            {/* 2020 Milestone */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3 relative hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/80 px-3 py-1 rounded-xl">
                  2020
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">{t('expandingRange')}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('story2020Title')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('story2020Desc')}
              </p>
            </div>

          </div>

          {/* Business Evolution Summary */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl space-y-2 text-center sm:text-left border border-slate-800">
            <h3 className="text-lg font-bold text-emerald-300">{t('continuousGrowthTitle')}</h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {t('continuousGrowthDesc')}
            </p>
          </div>
        </section>

        {/* 3. WHAT WE OFFER */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('whatWeOffer')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {t('whatWeOfferSubtext')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-lg space-y-4">
              <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-2xl w-fit">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('disposableProducts')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('disposableOfferDesc')}
              </p>
              <Link to="/disposable-products" className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                <span>{t('exploreProducts')} →</span>
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-lg space-y-4">
              <div className="p-3.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 rounded-2xl w-fit">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('rawMaterials')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('rawMaterialOfferDesc')}
              </p>
              <Link to="/raw-materials" className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline">
                <span>{t('exploreProducts')} →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 4. WHY CHOOSE R.P. ENTERPRISES */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('whyChooseUsTitle')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {t('whyChooseUsSubtext')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('qualityTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('qualityDesc')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl w-fit">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('reliabilityTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('reliabilityDesc')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('customerFocusTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('customerFocusDesc')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl w-fit">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('completeSolutionsTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('completeSolutionsDesc')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl w-fit">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('localDeliveryTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('localDeliveryDesc')}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('growingTeamTitle')}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('growingTeamDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* 5. TEAM INFORMATION */}
        <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-800 rounded-2xl text-emerald-200">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t('teamInfoTitle')}</h2>
              <p className="text-xs text-emerald-300">R.P. Enterprises Workforce</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl font-medium">
            {t('teamInfoDesc')}
          </p>
        </section>

        {/* 6. DELIVERY & SERVICE POLICY & VEHICLE ARRANGEMENT */}
        <section className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-800 rounded-2xl text-emerald-200">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t('deliveryServiceTitle')}</h2>
              <p className="text-xs text-emerald-300">{t('whyChooseUsDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            
            {/* Disposable Delivery Rules */}
            <div className="bg-emerald-900/60 p-6 rounded-2xl border border-emerald-800/80 space-y-3">
              <h3 className="font-bold text-emerald-300 text-base">{t('disposableDeliveryTitle')}</h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {t('disposableDeliveryDesc')}
              </p>
            </div>

            {/* Raw Material Delivery Rules */}
            <div className="bg-emerald-900/60 p-6 rounded-2xl border border-emerald-800/80 space-y-3">
              <h3 className="font-bold text-emerald-300 text-base">{t('rawMaterialDeliveryTitle')}</h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {t('rawMaterialDeliveryDesc')}
              </p>
            </div>

            {/* Vehicle Arrangement Rules */}
            <div className="bg-emerald-900/60 p-6 rounded-2xl border border-emerald-800/80 space-y-3">
              <h3 className="font-bold text-emerald-300 text-base">{t('vehicleArrangementTitle')}</h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {t('vehicleArrangementDesc')}
              </p>
            </div>

            {/* Large Order 50% Support Rules */}
            <div className="bg-emerald-900/60 p-6 rounded-2xl border border-emerald-800/80 space-y-3">
              <h3 className="font-bold text-emerald-300 text-base">{t('largeOrderSupportTitle')}</h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {t('largeOrderSupportDesc')}
              </p>
            </div>

          </div>

          {/* VISUAL DELIVERY SUMMARY MATRIX (5 RULES) */}
          <div className="pt-4 border-t border-emerald-900/80 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">{t('deliverySummaryTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60 flex items-start space-x-2 text-slate-200 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t('summaryRule1')}</span>
              </div>

              <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60 flex items-start space-x-2 text-slate-200 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t('summaryRule2')}</span>
              </div>

              <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60 flex items-start space-x-2 text-slate-200 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t('summaryRule3')}</span>
              </div>

              <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60 flex items-start space-x-2 text-slate-200 font-medium">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t('summaryRule4')}</span>
              </div>

              <div className="bg-emerald-900/80 p-3.5 rounded-xl border border-emerald-700/60 flex items-start space-x-2 text-slate-200 font-medium sm:col-span-2 lg:col-span-1">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t('summaryRule5')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. OUR COMMITMENT */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-8 sm:p-12 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-2xl">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('ourCommitmentTitle')}</h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase">{t('trustTagline')}</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {t('ourCommitmentDesc')}
          </p>
        </section>

        {/* 8. GROWING TOGETHER */}
        <section className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-800 rounded-2xl text-emerald-200">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{t('growingTogetherTitle')}</h2>
              <p className="text-xs text-emerald-300">2019 → 2020 → Today</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            {t('growingTogetherDesc')}
          </p>
        </section>

        {/* 9. OUR LEADERSHIP */}
        <section className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('ourLeadership')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {t('leadershipGreeting')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* PROMINENT MAIN FOCAL POINT FOUNDER CARD: Rajkumar Pandey */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/80 dark:border-emerald-600/80 shadow-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                Main Leadership
              </div>
              <div className="w-36 h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 border-2 border-emerald-600 shadow-md relative">
                {!founderErr ? (
                  <img src={founderImg} alt="Rajkumar Pandey" onError={() => setFounderErr(true)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-900 text-white font-bold text-base">RP</div>
                )}
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800 inline-block">
                  {t('founder')}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Rajkumar Pandey</h3>
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">{t('founderTitle')}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('ourCommitmentDesc')}
                </p>
              </div>
            </div>

            {/* TWO CO-FOUNDER CARDS (Pradeep Pandey & Aryan Pandey) */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Pradeep Pandey */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md p-5 flex items-center space-x-4">
                <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                  {!pradeepErr ? (
                    <img src={pradeepImg} alt="Pradeep Pandey" onError={() => setPradeepErr(true)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-900 text-white text-xs font-bold">PP</div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded">
                    {t('coFounder')}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Pradeep Pandey</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('coFounderTitle')}</p>
                </div>
              </div>

              {/* Aryan Pandey */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md p-5 flex items-center space-x-4">
                <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                  {!aryanErr ? (
                    <img src={aryanImg} alt="Aryan Pandey" onError={() => setAryanErr(true)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-900 text-white text-xs font-bold">AP</div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded">
                    {t('coFounder')}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Aryan Pandey</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('coFounderTitle')}</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 10. FINAL CLOSING BANNER */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl text-white p-8 sm:p-12 shadow-2xl text-center space-y-4 max-w-5xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
            R.P. Enterprises
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            {t('builtOnTrustTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            {t('builtOnTrustSubtext')}
          </p>
          <div className="pt-4 border-t border-slate-800 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            {t('trustTagline')}
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
