import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ShoppingBag, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const NotFoundPage = () => {
  const { t, isHindi } = useLanguage();
  const [stage, setStage] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check for user's reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
      setStage(6); // Jump directly to final static state
      return;
    }

    // Master Animation Timeline (Connected Storyboard Sequence)
    const timers = [
      setTimeout(() => setStage(1), 100),   // 0.1s: Character enters & begins natural walking cycle
      setTimeout(() => setStage(2), 2400),  // 2.4s: Character reaches center position, decelerates & plants feet
      setTimeout(() => setStage(3), 2800),  // 2.8s: Backpack inertia swing, follow-through & flap unlatches
      setTimeout(() => setStage(4), 3350),  // 3.35s - 4.2s: Bowls & cups spill out with physics bounce & rotation
      setTimeout(() => setStage(5), 4300),  // 4.3s: Character notices accident & reacts (surprised pose + "!" bubble)
      setTimeout(() => setStage(6), 4800),  // 4.8s: 404 title, subtitle, description & buttons reveal
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleReplay = () => {
    if (isReducedMotion) return;
    setStage(0);
    setTimeout(() => setStage(1), 100);
    setTimeout(() => setStage(2), 2400);
    setTimeout(() => setStage(3), 2800);
    setTimeout(() => setStage(4), 3350);
    setTimeout(() => setStage(5), 4300);
    setTimeout(() => setStage(6), 4800);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-slate-50 via-emerald-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 overflow-hidden relative select-none">
      
      {/* Ambient Lighting & Glow Backdrops */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container Layout */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left / Top Stage Area: Character Animation Scene */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative h-72 sm:h-80 w-full max-w-md flex items-end justify-center pb-4 overflow-hidden">
            
            {/* Ground Plane with Layered Shadows & Depth */}
            <div className="absolute bottom-4 left-4 right-4 h-3 bg-gradient-to-r from-transparent via-slate-300/60 dark:via-slate-800 to-transparent rounded-full opacity-80" />
            <div className="absolute bottom-5 left-1/3 right-1/3 h-1 bg-gradient-to-r from-transparent via-emerald-300/40 dark:via-emerald-800/40 to-transparent rounded-full opacity-60" />

            {/* Character Container with Smooth Walk & Stop Easing */}
            <div
              className={`absolute bottom-4 transition-all duration-[2300ms] cubic-bezier(0.16, 1, 0.3, 1) flex flex-col items-center ${
                stage === 0
                  ? "-left-52 opacity-0"
                  : "left-1/2 -translate-x-1/2 opacity-100"
              }`}
            >
              {/* Surprised Exclamation Reaction Bubble */}
              <div
                className={`absolute -top-16 right-0 transition-all duration-400 cubic-bezier(0.68, -0.55, 0.265, 1.55) transform ${
                  stage >= 5
                    ? "scale-100 opacity-100 translate-y-0"
                    : "scale-0 opacity-0 translate-y-4"
                }`}
              >
                <div className="bg-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center space-x-1.5 border border-amber-300 animate-bounce">
                  <AlertTriangle className="w-4 h-4 fill-slate-950 stroke-amber-500" />
                  <span className="tracking-wide">Oops!</span>
                </div>
              </div>

              {/* Vector Character Art & Body Joint Rig */}
              <svg
                className={`w-36 h-48 sm:w-44 sm:h-56 transition-transform duration-300 ${
                  stage === 1 && !isReducedMotion ? "animate-character-bob" : ""
                }`}
                viewBox="0 0 140 170"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Dynamic Ground Shadow underneath Character */}
                <ellipse
                  cx="70"
                  cy="160"
                  rx={stage === 1 && !isReducedMotion ? "24" : "30"}
                  ry="6"
                  className="fill-slate-400/30 dark:fill-slate-950/70 transition-all duration-300"
                />

                {/* Backpack Rig with Inertia & Flap Opening */}
                <g className={`transition-transform duration-500 origin-bottom-left ${
                  stage === 2 ? "rotate-18 scale-105" : stage >= 3 ? "rotate-12" : ""
                }`}>
                  {/* Bag Body */}
                  <rect x="22" y="52" width="36" height="48" rx="10" className="fill-emerald-700 dark:fill-emerald-600 shadow-lg" />
                  <rect x="26" y="58" width="28" height="18" rx="5" className="fill-emerald-800 dark:fill-emerald-700" />
                  
                  {/* Bag Straps */}
                  <path d="M48 58C48 44 56 40 64 40" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                  <path d="M38 58C38 46 44 42 50 42" stroke="#065f46" strokeWidth="3" strokeLinecap="round" fill="none" />

                  {/* Open Flap (Flips open in Stage 3+) */}
                  <path
                    d="M22 52 C22 38, 58 38, 58 52 Z"
                    className={`fill-emerald-900 dark:fill-emerald-800 transition-all duration-500 origin-top ${
                      stage >= 3 ? "-rotate-130 -translate-y-3 translate-x-1" : ""
                    }`}
                  />

                  {/* Dust Burst Effect when Bag Opens */}
                  {stage === 3 && (
                    <g className="animate-ping opacity-75">
                      <circle cx="18" cy="45" r="3" className="fill-amber-400" />
                      <circle cx="12" cy="55" r="2" className="fill-emerald-300" />
                      <circle cx="24" cy="38" r="2.5" className="fill-slate-300" />
                    </g>
                  )}
                </g>

                {/* Back Arm & Sleeve (Swings opposite to Front Leg) */}
                <g className={`origin-[48px_58px] ${
                  stage === 1 && !isReducedMotion ? "animate-arm-back-swing" : ""
                }`}>
                  <rect x="42" y="58" width="12" height="28" rx="6" className="fill-emerald-700 dark:fill-emerald-600" />
                  <circle cx="48" cy="88" r="6" className="fill-amber-200" />
                </g>

                {/* Back Leg & Shoe (Phase-offset Walk Stride) */}
                <g className={`origin-[56px_100px] ${
                  stage === 1 && !isReducedMotion ? "animate-leg-back-stride" : ""
                }`}>
                  <rect x="50" y="100" width="13" height="42" rx="6.5" className="fill-slate-700 dark:fill-slate-600" />
                  {/* Foot / Shoe */}
                  <path d="M46 136 C46 136, 68 136, 68 142 C68 146, 44 146, 44 142 Z" className="fill-slate-900 dark:fill-slate-300" />
                </g>

                {/* Front Leg & Shoe (Main Walk Stride) */}
                <g className={`origin-[76px_100px] ${
                  stage === 1 && !isReducedMotion ? "animate-leg-front-stride" : ""
                }`}>
                  <rect x="70" y="100" width="13" height="42" rx="6.5" className="fill-slate-800 dark:fill-slate-500" />
                  {/* Foot / Shoe */}
                  <path d="M66 136 C66 136, 88 136, 88 142 C88 146, 64 146, 64 142 Z" className="fill-slate-950 dark:fill-slate-200" />
                </g>

                {/* Torso & Shirt Uniform */}
                <rect x="48" y="54" width="36" height="52" rx="10" className="fill-emerald-600 dark:fill-emerald-500" />
                <path d="M48 54 H84 V68 H48 Z" className="fill-emerald-700 dark:fill-emerald-600" />
                <path d="M60 54 L66 62 L72 54" stroke="#047857" strokeWidth="2.5" fill="none" />

                {/* Neck */}
                <rect x="62" y="44" width="10" height="12" className="fill-amber-200" />

                {/* Head & Dynamic Expressions */}
                <g className={`transition-transform duration-400 origin-[67px_35px] ${
                  stage >= 5 ? "rotate-18 translate-y-1.5" : ""
                }`}>
                  {/* Face Base */}
                  <circle cx="67" cy="35" r="18" className="fill-amber-200" />
                  
                  {/* Hair Style */}
                  <path d="M48 35 C48 16, 86 16, 86 35 C86 25, 76 20, 67 20 C58 20, 48 25, 48 35 Z" className="fill-slate-900" />
                  
                  {/* R.P. Cap */}
                  <path d="M46 28 C46 16, 88 16, 88 28 Z" className="fill-emerald-700 dark:fill-emerald-600" />
                  <path d="M67 28 H96 V33 H67 Z" className="fill-emerald-800 dark:fill-emerald-700" />
                  <text x="56" y="25" fill="white" fontSize="8" fontWeight="900" letterSpacing="0.5">RP</text>

                  {/* Face Expression Rig */}
                  {stage >= 5 ? (
                    /* Surprised Shocked Expression */
                    <g>
                      <circle cx="74" cy="33" r="3.2" className="fill-slate-950" />
                      <circle cx="83" cy="33" r="3.2" className="fill-slate-950" />
                      <circle cx="75" cy="32" r="1" fill="white" />
                      <circle cx="84" cy="32" r="1" fill="white" />
                      <circle cx="78.5" cy="41" r="4.2" className="fill-rose-500" />
                      <path d="M71 25 Q74 22 77 25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                      <path d="M80 25 Q83 22 86 25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  ) : (
                    /* Cheerful Walking Expression */
                    <g>
                      <circle cx="75" cy="33" r="2.3" className="fill-slate-900" />
                      <path d="M73 38 Q78 44 83 38" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>
                  )}
                </g>

                {/* Front Arm & Hand (Swings opposite to Front Leg) */}
                <g className={`transition-transform duration-400 origin-[76px_58px] ${
                  stage >= 5
                    ? "-rotate-65 -translate-y-2 translate-x-1"
                    : stage === 1 && !isReducedMotion
                    ? "animate-arm-front-swing"
                    : ""
                }`}>
                  <rect x="70" y="58" width="12" height="28" rx="6" className="fill-emerald-500 dark:fill-emerald-400" />
                  <circle cx="76" cy="88" r="6" className="fill-amber-200" />
                </g>
              </svg>
            </div>

            {/* Individual Physics Bowl, Cup & Plate Trajectories */}
            {stage >= 4 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 h-24 pointer-events-none">
                
                {/* Bowl A: Paper Salad Bowl (Green Rim - Left Arc Drop) */}
                <div
                  className={`absolute left-0 transition-all duration-700 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
                    stage >= 4
                      ? "bottom-1 opacity-100 rotate-20 scale-100"
                      : "bottom-36 opacity-0 -rotate-210 scale-40"
                  }`}
                >
                  <svg className="w-13 h-9 drop-shadow-xl" viewBox="0 0 50 35">
                    <ellipse cx="25" cy="10" rx="22" ry="7" className="fill-emerald-100 dark:fill-emerald-950 stroke-emerald-600" strokeWidth="2" />
                    <path d="M5 10 C8 30, 42 30, 45 10 Z" className="fill-white dark:fill-slate-800 stroke-emerald-600" strokeWidth="2" />
                    <ellipse cx="25" cy="10" rx="18" ry="4" className="fill-emerald-50 dark:fill-emerald-900/50" />
                  </svg>
                </div>

                {/* Bowl B: Beverage Paper Cup (Right Roll Bounce) */}
                <div
                  className={`absolute left-24 transition-all duration-850 delay-150 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
                    stage >= 4
                      ? "bottom-0 opacity-100 -rotate-50 scale-100"
                      : "bottom-40 opacity-0 rotate-180 scale-40"
                  }`}
                >
                  <svg className="w-9 h-10 drop-shadow-md" viewBox="0 0 40 45">
                    <path d="M5 5 L10 40 H30 L35 5 Z" className="fill-white dark:fill-slate-800 stroke-emerald-600" strokeWidth="2" />
                    <ellipse cx="20" cy="5" rx="15" ry="4" className="fill-emerald-600" />
                    <line x1="8" y1="20" x2="32" y2="20" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 2" />
                  </svg>
                </div>

                {/* Bowl C: Round Paper Meal Plate (Air Glide & Slap Landing) */}
                <div
                  className={`absolute left-40 transition-all duration-1000 delay-300 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
                    stage >= 4
                      ? "bottom-1 opacity-100 rotate-6 scale-100"
                      : "bottom-44 opacity-0 -rotate-90 scale-40"
                  }`}
                >
                  <svg className="w-16 h-8 drop-shadow-lg" viewBox="0 0 60 30">
                    <ellipse cx="30" cy="15" rx="28" ry="12" className="fill-white dark:fill-slate-800 stroke-emerald-600" strokeWidth="2" />
                    <ellipse cx="30" cy="15" rx="20" ry="7" className="fill-emerald-50 dark:fill-emerald-900/40 stroke-emerald-400" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Bowl D: Small Sauce Cup (Fast Tumble & Micro Bounce) */}
                <div
                  className={`absolute left-60 transition-all duration-750 delay-450 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${
                    stage >= 4
                      ? "bottom-0 opacity-100 rotate-35 scale-100"
                      : "bottom-32 opacity-0 rotate-150 scale-40"
                  }`}
                >
                  <svg className="w-7 h-7 drop-shadow-sm" viewBox="0 0 30 30">
                    <ellipse cx="15" cy="8" rx="12" ry="4" className="fill-amber-100 stroke-amber-600" strokeWidth="1.5" />
                    <path d="M3 8 L6 24 H24 L27 8 Z" className="fill-white dark:fill-slate-800 stroke-amber-600" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom Area: 404 Headline, Subtitle, Description & Buttons */}
        <div className="lg:col-span-6 text-center lg:text-left space-y-6">
          <div
            className={`space-y-6 transition-all duration-800 transform ${
              stage >= 6 || isReducedMotion
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-95 pointer-events-none"
            }`}
          >
            {/* Glowing 404 Header Badge */}
            <div className="relative inline-block">
              <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-800 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500 drop-shadow-sm select-none">
                404
              </h1>
              <span className="absolute -top-2 -right-4 px-3.5 py-1 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-widest rounded-full shadow-lg rotate-12 border border-amber-300">
                {t("pageNotFoundSubTitle") || "404 Error"}
              </span>
            </div>

            {/* Title & Localized Description */}
            <div className="space-y-3 max-w-lg mx-auto lg:mx-0">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t("pageNotFoundTitle") || (isHindi ? "पेज नहीं मिला" : "Page Not Found")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                {t("pageNotFoundDesc") ||
                  (isHindi
                    ? "ओह! आप जिस पेज को ढूंढ रहे हैं वह मौजूद नहीं है या शायद कहीं और स्थानांतरित कर दिया गया है।"
                    : "Oops! The page you're looking for doesn't exist or may have been moved.")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 max-w-md mx-auto lg:mx-0">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-emerald-700/25 transition-all cursor-pointer group"
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

            {/* Replay Animation Control */}
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
      </div>

      {/* Smooth 60 FPS Keyframe Animation Engine */}
      <style>{`
        @keyframes characterBob {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-8px) rotate(1deg); }
          50% { transform: translateY(0px); }
          75% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes legFrontStride {
          0%, 100% { transform: rotate(28deg); }
          50% { transform: rotate(-28deg); }
        }
        @keyframes legBackStride {
          0%, 100% { transform: rotate(-28deg); }
          50% { transform: rotate(28deg); }
        }
        @keyframes armFrontSwing {
          0%, 100% { transform: rotate(-30deg); }
          50% { transform: rotate(30deg); }
        }
        @keyframes armBackSwing {
          0%, 100% { transform: rotate(30deg); }
          50% { transform: rotate(-30deg); }
        }
        .animate-character-bob { animation: characterBob 0.5s infinite ease-in-out; }
        .animate-leg-front-stride { animation: legFrontStride 0.5s infinite ease-in-out; }
        .animate-leg-back-stride { animation: legBackStride 0.5s infinite ease-in-out; }
        .animate-arm-front-swing { animation: armFrontSwing 0.5s infinite ease-in-out; }
        .animate-arm-back-swing { animation: armBackSwing 0.5s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
