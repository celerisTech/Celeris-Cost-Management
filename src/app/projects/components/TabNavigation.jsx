export default function TabNavigation({
  activeTab,
  setActiveTab,
  setSelectedProject
}) {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab !== 'view' && tab !== 'products') {
      setSelectedProject(null);
    }
  };

  return (
  <div className="border-b border-gray-200 mb-8">
    <nav className="-mb-px flex justify-between items-center" role="tablist">
      
      {/* Left: All Projects */}
      <button
        onClick={() => handleTabClick('projects')}
        className={`whitespace-nowrap py-4 px-1 border-b-2 rounded-xl font-medium text-sm  transition-colors duration-200 ${
          activeTab === 'projects' 
            ? 'border-blue-600 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
        role="tab"
        aria-selected={activeTab === 'projects'}
      >
        <span className="flex items-center font-bold">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          All Projects
        </span>
      </button>

      {/* Right: New Project */}
      <button
        onClick={() => handleTabClick('new')}
        className={`whitespace-nowrap py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
          activeTab === 'new'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        }`}
        role="tab"
        aria-selected={activeTab === 'new'}
      >
        <span className="flex items-center">
          <svg
            className="w-4 h-4 mr-2"
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
        </span>
      </button>
    </nav>
  </div>
);

}
