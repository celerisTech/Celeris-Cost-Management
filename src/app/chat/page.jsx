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
  Trash2,
  Users,
  Palette,
  Mic,
  Square
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuthStore } from "../store/useAuthScreenStore";
import { useRouter } from "next/navigation";
import { useEmployeeSocket } from "../hooks/useEmployeeSocket";

const THEMES = {
  indigo: {
    name: "Indigo",
    bubbleMe: "bg-indigo-600 text-white rounded-br-sm",
    bubbleThem: "bg-white text-slate-800 border border-slate-200 rounded-bl-sm",
    projectMe: "bg-black/20 border-white/20 text-white",
    projectThem: "bg-slate-50 border-slate-200 text-slate-500",
    timeMe: "text-white/70",
    timeThem: "text-slate-400",
    sendBtn: "bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600",
    inputRing: "focus:ring-indigo-500",
    bgLight: "bg-indigo-50",
    textMain: "text-indigo-600",
    textLight: "text-indigo-500",
    textDark: "text-indigo-900",
    dot: "bg-indigo-500",
    avatarGroup: "from-blue-500 to-indigo-600",
    avatarSingle: "from-indigo-500 to-purple-600",
    sidebarActive: "bg-indigo-50 border-indigo-200",
    badgeBg: "bg-indigo-600",
    borderLight: "border-indigo-100",
    typingBg: "bg-indigo-50 border-indigo-200",
    typingText: "text-indigo-700",
    blob1: "bg-indigo-300",
    blob2: "bg-purple-300",
    blob3: "bg-blue-300"
  },
  emerald: {
    name: "Emerald",
    bubbleMe: "bg-emerald-600 text-white rounded-br-sm",
    bubbleThem: "bg-white text-slate-800 border border-slate-200 rounded-bl-sm",
    projectMe: "bg-black/20 border-white/20 text-white",
    projectThem: "bg-slate-50 border-slate-200 text-slate-500",
    timeMe: "text-white/70",
    timeThem: "text-slate-400",
    sendBtn: "bg-emerald-600 hover:bg-emerald-700 disabled:hover:bg-emerald-600",
    inputRing: "focus:ring-emerald-500",
    bgLight: "bg-emerald-50",
    textMain: "text-emerald-600",
    textLight: "text-emerald-500",
    textDark: "text-emerald-900",
    dot: "bg-emerald-500",
    avatarGroup: "from-teal-500 to-emerald-600",
    avatarSingle: "from-emerald-500 to-green-600",
    sidebarActive: "bg-emerald-50 border-emerald-200",
    badgeBg: "bg-emerald-600",
    borderLight: "border-emerald-100",
    typingBg: "bg-emerald-50 border-emerald-200",
    typingText: "text-emerald-700",
    blob1: "bg-emerald-300",
    blob2: "bg-teal-300",
    blob3: "bg-green-300"
  },
  rose: {
    name: "Rose",
    bubbleMe: "bg-rose-600 text-white rounded-br-sm",
    bubbleThem: "bg-white text-slate-800 border border-slate-200 rounded-bl-sm",
    projectMe: "bg-black/20 border-white/20 text-white",
    projectThem: "bg-slate-50 border-slate-200 text-slate-500",
    timeMe: "text-white/70",
    timeThem: "text-slate-400",
    sendBtn: "bg-rose-600 hover:bg-rose-700 disabled:hover:bg-rose-600",
    inputRing: "focus:ring-rose-500",
    bgLight: "bg-rose-50",
    textMain: "text-rose-600",
    textLight: "text-rose-500",
    textDark: "text-rose-900",
    dot: "bg-rose-500",
    avatarGroup: "from-red-500 to-rose-600",
    avatarSingle: "from-rose-500 to-pink-600",
    sidebarActive: "bg-rose-50 border-rose-200",
    badgeBg: "bg-rose-600",
    borderLight: "border-rose-100",
    typingBg: "bg-rose-50 border-rose-200",
    typingText: "text-rose-700",
    blob1: "bg-rose-300",
    blob2: "bg-pink-300",
    blob3: "bg-orange-200"
  },
  amber: {
    name: "Amber",
    bubbleMe: "bg-amber-500 text-white rounded-br-sm",
    bubbleThem: "bg-white text-slate-800 border border-slate-200 rounded-bl-sm",
    projectMe: "bg-black/20 border-white/20 text-white",
    projectThem: "bg-slate-50 border-slate-200 text-slate-500",
    timeMe: "text-white/70",
    timeThem: "text-slate-400",
    sendBtn: "bg-amber-500 hover:bg-amber-600 disabled:hover:bg-amber-500",
    inputRing: "focus:ring-amber-500",
    bgLight: "bg-amber-50",
    textMain: "text-amber-600",
    textLight: "text-amber-500",
    textDark: "text-amber-900",
    dot: "bg-amber-500",
    avatarGroup: "from-yellow-400 to-amber-500",
    avatarSingle: "from-amber-400 to-orange-500",
    sidebarActive: "bg-amber-50 border-amber-200",
    badgeBg: "bg-amber-500",
    borderLight: "border-amber-100",
    typingBg: "bg-amber-50 border-amber-200",
    typingText: "text-amber-700",
    blob1: "bg-amber-300",
    blob2: "bg-yellow-300",
    blob3: "bg-orange-300"
  },
  cyan: {
    name: "Cyan",
    bubbleMe: "bg-cyan-600 text-white rounded-br-sm",
    bubbleThem: "bg-white text-slate-800 border border-slate-200 rounded-bl-sm",
    projectMe: "bg-black/20 border-white/20 text-white",
    projectThem: "bg-slate-50 border-slate-200 text-slate-500",
    timeMe: "text-white/70",
    timeThem: "text-slate-400",
    sendBtn: "bg-cyan-600 hover:bg-cyan-700 disabled:hover:bg-cyan-600",
    inputRing: "focus:ring-cyan-500",
    bgLight: "bg-cyan-50",
    textMain: "text-cyan-600",
    textLight: "text-cyan-500",
    textDark: "text-cyan-900",
    dot: "bg-cyan-500",
    avatarGroup: "from-sky-500 to-cyan-600",
    avatarSingle: "from-cyan-500 to-blue-500",
    sidebarActive: "bg-cyan-50 border-cyan-200",
    badgeBg: "bg-cyan-600",
    borderLight: "border-cyan-100",
    typingBg: "bg-cyan-50 border-cyan-200",
    typingText: "text-cyan-700",
    blob1: "bg-cyan-300",
    blob2: "bg-sky-300",
    blob3: "bg-blue-200"
  },
  slate: {
    name: "Slate",
    bubbleMe: "bg-slate-700 text-white rounded-br-sm",
    bubbleThem: "bg-white text-slate-800 border border-slate-200 rounded-bl-sm",
    projectMe: "bg-black/20 border-white/20 text-white",
    projectThem: "bg-slate-50 border-slate-200 text-slate-500",
    timeMe: "text-white/70",
    timeThem: "text-slate-400",
    sendBtn: "bg-slate-700 hover:bg-slate-800 disabled:hover:bg-slate-700",
    inputRing: "focus:ring-slate-500",
    bgLight: "bg-slate-100",
    textMain: "text-slate-700",
    textLight: "text-slate-500",
    textDark: "text-slate-900",
    dot: "bg-slate-600",
    avatarGroup: "from-slate-500 to-slate-700",
    avatarSingle: "from-slate-600 to-gray-700",
    sidebarActive: "bg-slate-100 border-slate-300",
    badgeBg: "bg-slate-600",
    borderLight: "border-slate-200",
    typingBg: "bg-slate-100 border-slate-300",
    typingText: "text-slate-700",
    blob1: "bg-slate-300",
    blob2: "bg-gray-300",
    blob3: "bg-zinc-300"
  }
};
const getCurrentLocalDatetime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export default function EmployeeChatPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const currentUserId = user?.CM_User_ID || user?.id || user?.user_id;
  const isOwner = user?.CM_Role_Description === "Owner" || user?.CM_Role_ID === "ROL000001";

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageDate, setMessageDate] = useState(getCurrentLocalDatetime());
  const [hasManuallyChangedDate, setHasManuallyChangedDate] = useState(false);
  const [isGlobalCustomDateEnabled, setIsGlobalCustomDateEnabled] = useState(false);
  const [isGlobalChatEditEnabled, setIsGlobalChatEditEnabled] = useState(false);
  const [isGlobalChatDeleteEnabled, setIsGlobalChatDeleteEnabled] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const formRef = useRef(null);

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

  const [globalThemeKey, setGlobalThemeKey] = useState("indigo");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    if (currentUserId) {
      const stored = localStorage.getItem(`chat_global_theme_${currentUserId}`);
      if (stored && THEMES[stored]) {
        setGlobalThemeKey(stored);
      }
    }
  }, [currentUserId]);
  // Keep default date synced to current time
  useEffect(() => {
    if (!hasManuallyChangedDate) {
      const interval = setInterval(() => {
        setMessageDate(getCurrentLocalDatetime());
      }, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [hasManuallyChangedDate]);

  const handleColorSelect = (colorKey) => {
    setGlobalThemeKey(colorKey);
    localStorage.setItem(`chat_global_theme_${currentUserId}`, colorKey);
    setShowColorPicker(false);
  };

  const activeTheme = THEMES[globalThemeKey];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

  const handleIncomingTyping = React.useCallback((senderId, isTyping) => {
    setTypingUsers(prev => ({
      ...prev,
      [senderId]: isTyping
    }));
  }, []);



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
        const fetchedEmployees = data.employees || [];
        setEmployees(fetchedEmployees);
        // Automatically select the first chat (CS Squad) on initial load
        setSelectedEmployee(prev => prev || (fetchedEmployees.length > 0 ? fetchedEmployees[0] : null));
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
        setMessageDate(getCurrentLocalDatetime());
        setHasManuallyChangedDate(false);
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
        // Do not pre-select the active project so it defaults to the placeholder
        // if (data.success) {
        //   setCurrentProjectId(data.projectId);
        // }
      } catch (err) {
        // silent
      }
    };
    fetchCurrentProject();
  }, [currentUserId]);

  const handleProjectSelect = (e) => {
    setCurrentProjectId(e.target.value);
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
      setCurrentProjectId(""); // Reset project tag when switching chats
      const interval = setInterval(() => {
        fetchMessages(selectedEmployee.CM_User_ID, true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedEmployee?.CM_User_ID, currentUserId]);

  // Scroll to bottom only when a new message arrives or chat changes
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].CM_Chat_ID : null;
  const currentChatUserId = selectedEmployee?.CM_User_ID;

  useEffect(() => {
    // A slight delay ensures the DOM has fully rendered the new messages before attempting to scroll.
    // Using "auto" instead of "smooth" prevents the browser from getting stuck scrolling through very long histories.
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, currentChatUserId]);

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

  // --- AUDIO RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Auto-send the voice message by setting it to state and calling submit
        setFile(audioFile);
        
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to send voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      
      // We will trigger a synthetic form submission shortly after state updates
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }, 100);
    }
  };
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      // Clean up tracks without sending
      setFile(null);
    }
  };
  
  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
          setMessageDate(getCurrentLocalDatetime());
          setHasManuallyChangedDate(false);
        }
      } else {
        // Handle Send New Message (POST request)
        const formData = new FormData();
        formData.append("senderId", currentUserId);
        formData.append("receiverId", selectedEmployee.CM_User_ID);
        if (newMessage.trim()) formData.append("message", newMessage.trim());
        formData.append("projectId", currentProjectId || "");
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
          setMessageDate(getCurrentLocalDatetime());
          setHasManuallyChangedDate(false);
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
    <div className="flex flex-col sm:flex-row h-[100dvh] bg-slate-100 overflow-hidden font-sans">
      <Navbar />

      <div className="flex-1 h-full overflow-hidden flex flex-col w-full bg-white">
        <div className="flex flex-1 overflow-hidden h-full w-full">

          {/* ── LEFT PANEL: Employee Directory ── */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50 ${showMobileChat ? "hidden md:flex" : "flex"}`}>

            {/* Header & Search */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 ${activeTheme.badgeBg} text-white rounded-xl shadow-md`}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-slate-800">CS Hub</h1>
                    <p className="text-[11px] text-slate-500">Internal team communications</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="relative" ref={colorPickerRef}>
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className={`p-1.5 rounded-lg transition-colors text-slate-400 hover:${activeTheme.textMain} hover:bg-slate-100`}
                      title="Change App Theme"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                    {showColorPicker && (
                      <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 shadow-lg rounded-xl p-3 z-50 flex gap-2 w-max">
                        {Object.keys(THEMES).map((key) => (
                          <button
                            key={key}
                            onClick={() => handleColorSelect(key)}
                            className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ${THEMES[key].dot} ${globalThemeKey === key ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                            title={THEMES[key].name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={fetchEmployees}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                    title="Refresh employees"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
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
                  <RefreshCw className={`h-5 w-5 animate-spin ${activeTheme.textMain}`} />
                  <span>Loading employees...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No employees found matching "{searchQuery}"
                </div>
              ) : (
                employees.map((emp) => {
                  const isSelected = selectedEmployee?.CM_User_ID === emp.CM_User_ID;
                  const empTheme = activeTheme;
                  return (
                    <button
                      key={emp.CM_User_ID}
                      onClick={() => handleSelectEmployee(emp)}
                      className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 relative ${isSelected
                        ? activeTheme.sidebarActive + " shadow-xs border"
                        : "hover:bg-slate-100 bg-white border border-slate-100"
                        }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {emp.isGroup ? (
                          <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm p-1.5 border border-slate-100 shrink-0`}>
                            <img src="/logo.svg" alt="Group Chat" className="w-full h-full object-contain" />
                          </div>
                        ) : emp.CM_Photo_URL ? (
                          <img
                            src={emp.CM_Photo_URL}
                            alt={emp.CM_Full_Name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${empTheme.avatarSingle} text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm`}>
                            {emp.CM_Full_Name?.slice(0, 2) || "EM"}
                          </div>
                        )}
                        {/* Dynamic Online/Offline Badge */}
                        {!emp.isGroup && (isUserOnline(emp.CM_User_ID) ? (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-400/50 animate-pulse"
                            title="Online now"
                          />
                        ) : (
                          <span
                            className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 border-2 border-white rounded-full"
                            title="Offline"
                          />
                        ))}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h3 className="text-[13px] font-extrabold text-slate-900 truncate flex items-center gap-1.5 tracking-tight">
                            {emp.CM_Full_Name}
                          </h3>
                          {/* Timestamp intentionally removed per user request */}
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 mb-1">
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold border border-slate-200">
                            {emp.CM_Role_Description || "Staff"}
                          </span>
                          {emp.CM_Current_Project_Name && (
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border truncate max-w-[100px] ${empTheme.bgLight} ${empTheme.textMain} ${empTheme.borderLight}`} title={emp.CM_Current_Project_Name}>
                              {emp.CM_Current_Project_Name}
                            </span>
                          )}
                          <span className={`text-[9px] font-medium ${isUserOnline(emp.CM_User_ID) ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                            {!emp.isGroup && (typingUsers[emp.CM_User_ID] ? (
                              <span className={`${empTheme.textLight} italic font-bold flex items-center gap-0.5`}>
                                Typing<span className="animate-pulse">...</span>
                              </span>
                            ) : (
                              formatLastSeenStatus(emp)
                            ))}
                          </span>
                        </div>

                        {/* Last Message Snippet */}
                        {emp.lastMessage ? (
                          <p className={`text-[12px] truncate mt-0.5 ${emp.unreadCount > 0 ? `font-bold ${empTheme.textDark}` : "text-slate-500 font-medium"}`}>
                            {emp.lastMessage}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">No messages yet</p>
                        )}
                      </div>

                      {/* Unread badge */}
                      {emp.unreadCount > 0 && (
                        <span className={`ml-1 shrink-0 px-2 py-0.5 text-white font-bold text-[10px] rounded-full shadow-xs ${empTheme.badgeBg}`}>
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
                      {selectedEmployee.isGroup ? (
                        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm p-1.5 border border-slate-100 shrink-0`}>
                          <img src="/logo.svg" alt="Group Chat" className="w-full h-full object-contain" />
                        </div>
                      ) : selectedEmployee.CM_Photo_URL ? (
                        <img
                          src={selectedEmployee.CM_Photo_URL}
                          alt={selectedEmployee.CM_Full_Name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeTheme.avatarSingle} text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm`}>
                          {selectedEmployee.CM_Full_Name?.slice(0, 2) || "EM"}
                        </div>
                      )}
                      {!selectedEmployee.isGroup && (isUserOnline(selectedEmployee.CM_User_ID) ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-400/50 animate-pulse" />
                      ) : (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 border-2 border-white rounded-full" />
                      ))}
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        {selectedEmployee.CM_Full_Name}
                      </h2>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className={`font-medium ${activeTheme.textMain}`}>{selectedEmployee.CM_Role_Description || "Staff"}</span>
                        {selectedEmployee.CM_Phone_Number && (
                          <a
                            href={`tel:${selectedEmployee.CM_Phone_Number}`}
                            className={`flex items-center gap-0.5 hover:${activeTheme.textMain} transition-colors cursor-pointer`}
                            title="Click to call"
                          >
                            <Phone className="h-3 w-3 text-slate-400" /> {selectedEmployee.CM_Phone_Number}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!selectedEmployee.isGroup && (
                      typingUsers[selectedEmployee.CM_User_ID] ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${activeTheme.typingBg} ${activeTheme.typingText} text-xs font-bold rounded-full shadow-xs`}>
                          <span className="flex items-center gap-0.5 animate-pulse">
                            <span className={`w-1.5 h-1.5 ${activeTheme.dot} rounded-full animate-bounce`}></span>
                            <span className={`w-1.5 h-1.5 ${activeTheme.dot} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                            <span className={`w-1.5 h-1.5 ${activeTheme.dot} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
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
                      )
                    )}

                    <button
                      onClick={() => router.push("/dashboard")}
                      className="ml-2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Close Chat Module"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 relative overflow-hidden bg-slate-50/80">
                  {/* Glassmorphic Background Blobs */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 ${activeTheme.blob1}`}></div>
                    <div className={`absolute top-[20%] -right-[10%] w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 ${activeTheme.blob2}`}></div>
                    <div className={`absolute -bottom-[10%] left-[20%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 ${activeTheme.blob3}`}></div>
                  </div>

                  {/* Frosted Glass Overlay & Scrollable Container */}
                  <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 bg-white/70 backdrop-blur-3xl z-10">
                    {isLoadingMessages ? (
                      <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className={`h-5 w-5 animate-spin ${activeTheme.textMain}`} />
                        <span>Loading conversation...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                        <div className={`p-5 rounded-full shadow-sm ${activeTheme.bgLight} ${activeTheme.textLight}`}>
                          <MessageSquare className="h-8 w-8" />
                        </div>
                        <p className="text-[15px] font-extrabold text-slate-700 tracking-tight">Start a conversation with {selectedEmployee.CM_Full_Name}</p>
                        <p className="text-xs font-medium text-slate-500">Messages sent here are secure and private.</p>
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
                                className={`w-fit max-w-[85%] sm:max-w-[75%] rounded-2xl py-2 px-3.5 shadow-sm relative ${isMe ? activeTheme.bubbleMe : activeTheme.bubbleThem
                                  }`}
                              >
                                {!isMe && selectedEmployee.isGroup && msg.Sender_Name && (
                                  <div className={`text-[10px] font-bold ${activeTheme.textLight} mb-0.5`}>
                                    {msg.Sender_Name}
                                  </div>
                                )}

                                {/* Project Tag */}
                                {msg.CM_Project_Name && (
                                  <div className={`mb-1.5 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide border ${isMe ? activeTheme.projectMe : activeTheme.projectThem}`}>
                                    {msg.CM_Project_Name}
                                  </div>
                                )}

                                {/* Attached Image/File/Audio */}
                                {msg.CM_Image_URL && (
                                  <div className="mb-2 overflow-hidden rounded-xl border border-black/10">
                                    {msg.CM_Image_URL.match(/\.(webm|ogg|mp3|wav|m4a)$/i) ? (
                                      <div className="p-2 bg-slate-50/50 backdrop-blur-sm">
                                        <audio controls src={msg.CM_Image_URL} className="max-w-full h-10" />
                                      </div>
                                    ) : msg.CM_Image_URL.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
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
                                        className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${isMe ? "bg-black/20 text-white" : "bg-slate-100 text-slate-800"
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
                                  <p className={`text-[13px] leading-relaxed whitespace-pre-line break-words ${editingMessageId === msg.CM_Chat_ID ? 'opacity-50' : ''}`}>
                                    {msg.CM_Message}
                                  </p>
                                )}

                                {/* Timestamp & Read indicator */}
                                <div
                                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? activeTheme.timeMe : activeTheme.timeThem
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
                                      className={`ml-1 transition-opacity ${editingMessageId === msg.CM_Chat_ID ? 'text-white opacity-100 drop-shadow-md' : 'opacity-60 hover:opacity-100'}`}
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
                                      <CheckCheck className="h-3.5 w-3.5 text-white/90" title="Read" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-white/60" title="Sent" />
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
                </div>

                {/* File Preview bar */}
                {file && (
                  <div className={`px-4 py-2 border-t flex items-center justify-between text-xs ${activeTheme.bgLight} ${activeTheme.borderLight}`}>
                    <div className={`flex items-center gap-2 truncate ${activeTheme.textDark}`}>
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover border" />
                      ) : (
                        <Paperclip className={`h-4 w-4 ${activeTheme.textMain}`} />
                      )}
                      <span className="truncate font-medium">{file.name}</span>
                    </div>
                    <button onClick={removeFile} className={`p-1 rounded opacity-60 hover:opacity-100 ${activeTheme.textMain}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <form ref={formRef} onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 relative z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2 px-1 text-xs text-slate-500 font-medium tracking-wide">
                    <span>Tag Message To Project:</span>
                    <select
                      className={`appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-full cursor-pointer outline-none border border-slate-200 focus:ring-2 ${activeTheme.inputRing} transition-colors disabled:opacity-50 text-xs shadow-sm`}
                      value={currentProjectId || ""}
                      onChange={handleProjectSelect}
                      disabled={isUpdatingProject || projects.length === 0}
                    >
                      <option value="">Select active projects</option>
                      {projects.map(p => (
                        <option key={p.CM_Project_ID} value={p.CM_Project_ID}>
                          {p.CM_Project_Name}
                        </option>
                      ))}
                    </select>
                  </div>



                  {isGlobalCustomDateEnabled && (
                    <div className="flex flex-col sm:flex-row sm:items-center items-start gap-2 px-1 mt-1 text-xs text-slate-500 font-medium tracking-wide">
                      <span>Work Date & Time:</span>
                      <input
                        type="datetime-local"
                        value={messageDate}
                        onChange={(e) => {
                          setMessageDate(e.target.value);
                          setHasManuallyChangedDate(true);
                        }}
                        className={`appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-md cursor-pointer outline-none border border-slate-200 focus:ring-2 ${activeTheme.inputRing} transition-colors shadow-sm`}
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

                    {isRecording ? (
                      <div className="flex-1 flex items-center justify-between bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                          </span>
                          <span className="text-rose-600 font-medium text-sm tracking-widest">{formatRecordingTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelRecording}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-full transition"
                            title="Cancel Recording"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="p-2 bg-rose-500 text-white hover:bg-rose-600 rounded-full transition shadow-sm"
                            title="Send Voice Message"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-2.5 text-slate-500 hover:${activeTheme.textMain} hover:bg-slate-100 rounded-xl transition`}
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
                          className={`flex-1 border rounded-2xl px-4 py-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 ${activeTheme.inputRing} transition shadow-sm ${editingMessageId ? `${activeTheme.bgLight} border-${activeTheme.dot.split('-')[1]}-300 focus:bg-white` : 'bg-slate-50 border-slate-200 placeholder-slate-400 focus:bg-white hover:bg-white'}`}
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

                        {!newMessage.trim() && !file ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className={`p-2.5 text-slate-500 hover:${activeTheme.textMain} hover:bg-slate-100 rounded-xl transition shrink-0`}
                            title="Record Voice Message"
                          >
                            <Mic className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSending}
                            className={`p-2.5 text-white rounded-xl font-bold transition disabled:opacity-40 shadow-md flex items-center justify-center shrink-0 ${activeTheme.sendBtn}`}
                            title={editingMessageId ? "Save Edit" : "Send Message"}
                          >
                            {editingMessageId ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3 relative">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Close Chat Module"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className={`p-4 rounded-2xl shadow-inner ${activeTheme.bgLight} ${activeTheme.textMain}`}>
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
