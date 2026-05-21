'use client';
import { useState, useEffect } from 'react';
import StockDisplay from './components/StockDisplay';
import StockHistory from './components/StockHistory';
import QuickTransfer from './components/QuickTransfer';
import Navbar from '../components/Navbar';

// Tab configuration
const TABS = {
  overview: {
    id: 'overview',
    label: 'Stock Overview',
    icon: '📊',
    description: 'View current stock levels and locations'
  },
  transfer: {
    id: 'transfer',
    label: 'Quick Transfer',
    icon: '🔄',
    description: 'Transfer stock between godowns quickly'
  },
  history: {
    id: 'history',
    label: 'Transaction History',
    icon: '📋',
    description: 'View all transaction records'
  }
};

// Loading component
const PageLoader = () => (
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

// Tab button component
const TabButton = ({ tab, isActive, onClick, disabled = false }) => (
  <button
    onClick={() => onClick(tab.id)}
    disabled={disabled}
    className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${isActive
      ? 'bg-blue-600 text-white shadow-md transform scale-105'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
      }`}
    title={tab.description}
  >
    <div className="flex flex-col items-center space-y-1">
      <span className="text-base sm:text-lg">{tab.icon}</span>
      <span className="hidden xs:block text-xs sm:text-sm">{tab.label}</span>
      <span className="xs:hidden text-xs">{tab.label.split(' ')[0]}</span>
    </div>
  </button>
);

// Breadcrumb component
const Breadcrumb = ({ activeTab }) => {
  const currentTab = TABS[activeTab];

  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 overflow-x-auto whitespace-nowrap pb-1">
      <span>Stock Management</span>
      <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="text-blue-600 font-medium">{currentTab.label}</span>
    </nav>
  );
};

const StockManagementPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle tab change with loading state
  const handleTabChange = async (tabId) => {
    if (activeTab === tabId) return;

    setIsLoading(true);
    setError('');

    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      setActiveTab(tabId);
    } catch (err) {
      setError('Failed to load tab content');
      console.error('Tab change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey) {
        const tabKeys = {
          '1': 'overview',
          '2': 'transfer',
          '3': 'transactions',
          '4': 'history'
        };

        if (tabKeys[event.key]) {
          event.preventDefault();
          handleTabChange(tabKeys[event.key]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get current tab info
  const currentTabInfo = TABS[activeTab];

  // Render tab content
  const renderTabContent = () => {
    if (isLoading) {
      return <PageLoader />;
    }

    // Error boundary for tab content
    try {
      switch (activeTab) {
        case 'overview':
          return <StockDisplay key="overview" />;
        case 'transfer':
          return <QuickTransfer key="transfer" />;
        case 'history':
          return <StockHistory key="history" />;
        default:
          return (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚧</div>
              <p className="text-base sm:text-lg">Tab content not found</p>
            </div>
          );
      }
    } catch (err) {
      console.error('Tab content error:', err);
      return (
        <div className="text-center py-8 sm:py-12 text-red-500 bg-white rounded-lg">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">❌</div>
          <p className="text-base sm:text-lg font-medium">Failed to load content</p>
          <p className="text-xs sm:text-sm mt-2">{err.message || 'Unknown error occurred'}</p>
          <button
            onClick={() => handleTabChange(activeTab)}
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col  h-screen md:flex-row bg-white">
      <Navbar />

      <div className="flex-1 p-2 sm:p-4  overflow-y-auto">
        <div className="container mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Stock Management System
                </h1>
              </div>
            </div>

            <Breadcrumb activeTab={activeTab} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 text-sm sm:text-base">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mb-4 sm:mb-8">
            <nav className="flex space-x-1 bg-white p-1.5 sm:p-2 rounded-lg shadow-md">
              {Object.values(TABS).map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={handleTabChange}
                  disabled={isLoading}
                />
              ))}
            </nav>

            {/* Tab Description */}
            <div className="mt-2 sm:mt-4 text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                {currentTabInfo.description}
              </p>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content bg-white rounded-lg shadow-sm p-3 sm:p-6">
            <div className="transition-all duration-300 ease-in-out">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagementPage;
