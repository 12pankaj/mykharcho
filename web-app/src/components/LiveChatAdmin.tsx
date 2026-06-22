import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../api/shared/apiService';
import { Send, UserCircle, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

export default function LiveChatAdmin() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ [visitorId: string]: any[] }>({});
    const [reply, setReply] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Connect to Socket.io server
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server as admin');
            newSocket.emit('join_admin');
        });

        newSocket.on('visitor_waiting', (data) => {
            console.log('New visitor:', data);
            setVisitors(prev => {
                if (!prev.find(v => v.visitorId === data.visitorId)) {
                    return [...prev, data];
                }
                return prev;
            });
            
            // Initialize their message history
            setMessages(prev => {
                if (!prev[data.visitorId]) {
                    return {
                        ...prev,
                        [data.visitorId]: [{ sender: 'visitor', message: data.message }]
                    };
                }
                return prev;
            });
        });

        newSocket.on('receive_admin_message', (data) => {
            const { visitorId, message } = data;
            setMessages(prev => ({
                ...prev,
                [visitorId]: [...(prev[visitorId] || []), { sender: 'visitor', message }]
            }));
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeVisitorId]);

    const handleSend = () => {
        if (!reply.trim() || !activeVisitorId || !socket) return;
        
        // Update local state
        setMessages(prev => ({
            ...prev,
            [activeVisitorId]: [...(prev[activeVisitorId] || []), { sender: 'admin', message: reply }]
        }));

        // Send to server
        socket.emit('admin_send_message', { visitorId: activeVisitorId, message: reply });
        setReply('');
    };

    return (
        <div className="flex h-[600px] bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            {/* Sidebar (Visitors) */}
            <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/50">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-600 animate-pulse" />
                        Live Visitors
                    </h3>
                    <p className="text-slate-500 text-xs font-bold mt-1">Marketing Site Leads</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {visitors.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <Clock className="mx-auto text-slate-500 mb-2" />
                            <p className="text-slate-500 text-xs font-bold">No active visitors</p>
                        </div>
                    ) : (
                        visitors.map(v => (
                            <div 
                                key={v.visitorId}
                                onClick={() => setActiveVisitorId(v.visitorId)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                    activeVisitorId === v.visitorId 
                                        ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' 
                                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <UserCircle size={24} className={activeVisitorId === v.visitorId ? 'text-blue-200' : 'text-slate-500'} />
                                    <div>
                                        <p className="font-bold text-sm">{v.name}</p>
                                        <p className={`text-[10px] ${activeVisitorId === v.visitorId ? 'text-blue-200' : 'text-slate-500'}`}>{v.email}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-950/30">
                {activeVisitorId ? (
                    <>
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UserCircle size={30} className="text-slate-400" />
                                <div>
                                    <h4 className="text-white font-black">
                                        {visitors.find(v => v.visitorId === activeVisitorId)?.name}
                                    </h4>
                                    <span className="text-orange-500 text-[10px] font-bold uppercase tracking-widest bg-orange-600/10 px-2 py-0.5 rounded-md">Online now</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setVisitors(visitors.filter(v => v.visitorId !== activeVisitorId));
                                    setActiveVisitorId(null);
                                }}
                                className="p-2 text-orange-500 hover:bg-orange-600/10 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                            >
                                <CheckCircle2 size={16} /> Resolve Chat
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {(messages[activeVisitorId] || []).map((m, i) => (
                                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm font-medium ${
                                        m.sender === 'admin' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                    }`}>
                                        {m.message}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-950/50">
                            <div className="flex gap-3">
                                <input 
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 text-sm font-medium text-white outline-none focus:border-blue-500"
                                    placeholder="Type your reply to the visitor..."
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button 
                                    onClick={handleSend}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <Send size={18} /> Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                        <MessageSquare size={48} className="text-slate-600 mb-4" />
                        <p className="text-slate-400 font-bold">Select a visitor to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
