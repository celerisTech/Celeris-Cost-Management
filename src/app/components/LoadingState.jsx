import React from "react";

export default function LoadingState({
  message = "Loading details...",
  subtext = "Please wait while we update your workspace.",
  fullscreen = false,
  compact = false,
}) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-3 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center w-12 h-12">
          {/* Outer spinning ring (clockwise) */}
          <div className="absolute inset-0 rounded-full border-3 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          {/* Inner spinning ring (counter-clockwise, faster) */}
          <div 
            className="absolute inset-1.5 rounded-full border-3 border-t-transparent border-r-transparent border-b-indigo-500 border-l-transparent animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "0.6s" }}
          ></div>
          {/* Center core */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
        </div>
        {message && (
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  const containerClasses = fullscreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-900/10 backdrop-blur-md animate-in fade-in duration-300"
    : "flex items-center justify-center min-h-[60vh] bg-gray-50/50 dark:bg-gray-900/10 p-4 animate-in fade-in duration-300";

  const cardClasses = fullscreen
    ? "flex flex-col items-center p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 max-w-sm w-full mx-4"
    : "flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 max-w-sm w-full mx-auto";

  return (
    <div className={containerClasses}>
      <div className={cardClasses}>
        <div className="relative flex items-center justify-center w-20 h-20">
          {/* Outer pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-400/10 animate-ping duration-[2000ms]"></div>
          
          {/* Outer spinning ring (clockwise) */}
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-400 border-b-transparent border-l-transparent animate-spin"></div>
          
          {/* Inner spinning ring (counter-clockwise, faster) */}
          <div 
            className="absolute inset-2.5 rounded-full border-4 border-t-transparent border-r-transparent border-b-indigo-500 border-l-indigo-300 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
          ></div>
          
          {/* Center glowing core */}
          <div className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
        </div>
        
        <div className="mt-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 tracking-wide animate-pulse">
            {message}
          </h3>
          {subtext && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[240px] leading-relaxed mx-auto">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
