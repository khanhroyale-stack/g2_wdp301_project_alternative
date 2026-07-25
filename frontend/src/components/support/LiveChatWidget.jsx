import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import supportService from "../../services/support.service";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const getUserId = (value) => value?._id || value?.id || value;

const getUserName = (value) => value?.fullName || value?.name || "Hỗ trợ";

const LiveChatWidget = () => {
  const { user } = useAuth();
  const { socket } = useChat();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messagesList, setMessagesList] = useState([]);

  // Admin không dùng bong bóng chat này, Admin có trang riêng
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && user) {
      scrollToBottom();
    }
  }, [messagesList, isOpen, user]);

  useEffect(() => {
    if (isOpen && user) {
      // Fetch lịch sử tin nhắn
      supportService.getMessages()
        .then(res => {
          if (res.success) {
            setMessagesList(res.data);
          }
        })
        .catch(err => {
          console.error("Lỗi lấy lịch sử chat:", err);
        });

      // Join room support của chính mình
      if (socket) {
        socket.emit("join_support", user._id);
      }
    }

    return () => {
      if (socket && user) {
        socket.emit("leave_support", user._id);
      }
    };
  }, [isOpen, user, socket]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (msg) => {
        setMessagesList(prev => [...prev, msg]);
      };
      socket.on("new_support_message", handleNewMessage);
      
      return () => {
        socket.off("new_support_message", handleNewMessage);
      };
    }
  }, [socket]);

  const handleToggle = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng Chat Hỗ Trợ");
      navigate("/dang-nhap");
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    try {
      const res = await supportService.sendMessage(input);
      if (res.success) {
        setInput("");
      }
    } catch (error) {
      toast.error("Không thể gửi tin nhắn");
    }
  };

  if (user?.role === "admin") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && user && (
        <div className="mb-4 w-[350px] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[550px] max-h-[80vh] animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground flex items-center justify-between shadow-sm relative overflow-hidden">
            {/* Background elements for premium look */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-white/20 rounded-full backdrop-blur-sm shadow-inner">
                <MessageCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  Hỗ trợ trực tuyến
                </h3>
                <p className="text-sm text-primary-foreground/90 mt-0.5 font-medium">
                  EcoTrade luôn sẵn sàng hỗ trợ
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
              aria-label="Đóng chat"
            >
              <X size={22} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc] flex flex-col gap-4">
            <div className="text-center my-2">
              <span className="text-xs font-semibold text-gray-500 bg-gray-200/60 px-3 py-1.5 rounded-full shadow-sm">
                Bắt đầu cuộc trò chuyện
              </span>
            </div>
            {messagesList.map((msg, idx) => {
              const senderId = getUserId(msg.senderId);
              const isMine = String(senderId) === String(user._id || user.id);
              const sender = isMine ? user : (typeof msg.senderId === "object" ? msg.senderId : null);
              const senderName = getUserName(sender);
              const avatarUrl = sender?.avatarUrl;

              return (
                <div 
                  key={idx} 
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-end gap-2.5 max-w-[85%] ${isMine ? "flex-row-reverse" : ""}`}>
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary flex items-center justify-center shadow-sm border border-primary/20">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={senderName} className="h-full w-full object-cover" />
                      ) : (
                        senderName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                      }`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form 
            onSubmit={handleSend}
            className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full px-5 py-3 text-[15px] outline-none transition-all placeholder:text-gray-400"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-primary text-primary-foreground p-3 rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send size={20} className={input.trim() ? "translate-x-0.5" : ""} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={handleToggle}
        className={`${
          isOpen 
            ? "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50" 
            : "bg-primary text-white hover:bg-primary/90"
        } p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center relative z-50 group`}
      >
        {isOpen ? (
          <X size={28} className="transition-transform duration-300 group-hover:rotate-90" />
        ) : (
          <MessageCircle size={28} className="transition-transform duration-300 group-hover:-rotate-12" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default LiveChatWidget;
