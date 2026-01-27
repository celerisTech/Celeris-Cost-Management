'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Navbar from "@/app/components/Navbar";
import SummaryCards from './components/SummaryCards';
import TabNavigation from './components/TabNavigation';
import ProjectsTab from './components/ProjectsTab';
import ProjectChargesTab from './components/ProjectChargesTab';
import NewProjectTab from './components/NewProjectTab';
import ProjectViewTab from './components/ProjectViewTab/ProjectViewTab';
import ProductsAllocationTab from './components/ProductsAllocationTab';
import ProjectPayments from './components/ProjectPayments'; // Add this import

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);

  // Updated form state with correct field names
  const [form, setForm] = useState({
    CM_Project_ID: '',
    CM_Project_Code: '',
    CM_Company_ID: '',
    CM_Project_Name: '',
    CM_Description: '',
    CM_Project_Location: '',
    CM_Project_Customer: '',
    CM_Project_Customer_Phone: '',
    CM_Alternative_Phone: '',
    CM_Customer_Address: '',
    CM_Estimated_Cost: '',
    CM_Actual_Cost: '',
    CM_Status: '',
    CM_Project_Status: '',
    CM_Planned_Start_Date: '',
    CM_Plenned_End_Date: '',
    CM_Actual_Start_Date: '',
    CM_Actual_End_Date: '',
    CM_Payment_Terms: '',
    CM_Project_Leader_ID: '',
    CM_Created_By: '',
    CM_Uploaded_By: '',
    CM_Longitude: null,
    CM_Radius_Meters: 150,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Starting project fetch request...');

      const res = await fetch('/api/projects', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        let errorMessage = `Failed to fetch projects. Status: ${res.status} ${res.statusText}`;
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage}. Details: ${errorData.error}`;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (Array.isArray(data) && data.length === 0) {
        console.warn('API returned an empty array of projects');
      }

      if (!Array.isArray(data)) {
        console.warn('API did not return an array. Received:', typeof data, data);
      }

      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Project fetch error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Could not connect to the API. Please check your connection.');
      } else {
        setError(err.message || 'An unknown error occurred while fetching projects');
      }

      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Enhanced summary data calculation with proper field names
  const summaryData = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        inProgressProjects: 0,
        plannedProjects: 0,
        onHoldProjects: 0,
        cancelledProjects: 0,
        totalBudget: 0,
        totalActualCost: 0,
        budgetVariance: 0
      };
    }

    const totalProjects = projects.length;

    // Count by CM_Status
    const activeProjects = projects.filter(p =>
      p.CM_Status === 'Active' || p.CM_Status === 'active'
    ).length;

    // Count by CM_Project_Status
    const completedProjects = projects.filter(p =>
      p.CM_Project_Status === 'Completed' || p.CM_Status === 'Completed'
    ).length;

    const inProgressProjects = projects.filter(p =>
      p.CM_Project_Status === 'In Progress'
    ).length;

    const plannedProjects = projects.filter(p =>
      p.CM_Project_Status === 'Planning'
    ).length;

    const onHoldProjects = projects.filter(p =>
      p.CM_Project_Status === 'On Hold'
    ).length;

    const cancelledProjects = projects.filter(p =>
      p.CM_Project_Status === 'Cancelled'
    ).length;

    // Calculate financial data using correct field names
    const totalBudget = projects.reduce((sum, project) => {
      return sum + (parseFloat(project.CM_Estimated_Cost) || 0);
    }, 0);

    const totalActualCost = projects.reduce((sum, project) => {
      return sum + (parseFloat(project.CM_Actual_Cost) || 0);
    }, 0);

    const budgetVariance = totalActualCost - totalBudget;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      inProgressProjects,
      plannedProjects,
      onHoldProjects,
      cancelledProjects,
      totalBudget,
      totalActualCost,
      budgetVariance
    };
  }, [projects]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      CM_Project_ID: '',
      CM_Project_Code: '',
      CM_Company_ID: '',
      CM_Project_Name: '',
      CM_Description: '',
      CM_Project_Location: '',
      CM_Project_Customer: '',
      CM_Project_Customer_Phone: '',
      CM_Alternative_Phone: '',
      CM_Customer_Address: '',
      CM_Estimated_Cost: '',
      CM_Actual_Cost: '',
      CM_Status: '',
      CM_Project_Status: '',
      CM_Planned_Start_Date: '',
      CM_Plenned_End_Date: '',
      CM_Actual_Start_Date: '',
      CM_Actual_End_Date: '',
      CM_Payment_Terms: '',
      CM_Project_Leader_ID: '',
      CM_Created_By: '',
      CM_Uploaded_By: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!form.CM_Project_Name || !form.CM_Company_ID || !form.CM_Project_Leader_ID) {
      setError('Project Name, Company ID, and Project Leader ID are required.');
      return;
    }

    try {
      if (isEditMode) {
        const response = await axios.post('/api/projects?_method=PUT', form);
        console.log('Update response:', response.data);
      } else {
        const response = await axios.post('/api/projects', form);
        console.log('Create response:', response.data);
      }

      resetForm();
      fetchProjects();
      setIsEditMode(false);
      setActiveTab('projects');

    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err?.response?.data?.error ||
        err?.response?.data?.details ||
        err.message ||
        'An error occurred';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleEdit = (project) => {
    console.log('Editing project:', project);

    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        return dateString.split('T')[0];
      } catch {
        return '';
      }
    };

    setForm({
      CM_Project_ID: project.CM_Project_ID || '',
      CM_Project_Code: project.CM_Project_Code || '',
      CM_Company_ID: project.CM_Company_ID || '',
      CM_Project_Name: project.CM_Project_Name || '',
      CM_Description: project.CM_Description || '',
      CM_Project_Location: project.CM_Project_Location || '',
      CM_Project_Customer: project.CM_Project_Customer || '',
      CM_Project_Customer_Phone: project.CM_Project_Customer_Phone || '',
      CM_Alternative_Phone: project.CM_Alternative_Phone || '',
      CM_Latitude: project.CM_Latitude || null,
      CM_Longitude: project.CM_Longitude || null,
      CM_Radius_Meters: project.CM_Radius_Meters || 200,
      CM_Customer_Address: project.CM_Customer_Address || '',
      CM_Estimated_Cost: project.CM_Estimated_Cost || '',
      CM_Actual_Cost: project.CM_Actual_Cost || '',
      CM_Status: project.CM_Status || '',
      CM_Project_Status: project.CM_Project_Status || '',
      CM_Planned_Start_Date: formatDateForInput(project.CM_Planned_Start_Date),
      CM_Plenned_End_Date: formatDateForInput(project.CM_Plenned_End_Date),
      CM_Actual_Start_Date: formatDateForInput(project.CM_Actual_Start_Date),
      CM_Actual_End_Date: formatDateForInput(project.CM_Actual_End_Date),
      CM_Payment_Terms: project.CM_Payment_Terms || '',
      CM_Project_Leader_ID: project.CM_Project_Leader_ID || '',
      CM_Created_By: project.CM_Created_By || '',
      CM_Uploaded_By: project.CM_Uploaded_By || ''
    });

    setIsEditMode(true);
    setActiveTab('view');
    window.scrollTo(0, 0);
  };

  const handleView = (project) => {
    setSelectedProject(project);
    setActiveTab('view');
  };

  const handleProductAllocation = (project) => {
    setSelectedProject(project);
    setActiveTab('products');
  };

  // ✅ Updated handlePayment function
  const handlePayment = (project) => {
    setSelectedProject(project);
    setActiveTab('payments');
  };
  // ✅ Updated handlePayment function
  const handleServices = (project) => {
    setSelectedProject(project);
    setActiveTab('services');
  };

  // ✅ Expense tracker handler
  const handleExpenseTracker = (project) => {
    const url = `/expense-tracker?projectId=${encodeURIComponent(project.CM_Project_ID)}&projectName=${encodeURIComponent(project.CM_Project_Name)}&projectCode=${encodeURIComponent(project.CM_Project_Code || '')}&mode=project-specific`;
    window.location.href = url;
  };

  // ✅ Close expense tracker

  const handleCancel = () => {
    resetForm();
    setIsEditMode(false);
    setSelectedProject(null);
    setActiveTab('projects');
  };

  return (
    <div className="flex h-screen">
      <Navbar />
      <div className="min-h-screen flex-1 overflow-y-auto p-4">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SummaryCards data={summaryData} />

          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedProject={selectedProject}
            isEditMode={isEditMode}
            setSelectedProject={setSelectedProject}
          />

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'projects' && (
              <ProjectsTab
                projects={projects}
                isLoading={isLoading}
                error={error}
                handleView={handleView}
                handleEdit={handleEdit}
                handlePayment={handlePayment} // Pass the function
                handleServices={handleServices}
                handleProductAllocation={handleProductAllocation}
                handleExpenseTracker={handleExpenseTracker}
                status={projects.CM_Status}
              />
            )}

            {activeTab === 'new' && (
              <NewProjectTab
                form={form}
                setForm={setForm}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                isEditMode={isEditMode}
                error={error}
                initialProjectId={form.CM_Project_ID || null}
                refreshProjects={fetchProjects}
              />
            )}

            {activeTab === 'view' && selectedProject && (
              <ProjectViewTab
                selectedProject={selectedProject}
                handleEdit={handleEdit}
                setActiveTab={setActiveTab}
                handleProductAllocation={handleProductAllocation}
              />
            )}

            {activeTab === 'products' && selectedProject && (
              <ProductsAllocationTab
                projectId={selectedProject.CM_Project_ID}
                projectName={selectedProject.CM_Project_Name}
                project={selectedProject}
                status={selectedProject.CM_Status}
              />
            )}

            {/* ✅ Add ProjectPayments tab */}
            {activeTab === 'payments' && selectedProject && (
              <ProjectPayments
                project={selectedProject}
                onBack={() => setActiveTab('projects')}
              />
            )}

            {/* ✅ Add ProjectPayments tab */}
            {activeTab === 'services' && selectedProject && (
              <ProjectChargesTab
                project={selectedProject}
                onBack={() => setActiveTab('projects')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}