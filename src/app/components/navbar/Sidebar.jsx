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
      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20'
      : 'bg-transparent'
      }`} />
  );

  // Glow effect for active items
  const ActiveGlow = () => (
    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-lg blur-sm scale-105" />
  );



  // Icon component that handles active and hover states internally
  const NavIcon = ({ label, isActive, isHovered }) => {
    const Icon = iconMap[label] || HelpCircle;

    return (
      <div className="relative">
        <Icon
          className={`h-5 w-5 transition-all duration-300 ${isActive
            ? 'text-white scale-110'
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
              className="hidden md:inline-flex text-gray-600 hover:text-gray-900 focus:outline-none transition-all duration-300 hover:scale-110"
            >
              {isSidebarOpen ? (
                <ChevronDown className="h-5 w-5 transform rotate-90 transition-transform duration-300" />
              ) : (
                <ChevronDown className="h-5 w-5 transform -rotate-90 transition-transform duration-300" />
              )}
            </button>
          </div>

          {/* Dynamic Nav Sections */}
          <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8 relative z-10">
            {navLinks && Object.keys(navLinks).length > 0 ? (
              Object.entries(navLinks).map(([section, links]) => (
                <div key={section} className="relative">
                  {isSidebarOpen && (
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider flex items-center">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text font-bold text-transparent">
                        {section}
                      </span>
                      <div className="ml-2 w-7 h-0.5 bg-gradient-to-r from-yellow-500 to-transparent flex-1"></div>
                    </h2>
                  )}
                  <ul className="space-y-2">
                    {links.map((link) => {
                      const isActive = pathname === link.href;
                      const isHovered = hoveredLink === link.href;

                      return (
                        <li key={link.href} className="relative">
                          {/* Active item glow */}
                          {isActive && <ActiveGlow />}

                          <Link
                            href={link.href}
                            className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-500 relative overflow-hidden group ${isActive
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                              : "text-gray-700 hover:bg-white/80 hover:shadow-md border border-transparent hover:border-gray-200/50"
                              }`}
                            onMouseEnter={() => setHoveredLink(link.href)}
                            onMouseLeave={() => setHoveredLink(null)}
                          >
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
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #ffffffff;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #ffffffff;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #ffffffff;
        }
          `}</style>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;