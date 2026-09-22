"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  User,
  Check,
  CheckCheck,
  Image as ImageIcon,
  ChevronLeft,
  Phone,
  Mail,
  Shield,
  Circle,
  RefreshCw,
  X,
  Download,
  Pencil,
  Trash2
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/useAuthScreenStore";
import { useRouter } from "next/navigation";
import { useEmployeeSocket } from "../hooks/useEmployeeSocket";

export default function EmployeeChatPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageDate, setMessageDate] = useState("");
  const [isGlobalCustomDateEnabled, setIsGlobalCustomDateEnabled] = useState(false);
  const [isGlobalChatEditEnabled, setIsGlobalChatEditEnabled] = useState(false);
  const [isGlobalChatDeleteEnabled, setIsGlobalChatDeleteEnabled] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Mobile layout state
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [typingUsers, setTypingUsers] = useState({});

  const handleIncomingTyping = React.useCallback((senderId, isTyping) => {
    setTypingUsers(prev => ({
      ...prev,
      [senderId]: isTyping
    }));
  }, []);

  const currentUserId = user?.CM_User_ID || user?.id || user?.user_id;
  const isOwner = user?.CM_Role_Description === "Owner" || user?.CM_Role_ID === "ROL000001";

  // Real-time WebSocket connection for online status & live chat delivery
  const handleIncomingRealTimeMessage = (msg) => {
    if (selectedEmployee && (String(msg.senderId) === String(selectedEmployee.CM_User_ID) || String(msg.receiverId) === String(selectedEmployee.CM_User_ID))) {
      fetchMessages(selectedEmployee.CM_User_ID, true);
    }
    fetchEmployees();
  };

  const { isUserOnline, getLastSeen, sendRealTimeMessage, sendTypingStatus, isConnected } = useEmployeeSocket(
    currentUserId,
    handleIncomingRealTimeMessage,
    handleIncomingTyping
  );

  const formatLastSeenStatus = (emp) => {
    if (!emp) return "";
    if (isUserOnline(emp.CM_User_ID)) return "Online";

    const socketTs = getLastSeen(emp.CM_User_ID);
    const ts = socketTs || emp.CM_Last_Seen;
    if (!ts) return "Offline";

    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Last seen just now";
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;

    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `Last seen today at ${timeStr}`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Last seen yesterday at ${timeStr}`;
    }

    return `Last seen ${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} at ${timeStr}`;
  };

  // 1. Fetch employee list
  const fetchEmployees = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/chat?userId=${currentUserId}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(fetchEmployees, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, searchQuery]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(data);
        } else if (data.success && data.projects) {
          setProjects(data.projects);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [dateRes, editRes, deleteRes] = await Promise.all([
          fetch("/api/settings?key=custom_work_date_enabled"),
          fetch("/api/settings?key=chat_edit_enabled"),
          fetch("/api/settings?key=chat_delete_enabled")
        ]);
        
        const dateData = await dateRes.json();
        const editData = await editRes.json();
        const deleteData = await deleteRes.json();
        
        if (dateData.success && dateData.value !== undefined) setIsGlobalCustomDateEnabled(dateData.value === "true");
        if (editData.success && editData.value !== undefined) setIsGlobalChatEditEnabled(editData.value === "true");
        if (deleteData.success && deleteData.value !== undefined) setIsGlobalChatDeleteEnabled(deleteData.value === "true");
      } catch (err) {
        console.warn("Failed to fetch settings:", err);
      }
    };
    fetchSettings();

    const handleCustomWorkDateChanged = (e) => {
      setIsGlobalCustomDateEnabled(e.detail);
      if (!e.detail) {
        setMessageDate("");
      }
    };
    
    const handleChatEditEnabledChanged = (e) => setIsGlobalChatEditEnabled(e.detail);
    const handleChatDeleteEnabledChanged = (e) => setIsGlobalChatDeleteEnabled(e.detail);

    window.addEventListener('customWorkDateChanged', handleCustomWorkDateChanged);
    window.addEventListener('chatEditEnabledChanged', handleChatEditEnabledChanged);
    window.addEventListener('chatDeleteEnabledChanged', handleChatDeleteEnabledChanged);

    const settingsInterval = setInterval(fetchSettings, 5000);

    return () => {
      window.removeEventListener('customWorkDateChanged', handleCustomWorkDateChanged);
      window.removeEventListener('chatEditEnabledChanged', handleChatEditEnabledChanged);
      window.removeEventListener('chatDeleteEnabledChanged', handleChatDeleteEnabledChanged);
      clearInterval(settingsInterval);
    };
  }, []);

  useEffect(() => {
    const fetchCurrentProject = async () => {
      if (!currentUserId) return;
      try {
        const res = await fetch(`/api/users/current-project?userId=${currentUserId}`);
        const data = await res.json();
        if (data.success) {
          setCurrentProjectId(data.projectId);
        }
      } catch (err) {
        // silent
      }
    };
    fetchCurrentProject();
  }, [currentUserId]);

  const handleProjectSelect = async (e) => {
    const projectId = e.target.value;
    await updateActiveProject(projectId);
  };

  const updateActiveProject = async (projectId) => {
    if (!currentUserId) return;
    
    setIsUpdatingProject(true);
    setCurrentProjectId(projectId);
    
    try {
      await fetch("/api/users/current-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, projectId })
      });
      fetchEmployees();
    } catch (err) {
      console.error("Failed to update project", err);
    } finally {
      setIsUpdatingProject(false);
    }
  };

  // 2. Fetch messages for selected employee
  const fetchMessages = async (targetId, isSilent = false) => {
    if (!currentUserId || !targetId) return;
    try {
      if (!isSilent) setIsLoadingMessages(true);
      const res = await fetch(`/api/chat/messages?userId=${currentUserId}&targetId=${targetId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        fetchEmployees(); // Update unread counts
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      if (!isSilent) setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchMessages(selectedEmployee.CM_User_ID);
      const interval = setInterval(() => {
        fetchMessages(selectedEmployee.CM_User_ID, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedEmployee, currentUserId]);

  // Scroll to bottom only when a new message arrives or chat changes
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].CM_Chat_ID : null;
  const currentChatUserId = selectedEmployee?.CM_User_ID;
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId, currentChatUserId]);

  // File preview handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Send or Update Message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Immediately clear typing indicator
    if (sendTypingStatus && selectedEmployee) {
      sendTypingStatus(selectedEmployee.CM_User_ID, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    if ((!newMessage.trim() && !file) || !selectedEmployee || !currentUserId || isSending) return;

    try {
      setIsSending(true);

      if (editingMessageId) {
        // Handle Edit Message (PUT request)
        const res = await fetch("/api/chat", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: editingMessageId,
            senderId: currentUserId,
            message: newMessage.trim(),
            date: messageDate,
            projectId: currentProjectId
          })
        });
        if (res.ok) {
          const selectedProject = projects.find(p => String(p.CM_Project_ID) === String(currentProjectId));
          setMessages(messages.map(m => m.CM_Chat_ID === editingMessageId ? { 
            ...m, 
            CM_Message: newMessage.trim(),
            ...(messageDate ? { CM_Created_At: new Date(messageDate).toISOString() } : {}),
            CM_Project_ID: currentProjectId || null,
            CM_Project_Name: selectedProject ? selectedProject.CM_Project_Name : null
          } : m));
          setEditingMessageId(null);
          setNewMessage("");
          setMessageDate("");
        }
      } else {
        // Handle New Message (POST request)
        const formData = new FormData();
        formData.append("senderId", currentUserId);
        formData.append("receiverId", selectedEmployee.CM_User_ID);
        if (newMessage.trim()) formData.append("message", newMessage.trim());
        if (messageDate) formData.append("date", messageDate);
        if (file) formData.append("file", file);

        const res = await fetch("/api/chat", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          // Broadcast over WebSocket for 0ms delivery
          sendRealTimeMessage({
            senderId: currentUserId,
            receiverId: selectedEmployee.CM_User_ID,
            message: data.message,
          });

          setNewMessage("");
          removeFile();
          fetchMessages(selectedEmployee.CM_User_ID, true);
        }
      }
    } catch (err) {
      console.error("Failed to send/edit message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // We no longer need the inline handleSaveEdit as it's merged into handleSendMessage


  const handleDeleteMessage = (chatId) => {
    setMessageToDelete(chatId);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chat?chatId=${messageToDelete}&senderId=${currentUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchMessages(selectedEmployee.CM_User_ID, true);
        setMessageToDelete(null);
      } else {
        alert("Failed to delete message: " + data.error);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setShowMobileChat(true);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!selectedEmployee || editingMessageId) return;

    if (sendTypingStatus) {
      sendTypingStatus(selectedEmployee.CM_User_ID, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(selectedEmployee.CM_User_ID, false);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-slate-100 overflow-hidden font-sans">
      <Navbar />

      <div className="flex-1 h-screen overflow-y-auto p-2 sm:p-4 md:p-6 flex flex-col max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-1 overflow-hidden min-h-[550px] h-full">

          {/* ── LEFT PANEL: Employee Directory ── */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50 ${showMobileChat ? "hidden md:flex" : "flex"}`}>
            
            {/* Header & Search */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-slate-800">Employee Chat</h1>
                    <p className="text-[11px] text-slate-500">Internal team communications</p>
                  </div>
                </div>
                <button
                  onClick={fetchEmployees}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                  title="Refresh employees"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, role or phone..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {isLoadingEmployees ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                  <span>Loading employees...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No employees found matching "{searchQuery}"
                </div>
              ) : (
                employees.map((emp) => {
                  const isSelected = selectedEmployee?.CM_User_ID === emp.CM_User_ID;
                  return (
                    <button
                      key={emp.CM_User_ID}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 relative ${
                        isSelected
                          ? "bg-indigo-50 border border-indigo-200 shadow-xs"
                          : "hover:bg-slate-100 bg-white border border-slate-100"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {emp.CM_Photo_URL ? (
                          <img
                            src={emp.CM_Photo_URL}
                            alt={emp.CM_Full_Name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {emp.CM_Full_Name?.slice(0, 2) || "EM"}
                          </div>
                        )}
                        {/* Dynamic Online/Offline Badge */}
                        {isUserOnline(emp.CM_User_ID) ? (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-400/50 animate-pulse"
                            title="Online now"
                          />
                        ) : (
                          <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 border-2 border-white rounded-full"
                            title="Offline"
                          />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h3 className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                            {emp.CM_Full_Name}
                          </h3>
                          {emp.lastMessageDate && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatTime(emp.lastMessageDate)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 mb-1">
                          <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold border border-slate-200">
                            {emp.CM_Role_Description || "Staff"}
                          </span>
                          {emp.CM_Current_Project_Name && (
                            <span className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded text-[9px] font-semibold border border-blue-200 truncate max-w-[100px]" title={emp.CM_Current_Project_Name}>
                              {emp.CM_Current_Project_Name}
                            </span>
                          )}
                          <span className={`text-[9px] font-medium ${isUserOnline(emp.CM_User_ID) ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                            {typingUsers[emp.CM_User_ID] ? (
                              <span className="text-indigo-500 italic font-bold flex items-center gap-0.5">
                                Typing<span className="animate-pulse">...</span>
                              </span>
                            ) : (
                              formatLastSeenStatus(emp)
                            )}
                          </span>
                        </div>

                        {/* Last Message Snippet */}
                        {emp.lastMessage ? (
                          <p className={`text-[11px] truncate ${emp.unreadCount > 0 ? "font-semibold text-indigo-900" : "text-slate-500"}`}>
                            {emp.lastMessage}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No messages yet</p>
                        )}
                      </div>

                      {/* Unread badge */}
                      {emp.unreadCount > 0 && (
                        <span className="ml-1 shrink-0 px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full shadow-xs">
                          {emp.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Chat Conversation ── */}
          <div className={`flex-1 flex flex-col bg-slate-100/50 ${showMobileChat ? "flex" : "hidden md:flex"}`}>
            {selectedEmployee ? (
              <>
                {/* Active Employee Top Bar */}
                <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="relative">
                      {selectedEmployee.CM_Photo_URL ? (
                        <img
                          src={selectedEmployee.CM_Photo_URL}
                          alt={selectedEmployee.CM_Full_Name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {selectedEmployee.CM_Full_Name?.slice(0, 2) || "EM"}
                        </div>
                      )}
                      {isUserOnline(selectedEmployee.CM_User_ID) ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-400/50 animate-pulse" />
                      ) : (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        {selectedEmployee.CM_Full_Name}
                      </h2>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-indigo-600">{selectedEmployee.CM_Role_Description || "Staff"}</span>
                        {selectedEmployee.CM_Phone_Number && (
                          <span className="flex items-center gap-0.5"><Phone className="h-3 w-3 text-slate-400" /> {selectedEmployee.CM_Phone_Number}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {typingUsers[selectedEmployee.CM_User_ID] ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200 shadow-xs">
                        <span className="flex items-center gap-0.5 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                        Typing...
                      </span>
                    ) : isUserOnline(selectedEmployee.CM_User_ID) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-400" /> {formatLastSeenStatus(selectedEmployee)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
                  {isLoadingMessages ? (
                    <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                      <span>Loading conversation...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                      <div className="p-4 bg-indigo-50 text-indigo-500 rounded-full">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600">Start a conversation with {selectedEmployee.CM_Full_Name}</p>
                      <p className="text-[11px] text-slate-400">Messages sent here are secure and private.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.CM_Sender_ID === currentUserId;
                      const showDateHeader =
                        idx === 0 ||
                        formatDateLabel(msg.CM_Created_At) !== formatDateLabel(messages[idx - 1].CM_Created_At);

                      return (
                        <React.Fragment key={msg.CM_Chat_ID || idx}>
                          {showDateHeader && (
                            <div className="flex justify-center my-3">
                              <span className="px-3 py-0.5 bg-slate-200/80 text-slate-600 rounded-full text-[10px] font-bold shadow-xs">
                                {formatDateLabel(msg.CM_Created_At)}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs relative ${
                                isMe
                                  ? "bg-indigo-600 text-white rounded-br-xs"
                                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                              }`}
                            >
                              {/* Project Tag */}
                              {msg.CM_Project_Name && (
                                <div className={`mb-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isMe ? "bg-indigo-700 text-indigo-100" : "bg-indigo-50 text-indigo-600"}`}>
                                  {msg.CM_Project_Name}
                                </div>
                              )}

                              {/* Attached Image/File */}
                              {msg.CM_Image_URL && (
                                <div className="mb-2 overflow-hidden rounded-xl border border-black/10">
                                  {msg.CM_Image_URL.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                    <a href={msg.CM_Image_URL} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={msg.CM_Image_URL}
                                        alt="Attachment"
                                        className="max-h-60 w-full object-cover hover:opacity-95 transition"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={msg.CM_Image_URL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
                                        isMe ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-800"
                                      }`}
                                    >
                                      <Paperclip className="h-4 w-4" />
                                      <span className="truncate flex-1">View Attachment</span>
                                      <Download className="h-3.5 w-3.5 shrink-0" />
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Message Text */}
                              {msg.CM_Message && (
                                <p className={`text-xs leading-relaxed whitespace-pre-line break-words ${editingMessageId === msg.CM_Chat_ID ? 'opacity-50' : ''}`}>
                                  {msg.CM_Message}
                                </p>
                              )}

                              {/* Timestamp & Read indicator */}
                              <div
                                className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                  isMe ? "text-indigo-200" : "text-slate-400"
                                }`}
                              >
                                <span>{formatTime(msg.CM_Created_At)}</span>
                                {isGlobalChatEditEnabled && isMe && !msg.CM_Image_URL && msg.CM_Message && editingMessageId !== msg.CM_Chat_ID && (
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(msg.CM_Chat_ID);
                                      setNewMessage(msg.CM_Message);
                                      
                                      // Set project dropdown
                                      updateActiveProject(msg.CM_Project_ID || "");
                                      
                                      if (msg.CM_Created_At) {
                                        const d = new Date(msg.CM_Created_At);
                                        const pad = (n) => String(n).padStart(2, '0');
                                        const localDatetime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                        setMessageDate(localDatetime);
                                      }

                                      if (messageInputRef.current) messageInputRef.current.focus();
                                    }}
                                    className={`ml-1 transition-opacity ${editingMessageId === msg.CM_Chat_ID ? 'text-indigo-400 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                    title="Edit message"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                )}
                                {isGlobalChatDeleteEnabled && isMe && !msg.CM_Image_URL && editingMessageId !== msg.CM_Chat_ID && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.CM_Chat_ID)}
                                    className="ml-1 opacity-60 hover:opacity-100 hover:text-rose-400 transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                                {isMe && (
                                  msg.CM_Is_Read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-200" title="Read" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-indigo-300" title="Sent" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* File Preview bar */}
                {file && (
                  <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 truncate">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover border" />
                      ) : (
                        <Paperclip className="h-4 w-4 text-indigo-600" />
                      )}
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                    <button onClick={removeFile} className="p-1 text-indigo-500 hover:text-indigo-800 rounded">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <span>Tag Message To Project:</span>
                    <select
                      className="appearance-none bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md cursor-pointer outline-none border border-indigo-100 focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                      value={currentProjectId || ""}
                      onChange={handleProjectSelect}
                      disabled={isUpdatingProject || projects.length === 0}
                    >
                      <option value="">-- Select Active Project --</option>
                      {projects.map(p => (
                        <option key={p.CM_Project_ID} value={p.CM_Project_ID}>
                          {p.CM_Project_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  


                  {isGlobalCustomDateEnabled && (
                    <div className="flex items-center gap-1.5 px-1 mt-1 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      <span>Work Date & Time:</span>
                      <input
                        type="datetime-local"
                        value={messageDate}
                        onChange={(e) => setMessageDate(e.target.value)}
                        className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md cursor-pointer outline-none border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        title="Select a backdated work date and time"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
                      title="Attach image or file"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    <input
                      type="text"
                      ref={messageInputRef}
                      value={newMessage}
                      onChange={handleTyping}
                      placeholder={editingMessageId ? "Edit your message..." : `Type a message to ${selectedEmployee.CM_Full_Name}...`}
                      className={`flex-1 border rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${editingMessageId ? 'bg-indigo-50/50 border-indigo-300 focus:bg-white' : 'bg-slate-100 border-slate-200 placeholder-slate-400 focus:bg-white'}`}
                    />

                    {editingMessageId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(null);
                          setNewMessage("");
                        }}
                        className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                        title="Cancel Editing"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && !file) || isSending}
                      className="p-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-md flex items-center justify-center shrink-0"
                      title={editingMessageId ? "Save Edit" : "Send Message"}
                    >
                      {editingMessageId ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                  <MessageSquare className="h-10 w-10" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Select an employee to chat</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Choose any colleague or staff member from the employee list on the left to start a 1-on-1 message conversation.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Delete Confirmation Modal */}
        {messageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Message</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => setMessageToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMessage}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Message"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
