import React, { useState, useEffect } from 'react';
import { SupportService } from '../api/shared/apiService';
import { 
    LifeBuoy, 
    Plus, 
    MessageSquare, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Send,
    ChevronRight,
    Search,
    RefreshCcw,
    Sparkles,
    UserCheck
} from 'lucide-react';

const Support: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'Normal' });

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await SupportService.getTickets();
            setTickets(res.data.tickets);
        } catch (err) {
            console.error('Error fetching tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (ticketId: number) => {
        try {
            const res = await SupportService.getMessages(ticketId);
            setMessages(res.data.messages);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        let interval: any;
        if (selectedTicket) {
            fetchMessages(selectedTicket.id);
            interval = setInterval(() => fetchMessages(selectedTicket.id), 10000);
        }
        return () => clearInterval(interval);
    }, [selectedTicket]);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await SupportService.createTicket(newTicket);
            setIsCreateModalOpen(false);
            setNewTicket({ subject: '', description: '', priority: 'Normal' });
            fetchTickets();
        } catch (err) {
            console.error('Error creating ticket:', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await SupportService.addMessage(selectedTicket.id, newMessage);
            setNewMessage('');
            fetchMessages(selectedTicket.id);
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const selectTicket = (ticket: any) => {
        setSelectedTicket(ticket);
        fetchMessages(ticket.id);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-orange-600/10 text-orange-500 border-orange-600/20';
            case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Resolved': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        <LifeBuoy className="text-blue-500" size={40} /> Help Desk
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Our support team is ready to help you manage your financial empire.</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                >
                    <Plus size={20} strokeWidth={3} /> Raise a Ticket
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tickets List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 h-[600px] flex flex-col">
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
                            <Search size={18} className="text-slate-500" />
                            <input type="text" placeholder="Search tickets..." className="bg-transparent border-none focus:ring-0 text-sm w-full text-white font-medium" />
                        </div>

                        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                            {tickets.length > 0 ? tickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    onClick={() => selectTicket(ticket)}
                                    className={`p-5 rounded-2xl border transition-all cursor-pointer group ${selectedTicket?.id === ticket.id ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getStatusStyle(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-white font-black text-sm group-hover:text-blue-400 transition-colors mb-1 truncate">{ticket.subject}</h4>
                                    <p className="text-slate-500 text-xs truncate font-medium">{ticket.description}</p>
                                </div>
                            )) : (
                                <div className="text-center py-10 opacity-50">
                                    <MessageSquare size={40} className="mx-auto mb-4 text-slate-700" />
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-600">No tickets found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Conversation Area */}
                <div className="lg:col-span-2">
                    {selectedTicket ? (
                        <div className="bg-slate-950/50 border border-slate-800 rounded-3xl h-[600px] flex flex-col overflow-hidden relative">
                            <div className="p-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-white">{selectedTicket.subject}</h3>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                            <Clock size={12} /> Ticket ID: #{selectedTicket.id} • Created {new Date(selectedTicket.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => fetchMessages(selectedTicket.id)}
                                            className="p-2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            <RefreshCcw size={18} />
                                        </button>
                                        <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${getStatusStyle(selectedTicket.status)}`}>
                                            {selectedTicket.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#08172c_100%)]">
                                {/* Ticket Description as first message */}
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-700">
                                        <p className="text-white text-sm leading-relaxed">{selectedTicket.description}</p>
                                    </div>
                                </div>

                                 {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 border shadow-lg ${
                                            msg.sender_type === 'user' 
                                                ? 'bg-blue-600 border-blue-400 rounded-tr-none' 
                                                : msg.sender_type === 'ai'
                                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 rounded-tl-none ring-1 ring-blue-500/20'
                                                : 'bg-orange-700 border-orange-500 text-white rounded-tl-none'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                                {msg.sender_type === 'ai' && <Sparkles size={10}/>}
                                                {(msg.sender_type === 'admin' || msg.sender_type === 'agent') && <UserCheck size={10}/>}
                                                <span className="text-[8px] font-black uppercase tracking-tighter">
                                                    {msg.sender_type === 'ai' ? 'AI Support Assistant' : (msg.sender_type === 'admin' || msg.sender_type === 'agent') ? 'Support Specialist' : 'You'}
                                                </span>
                                            </div>
                                            <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${msg.sender_type === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-slate-950 border-t border-slate-800">
                                <form onSubmit={handleSendMessage} className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message here..." 
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <button 
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-90"
                                    >
                                        <Send size={24} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-950/50 border border-slate-800 border-dashed rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-10">
                            <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-8 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                <MessageSquare size={48} className="text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Select a conversation</h3>
                            <p className="text-slate-500 max-w-sm font-medium">Select a ticket from the left sidebar to view the conversation and get help from our team.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-8">Raise a Ticket</h2>
                        <form onSubmit={handleCreateTicket} className="space-y-6">
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Subject</label>
                                <input 
                                    required
                                    type="text" 
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Briefly describe your issue"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Priority</label>
                                <select 
                                    value={newTicket.priority}
                                    onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Normal">Normal</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent ⚡</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Description</label>
                                <textarea 
                                    required
                                    rows={4}
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    placeholder="Detailed explanation of the problem..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-95"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Support;
