import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import supportService from "../../services/support.service";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
  }, [messagesList, isOpen]);

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
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && user && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[450px]">
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle size={20} />
                Hỗ trợ trực tuyến
              </h3>
              <p className="text-xs text-primary-foreground/80 mt-1">
                EcoTrade luôn sẵn sàng hỗ trợ bạn
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            <div className="text-center text-xs text-gray-500 my-2">
              Bắt đầu cuộc trò chuyện
            </div>
            {messagesList.map((msg, idx) => {
              const isMine = msg.senderId._id === user._id || msg.senderId === user._id;
              return (
                <div 
                  key={idx} 
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      isMine 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form 
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:ring-1 focus:ring-primary rounded-full px-4 py-2 text-sm outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={handleToggle}
        className={`${
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
        } text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center relative`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
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
