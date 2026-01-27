"use client";

import { useEffect, useState, useRef } from "react";
import { HelpCircle, Loader2, ChevronRight, Sparkles } from "lucide-react";
import iconMap from "./navbar/iconMap";
import { useAuthStore } from "@/app/store/useAuthScreenStore";

export default function NavSections({
  isSidebarOpen,
  pathname,
  notificationsCount,
  userId,
}) {
  const { navLinks, setNavLinks } = useAuthStore();
  const [sections, setSections] = useState(navLinks || {});
  const [loading, setLoading] = useState(!navLinks || Object.keys(navLinks).length === 0);
  const [error, setError] = useState(null);
  const [visibleItems, setVisibleItems] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);
  const sectionRefs = useRef({});
  const abortControllerRef = useRef(null);

  // Custom Icon component to properly handle active and hover states
  const NavIcon = ({ label, isActive, isHovered }) => {
    const Icon = iconMap[label] || HelpCircle;
    
    return (
      <div className="relative">
        <Icon 
          size={20}
          className={`transition-all duration-300 ${
            isActive 
              ? 'text-purple-600 scale-110' 
              : isHovered
                ? 'text-gray-700 scale-105' 
                : 'text-gray-500 scale-100'
          }`}
        />
        {isActive && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
        )}
      </div>
    );
  };

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems(prev => ({
              ...prev,
              [entry.target.dataset.section]: true
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '-50px' }
    );

    Object.keys(sectionRefs.current).forEach(key => {
      if (sectionRefs.current[key]) {
        observer.observe(sectionRefs.current[key]);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  // Optimized data fetching
  useEffect(() => {
    let isMounted = true;
    
    async function fetchNav() {
      // If we already have navLinks in the store, use them immediately
      if (navLinks && Object.keys(navLinks).length > 0) {
        setSections(navLinks);
        setLoading(false);
        return;
      }
      
      // Only proceed with fetch if userId exists
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Clean up previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();
        
        // Set timeout to abort the request if it takes too long
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort('Request timeout');
          }
        }, 5000); // 5 seconds timeout

        // Add cache-busting parameter and caching headers
        const res = await fetch(`/api/nav-links?userId=${userId}&_t=${Date.now()}`, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=3600',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        // Don't continue if component unmounted
        if (!isMounted) return;

        if (!res.ok) {
          throw new Error(`Failed to fetch navigation: ${res.status}`);
        }

        const data = await res.json();
        
        if (data?.success && data?.data) {
          setSections(data.data);
          setNavLinks(data.data); // Store in global state
        } else {
          throw new Error("Invalid data format from API");
        }
      } catch (error) {
        // Only set error state if the error isn't from aborting
        if (error.name !== 'AbortError' && isMounted) {
          console.error("Error fetching navigation:", error);
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchNav();

    // Clean up function
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [userId, navLinks, setNavLinks]);

  // Staggered animation delay calculator
  const getStaggerDelay = (sectionIndex, itemIndex) => {
    return sectionIndex * 100 + itemIndex * 50;
  };

  // Improved loading skeleton with realistic layout
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8">
          {[1, 2, 3].map((sectionIndex) => (
            <div key={sectionIndex} className="animate-pulse mb-8">
              {isSidebarOpen && (
                <div className="h-3 w-24 bg-gray-200 rounded-full mb-4 mx-4"></div>
              )}
              <div className="space-y-2">
                {Array(4).fill(0).map((_, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    className="flex items-center gap-3 px-4 py-3 mx-4 rounded-xl bg-gray-50"
                    style={{ animationDelay: `${getStaggerDelay(sectionIndex, itemIndex)}ms` }}
                  >
                    <div className="h-5 w-5 rounded-full bg-gray-200"></div>
                    {isSidebarOpen && (
                      <div className="h-4 w-24 bg-gray-200 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-red-500 text-sm mb-2">⚠️ Navigation Error</div>
          <div className="text-red-400 text-xs">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              // Force refetch by setting userId to trigger useEffect
              setTimeout(() => window.location.reload(), 100);
            }}
            className="mt-3 px-3 py-1 bg-red-100 text-red-600 rounded-md text-xs hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!sections || Object.keys(sections).length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <HelpCircle className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No navigation items available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {Object.entries(sections).map(
        ([sectionTitle, items], sectionIndex) =>
          items.length > 0 && (
            <div 
              key={sectionTitle}
              ref={el => sectionRefs.current[sectionTitle] = el}
              data-section={sectionTitle}
              className="mb-8"
              style={{
                opacity: visibleItems[sectionTitle] ? 1 : 0,
                transform: visibleItems[sectionTitle] ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.6s ease-out ${sectionIndex * 100}ms`
              }}
            >
              {isSidebarOpen && (
                <h3 className="px-4 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                  <span className="bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent">
                    {sectionTitle}
                  </span>
                  <div className="ml-3 w-full h-px bg-gradient-to-r from-gray-200 to-transparent flex-1"></div>
                </h3>
              )}
              <ul className="space-y-2">
                {Array.isArray(items) &&
                  items.map((item, itemIndex) => {
                    const isActive = pathname.startsWith(item.href);
                    const isHovered = hoveredItem === item.href;
                    const delay = getStaggerDelay(sectionIndex, itemIndex);

                    return (
                      <li 
                        key={item.href}
                        style={{
                          animationDelay: `${delay}ms`
                        }}
                        className="animate-in slide-in-from-left-8 duration-500 fill-mode-backwards"
                      >
                        <a
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 relative overflow-hidden group ${
                            isActive
                              ? "bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border-l-4 border-purple-600 text-purple-700 shadow-lg shadow-purple-500/10"
                              : "text-gray-700 hover:bg-white/50 hover:shadow-md border-l-4 border-transparent"
                          }`}
                          onMouseEnter={() => setHoveredItem(item.href)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          {/* Animated border effect */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-indigo-400 transition-all duration-300 ${
                            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`} />
                          
                          {/* Use custom NavIcon component */}
                          <NavIcon 
                            label={item.label}
                            isActive={isActive}
                            isHovered={isHovered}
                          />
                          
                          {isSidebarOpen && (
                            <span className="flex-1 font-medium transition-all duration-300">
                              {item.label}
                            </span>
                          )}
                          
                          {item.label === "Notifications" && notificationsCount > 0 && (
                            <span className="relative">
                              <span className="absolute -inset-1 bg-red-400/50 rounded-full animate-ping"></span>
                              <span className="relative text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full shadow-lg">
                                {notificationsCount}
                              </span>
                            </span>
                          )}

                          {/* Add hover indicator with ChevronRight */}
                          {isSidebarOpen && (
                            <div className="ml-auto transition-all duration-300">
                              <ChevronRight 
                                size={16} 
                                className={`transition-all duration-300 ${
                                  isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                                }`}
                              />
                            </div>
                          )}
                          
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12" />
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )
      )}
    </div>
  );
}