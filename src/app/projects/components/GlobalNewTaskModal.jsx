import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function GlobalNewTaskModal({ isOpen, onClose, projects, onTaskCreated, authUser }) {
  const [newTask, setNewTask] = useState({
    CM_Project_ID: '',
    CM_Milestone_ID: '',
    CM_Task_Name: '',
    CM_Engineer_ID: '',
    CM_Assign_Date: '',
    CM_Due_Date: '',
    CM_Is_Active: 'Active'
  });

  const [engineers, setEngineers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loadingEngineers, setLoadingEngineers] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const filteredProjects = projects.filter(p => 
    p.CM_Project_Name?.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      fetchEngineers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (newTask.CM_Project_ID) {
      fetchMilestones(newTask.CM_Project_ID);
    } else {
      setMilestones([]);
      setNewTask(prev => ({ ...prev, CM_Milestone_ID: '' }));
    }
  }, [newTask.CM_Project_ID]);

  const fetchEngineers = async () => {
    setLoadingEngineers(true);
    try {
      const response = await fetch('/api/projects?type=engineers');
      if (response.ok) {
        const data = await response.json();
        setEngineers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching engineers:', err);
    } finally {
      setLoadingEngineers(false);
    }
  };

  const fetchMilestones = async (projectId) => {
    setLoadingMilestones(true);
    try {
      const response = await fetch(`/api/milestones?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "CM_Milestone_ID" && value) {
      const selectedMilestone = milestones.find(m => m.CM_Milestone_ID === value);
      
      const toDateInputValue = (val) => {
          if (!val) return '';
          try {
              const date = new Date(val);
              if (isNaN(date.getTime())) return '';
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
          } catch {
              return '';
          }
      };

      if (selectedMilestone) {
        setNewTask(prev => ({
          ...prev,
          [name]: value,
          CM_Assign_Date: selectedMilestone.CM_Planned_Start_Date ? toDateInputValue(selectedMilestone.CM_Planned_Start_Date) : prev.CM_Assign_Date,
          CM_Due_Date: selectedMilestone.CM_Planned_End_Date ? toDateInputValue(selectedMilestone.CM_Planned_End_Date) : prev.CM_Due_Date
        }));
        return;
      }
    }
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newTask.CM_Project_ID || !newTask.CM_Task_Name || !newTask.CM_Engineer_ID || !newTask.CM_Assign_Date || !newTask.CM_Due_Date) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedProject = projects.find(p => p.CM_Project_ID === newTask.CM_Project_ID);
      
      const formattedTask = {
        ...newTask,
        CM_Company_ID: selectedProject?.CM_Company_ID || authUser?.company?.CM_Company_ID || authUser?.CM_Company_ID,
        CM_Created_By: authUser?.CM_Full_Name || 'Unknown User',
        CM_Milestone_ID: newTask.CM_Milestone_ID || null
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedTask),
      });

      if (response.ok) {
        setNewTask({
          CM_Project_ID: '',
          CM_Milestone_ID: '',
          CM_Task_Name: '',
          CM_Engineer_ID: '',
          CM_Assign_Date: '',
          CM_Due_Date: '',
          CM_Is_Active: 'Active'
        });
        if (onTaskCreated) onTaskCreated();
        onClose();
      } else {
        const errData = await response.json();
        setError(errData.message || errData.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Task</h2>
            <p className="text-sm text-gray-500 mt-1">Create a new task across any project</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-4 text-gray-700">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Project *</label>
              
              <div 
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer flex justify-between items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              >
                <span className={newTask.CM_Project_ID ? 'text-gray-900' : 'text-gray-500'}>
                  {newTask.CM_Project_ID 
                    ? projects.find(p => p.CM_Project_ID === newTask.CM_Project_ID)?.CM_Project_Name 
                    : '-- Choose Project --'}
                </span>
                <span className="text-gray-400 text-xs">▼</span>
              </div>
              
              {isProjectDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto top-full">
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-200 z-10">
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Search project..."
                      value={projectSearchTerm}
                      onChange={(e) => setProjectSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map(p => (
                      <div 
                        key={p.CM_Project_ID}
                        className="p-2.5 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          handleChange({ target: { name: 'CM_Project_ID', value: p.CM_Project_ID } });
                          setIsProjectDropdownOpen(false);
                          setProjectSearchTerm('');
                        }}
                      >
                        {p.CM_Project_Name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2.5 text-sm text-gray-500 text-center">No projects found</div>
                  )}
                </div>
              )}
            </div>

            {newTask.CM_Project_ID && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Milestone (Optional)
                  {loadingMilestones && <span className="ml-2 text-blue-500 text-xs">Loading...</span>}
                </label>
                <select
                  name="CM_Milestone_ID"
                  value={newTask.CM_Milestone_ID}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loadingMilestones}
                >
                  <option value="">-- No Milestone --</option>
                  {milestones.map(m => (
                    <option key={m.CM_Milestone_ID} value={m.CM_Milestone_ID}>
                      {m.CM_Milestone_Name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
              <textarea
                type="text"
                name="CM_Task_Name"
                rows={3}
                value={newTask.CM_Task_Name}
                onChange={handleChange}
                placeholder="Enter task name"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To (Engineer) *
                {loadingEngineers && <span className="ml-2 text-blue-500 text-xs">Loading...</span>}
              </label>
              <select
                name="CM_Engineer_ID"
                value={newTask.CM_Engineer_ID}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                disabled={loadingEngineers}
              >
                <option value="">-- Choose Engineer --</option>
                {engineers.map(e => (
                  <option key={e.CM_User_ID} value={e.CM_User_ID}>
                    {e.CM_Full_Name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Date *</label>
                <input
                  type="date"
                  name="CM_Assign_Date"
                  value={newTask.CM_Assign_Date}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  name="CM_Due_Date"
                  value={newTask.CM_Due_Date}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full mr-2"></span>
                  Creating...
                </>
              ) : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
