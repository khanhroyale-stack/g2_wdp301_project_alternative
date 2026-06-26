import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import supportService from "../../services/support.service";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import toast from "react-hot-toast";

const SupportManagement = () => {
  const { user } = useAuth();
  const { socket } = useChat();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const fetchCustomers = async () => {
    try {
      const res = await supportService.getActiveCustomers();
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      toast.error("Lỗi lấy danh sách khách hàng");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      supportService.getMessages(selectedCustomer._id)
        .then(res => {
          if (res.success) {
            setMessages(res.data);
            scrollToBottom();
          }
        })
        .catch(err => {
          toast.error("Lỗi lấy tin nhắn");
        });
      
      if (socket) {
        socket.emit("join_support", selectedCustomer._id);
      }
    }

    return () => {
      if (socket && selectedCustomer) {
        socket.emit("leave_support", selectedCustomer._id);
      }
    };
  }, [selectedCustomer, socket]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (msg) => {
        if (selectedCustomer && (msg.customerId === selectedCustomer._id || msg.senderId._id === selectedCustomer._id || msg.senderId === selectedCustomer._id)) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
        fetchCustomers();
      };

      const handleListUpdate = () => {
        fetchCustomers();
      };

      socket.on("new_support_message", handleNewMessage);
      socket.on("support_list_updated", handleListUpdate);

      return () => {
        socket.off("new_support_message", handleNewMessage);
        socket.off("support_list_updated", handleListUpdate);
      };
    }
  }, [socket, selectedCustomer]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedCustomer) return;

    try {
      const res = await supportService.sendMessage(input, selectedCustomer._id);
      if (res.success) {
        setInput("");
        fetchCustomers();
      }
    } catch (err) {
      toast.error("Lỗi gửi tin nhắn");
    }
  };

  return (
    <div className="app-shell flex h-screen bg-[#F5F5F7] overflow-hidden">
      <Sidebar variant="admin" />
      <main className="flex-1 flex flex-col md:ml-72 bg-white m-4 rounded-[28px] shadow-sm border border-gray-100 overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">support_agent</span>
            Hỗ trợ trực tuyến
          </h2>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar danh sách khách hàng */}
          <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
            <div className="p-4 border-b border-gray-100">
              <input 
                type="text" 
                placeholder="Tìm kiếm khách hàng..." 
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {customers.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-10">Chưa có khách hàng nào</p>
              )}
              {customers.map(c => (
                <div 
                  key={c._id} 
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedCustomer?._id === c._id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={c.avatarUrl || "https://ui-avatars.com/api/?name=" + c.fullName} 
                      alt={c.fullName} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm truncate">{c.fullName}</h4>
                        {c.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cửa sổ Chat */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedCustomer ? (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <img 
                    src={selectedCustomer.avatarUrl || "https://ui-avatars.com/api/?name=" + selectedCustomer.fullName} 
                    alt={selectedCustomer.fullName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold">{selectedCustomer.fullName}</h3>
                    <p className="text-xs text-gray-500">{selectedCustomer.email}</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/50">
                  {messages.map((msg, idx) => {
                    const isAdmin = msg.senderId.role === "admin" || msg.senderId === user._id;
                    return (
                      <div key={idx} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-5 py-2.5 text-sm ${
                          isAdmin 
                            ? "bg-primary text-white rounded-tr-sm" 
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn hỗ trợ..."
                    className="flex-1 bg-gray-100 rounded-full px-5 py-3 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="bg-primary hover:bg-primary/90 text-white w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                <span className="material-symbols-outlined text-6xl opacity-50">forum</span>
                <p>Chọn một cuộc trò chuyện để bắt đầu hỗ trợ</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportManagement;
