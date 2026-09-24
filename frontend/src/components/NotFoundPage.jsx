import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ShoppingBag, RotateCcw, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const NotFoundPage = () => {
  const { t, isHindi } = useLanguage();
  const [stage, setStage] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
      setStage(5); // Skip directly to end scene
      return;
    }

    // Animation timeline sequence
    const timers = [
      setTimeout(() => setStage(1), 100),   // Character starts walking in
      setTimeout(() => setStage(2), 2200),  // Reaches center, bag opens
      setTimeout(() => setStage(3), 2800),  // Bowls & plates spill out
      setTimeout(() => setStage(4), 3600),  // Surprised reaction
      setTimeout(() => setStage(5), 4200),  // 404 & Text & Buttons reveal
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleReplay = () => {
    if (isReducedMotion) return;
    setStage(0);
    setTimeout(() => setStage(1), 100);
    setTimeout(() => setStage(2), 2200);
    setTimeout(() => setStage(3), 2800);
    setTimeout(() => setStage(4), 3600);
    setTimeout(() => setStage(5), 4200);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 via-emerald-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 overflow-hidden relative select-none">
      {/* Background Decorative Ambient Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-3xl w-full mx-auto text-center space-y-8 relative z-10">
        
        {/* Animated Scene Area */}
        <div className="relative h-64 sm:h-72 w-full max-w-lg mx-auto flex items-end justify-center pb-6 overflow-hidden">
          
          {/* Ground Line & Shadow */}
          <div className="absolute bottom-6 left-4 right-4 h-1.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent rounded-full opacity-80" />
          
          {/* Character Wrapper */}
          <div
            className={`absolute bottom-6 transition-all duration-[2000ms] cubic-bezier(0.25, 1, 0.5, 1) flex flex-col items-center ${
              stage === 0
                ? "-left-40 opacity-0"
                : "left-1/2 -translate-x-1/2 opacity-100"
            }`}
          >
            {/* Surprise Exclamation Mark Bubble */}
            <div
              className={`absolute -top-12 right-2 transition-all duration-300 transform ${
                stage >= 4
                  ? "scale-100 opacity-100 translate-y-0"
                  : "scale-0 opacity-0 translate-y-4"
              }`}
            >
              <div className="bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-lg flex items-center space-x-1 animate-bounce">
                <span>!</span>
                <span className="text-[10px] font-bold">Oops!</span>
              </div>
            </div>

            {/* Vector Animated Character (SVG) */}
            <svg
              className={`w-32 h-40 sm:w-36 sm:h-44 transition-transform duration-300 ${
                stage === 1 && !isReducedMotion ? "animate-walk-bob" : ""
              }`}
              viewBox="0 0 120 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Backpack / Delivery Bag */}
              <g className={`transition-transform duration-500 origin-bottom-left ${stage >= 2 ? "rotate-12" : ""}`}>
                {/* Main Bag Body */}
                <rect x="22" y="52" width="30" height="42" rx="8" className="fill-emerald-700 dark:fill-emerald-600" />
                <rect x="25" y="56" width="24" height="14" rx="4" className="fill-emerald-600 dark:fill-emerald-500" />
                {/* Bag Straps */}
                <path d="M42 56C42 45 48 42 54 42" stroke="#047857" strokeWidth="4" strokeLinecap="round" />
                
                {/* Bag Open Flap (Flips open in Stage 2) */}
                <path
                  d="M22 52 C22 42, 52 42, 52 52"
                  className={`fill-emerald-800 transition-all duration-500 origin-top ${
                    stage >= 2 ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </g>

              {/* Left Arm & Sleeve */}
              <g className={stage === 1 && !isReducedMotion ? "animate-arm-swing-left" : ""}>
                <rect x="42" y="54" width="10" height="24" rx="5" className="fill-emerald-600" />
                <circle cx="47" cy="80" r="5" className="fill-amber-200" />
              </g>

              {/* Back Leg */}
              <g className={stage === 1 && !isReducedMotion ? "animate-leg-back" : ""}>
                <rect x="48" y="94" width="10" height="34" rx="5" className="fill-slate-700 dark:fill-slate-600" />
                <path d="M45 125 H62 V132 H45 Z" className="fill-slate-900 dark:fill-slate-300" />
              </g>

              {/* Front Leg */}
              <g className={stage === 1 && !isReducedMotion ? "animate-leg-front" : ""}>
                <rect x="62" y="94" width="10" height="34" rx="5" className="fill-slate-800 dark:fill-slate-500" />
                <path d="M60 125 H77 V132 H60 Z" className="fill-slate-900 dark:fill-slate-200" />
              </g>

              {/* Torso / Shirt */}
              <rect x="46" y="50" width="28" height="46" rx="8" className="fill-emerald-600 dark:fill-emerald-500" />
              <path d="M46 50 H74 V62 H46 Z" className="fill-emerald-700 dark:fill-emerald-600" />

              {/* Neck */}
              <rect x="56" y="42" width="8" height="10" className="fill-amber-200" />

              {/* Head */}
              <g className={`transition-transform duration-300 ${stage >= 4 ? "rotate-12 translate-y-1" : ""}`}>
                <circle cx="60" cy="32" r="16" className="fill-amber-200" />
                
                {/* Hair */}
                <path d="M44 32 C44 16, 76 16, 76 32 C76 24, 68 20, 60 20 C52 20, 44 24, 44 32 Z" className="fill-slate-900" />
                
                {/* R.P. Cap */}
                <path d="M42 26 C42 16, 78 16, 78 26 Z" className="fill-emerald-700" />
                <path d="M60 26 H86 V30 H60 Z" className="fill-emerald-800" />
                <text x="52" y="24" fill="white" fontSize="7" fontWeight="bold">RP</text>

                {/* Face Expression */}
                {stage >= 4 ? (
                  /* Surprised Face */
                  <>
                    <circle cx="66" cy="30" r="2.5" className="fill-slate-900" />
                    <circle cx="73" cy="30" r="2.5" className="fill-slate-900" />
                    <circle cx="70" cy="38" r="3.5" className="fill-rose-500" />
                    <path d="M64 24 Q66 22 68 24" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M71 24 Q73 22 75 24" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                ) : (
                  /* Normal Cheerful Face */
                  <>
                    <circle cx="67" cy="30" r="2" className="fill-slate-900" />
                    <path d="M65 35 Q70 40 73 35" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </>
                )}
              </g>

              {/* Right Arm & Hand */}
              <g className={`transition-transform duration-300 ${stage >= 4 ? "-rotate-45 translate-y-1" : stage === 1 && !isReducedMotion ? "animate-arm-swing-right" : ""}`}>
                <rect x="64" y="54" width="10" height="24" rx="5" className="fill-emerald-500" />
                <circle cx="69" cy="80" r="5" className="fill-amber-200" />
              </g>
            </svg>
          </div>

          {/* Falling Disposable Bowls & Paper Items */}
          {stage >= 3 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-20 pointer-events-none">
              {/* Item 1: Paper Bowl (Green Rim) */}
              <div
                className={`absolute left-4 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                  stage >= 3
                    ? "bottom-1 opacity-100 rotate-12 scale-100"
                    : "bottom-24 opacity-0 -rotate-90 scale-50"
                }`}
              >
                <svg className="w-10 h-7 drop-shadow-md" viewBox="0 0 50 35">
                  <ellipse cx="25" cy="10" rx="22" ry="7" className="fill-emerald-100 dark:fill-emerald-950 stroke-emerald-600" strokeWidth="2" />
                  <path d="M5 10 C8 30, 42 30, 45 10 Z" className="fill-white dark:fill-slate-800 stroke-emerald-600" strokeWidth="2" />
                  <ellipse cx="25" cy="10" rx="18" ry="4" className="fill-emerald-50 dark:fill-emerald-900/40" />
                </svg>
              </div>

              {/* Item 2: Paper Cup */}
              <div
                className={`absolute left-16 transition-all duration-800 delay-100 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                  stage >= 3
                    ? "bottom-0 opacity-100 -rotate-45 scale-100"
                    : "bottom-28 opacity-0 rotate-180 scale-50"
                }`}
              >
                <svg className="w-8 h-9 drop-shadow-md" viewBox="0 0 40 45">
                  <path d="M5 5 L10 40 H30 L35 5 Z" className="fill-white dark:fill-slate-800 stroke-emerald-600" strokeWidth="2" />
                  <ellipse cx="20" cy="5" rx="15" ry="4" className="fill-emerald-600" />
                  <line x1="8" y1="20" x2="32" y2="20" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
                </svg>
              </div>

              {/* Item 3: Round Disposable Plate */}
              <div
                className={`absolute left-28 transition-all duration-900 delay-200 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                  stage >= 3
                    ? "bottom-1 opacity-100 rotate-6 scale-100"
                    : "bottom-32 opacity-0 -rotate-180 scale-50"
                }`}
              >
                <svg className="w-12 h-6 drop-shadow-md" viewBox="0 0 60 30">
                  <ellipse cx="30" cy="15" rx="28" ry="12" className="fill-white dark:fill-slate-800 stroke-emerald-600" strokeWidth="2" />
                  <ellipse cx="30" cy="15" rx="20" ry="7" className="fill-emerald-50 dark:fill-emerald-900/30 stroke-emerald-400" strokeWidth="1" />
                </svg>
              </div>

              {/* Item 4: Small Sauce Cup */}
              <div
                className={`absolute left-40 transition-all duration-750 delay-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                  stage >= 3
                    ? "bottom-0 opacity-100 rotate-25 scale-100"
                    : "bottom-20 opacity-0 rotate-90 scale-50"
                }`}
              >
                <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 30 30">
                  <ellipse cx="15" cy="8" rx="12" ry="4" className="fill-amber-100 stroke-amber-600" strokeWidth="1.5" />
                  <path d="M3 8 L6 24 H24 L27 8 Z" className="fill-white dark:fill-slate-800 stroke-amber-600" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* 404 Headline, Subtitle, Description & Action Buttons */}
        <div
          className={`space-y-6 transition-all duration-700 transform ${
            stage >= 5 || isReducedMotion
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          {/* Glowing 404 Header */}
          <div className="relative inline-block">
            <h1 className="text-7xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-800 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500 drop-shadow-sm">
              404
            </h1>
            <span className="absolute -top-3 -right-6 px-3 py-1 bg-amber-500 text-slate-900 text-xs font-black uppercase tracking-widest rounded-full shadow-md rotate-12">
              {t("pageNotFoundSubTitle") || "404 Error"}
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t("pageNotFoundTitle") || (isHindi ? "पेज नहीं मिला" : "Page Not Found")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
              {t("pageNotFoundDesc") ||
                (isHindi
                  ? "ओह! आप जिस पेज को ढूंढ रहे हैं वह मौजूद नहीं है या शायद कहीं और स्थानांतरित कर दिया गया है।"
                  : "Oops! The page you're looking for doesn't exist or may have been moved.")}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-emerald-700/20 transition-all cursor-pointer group"
            >
              <Home className="w-4.5 h-4.5 transition-transform group-hover:-translate-x-0.5" />
              <span>{t("goToHome") || (isHindi ? "होम पर जाएं" : "Go to Home")}</span>
            </Link>

            <Link
              to="/disposable-products"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer group"
            >
              <ShoppingBag className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t("browseProducts") || (isHindi ? "प्रोडक्ट्स देखें" : "Browse Products")}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Replay Animation Button */}
          {!isReducedMotion && (
            <div className="pt-2">
              <button
                onClick={handleReplay}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                title="Replay Animation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Animation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Custom Keyframe Animations */}
      <style>{`
        @keyframes walkBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes legFront {
          0%, 100% { transform: rotate(20deg); }
          50% { transform: rotate(-20deg); }
        }
        @keyframes legBack {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes armSwingRight {
          0%, 100% { transform: rotate(-25deg); }
          50% { transform: rotate(25deg); }
        }
        @keyframes armSwingLeft {
          0%, 100% { transform: rotate(25deg); }
          50% { transform: rotate(-25deg); }
        }
        .animate-walk-bob { animation: walkBob 0.4s infinite ease-in-out; }
        .animate-leg-front { animation: legFront 0.4s infinite ease-in-out; transform-origin: 67px 94px; }
        .animate-leg-back { animation: legBack 0.4s infinite ease-in-out; transform-origin: 53px 94px; }
        .animate-arm-swing-right { animation: armSwingRight 0.4s infinite ease-in-out; transform-origin: 69px 54px; }
        .animate-arm-swing-left { animation: armSwingLeft 0.4s infinite ease-in-out; transform-origin: 47px 54px; }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
