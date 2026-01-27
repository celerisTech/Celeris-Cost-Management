"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, Send, X, User, Clock, Reply, Paperclip, Download, ChevronRight, Filter, Search, CheckCircle, AlertCircle, MessageSquare, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthScreenStore";
import Navbar from '../components/Navbar';
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [activeTab, setActiveTab] = useState("received");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (user?.CM_User_ID) {
      fetchNotifications();
    } else {
      setIsLoadingNotifications(false);
    }
  }, [user, activeTab]);

  const fetchNotifications = async () => {
    if (!user?.CM_User_ID) return;

    try {
      setIsLoadingNotifications(true);
      const res = await fetch(`/api/notifications?userId=${user.CM_User_ID}&type=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        if (selectedNotification) {
          const updatedNotification = data.notifications.find(
            n => n.CM_Notification_ID === selectedNotification.CM_Notification_ID
          );
          if (updatedNotification) {
            setSelectedNotification(updatedNotification);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user?.CM_User_ID) return;

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          isRead: true
        }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedNotification || !user?.CM_User_ID) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("notificationId", selectedNotification.CM_Notification_ID);
    formData.append("senderId", user.CM_User_ID);
    formData.append("message", replyMessage);
    if (replyFile) formData.append("file", replyFile);

    try {
      const res = await fetch("/api/notifications/replies", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage("");
        setReplyFile(null);
        setSelectedNotification(data.updatedNotification);
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: diffDays < 365 ? undefined : 'numeric'
    });
  };

  const getSenderName = (notification) => {
    if (activeTab === "sent") return "You";
    return notification.sender_name || "Unknown User";
  };

  const getNotificationType = (message) => {
    const msg = message?.toLowerCase() || '';
    if (msg.includes('urgent') || msg.includes('important')) return 'urgent';
    if (msg.includes('update') || msg.includes('status')) return 'update';
    if (msg.includes('welcome') || msg.includes('new')) return 'info';
    return 'normal';
  };

  // Get read status color for notification card
  const getReadStatusColor = (notification) => {
    if (activeTab === "sent") {
      // For sent messages, check if recipient has read it
      return notification.CM_Is_Read ? "bg-green-50 border-green-100" : "bg-yellow-50 border-yellow-100";
    } else {
      // For received messages
      return notification.CM_Is_Read ? "bg-green-50 border-green-100" : "bg-yellow-50 border-yellow-100";
    }
  };

  // Get border color based on read status
  const getReadStatusBorderColor = (notification) => {
    if (activeTab === "sent") {
      return notification.CM_Is_Read ? "border-l-green-500" : "border-l-yellow-500";
    } else {
      return notification.CM_Is_Read ? "border-l-green-500" : "border-l-yellow-500";
    }
  };

  // Get read status indicator color
  const getReadStatusIndicatorColor = (notification) => {
    if (activeTab === "sent") {
      return notification.CM_Is_Read ? "bg-green-500" : "bg-yellow-500";
    } else {
      return !notification.CM_Is_Read ? "bg-yellow-500" : "bg-green-500";
    }
  };

  // Get read status text
  const getReadStatusText = (notification) => {
    if (activeTab === "sent") {
      return notification.CM_Is_Read ? "Read" : "Unread";
    } else {
      return notification.CM_Is_Read ? "Read" : "Unread";
    }
  };

  // Get read status badge color
  const getReadStatusBadgeColor = (notification) => {
    if (activeTab === "sent") {
      return notification.CM_Is_Read ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
    } else {
      return notification.CM_Is_Read ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.CM_Message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "unread" && !notification.CM_Is_Read) ||
      (filterStatus === "replied" && notification.reply_count > 0);
    return matchesSearch && matchesFilter;
  });

  const handleFileDownload = (fileUrl, fileName) => {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank');
  };

  const isCurrentUser = (senderId) => user?.CM_User_ID === senderId;

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading user information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex  h-screen bg-white text-black">
      <Navbar />

      <div className="h-screen overflow-y-auto bg-white py-4 sm:py-8 flex-1 p-2 sm:p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">Stay updated with your communications</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-xl border border-green-200">
                <User className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-800">{user.CM_Full_Name || user.CM_Email}</span>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-gray-50 border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread</option>
                  <option value="replied">Replied</option>
                </select>
                <button className="px-4 py-3 bg-gray-50 border border-blue-500 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Notifications Sidebar */}
          <div className={`lg:w-1/3 xl:w-96 ${showMobileDetail ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("received")}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 relative ${activeTab === "received"
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Received
                  {activeTab === "received" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("sent")}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 relative ${activeTab === "sent"
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Sent
                  {activeTab === "sent" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              </div>

              {/* Notifications List */}
              <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {isLoadingNotifications ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-100 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No notifications found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => {
                    const type = getNotificationType(notification.CM_Message);
                    return (
                      <div
                        key={notification.CM_Notification_ID}
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowMobileDetail(true);
                          if (!notification.CM_Is_Read && activeTab === "received") {
                            markAsRead(notification.CM_Notification_ID);
                          }
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.995] ${selectedNotification?.CM_Notification_ID === notification.CM_Notification_ID
                          ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100"
                          : `${getReadStatusColor(notification)} border ${getReadStatusBorderColor(notification)}`
                          }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {/* Icon Container */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${type === 'urgent' ? 'bg-red-100' :
                            type === 'update' ? 'bg-green-100' :
                              'bg-blue-100'
                            }`}>
                            {type === 'urgent' ? (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            ) : type === 'update' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                            )}
                          </div>

                          {/* Content Area */}
                          <div className="flex-1 min-w-0">
                            {/* Header Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-900 truncate">
                                  {getSenderName(notification)}
                                </span>

                                {/* Badges */}
                                <div className="flex items-center gap-1">
                                  {type === 'urgent' && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full whitespace-nowrap">
                                      Urgent
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getReadStatusBadgeColor(notification)}`}>
                                    {getReadStatusText(notification)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <p className="text-sm text-gray-500 whitespace-nowrap">
                                  {formatDate(notification.CM_Notification_Date)}
                                </p>
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-2 mb-3">
                              {notification.recipient_name && (
                                <p className="text-gray-900 text-sm font-medium truncate">
                                  Sent to: {notification.recipient_name}
                                </p>
                              )}
                              <p className="text-gray-700 text-sm line-clamp-2">
                                {notification.CM_Message || "No message"}
                              </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-4">
                                {notification.CM_Image && (
                                  <div className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors">
                                    <Paperclip className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                    <span>Attachment</span>
                                  </div>
                                )}
                                {notification.reply_count > 0 && (
                                  <div className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors">
                                    <Reply className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                    <span>
                                      {notification.reply_count} repl{notification.reply_count === 1 ? 'y' : 'ies'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Status Indicator */}
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 ${getReadStatusIndicatorColor(notification)} rounded-full ${!notification.CM_Is_Read && activeTab === "received" ? 'animate-pulse' : ''
                                  }`}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Notification Detail Panel */}
          <div className={`flex-1 ${!showMobileDetail && selectedNotification ? 'hidden lg:block' : 'block'}`}>
            {selectedNotification ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                {/* Mobile Back Button */}
                <div className="lg:hidden p-4 border-b border-gray-200">
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                  >
                    <ChevronRight className="w-5 h-5 rotate-180" />
                    <span>Back to list</span>
                  </button>
                </div>

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedNotification.CM_Is_Read ? 'bg-gradient-to-br from-green-100 to-green-50' : 'bg-gradient-to-br from-yellow-100 to-yellow-50'}`}>
                          <User className={`w-6 h-6 ${selectedNotification.CM_Is_Read ? 'text-green-600' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            {activeTab === "sent" ? "To: " : "From: "}
                            {activeTab === "sent"
                              ? (selectedNotification.recipient_name || "Unknown User")
                              : (selectedNotification.sender_name || "Unknown User")
                            }
                          </h2>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {formatDate(selectedNotification.CM_Notification_Date)}
                            </span>
                            {/* Read status badge in detail view */}
                            <span className={`px-3 py-1 ${getReadStatusBadgeColor(selectedNotification)} text-xs font-medium rounded-full`}>
                              {getReadStatusText(selectedNotification)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-xl p-5 border ${selectedNotification.CM_Is_Read ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {selectedNotification.CM_Message || "No message content"}
                        </p>
                      </div>
                    </div>

                    <button className="hidden lg:flex p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Attachments */}
                  {selectedNotification.CM_Image && (
                    <div className={`mt-6 p-4 rounded-xl border ${selectedNotification.CM_Is_Read ? 'bg-gradient-to-r from-green-50 to-gray-50 border-green-100' : 'bg-gradient-to-r from-yellow-50 to-gray-50 border-yellow-100'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${selectedNotification.CM_Is_Read ? 'bg-green-100 border-green-200' : 'bg-yellow-100 border-yellow-200'} border flex items-center justify-center`}>
                            <Paperclip className={`w-5 h-5 ${selectedNotification.CM_Is_Read ? 'text-green-600' : 'text-yellow-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Attached File</h4>
                            <p className="text-sm text-gray-500">
                              {selectedNotification.CM_Image.split('/').pop()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFileDownload(selectedNotification.CM_Image, 'attachment')}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                        >
                          <Download className="w-4 h-4" />
                          <span className="font-medium">Download</span>
                        </button>
                      </div>
                      {selectedNotification.CM_Image.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <div className="mt-4">
                          <img
                            src={selectedNotification.CM_Image}
                            alt="Notification attachment"
                            className="w-full max-w-md rounded-lg border border-gray-200"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Replies Section */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">
                      Replies ({selectedNotification.replies?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {selectedNotification.replies?.map((reply) => (
                      <div
                        key={reply.CM_Reply_ID}
                        className={`p-5 rounded-2xl ${isCurrentUser(reply.CM_Sender_ID)
                          ? "bg-gradient-to-r from-blue-50 to-blue-25 ml-0 lg:ml-12 border border-blue-100"
                          : "bg-gray-50 mr-0 lg:mr-12 border border-gray-100"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrentUser(reply.CM_Sender_ID)
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-200 text-gray-600"
                              }`}>
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">
                                {isCurrentUser(reply.CM_Sender_ID) ? "You" : (reply.sender_name || "Unknown User")}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(reply.CM_Reply_Date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-800 text-sm mb-4">
                          {reply.CM_Message || "No message"}
                        </p>
                        {reply.CM_Image && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Attachment</span>
                              </div>
                              <button
                                onClick={() => handleFileDownload(reply.CM_Image, 'reply-attachment')}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!selectedNotification.replies || selectedNotification.replies.length === 0) && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Reply className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No replies yet</p>
                        <p className="text-gray-400 text-sm mt-2">Be the first to respond</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {activeTab === "received" && (
                  <div className="border-t border-gray-200 p-6 bg-gradient-to-b from-white to-gray-50">
                    <form onSubmit={sendReply} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Send Reply
                        </label>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply here..."
                          className="w-full text-gray-900 bg-white border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none shadow-sm"
                          rows="3"
                          required
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl transition-all duration-200"
                          >
                            <Paperclip className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-700">Attach File</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                          />
                          {replyFile && (
                            <div className="flex items-center space-x-3 px-4 py-2 bg-blue-50 rounded-xl">
                              <Paperclip className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700 truncate max-w-xs">
                                {replyFile.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setReplyFile(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || !replyMessage.trim() || !user?.CM_User_ID}
                          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[140px]"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              <span className="font-medium">Send Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="text-center p-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                    <Bell className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Select a Notification</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Choose a notification from the list to view details, reply, and manage attachments.
                  </p>
                  <div className="flex items-center justify-center space-x-4 mt-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Read</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Unread</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}