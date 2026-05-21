//src\app\labors\page.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from "next/navigation";
import { PlusCircle, HardHat, Menu } from 'lucide-react';
import Navbar from '../components/Navbar';
import { LaborSidebar } from './components/LaborSidebar';


// Main Page Component
export default function LaborsPage() {
  const [labors, setLabors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [laborsRes, projectsRes] = await Promise.all([
          fetch('/api/labors'),
          fetch('/api/projects')
        ]);
        const laborsData = await laborsRes.json();
        const projectsData = await projectsRes.json();

        console.log('Fetched labors:', laborsData.length);
        setLabors(laborsData);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Handle labor selection - navigate to employee details page
  const handleLaborClick = (labor) => {
    router.push(`/employee-details/${labor.CM_Labor_Type_ID}`);
    setIsSidebarOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-row h-screen bg-white">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full items-center justify-center">
          <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mt-70">
              <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping"></div>
              <div className="absolute inset-0 border-2 border-blue-300/30 rounded-full animate-spin">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <div className="absolute inset-2 border-2 border-green-300/30 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-white overflow-hidden">
      <Navbar />

      {/* Labor Sidebar */}
      <LaborSidebar
        labors={labors}
        selectedLabor={null} // No selection in main page
        onLaborClick={handleLaborClick}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        logs={[]} // Empty logs for main page
        calculateDailyWage={() => '0.00'} // Dummy function for main page
      />
    </div>
  );
}
