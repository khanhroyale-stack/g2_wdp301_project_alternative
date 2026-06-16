import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import chatService from "../../services/chat.service";
import { useAuth } from "../../context/AuthContext";

const TinNhan = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  const messagesEndRef = useRef(null);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await chatService.getMyChats();
      if (res.success) {
        setChats(res.data);
        if (res.data.length > 0 && !activeChat) {
          setActiveChat(res.data[0]);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải tin nhắn", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleSend = async () => {
    if (!msg.trim() || !activeChat) return;
    try {
      const res = await chatService.sendMessage(activeChat._id, msg);
      if (res.success) {
        setMsg("");
        // Optimistically add message
        const updatedChat = { ...activeChat, messages: res.data.messages };
        setActiveChat(updatedChat);
        setChats(prev => prev.map(c => c._id === updatedChat._id ? updatedChat : c));
      }
    } catch (err) {
      console.error("Lỗi khi gửi tin nhắn", err);
    }
  };

  const getOtherUser = (chat) => {
    return chat.participants.find(p => p._id !== user?._id) || chat.participants[0];
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const filteredChats = chats.filter(c => {
     const other = getOtherUser(c);
     return other?.name?.toLowerCase().includes(search.toLowerCase()) || c.product?.title?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 flex h-[100dvh]">
        {/* Chat list (Sidebar) */}
        <div className="w-full md:w-80 lg:w-[350px] flex-shrink-0 bg-white border-r border-surface-variant/30 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 border-b border-surface-variant/20">
            <h2 className="font-extrabold text-on-surface text-2xl mb-4 flex items-center gap-2">
               <span className="material-symbols-outlined text-primary text-3xl">forum</span>
               Tin nhắn
            </h2>
            <div className="flex items-center bg-surface-container-lowest border border-surface-variant/40 rounded-xl px-4 py-3 gap-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
              <input 
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-on-surface-variant" 
                placeholder="Tìm kiếm cuộc trò chuyện..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-surface-container-low/30">
            {loading ? (
              <div className="p-10 flex justify-center text-primary"><span className="material-symbols-outlined animate-spin text-3xl">refresh</span></div>
            ) : filteredChats.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant flex flex-col items-center">
                 <span className="material-symbols-outlined text-4xl mb-2 opacity-50">chat_bubble_outline</span>
                 <p className="text-sm">Chưa có tin nhắn nào.</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const other = getOtherUser(chat);
                const isActive = activeChat?._id === chat._id;
                
                return (
                  <button key={chat._id} onClick={() => setActiveChat(chat)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl text-left transition-all duration-300 border ${
                       isActive ? "bg-primary text-white border-transparent shadow-md" : "bg-white hover:bg-surface-container-low border-surface-variant/20 hover:border-surface-variant/50"
                    }`}>
                    <div className="relative">
                       {other?.avatar ? (
                          <img src={other.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                       ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm border-2 ${
                             isActive ? "bg-white/20 text-white border-white/30" : "bg-gradient-to-br from-primary to-primary-fixed text-white border-white"
                          }`}>
                            {other?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                       )}
                       {/* Online indicator placeholder */}
                       <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className={`font-bold text-base truncate ${isActive ? "text-white" : "text-on-surface"}`}>{other?.name || "Người dùng ẩn"}</p>
                        <span className={`text-[10px] whitespace-nowrap ${isActive ? "text-white/80" : "text-on-surface-variant"}`}>
                           {chat.messages?.length > 0 ? formatDate(chat.messages[chat.messages.length - 1].createdAt) : ""}
                        </span>
                      </div>
                      <p className={`text-[11px] font-semibold truncate mb-1 ${isActive ? "text-white/90" : "text-primary"}`}>{chat.product?.title}</p>
                      <p className={`text-xs truncate ${isActive ? "text-white/80" : "text-on-surface-variant"}`}>{chat.lastMessage || "Gửi tin nhắn đầu tiên"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="hidden md:flex flex-1 flex-col bg-[#F5F5F7] relative">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="px-8 py-5 border-b border-surface-variant/20 flex items-center justify-between bg-white/80 backdrop-blur-xl absolute top-0 left-0 right-0 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-4">
                  <div className="relative">
                     {getOtherUser(activeChat)?.avatar ? (
                        <img src={getOtherUser(activeChat).avatar} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                     ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-fixed flex items-center justify-center text-white text-lg font-bold shadow-sm">
                          {getOtherUser(activeChat)?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                     )}
                     <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-on-surface text-lg leading-tight">{getOtherUser(activeChat)?.name || "Người dùng ẩn"}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500 block"></span> Đang hoạt động
                       </p>
                       <span className="text-on-surface-variant text-xs">•</span>
                       <p className="text-xs font-semibold text-primary truncate max-w-[200px]" title={activeChat.product?.title}>Về: {activeChat.product?.title}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                   <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors">
                      <span className="material-symbols-outlined text-[22px]">call</span>
                   </button>
                   <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors">
                      <span className="material-symbols-outlined text-[22px]">more_vert</span>
                   </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-8 pt-28 pb-6 flex flex-col gap-4 custom-scrollbar bg-[#F5F5F7]">
                <div className="text-center text-xs text-on-surface-variant mb-6 font-medium bg-surface-container-low w-fit mx-auto px-4 py-1.5 rounded-full">
                   Hôm nay
                </div>
                
                {activeChat.messages?.map((m, idx) => {
                  const isMine = m.sender === user?._id;
                  const prevMsg = idx > 0 ? activeChat.messages[idx - 1] : null;
                  const isConsecutive = prevMsg && prevMsg.sender === m.sender;
                  
                  return (
                    <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-[-8px]" : "mt-2"}`}>
                      <div className={`flex items-end gap-2 max-w-[70%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                         {!isMine && !isConsecutive && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                               {getOtherUser(activeChat)?.name?.charAt(0).toUpperCase()}
                            </div>
                         )}
                         {!isMine && isConsecutive && <div className="w-8 h-8 flex-shrink-0"></div>}
                         
                         <div className={`px-5 py-3 shadow-sm ${
                             isMine
                               ? `bg-gradient-to-br from-primary to-primary-fixed text-white ${isConsecutive ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-br-sm'}`
                               : `bg-white text-on-surface border border-surface-variant/20 ${isConsecutive ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-bl-sm'}`
                           }`}>
                           <p className="text-sm leading-relaxed">{m.content}</p>
                           <p className={`text-[10px] mt-1.5 ${isMine ? "text-white/70" : "text-on-surface-variant"} ${isMine ? "text-right" : "text-left"}`}>
                             {formatDate(m.createdAt)}
                           </p>
                         </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-surface-variant/20 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 max-w-4xl mx-auto">
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex-shrink-0">
                     <span className="material-symbols-outlined text-[24px]">add_circle</span>
                  </button>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors flex-shrink-0">
                     <span className="material-symbols-outlined text-[24px]">image</span>
                  </button>
                  
                  <div className="flex-1 relative">
                     <input
                       className="w-full bg-surface-container-lowest border border-surface-variant/40 rounded-full pl-5 pr-12 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                       placeholder="Nhập tin nhắn..."
                       value={msg}
                       onChange={(e) => setMsg(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === "Enter") handleSend();
                       }}
                     />
                     <button className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">sentiment_satisfied</span>
                     </button>
                  </div>
                  
                  <button
                    onClick={handleSend}
                    disabled={!msg.trim()}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all flex-shrink-0 ${
                       msg.trim() ? "bg-primary text-white hover:shadow-lg hover:shadow-primary/30 active:scale-95" : "bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] ml-1">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant bg-gradient-to-b from-white to-[#F5F5F7]">
              <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                 <span className="material-symbols-outlined text-7xl text-primary/30">forum</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Xin chào!</h2>
              <p className="text-on-surface-variant">Chọn một cuộc trò chuyện để bắt đầu kết nối.</p>
            </div>
          )}
        </div>
        
        {/* Mobile View Placeholder */}
        {!activeChat && (
           <div className="md:hidden flex-1 flex flex-col items-center justify-center text-on-surface-variant p-8 text-center bg-white">
              <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">chat</span>
              <p className="font-medium text-lg text-on-surface">Chọn tin nhắn để xem</p>
           </div>
        )}
      </main>
    </div>
  );
};
export default TinNhan;
