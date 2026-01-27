"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthScreenStore";
import StatsCards from "./components/StatsCards";
import ProjectProgressDashboard from "./components/ProjectProgressDashboard";
import ProjectCostReport from "./components/BudgetVsExpenses";
import PurchaseMaterialReport from "./components/PurchaseMaterialReport";
import RotatingText from "./components/RotatingText";
import TaskOverviewModal from "./components/TaskOverviewModal";
import { ClipboardList } from "lucide-react";

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState("projects"); // 👈 new state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const userName = user?.name || user?.CM_Full_Name || "";

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-5 space-y-4 max-w-full bg-white overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:flex-1 min-w-0">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-7 bg-gray-200 rounded w-48 sm:w-64 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-32 sm:w-40"></div>
            </div>
          ) : (
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold flex flex-wrap items-center gap-2 leading-tight">
              <span className="text-gray-800">Welcome</span>

              <span className="text-yellow-600 
                px-2 py-1 
                sm:px-3 sm:py-1.5 
                md:px-4 md:py-2 
                rounded-4xl 
                inline-flex items-center
              ">
                <RotatingText
                  texts={[userName || "User", "Have a Great Day"]}
                  rotationInterval={4000}
                  splitBy="characters"
                  staggerDuration={0.03}
                  elementLevelClassName="text-yellow-600"
                  mainClassName="inline-flex"
                />
              </span>
            </h1>

          )}
        </div>
        {!isLoading && (
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="
              group flex items-center gap-2
              px-4 py-2.5
              bg-blue-600 hover:bg-blue-700
              text-white text-sm font-medium
              rounded-lg
              shadow-sm hover:shadow-md
              transition-all duration-200
              active:scale-[0.98]"
            >
              <ClipboardList
                size={18}
                className="transition-transform group-hover:translate-x-0.5"
              />
              <span className="hidden sm:inline">Today’s Tasks</span>
              <span className="sm:hidden">Tasks</span>
            </button>

            {user?.photo && (
              <div className="flex-shrink-0">
                <img
                  src={user.photo}
                  alt="Profile"
                  className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                />
              </div>
            )}
          </div>
        )}
        {!isLoading && user?.photo && (
          <div className="flex-shrink-0">
            <img
              src={user.photo}
              alt="Profile"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full object-cover border-2 border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="w-full -mx-3 sm:mx-0 px-3 sm:px-0 overflow-hidden">
        <StatsCards />
      </div>

      {/* --- Tabs Section --- */}
      <div className="p-2 sm:p-3 flex justify-center items-center space-x-3 sm:space-x-6 transition-all duration-300">
        <button
          onClick={() => setActiveTab("projects")}
          className={`group relative flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base font-medium rounded-xl transition-all duration-300 ${activeTab === "projects"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7h18M3 12h18m-9 5h9"
            />
          </svg>
          <span>Projects</span>
          {activeTab === "projects" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full translate-y-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`group relative flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base font-medium rounded-xl transition-all duration-300 ${activeTab === "reports"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17v-2a4 4 0 014-4h8m-6-4h6m-6 0a2 2 0 110-4 2 2 0 010 4zm-2 8v-2a4 4 0 014-4h4"
            />
          </svg>
          <span> Cost Overview</span>
          {activeTab === "reports" && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full translate-y-1" />
          )}
        </button>
      </div>

      {/* --- Tab Content --- */}
      <div className="grid grid-cols-1 gap-4 mt-4 ">
        {activeTab === "projects" ? (
          <>
            <div className="p-3 sm:p-4 rounded-lg ">
              <ProjectProgressDashboard />
            </div>

          </>
        ) : (
          <div className="p-3 sm:p-4 rounded-lg shadow-sm">
            <ProjectCostReport />
          </div>
          // <div className="p-3 sm:p-4 rounded-lg shadow-sm">
          //   <PurchaseMaterialReport />
          // </div>
        )}
      </div>
      <TaskOverviewModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}