"use client";
import { useEffect, useState, useRef, useCallback } from "react";

export function useEmployeeSocket(currentUserId, onNewMessage, onTyping) {
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);
  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    if (!currentUserId) return;

    let isMounted = true;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname || "localhost";
        const wsUrl = `${protocol}//${host}:3001`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log("🟢 Connected to Employee Chat WebSocket Server");
          setIsConnected(true);

          // Register current user ID with socket
          ws.send(
            JSON.stringify({
              type: "register",
              userId: String(currentUserId),
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "online_users" && Array.isArray(data.onlineUserIds)) {
              if (isMounted) {
                setOnlineUserIds(data.onlineUserIds.map((id) => String(id)));
                if (data.lastSeenMap) {
                  setLastSeenMap(data.lastSeenMap);
                }
              }
            } else if (data.type === "new_message" && data.message) {
              if (onNewMessageRef.current) {
                onNewMessageRef.current(data.message);
              }
            } else if (data.type === "typing") {
              if (onTypingRef.current) {
                onTypingRef.current(data.senderId, data.isTyping);
              }
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Try reconnecting after 3 seconds
          reconnectTimerRef.current = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (err) => {
          console.warn("WebSocket connection error (Server may be starting):", err);
          ws.close();
        };
      } catch (err) {
        console.warn("Failed to initiate WebSocket connection:", err);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [currentUserId]);

  const sendRealTimeMessage = useCallback((messageObj) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "send_message",
          message: messageObj,
        })
      );
    }
  }, []);

  const sendTypingStatus = useCallback((receiverId, isTyping) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          receiverId: String(receiverId),
          isTyping,
        })
      );
    }
  }, []);

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
