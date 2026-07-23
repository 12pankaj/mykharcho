/* eslint-disable */
'use client';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, X, Send, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<{ sender: string, message: string }[]>([]);
    const [reply, setReply] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !socket) {
            const newSocket = io('http://72.60.222.102:5010');
            
            newSocket.on('receive_visitor_message', (data) => {
                setMessages(prev => [...prev, { sender: 'admin', message: data.message }]);
            });
            
            setSocket(newSocket);
        }
        
        return () => {
            // Only disconnect if the component unmounts, we keep the connection alive while the chat is open
        };
    }, [isOpen]); // remove socket from dependencies to prevent infinite loop/immediate disconnect

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleJoin = () => {
        if (!name.trim() || !email.trim() || !socket) return;
        socket.emit('join_visitor', { name, email });
        setHasJoined(true);
        setMessages([{ sender: 'admin', message: 'Hello! How can we help you today?' }]);
    };

    const handleSend = () => {
        if (!reply.trim() || !socket) return;
        
        setMessages(prev => [...prev, { sender: 'visitor', message: reply }]);
        socket.emit('visitor_send_message', { message: reply });
        setReply('');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-5 flex justify-between items-center text-white">
                            <div>
                                <h3 className="font-bold">Live Support</h3>
                                <p className="text-amber-100 text-xs">We typically reply in minutes</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {!hasJoined ? (
                            <div className="flex-1 p-6 flex flex-col justify-center">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="text-amber-500" size={32} />
                                    </div>
                                    <h4 className="font-bold text-slate-800">Welcome to MyKharcho</h4>
                                    <p className="text-sm text-slate-500 mt-1">Please enter your details to start chatting with our team.</p>
                                </div>
                                <div className="space-y-4">
                                    <input 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                        placeholder="Your Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                    <input 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                        placeholder="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleJoin}
                                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-yellow-700 transition-all"
                                    >
                                        Start Chat
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                                            {m.sender === 'admin' && (
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mr-2 flex-shrink-0">
                                                    <UserCircle size={18} className="text-amber-500" />
                                                </div>
                                            )}
                                            <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                                                m.sender === 'visitor' 
                                                    ? 'bg-amber-500 text-white rounded-tr-sm' 
                                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm'
                                            }`}>
                                                {m.message}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-4 bg-white border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500"
                                            placeholder="Type a message..."
                                            value={reply}
                                            onChange={e => setReply(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                                        />
                                        <button 
                                            onClick={handleSend}
                                            className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white hover:bg-amber-600 transition-colors"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
                    isOpen ? 'bg-slate-800 text-white rotate-90 scale-90' : 'bg-amber-500 text-white hover:scale-105 hover:bg-amber-600'
                }`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
}
