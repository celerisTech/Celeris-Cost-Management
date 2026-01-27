"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Clock } from "lucide-react";

export default function ProjectProgressDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/progress");
        if (!res.ok) throw new Error("Failed to fetch project data");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setTimeout(() => setLoaded(true), 100);
      }
    };
    fetchData();
  }, []);

  const getProgress = (p) =>
    p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;

  const getStatus = (p) => {
    const today = new Date();
    const end = new Date(p.endDate);
    const progress = getProgress(p);
    const daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    const expectedProgress = calculateExpectedProgress(p.startDate, p.endDate);

    if (progress === 100) return "Completed";
    if (progress >= expectedProgress || daysRemaining > 7) return "On Track";
    if (daysRemaining < 0) return "Delayed";
    return "At Risk";
  };

  const calculateExpectedProgress = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (today <= start) return 0;
    if (today >= end) return 100;

    const totalDuration = end - start;
    const elapsedDuration = today - start;
    return Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "from-emerald-400 to-green-600";
      case "On Track":
        return "from-blue-400 to-indigo-600";
      case "At Risk":
        return "from-amber-400 to-orange-500";
      case "Delayed":
        return "from-rose-400 to-red-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getProgressGradient = (progress) => {
    if (progress >= 90) return "from-emerald-400 to-green-600";
    if (progress >= 70) return "from-blue-400 to-indigo-600";
    if (progress >= 50) return "from-amber-400 to-orange-500";
    return "from-rose-400 to-red-600";
  };

  const getRingColor = (progress) => {
    if (progress >= 90) return "ring-emerald-200";
    if (progress >= 70) return "ring-blue-200";
    if (progress >= 50) return "ring-amber-200";
    return "ring-rose-200";
  };

  const handleProjectClick = (projectId) => {
    router.push(`/projectlinking/${projectId}`);
  };

  // Filter projects based on showCompleted state
  const filteredProjects = showCompleted
    ? projects.filter(p => getStatus(p) === "Completed")
    : projects.filter(p => getStatus(p) !== "Completed");

  const completedCount = projects.filter(p => getStatus(p) === "Completed").length;
  const activeCount = projects.length - completedCount;

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
          {/* Sun */}
          <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
          {/* Orbit 1 */}
          <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          {/* Orbit 2 */}
          <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );

  if (error) {
    return (
      <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm border border-slate-200">
        <div className="rounded-xl sm:rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/50 p-4 sm:p-6 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm sm:text-md font-bold text-rose-800 mb-2">Error Loading Projects</h3>
          <p className="text-rose-600 text-xs sm:text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 sm:p-6 shadow-sm">
      {/* Header with Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Project Progress</h2>
          <div className="inline-flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-medium text-slate-700">
              {showCompleted ? completedCount : activeCount} {showCompleted ? 'Completed' : 'Active'} Project{filteredProjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Toggle Switch - Minimalist Version */}
<div className="flex flex-col items-center sm:items-end gap-2">
  <div className="flex items-center gap-3">
    {/* Active Label */}
    <span className={`text-sm font-medium transition-colors duration-300 ${!showCompleted ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
      Active
    </span>
    
    {/* Toggle Switch */}
    <button
      onClick={() => setShowCompleted(!showCompleted)}
      className="relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      style={{
        backgroundColor: showCompleted ? '#dcfce7' : '#dbeafe',
      }}
      aria-label={showCompleted ? "Show active projects" : "Show completed projects"}
    >
      <span
        className={`inline-flex items-center justify-center h-5 w-5 transform rounded-full shadow-sm transition-all duration-300 ${showCompleted ? 'translate-x-6 bg-emerald-500' : 'translate-x-1 bg-blue-500'
          }`}
      >
        {showCompleted ? (
          <CheckCircle className="w-3 h-3 text-white" />
        ) : (
          <Clock className="w-3 h-3 text-white" />
        )}
      </span>
    </button>
    
    {/* Completed Label */}
    <span className={`text-sm font-medium transition-colors duration-300 ${showCompleted ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
      Completed
    </span>
  </div>
  
  {/* Status Indicator */}
  <div className="flex items-center gap-2">
    {showCompleted ? (
      <>
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span className="text-xs text-slate-600">Showing completed projects</span>
      </>
    ) : (
      <>
        <Clock className="w-4 h-4 text-blue-500" />
        <span className="text-xs text-slate-600">Showing active projects</span>
      </>
    )}
  </div>
</div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl sm:rounded-2xl rotate-45 mx-auto mb-4 flex items-center justify-center">
            {showCompleted ? (
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 -rotate-45" />
            ) : (
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 -rotate-45" />
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-1">
            {showCompleted ? "No Completed Projects" : "No Active Projects"}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            {showCompleted
              ? "All projects are currently in progress"
              : "All projects have been completed"
            }
          </p>
        </div>
      ) : (
        <>
          {/* Hexagon Grid */}
          <div className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 relative">
            {filteredProjects.map((p, index) => {
              const progress = getProgress(p);
              const status = getStatus(p);
              const isHovered = hoveredProject === p.projectId;

              return (
                <div
                  key={p.projectId}
                  className="relative group cursor-pointer"
                  onPointerEnter={() => {
                    if (!isMobile) setHoveredProject(p.projectId);
                  }}
                  onPointerLeave={() => {
                    if (!isMobile) setHoveredProject(null);
                  }}
                  onClick={() => handleProjectClick(p.projectId)}
                >
                  {/* Hexagon Container */}
                  <div className={`
                    relative w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 transition-all duration-500 ease-out
                    ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                    ${isHovered && !isMobile ? 'scale-110 z-10' : 'scale-100'}
                  `} style={{ transitionDelay: `${index * 100}ms` }}>

                    {/* Hexagon Shape */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${getStatusColor(status)} 
                      rounded-lg sm:rounded-xl rotate-45 shadow-lg transition-all duration-500
                      ${isHovered ? 'shadow-xl brightness-110' : 'shadow-md'}
                    `}>
                      {/* Completed badge */}
                      {status === "Completed" && (
                        <div className="absolute -top-1 -right-1 z-10 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}

                      {/* Progress Ring */}
                      <div className={`
                        absolute inset-2 sm:inset-3 rounded-lg sm:rounded-xl border-2 sm:border-3 border-white/20 
                        ${getRingColor(progress)} transition-all duration-500
                        ${isHovered ? 'scale-105' : 'scale-100'}
                      `}></div>

                      {/* Content */}
                      <div className="absolute inset-0 -rotate-45 flex flex-col items-center justify-center p-2 sm:p-4 text-white">
                        {/* Progress Circle */}
                        <div className="relative mb-1 sm:mb-2">
                          <svg className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={`${progress}, 100`}
                              className="text-white/90"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] xs:text-[10px] sm:text-xs font-bold">
                            {progress}%
                          </span>
                        </div>

                        <h3 className="font-bold text-center text-[8px] xs:text-[9px] sm:text-xs leading-tight mb-0.5 sm:mb-1 line-clamp-2">
                          {p.name}
                        </h3>
                        <span className={`text-[7px] xs:text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm font-medium`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Card - Only show on non-mobile */}
                  {!isMobile && (
                    <div className={`
                      absolute top-full left-1/2 transform -translate-x-1/2 mt-4
                      w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200
                      transition-all duration-300 z-20
                      ${isHovered ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-3 invisible'}
                    `}>
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-medium bg-gradient-to-r ${getStatusColor(status)} text-white`}>
                            {status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressGradient(progress)} transition-all duration-1000`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="text-center p-2 bg-slate-50 rounded-md">
                            <div className="text-lg font-bold text-slate-800">{p.completedTasks}</div>
                            <div className="text-[10px] text-slate-600">Completed</div>
                          </div>
                          <div className="text-center p-2 bg-slate-50 rounded-md">
                            <div className="text-lg font-bold text-slate-800">{p.totalTasks}</div>
                            <div className="text-[10px] text-slate-600">Total Tasks</div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="text-[10px] text-slate-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Start Date:</span>
                            <span className="font-medium">{new Date(p.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>End Date:</span>
                            <span className="font-medium">{new Date(p.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile project details - Shows when tapped on mobile */}
          {isMobile && hoveredProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => {
              if (e.target === e.currentTarget) setHoveredProject(null);
            }}>
              <div className="w-full max-w-xs bg-white rounded-xl shadow-2xl p-4 m-auto">
                {(() => {
                  const project = projects.find(p => p.projectId === hoveredProject);
                  if (!project) return null;

                  const progress = getProgress(project);
                  const status = getStatus(project);

                  return (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-800">{project.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium bg-gradient-to-r ${getStatusColor(status)} text-white`}>
                          {status}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getProgressGradient(progress)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center p-2 bg-slate-50 rounded-md">
                          <div className="text-lg font-bold text-slate-800">{project.completedTasks}</div>
                          <div className="text-xs text-slate-600">Completed</div>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-md">
                          <div className="text-lg font-bold text-slate-800">{project.totalTasks}</div>
                          <div className="text-xs text-slate-600">Total Tasks</div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-2">
                        <div className="flex justify-between">
                          <span>Start Date:</span>
                          <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>End Date:</span>
                          <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        className="mt-4 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                        onClick={() => {
                          if (isMobile) {
                            setHoveredProject(p.projectId); // open modal
                          } else {
                            handleProjectClick(p.projectId);
                          }
                        }}
                      >
                        View Project Details
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}