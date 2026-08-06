export default function TabNavigation({
  activeTab,
  setActiveTab,
  setSelectedProject,
  onNewTaskClick
}) {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab !== 'view' && tab !== 'products') {
      setSelectedProject(null);
    }
  };

  return (
    <div className="">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* Left Section */}
        <div className="flex items-center gap-3">

          {/* Projects Tab */}
          <button
            onClick={() => handleTabClick("projects")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === "projects"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            role="tab"
            aria-selected={activeTab === "projects"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M3 12h18M3 17h18"
              />
            </svg>

            All Projects
          </button>

          {/* New Project */}
          <button
            onClick={() => handleTabClick("new")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === "new"
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-blue-100 text-blue-700 hover:bg-blue-100"
              }`}
            role="tab"
            aria-selected={activeTab === "new"}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>

            New Project
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end">

          {/* Add Task Button */}
          <button
            onClick={onNewTaskClick}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-semibold shadow-md transition-all duration-200 hover:scale-105"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>

            New Task
          </button>
        </div>
      </div>
    </div>
  );

}
