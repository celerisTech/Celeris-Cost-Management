"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Pusher from "pusher-js";

// Initialize Pusher outside the component so it's only created once per app load
// We don't connect immediately, we connect when the hook is used
let pusherInstance = null;

export function useEmployeeSocket(currentUserId, onNewMessage, onTyping) {
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const presenceChannelRef = useRef(null);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  
  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    if (!currentUserId) return;

    if (!pusherInstance) {
      // Create Pusher instance (Make sure to replace these in your .env)
      // We enable user authentication endpoint
      pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "YOUR_KEY", {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
        authEndpoint: "/api/pusher/auth",
        auth: {
          params: { user_id: currentUserId }
        }
      });
    }

    // Connect to Pusher
    pusherInstance.connection.bind("connected", () => {
      setIsConnected(true);
      console.log("🟢 Connected to Pusher");
    });
    
    pusherInstance.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    // 1. Subscribe to the Presence Channel for Online Status & Typing
    const presenceChannel = pusherInstance.subscribe("presence-chat");
    presenceChannelRef.current = presenceChannel;

    presenceChannel.bind("pusher:subscription_succeeded", (members) => {
      const activeIds = Object.keys(members.members).map(String);
      setOnlineUserIds(activeIds);
    });

    presenceChannel.bind("pusher:member_added", (member) => {
      setOnlineUserIds((prev) => Array.from(new Set([...prev, String(member.id)])));
    });

    presenceChannel.bind("pusher:member_removed", (member) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== String(member.id)));
      
      // Update last seen
      setLastSeenMap((prev) => ({
        ...prev,
        [member.id]: new Date().toISOString()
      }));
    });

    // Handle typing events via client events
    presenceChannel.bind("client-typing", (data) => {
      // data: { senderId, receiverId, isTyping }
      if (String(data.receiverId) === String(currentUserId) && onTypingRef.current) {
        onTypingRef.current(data.senderId, data.isTyping);
      }
    });

    // 2. Subscribe to Private Channel for Messages
    const privateChannel = pusherInstance.subscribe(`private-user-${currentUserId}`);
    privateChannel.bind("new_message", (data) => {
      if (data.message && onNewMessageRef.current) {
        onNewMessageRef.current(data.message);
      }
    });

    // 3. Subscribe to Group Chat Channel
    const groupChannel = pusherInstance.subscribe(`private-user-GROUP_ALL`);
    groupChannel.bind("new_message", (data) => {
      if (data.message && onNewMessageRef.current) {
        onNewMessageRef.current(data.message);
      }
    });

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe("presence-chat");
        pusherInstance.unsubscribe(`private-user-${currentUserId}`);
        pusherInstance.unsubscribe(`private-user-GROUP_ALL`);
        // We do not completely disconnect pusherInstance because other parts of the app might use it
      }
    };
  }, [currentUserId]);

  const sendRealTimeMessage = useCallback((messageObj) => {
    // With Pusher, messages are sent via the POST /api/chat API
    // We do NOT send chat messages directly via websocket to avoid client-side spoofing.
    // So this function can just be a no-op since your UI already calls POST /api/chat.
  }, []);

  const sendTypingStatus = useCallback((receiverId, isTyping) => {
    if (presenceChannelRef.current) {
      try {
        // Broadcast typing event directly to other clients without hitting the server
        presenceChannelRef.current.trigger("client-typing", {
          senderId: String(currentUserId),
          receiverId: String(receiverId),
          isTyping
        });
      } catch (e) {
        console.warn("Could not send typing indicator:", e);
      }
    }
  }, [currentUserId]);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUserIds.includes(String(userId));
    },
    [onlineUserIds]
  );

  const getLastSeen = useCallback(
    (userId) => {
      if (!userId) return null;
      return lastSeenMap[String(userId)] || null;
    },
    [lastSeenMap]
  );

  return {
    onlineUserIds,
    lastSeenMap,
    isConnected,
    isUserOnline,
    getLastSeen,
    sendRealTimeMessage,
    sendTypingStatus,
  };
}
