import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ChevronLeft, Search, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import chatService from "../../services/chat.service";
import { getSocket, joinChatRoom, leaveChatRoom } from "../../services/socket";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Hàm phát tiếng beep thông báo khi có tin nhắn mới dùng Web Audio API (không cần tải file ngoài)
const playNotificationSound = () => {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(550, context.currentTime); // Tần số Hz
    osc.frequency.exponentialRampToValueAtTime(750, context.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.12);
  } catch (e) {
    console.error("Lỗi phát âm thanh thông báo:", e);
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const UserChatWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cuộn tin nhắn xuống cuối khi mở room hoặc tin nhắn thay đổi
  useEffect(() => {
    if (activeRoom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, activeRoom]);

  // Lấy danh sách phòng chat từ API
  const fetchRooms = async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      const res = await chatService.getMyRooms();
      if (res.success) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách chat widget:", err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Gọi API lấy tin nhắn khi bấm chọn phòng
  const handleSelectRoom = async (room) => {
    if (activeRoom?._id) {
      leaveChatRoom(activeRoom._id);
    }
    
    setActiveRoom(room);
    setLoadingMsgs(true);
    setMessages([]);
    
    try {
      const res = await chatService.getMessages(room._id);
      if (res.success) {
        setMessages(res.data);
        // Cập nhật lại số chưa đọc của phòng này thành 0 trong danh sách local
        setRooms((prevRooms) =>
          prevRooms.map((r) => (r._id === room._id ? { ...r, unreadCount: 0 } : r))
        );
      }
    } catch (err) {
      console.error("Lỗi lấy tin nhắn phòng:", err);
    } finally {
      setLoadingMsgs(false);
    }
    
    joinChatRoom(room._id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Quay lại danh sách phòng
  const handleBackToRooms = () => {
    if (activeRoom?._id) {
      leaveChatRoom(activeRoom._id);
    }
    setActiveRoom(null);
    setMessages([]);
    fetchRooms(); // Tải lại danh sách phòng để cập nhật tin nhắn cuối cùng mới nhất
  };

  // Fetch danh sách phòng khi mở widget hoặc đăng nhập
  useEffect(() => {
    if (isOpen && user) {
      fetchRooms();
    }
  }, [isOpen, user]);

  // Thiết lập lắng nghe tin nhắn realtime qua Socket.IO
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      // Phát tiếng beep nhỏ khi có tin nhắn mới đến
      playNotificationSound();

      // Nếu đang xem đúng phòng chat của tin nhắn này
      if (activeRoom && String(newMsg.chatRoomId) === String(activeRoom._id)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        
        // Gọi API ẩn tin nhắn chưa đọc trên backend
        chatService.getMessages(activeRoom._id).catch(() => {});
        
        setRooms((prev) =>
          prev.map((r) =>
            r._id === newMsg.chatRoomId
              ? { ...r, lastMessage: newMsg.messageContent, lastMessageAt: newMsg.createdAt, unreadCount: 0 }
              : r
          )
        );
      } else {
        // Nếu tin nhắn thuộc phòng khác, cập nhật unreadCount và tin nhắn cuối
        setRooms((prev) => {
          const exists = prev.some((r) => r._id === newMsg.chatRoomId);
          if (exists) {
            return prev.map((r) =>
              r._id === newMsg.chatRoomId
                ? {
                    ...r,
                    lastMessage: newMsg.messageContent,
                    lastMessageAt: newMsg.createdAt,
                    unreadCount: (r.unreadCount || 0) + 1,
                  }
                : r
            );
          } else {
            // Nếu phòng chưa tồn tại trong danh sách (phòng mới được tạo từ trang sản phẩm), refresh danh sách phòng
            fetchRooms();
            return prev;
          }
        });
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [user, activeRoom]);

  // Gửi tin nhắn
  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeRoom) return;

    const content = msgInput.trim();
    setMsgInput("");

    try {
      const res = await chatService.sendMessage(activeRoom._id, content);
      if (res.success) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data._id)) return prev;
          return [...prev, res.data];
        });
        setRooms((prev) =>
          prev.map((r) =>
            r._id === activeRoom._id
              ? { ...r, lastMessage: content, lastMessageAt: new Date().toISOString() }
              : r
          )
        );
      }
    } catch (err) {
      toast.error("Không thể gửi tin nhắn");
      setMsgInput(content);
    }
  };

  const handleToggle = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để nhắn tin");
      navigate("/dang-nhap");
      return;
    }
    setIsOpen(!isOpen);
    if (isOpen && activeRoom?._id) {
      leaveChatRoom(activeRoom._id);
      setActiveRoom(null);
    }
  };

  // Tính tổng số tin nhắn chưa đọc
  const totalUnread = rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);

  // Lấy thông tin người đối diện trong cuộc trò chuyện
  const getOtherUser = (room) => {
    if (!room) return null;
    const myId = user?.id || user?._id;
    const buyer = room.buyerId;
    const seller = room.sellerId;
    if (!buyer || !seller) return buyer || seller || null;
    return String(buyer._id || buyer) === String(myId) ? seller : buyer;
  };

  // Lọc phòng chat theo ô tìm kiếm
  const filteredRooms = rooms.filter((r) => {
    const other = getOtherUser(r);
    const name = other?.fullName || other?.name || "";
    const title = r.postId?.title || "";
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || title.toLowerCase().includes(query);
  });

  if (user?.role === "admin") return null;

  return (
    <div className="fixed bottom-6 right-[88px] z-50 font-sans">
      {isOpen && user && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[480px] transition-all animate-scale-up">
          
          {/* ── Cửa sổ chat chi tiết ── */}
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="bg-primary p-3 text-primary-foreground flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={handleBackToRooms}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  title="Quay lại danh sách"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">
                    {getOtherUser(activeRoom)?.fullName || "Người dùng"}
                  </h3>
                  <p className="text-[10px] text-primary-foreground/80 truncate">
                    Sản phẩm: {activeRoom.postId?.title || "Không rõ"}
                  </p>
                </div>
                <button 
                  onClick={() => { setIsOpen(false); if (activeRoom?._id) leaveChatRoom(activeRoom._id); setActiveRoom(null); }}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Khu vực tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-2">
                {loadingMsgs ? (
                  <div className="flex-grow flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-gray-400 gap-1 py-10">
                    <MessageSquare size={32} className="opacity-30" />
                    <p className="text-xs">Hãy gửi tin nhắn đầu tiên!</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const myId = user?.id || user?._id;
                    const senderId = m.senderId?._id || m.senderId || m.sender;
                    const isMine = String(senderId) === String(myId);

                    return (
                      <div 
                        key={m._id || idx} 
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[75%] flex flex-col`}>
                          <div 
                            className={`rounded-2xl px-3 py-1.5 text-xs shadow-sm ${
                              isMine 
                                ? "bg-primary text-primary-foreground rounded-br-sm" 
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                            }`}
                          >
                            <p className="leading-relaxed break-words">{m.messageContent || m.content}</p>
                            <span className={`block text-[9px] mt-1 text-right ${isMine ? "text-primary-foreground/60" : "text-gray-400"}`}>
                              {formatTime(m.createdAt || new Date())}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Hộp nhập tin nhắn */}
              <form 
                onSubmit={handleSend}
                className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:ring-1 focus:ring-primary rounded-full px-4 py-2 text-xs outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!msgInput.trim()}
                  className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            // ── Danh sách phòng chat ──
            <>
              {/* Header */}
              <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <MessageSquare size={18} />
                    Trò chuyện mua bán
                  </h3>
                  <p className="text-[10px] text-primary-foreground/80 mt-0.5">
                    Hộp thư trao đổi giữa bạn và người mua/bán
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tìm kiếm */}
              <div className="p-3 bg-white border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center bg-gray-100 border border-transparent rounded-full px-3 py-1.5 gap-2 focus-within:bg-white focus-within:border-gray-300 transition-all">
                  <Search size={14} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên người, sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-xs flex-1 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Danh sách phòng */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
                {loadingRooms ? (
                  <div className="p-10 flex justify-center">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
                    <MessageSquare size={36} className="opacity-20" />
                    <p className="text-xs">Chưa có cuộc hội thoại nào.</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const other = getOtherUser(room);
                    const otherName = other?.fullName || "Người dùng";
                    const otherInitial = otherName.charAt(0).toUpperCase();

                    return (
                      <button 
                        key={room._id} 
                        onClick={() => handleSelectRoom(room)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        {/* Avatar tròn với chữ cái đầu */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm relative flex-shrink-0">
                          {otherInitial}
                          {room.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-sm animate-pulse">
                              {room.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Thông tin phòng chat */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-xs text-gray-800 truncate">
                              {otherName}
                            </p>
                            <span className="text-[9px] text-gray-400 flex-shrink-0">
                              {formatTime(room.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-[10px] text-primary font-medium truncate mt-0.5">
                            Sản phẩm: {room.postId?.title || "Không rõ"}
                          </p>
                          <p className={`text-[11px] truncate mt-0.5 ${room.unreadCount > 0 ? "font-bold text-gray-900" : "text-gray-500"}`}>
                            {room.lastMessage || "Bắt đầu cuộc trò chuyện"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}

        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={handleToggle}
        className={`${
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
        } text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center relative w-14 h-14`}
        title="Trò chuyện mua bán"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-1 shadow-md">
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  );
};

export default UserChatWidget;
