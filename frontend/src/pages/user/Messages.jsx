import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import chatService from "../../services/chat.service";
import { useAuth } from "../../context/AuthContext";
import { getSocket, joinChatRoom, leaveChatRoom } from "../../services/socket";

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const Messages = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Lấy danh sách phòng chat
  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await chatService.getMyRooms();
      if (res.success) {
        setRooms(res.data);
        if (res.data.length > 0) {
          const targetRoom = roomId
            ? res.data.find((r) => String(r._id) === String(roomId))
            : null;
          if (targetRoom) {
            handleSelectRoom(targetRoom);
          } else if (!roomId) {
            handleSelectRoom(res.data[0]);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách chat:", err);
    } finally {
      setLoadingRooms(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Lấy tin nhắn khi chọn phòng
  const handleSelectRoom = async (room) => {
    if (activeRoom?._id) leaveChatRoom(activeRoom._id);
    setActiveRoom(room);
    setLoadingMsgs(true);
    try {
      const res = await chatService.getMessages(room._id);
      if (res.success) setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
    joinChatRoom(room._id);
    inputRef.current?.focus();
  };

  // Socket: lắng nghe tin nhắn mới realtime
  useEffect(() => {
    const socket = getSocket();
    const handler = (newMsg) => {
      // Chỉ thêm nếu đang xem đúng phòng đó
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      // Cập nhật lastMessage trong danh sách rooms
      setRooms((prev) =>
        prev.map((r) =>
          r._id === newMsg.chatRoomId
            ? { ...r, lastMessage: newMsg.messageContent, lastMessageAt: newMsg.createdAt }
            : r
        )
      );
    };
    socket.on("new_message", handler);
    return () => socket.off("new_message", handler);
  }, []);

  // Auto scroll xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gửi tin nhắn
  const handleSend = async () => {
    if (!msg.trim() || !activeRoom) return;
    const content = msg.trim();
    setMsg("");
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
      console.error("Lỗi gửi tin nhắn:", err);
      setMsg(content); // Khôi phục lại nếu lỗi
    }
  };

  // Lấy thông tin người còn lại trong phòng
  const getOther = (room) => {
    if (!room) return null;
    const myId = user?.id || user?._id;
    const buyer = room.buyerId;
    const seller = room.sellerId;
    if (!buyer || !seller) return buyer || seller || null;
    return String(buyer._id || buyer) === String(myId) ? seller : buyer;
  };

  const filteredRooms = rooms.filter((r) => {
    const other = getOther(r);
    const name = other?.fullName || other?.name || "";
    const title = r.postId?.title || r.product?.title || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || title.toLowerCase().includes(q);
  });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-72 flex h-screen overflow-hidden">

        {/* ── Danh sách phòng chat ── */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-surface-variant/30 flex flex-col">
          <div className="p-5 border-b border-surface-variant/20">
            <h2 className="font-bold text-on-surface text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">forum</span>Tin nhắn
            </h2>
            <div className="flex items-center bg-surface-container-low border border-surface-variant/40 rounded-xl px-4 py-2.5 gap-2 focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[17px]">search</span>
              <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-on-surface-variant"
                placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-surface-variant/20">
            {loadingRooms ? (
              <div className="p-10 flex justify-center">
                <span className="material-symbols-outlined animate-spin text-2xl text-primary">refresh</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl opacity-30">chat_bubble_outline</span>
                <p className="text-sm">Chưa có tin nhắn nào.</p>
              </div>
            ) : filteredRooms.map((room) => {
              const other = getOther(room);
              const isActive = activeRoom?._id === room._id;
              const name = other?.fullName || other?.name || "Người dùng";

              return (
                <button key={room._id} onClick={() => handleSelectRoom(room)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${isActive ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-surface-container-low"
                    }`}>
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${isActive ? "bg-primary text-on-primary" : "bg-primary/10 text-primary"
                      }`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    {room.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${isActive ? "font-bold text-primary" : "font-semibold text-on-surface"}`}>
                        {name}
                      </p>
                      {room.lastMessageAt && (
                        <span className="text-[10px] text-on-surface-variant flex-shrink-0 ml-2">
                          {formatTime(room.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-primary truncate mt-0.5">
                      {room.postId?.title || room.product?.title || ""}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {room.lastMessage || "Bắt đầu cuộc trò chuyện"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Cửa sổ chat ── */}
        <div className="flex-1 flex flex-col bg-[#F5F5F7] overflow-hidden">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 bg-white border-b border-surface-variant/20 flex items-center justify-between flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
                    {(getOther(activeRoom)?.fullName || getOther(activeRoom)?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">
                      {getOther(activeRoom)?.fullName || getOther(activeRoom)?.name || "Người dùng"}
                    </p>
                    <p className="text-xs text-primary font-medium truncate max-w-[200px]">
                      {activeRoom.postId?.title || activeRoom.product?.title || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Khu vực tin nhắn */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
                {loadingMsgs ? (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-2xl text-primary">refresh</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-2 py-16">
                    <span className="material-symbols-outlined text-4xl opacity-30">chat</span>
                    <p className="text-sm">Hãy gửi tin nhắn đầu tiên!</p>
                  </div>
                ) : messages.map((m, idx) => {
                  const myId = user?.id || user?._id;
                  const senderId = m.senderId?._id || m.senderId || m.sender?._id || m.sender;
                  const isMine = String(senderId) === String(myId);
                  const prevSenderId = idx > 0
                    ? String(messages[idx - 1].senderId?._id || messages[idx - 1].senderId || messages[idx - 1].sender?._id || messages[idx - 1].sender)
                    : null;
                  const isConsecutive = prevSenderId && prevSenderId === String(senderId);

                  return (
                    <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isConsecutive ? "" : "mt-2"}`}>
                      <div className={`flex items-end gap-2 max-w-[65%] ${isMine ? "flex-row-reverse" : ""}`}>
                        {!isMine && !isConsecutive && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mb-1">
                            {(getOther(activeRoom)?.fullName || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        {!isMine && isConsecutive && <div className="w-7 flex-shrink-0" />}

                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMine
                            ? `bg-primary text-on-primary ${isConsecutive ? "rounded-tr-md" : "rounded-br-sm"}`
                            : `bg-white text-on-surface border border-surface-variant/20 ${isConsecutive ? "rounded-tl-md" : "rounded-bl-sm"}`
                          }`}>
                          <p className="leading-relaxed">{m.messageContent || m.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-on-primary/60 text-right" : "text-on-surface-variant"}`}>
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-4 bg-white border-t border-surface-variant/20 flex items-center gap-3 flex-shrink-0">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    className="w-full bg-surface-container-low border border-surface-variant/40 rounded-full pl-5 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Nhập tin nhắn..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                </div>
                <button onClick={handleSend} disabled={!msg.trim()}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${msg.trim()
                      ? "bg-primary text-on-primary hover:opacity-90 active:scale-95 shadow-sm"
                      : "bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed"
                    }`}>
                  <span className="material-symbols-outlined text-[20px]" style={{ marginLeft: "2px" }}>send</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-4">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-primary/30">forum</span>
              </div>
              <p className="font-semibold text-on-surface">Chọn cuộc trò chuyện</p>
              <p className="text-sm">để bắt đầu nhắn tin</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default Messages;
