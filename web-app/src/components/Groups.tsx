import React, { useEffect, useState } from 'react';
import { GroupService } from '../api/shared/apiService';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Groups: React.FC = () => {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const navigate = useNavigate();

    const fetchGroups = async () => {
        try {
            const res = await GroupService.getGroups();
            setGroups(res.data.groups);
        } catch (error) {
            console.error("Failed to fetch groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await GroupService.createGroup({ name, description });
            setShowModal(false);
            setName('');
            setDescription('');
            fetchGroups();
        } catch (error) {
            console.error("Error creating group");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-100">Groups & Splits</h1>
                    <p className="text-slate-400 mt-1">Split expenses easily with friends</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-900/20 font-bold"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Group</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">No Groups Found</h3>
                    <p className="text-slate-500 mt-2">Create a group to start splitting expenses.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(group => (
                        <div key={group.id} 
                             onClick={() => navigate(`/groups/${group.id}`)}
                             className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-orange-500/50 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{group.name}</h3>
                            <p className="text-slate-400 text-sm line-clamp-2">{group.description || 'No description provided.'}</p>
                            
                            <div className="mt-6 flex items-center justify-between text-orange-500 font-semibold group-hover:text-orange-400">
                                <span>View Details</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] rounded-3xl w-full max-w-md overflow-hidden border border-slate-800 shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white">Create New Group</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Group Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                                    placeholder="e.g. Goa Trip"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Description</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all resize-none"
                                    placeholder="Trip details..."
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="pt-2 flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-orange-900/20"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
