"use client";

import React, { useEffect, useState, useRef } from "react";
import { Briefcase, Users, Package, TrendingUp } from "lucide-react";
import StatCardLoop from "./StatCardLoop"; 
import { useRouter } from "next/navigation"; // For Next.js App Router
// If using Next.js Pages Router: import { useRouter } from "next/router";
// If using React Router: import { useNavigate } from "react-router-dom";

// Utility: Format INR with fallback
const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

// Utility: Format numbers with international formatting
const formatNumber = (n) =>
  new Intl.NumberFormat("en-US").format(Number.isFinite(n) ? n : 0);

// Utility: Count-up animation
function CountUp({ end, suffix = "", isCurrency = false, isPercent = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof end !== 'number' || !isFinite(end)) {
      setCount(0);
      return;
    }

    let start = 0;
    const duration = 1200;
    const totalFrames = duration / 16;
    const increment = end / totalFrames;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  if (isNaN(count)) return <>0{isPercent ? "%" : ""}</>;
  
  const formattedCount = isCurrency ? formatINR(count) : formatNumber(count);
  
  return (
    <>
      {formattedCount}
      {isPercent && "%"}
      {suffix && !isCurrency && !isPercent && suffix}
    </>
  );
}

export default function StatsCards() {
  const router = useRouter();
  // If using React Router: const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    total_projects: 0,
    total_labour: 0,
    total_stock_value: 0,
    budget_utilized_percent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/statscards", { 
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) throw new Error(`Failed to load stats: ${res.status}`);
        const data = await res.json();
        if (active) {
          setStats({
            total_projects: Number(data.total_projects ?? 0),
            total_labour: Number(data.total_labour ?? 0),
            total_stock_value: Number(data.total_stock_value ?? 0),
            budget_utilized_percent: Math.min(100, Number(data.budget_utilized_percent ?? 0)),
          });
          setError("");
        }
      } catch (e) {
        console.error("Stats fetch error:", e);
        if (active) setError("Unable to fetch dashboard statistics");
      } finally {
        if (active) {
          setLoading(false);
          setTimeout(() => setLoaded(true), 150);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Define navigation handlers for each card
  const handleCardClick = (cardId) => {
    switch(cardId) {
      case "projects":
        router.push("/projects"); // Navigate to projects page
        // React Router: navigate("/projects");
        break;
      case "labour":
        router.push("/labors"); // Navigate to employees page
        // React Router: navigate("/employees");
        break;
      case "stock":
        router.push("/warehouse"); // Navigate to inventory page
        // React Router: navigate("/inventory");
        break;
      case "budget":
        router.push("/expenses"); // Navigate to budget page
        // React Router: navigate("/budget");
        break;
      default:
        break;
    }
  };

  const cards = [
    {
      id: "projects",
      title: "Total Projects",
      value: <CountUp end={stats.total_projects} />,
      icon: <Briefcase className="text-blue-600" size={20} />,
      note: "Active projects",
      color: "blue",
      onClick: () => handleCardClick("projects"),
    },
    {
      id: "labour",
      title: "Total Labour",
      value: <CountUp end={stats.total_labour} />,
      icon: <Users className="text-green-600" size={20} />,
      note: "Registered workers",
      color: "green",
      onClick: () => handleCardClick("labour"),
    },
    // {
    //   id: "stock",
    //   title: "Stock Value",
    //   value: <CountUp end={stats.total_stock_value} isCurrency={true} />,
    //   icon: <Package className="text-purple-600" size={20} />,
    //   note: "Inventory worth",
    //   color: "purple",
    //   onClick: () => handleCardClick("stock"),
    // },
    {
      id: "budget",
      title: "Budget Utilized",
      value: <CountUp end={stats.budget_utilized_percent} isPercent={true} />,
      icon: <TrendingUp className="text-orange-600" size={20} />,
      note: "Across all projects",
      color: "orange",
      isProgress: true,
      onClick: () => handleCardClick("budget"),
    },
  ];

  const colorStyles = {
    blue: { bg: "from-blue-50 to-blue-100", border: "border-blue-200", text: "text-blue-700" },
    green: { bg: "from-green-50 to-green-100", border: "border-green-200", text: "text-green-700" },
    purple: { bg: "from-purple-50 to-purple-100", border: "border-purple-200", text: "text-purple-700" },
    orange: { bg: "from-orange-50 to-orange-100", border: "border-orange-200", text: "text-orange-700" },
  };

  // Function to render each card with click handler
  const renderCard = (card, index) => {
    const colors = colorStyles[card.color];
    
    return (
      <button
        onClick={card.onClick}
        className={`
          relative flex flex-col rounded-xl border bg-white/95 backdrop-blur-sm 
          p-3 sm:p-4 shadow-sm transition-all duration-300 hover:shadow-md
          h-28 sm:h-32 w-full sm:w-64 ${colors.border}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
          ${colors.text.replace('text-', 'focus:ring-')}
          group cursor-pointer
        `}
        aria-label={`View ${card.title}`}
      >
        {/* Background gradient on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl -z-10`} />
        
        {/* Add a subtle scale effect on hover */}
        <div className="transform group-hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-s font-bold text-gray-600 tracking-wider mb-1 truncate">
                {card.title}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {card.value}
              </h3>
            </div>
            <div className={`p-2 rounded-lg bg-white/80 shadow-xs ${colors.text} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              {card.icon}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-auto gap-2">
            <p className="text-xs text-gray-500 font-medium truncate">
              {card.note}
            </p>
            
            {/* Progress bar for budget utilization */}
            {card.isProgress && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-12 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-1000 ease-out"
                    style={{ width: `${stats.budget_utilized_percent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 w-7 text-right">
                  {stats.budget_utilized_percent}%
                </span>
              </div>
            )}
            
            {/* Add "View" text on hover for all cards */}
            {!card.isProgress && (
              <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors duration-300 opacity-0 group-hover:opacity-100">
                View →
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  // Loading skeleton - also make clickable
  if (loading) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 overflow-visible">
        {Array(4).fill(0).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-28 sm:h-32 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-xs animate-pulse cursor-not-allowed"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center font-medium">
        <div className="flex items-center justify-center gap-2">
          <span>⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  // For mobile devices, use a static grid layout
  if (isMobile) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 overflow-visible">
        {cards.map((card) => (
          <div key={card.id}>
            {renderCard(card)}
          </div>
        ))}
      </div>
    );
  }
  
  // For desktop, use the scrolling StatCardLoop
  return (
    <div className="hidden md:block">
      <StatCardLoop 
        cards={cards}
        renderCard={renderCard}
        speed={60}
        direction="left"
        gap={16}
        pauseOnHover={true}
        fadeOut={true}
        scaleOnHover={true}
        loaded={loaded}
        ariaLabel="Statistics"
        className="min-h-[10rem]"
      />
    </div>
  );
}