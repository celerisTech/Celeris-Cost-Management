"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, HelpCircle } from "lucide-react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import Link from "next/link";
import { useAuthStore } from "../../store/useAuthScreenStore";
import iconMap, { Sparkles } from "./iconMap";
import MobileToggle from "./MobileToggle";

const Sidebar = ({
  isSidebarOpen,
  onToggle,
  companyName,
  companyLogo,
  companyInitials,
  pathname,
  notificationsCount,
  isUserMenuOpen,
  pendingCount = 0,
  setIsUserMenuOpen,
  onSignOut,
  notifications = [],
}) => {
  const { navLinks, refreshNavLinks } = useAuthStore();
  const [hoveredLink, setHoveredLink] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

   const getMatchScore = (linkHref, currentPath) => {
    if (!currentPath || !linkHref || linkHref === '#') return 0;

    // Normalizing paths that are logically part of a section but not physically nested
    const normalizePath = (p) => {
      if (p.startsWith('/addlabors') || p.startsWith('/salary-report')) return '/labors';
      if (p.startsWith('/additems') || p.startsWith('/purchase-history')) return '/purchase-history';
      if (p.startsWith('/addsupplier')) return '/supplier';
      if (p.startsWith('/addproduct')) return '/purchase-history';
      if (p.startsWith('/projectlinking')) return '/expenses';
      if (p.startsWith('/item-movement')) return '/warehouse';
      if (p.startsWith('/newrole')) return '/teams';
      if (p.startsWith('/newuser')) return '/teams';
      if (p.startsWith('/engineer/requests')) return '/engineer/expensive-entry';
      return p;
    };

    const effectiveCurrentPath = normalizePath(currentPath);
    const effectiveLinkHref = linkHref; // Sidebar links are usually already normalized

    if (effectiveCurrentPath === effectiveLinkHref) return 100;
    if (effectiveCurrentPath.startsWith(effectiveLinkHref + '/')) return 80;

    const pathSegments = effectiveCurrentPath.split('/').filter(Boolean);
    const hrefSegments = effectiveLinkHref.split('/').filter(Boolean);

    if (pathSegments.length > 0 && pathSegments[0] === hrefSegments[0]) {
      let score = 20;
      for (let i = 0; i < Math.min(pathSegments.length, hrefSegments.length); i++) {
        if (pathSegments[i] === hrefSegments[i]) score += 10;
        else break;
      }
      return score;
    }
    return 0;
  };

  const bestMatch = React.useMemo(() => {
    const allLinks = navLinks ? Object.values(navLinks).flat() : [];
    return allLinks.reduce((best, link) => {
      const score = getMatchScore(link.href, pathname);
      if (score > best.score) return { href: link.href, score };
      return best;
    }, { href: null, score: 0 });
  }, [navLinks, pathname]);

  
  useEffect(() => {
    setMounted(true);
    // tailored to ensure if we are entering the app, we check if links are stale or need refresh
    if (refreshNavLinks) {
      refreshNavLinks();
    }
  }, []);

  // Ripple effect component
  const RippleEffect = ({ isActive }) => (
    <div className={`absolute inset-0 rounded-lg transition-all duration-500 ${isActive
      ? 'bg-yellow-200/20'
      : 'bg-transparent'
      }`} />
  );

  // Glow effect for active items
  const ActiveGlow = () => (
    <div className="absolute inset-0 bg-yellow-100/10 rounded-xl blur-md scale-105" />
  );



  // Icon component that handles active and hover states internally
  const NavIcon = ({ label, isActive, isHovered }) => {
    const Icon = iconMap[label] || HelpCircle;

    return (
      <div className="relative">
        <Icon
          className={`h-5 w-5 transition-all duration-300 ${isActive
            ? 'text-gray-800 scale-110'
            : isHovered
              ? 'text-gray-900 scale-105'
              : 'text-current scale-100'
            }`}
        />
        {isActive && (
          <Sparkles
            size={8}
            className="absolute -top-1 -right-1 text-yellow-400 animate-pulse"
          />
        )}
      </div>
    );
  };

  if (!mounted) {
    return (
      <aside className="fixed md:static inset-y-0 left-0 z-40 w-68 md:w-20 bg-white/90 backdrop-blur shadow-sm">
        <div className="flex flex-col h-full border-r border-gray-100 animate-pulse">
          <div className="p-4 border-b border-gray-100/80">
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-6 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <MobileToggle
        isSidebarOpen={isSidebarOpen}
        onToggle={onToggle}
        notifications={notifications}
      />

      <aside
        className={`${isSidebarOpen ? "md:w-60 lg:w-68" : "md:w-20"
          } fixed md:static inset-y-0 left-0 z-40 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } w-68 md:w-auto bg-white/90 backdrop-blur-lg shadow-xl transition-all duration-500 ease-out`}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
        }}
      >
        <div className="flex flex-col h-full border-r border-gray-200/50 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-400 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-400 rounded-full blur-lg"></div>
          </div>

          {/* Logo + Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50 relative z-10">
            <Logo
              companyName={companyName}
              companyLogo={companyLogo}
              companyInitials={companyInitials}
              isSidebarOpen={isSidebarOpen}
            />
            <button
              onClick={onToggle}
              className="hidden md:inline-flex text-gray-600 hover:text-gray-900 focus:outline-none transition-all duration-300 hover:scale-110 p-1.5"
              title={isSidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronRight className="h-4 w-4 transform rotate-180 transition-transform duration-300" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-300" />
              )}
            </button>
          </div>

          {/* Dynamic Nav Sections */}
          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8 relative z-10">
            {navLinks && Object.keys(navLinks).length > 0 ? (
              Object.entries(navLinks).map(([section, links]) => (
                <div key={section} className="relative">
                  {isSidebarOpen && (
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full text-sm font-bold text-gray-600 uppercase mb-4 tracking-widest flex items-center px-1 hover:opacity-80 transition-opacity focus:outline-none group/header"
                    >
                      <span className="bg-blue-600 bg-clip-text font-extrabold text-transparent text-left">
                        {section}
                      </span>
                      <div className="ml-3 h-[1px] bg-green-400/50 flex-1 rounded-full opacity-50 group-hover/header:opacity-100 transition-opacity"></div>
                      <ChevronDown
                        className={`ml-2 h-4 w-4 text-gray-500 transition-transform duration-300 ${collapsedSections[section] ? '-rotate-90' : 'rotate-0'
                          }`}
                      />
                    </button>
                  )}
                  <ul className={`space-y-2 transition-all duration-300 overflow-hidden ${collapsedSections[section] && isSidebarOpen ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
                    }`}>
                    {links.map((link) => {
                      const isActive = pathname === link.href || (bestMatch?.href === link.href && bestMatch?.score > 0);
                      const isHovered = hoveredLink === link.href;

                      return (
                        <li key={link.href} className="relative">

                          <Link
                            href={link.href}
                            className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-500 relative overflow-hidden group ${isActive
                              ? "bg-yellow-100/10 text-gray-900 shadow-md border-l-4 border-yellow-300 rounded-md"
                              : "text-gray-700 hover:bg-white/80 hover:shadow-md border border-transparent hover:border-gray-200/50"
                              }`}
                            onMouseEnter={() => setHoveredLink(link.href)}
                            onMouseLeave={() => setHoveredLink(null)}
                          >
                            {/* Active Glow */}
                            {isActive && <ActiveGlow />}

                            {/* Ripple background */}
                            <RippleEffect isActive={isActive} />

                            {/* Custom NavIcon component handles the active/hover states internally */}
                            <div className="mr-3 relative z-10">
                              <NavIcon
                                label={link.label}
                                isActive={isActive}
                                isHovered={isHovered}
                              />
                            </div>

                            {isSidebarOpen && (
                              <span className="relative z-10 transition-all duration-300">
                                {link.label}
                              </span>
                            )}

                            {/* Notification badge with animation */}
                            {link.label === "Notifications" && notificationsCount > 0 && (
                              <span className="ml-auto relative z-10">
                                <span className="absolute -inset-1 bg-red-400 rounded-full animate-ping opacity-75"></span>
                                <span className="relative text-xs bg-red-500 text-white px-2 py-1 rounded-full shadow-lg">
                                  {notificationsCount}
                                </span>
                              </span>
                            )}
                            {link.label === "Product Approval" && pendingCount > 0 && (
                              <span className="ml-auto relative z-10">
                                <span className="absolute -inset-1 bg-yellow-400 rounded-full animate-ping opacity-75"></span>
                                <span className="relative text-xs bg-yellow-500 text-white px-2 py-1 rounded-full shadow-lg">
                                  {pendingCount}
                                </span>
                              </span>
                            )}

                            {/* Hover arrow indicator */}
                            {isSidebarOpen && (
                              <ChevronRight className={`h-4 w-4 ml-auto transition-all duration-300 ${isHovered ? 'translate-x-1 opacity-100' : 'translate-x-0 opacity-0'
                                }`} />
                            )}

                            {/* Subtle hover effect */}
                            <div className={`absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isActive ? 'opacity-20' : ''
                              }`} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">No menu available</p>
              </div>
            )}
          </nav>

          {/* User Menu (bottom) */}
          <div className="relative z-10">
            <UserMenu
              isSidebarOpen={isSidebarOpen}
              isUserMenuOpen={isUserMenuOpen}
              setIsUserMenuOpen={setIsUserMenuOpen}
              onSignOut={onSignOut}
            />
          </div>
          <style jsx global>{`
          
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
          `}</style>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;