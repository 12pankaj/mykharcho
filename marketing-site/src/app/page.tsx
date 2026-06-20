import Link from 'next/link';
import { ShieldCheck, BarChart3, Clock, CheckCircle2, ChevronRight, Zap, Users, Star, ArrowRight, Shield, Smartphone } from 'lucide-react';
import LiveChatWidget from '@/components/LiveChatWidget';

// We'll fetch plans dynamically from the backend on each request
async function getPlans() {
    try {
        const res = await fetch('http://localhost:5010/api/public/plans', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch plans');
        const data = await res.json();
        return data.plans || [];
    } catch (error) {
        console.error('Error fetching plans:', error);
        return [];
    }
}

export default async function Home() {
    const plans = await getPlans();

    return (
        <main className="min-h-screen bg-[#08172c] text-slate-50 font-sans selection:bg-[#c1522d]/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpeg" alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-[#c1522d]" />
                        <span className="text-2xl font-black tracking-tight text-white">My<span className="text-[#c1522d]">Kharcho</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300">
                        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="http://localhost:5173/login" className="px-6 py-2.5 bg-[#c1522d] text-white rounded-full hover:bg-orange-700 transition-all shadow-lg shadow-[#c1522d]/20">
                            Dashboard Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0c3468]/50 blur-[120px] rounded-full pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0c3468] border border-slate-700 text-[#c1522d] text-xs font-black uppercase tracking-widest mb-8">
                        <Zap size={14} /> The Ultimate Finance Engine
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-8 bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                        Manage Your Wealth.<br />Automate Your Life.
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium">
                        Track daily expenses, manage loans with friends, generate EMI statements, and automate your entire financial ecosystem in one beautiful app.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="http://localhost:5173/signup" className="w-full sm:w-auto px-8 py-4 bg-[#c1522d] text-white rounded-full font-black text-lg hover:bg-orange-700 transition-all shadow-xl shadow-[#c1522d]/20 flex items-center justify-center gap-2">
                            Get Started Free <ChevronRight size={20} />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 bg-[#0c3468] text-white border border-[#344c77] rounded-full font-black text-lg hover:bg-[#344c77] transition-all">
                            View Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 bg-slate-900/50 border-t border-slate-800/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-[#c1522d] mb-2">1M+</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Transactions Tracked</p>
                        </div>
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-emerald-500 mb-2">₹50Cr</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Wealth Managed</p>
                        </div>
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-purple-500 mb-2">10k+</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Active Users</p>
                        </div>
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-rose-500 mb-2">99%</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Customer Satisfaction</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 px-6 bg-slate-900/30 border-y border-slate-800/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Powerful Features</h2>
                        <p className="text-slate-400 text-lg">Everything you need to take control of your money.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Smartphone, title: "WhatsApp Reminders", desc: "Our system automatically sends friendly WhatsApp reminders to friends for their pending EMIs. No awkward talks." },
                            { icon: Users, title: "Group Settlements", desc: "Split expenses on trips. Our algorithm minimizes transactions so you make the fewest payments to settle." },
                            { icon: Zap, title: "UPI Deep-Linking", desc: "Settle dues directly using PhonePe, Google Pay, or Paytm directly within the app." },
                            { icon: Shield, title: "AI Receipt Scanner", desc: "Upload a bill or just speak to it! Our AI automatically creates the transaction accurately." },
                            { icon: Clock, title: "Loan & EMI System", desc: "Track money lent to friends. Automatically generate EMI schedules and track due dates effortlessly." },
                            { icon: BarChart3, title: "Multi-Wallet Tracking", desc: "Manage multiple bank accounts, cash wallets, and credit cards in a single, unified dashboard." }
                        ].map((feat, i) => (
                            <div key={i} className="p-8 rounded-[2rem] bg-[#0c3468] border border-[#344c77] hover:border-[#c1522d]/30 transition-all group">
                                <div className="w-14 h-14 bg-[#08172c] border border-[#344c77] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feat.icon className="text-[#c1522d]" size={28} />
                                </div>
                                <h3 className="text-2xl font-black mb-3 text-white">{feat.title}</h3>
                                <p className="text-slate-300 font-medium leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 px-6 bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Your Financial Brain, Simplified.</h2>
                        <p className="text-slate-400 text-lg">MyKharcho works like magic so you don't have to.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#c1522d]/0 via-[#c1522d]/50 to-[#c1522d]/0 -translate-y-1/2 z-0" />

                        <div className="relative z-10 bg-[#0c3468] border border-[#344c77] p-8 rounded-[2rem] text-center">
                            <div className="w-16 h-16 mx-auto bg-[#c1522d] rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-[#c1522d]/30 mb-6">1</div>
                            <h3 className="text-xl font-black mb-3">Connect Wallets</h3>
                            <p className="text-slate-300 font-medium">Add your bank accounts, credit cards, or cash wallets in seconds. No complex setups.</p>
                        </div>
                        <div className="relative z-10 bg-[#0c3468] border border-[#344c77] p-8 rounded-[2rem] text-center">
                            <div className="w-16 h-16 mx-auto bg-[#c1522d] rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-[#c1522d]/30 mb-6">2</div>
                            <h3 className="text-xl font-black mb-3">Add Expenses</h3>
                            <p className="text-slate-300 font-medium">Just upload a receipt or speak it out loud. Our AI categorizes it automatically.</p>
                        </div>
                        <div className="relative z-10 bg-[#0c3468] border border-[#344c77] p-8 rounded-[2rem] text-center">
                            <div className="w-16 h-16 mx-auto bg-[#c1522d] rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-[#c1522d]/30 mb-6">3</div>
                            <h3 className="text-xl font-black mb-3">Lend & Recover</h3>
                            <p className="text-slate-300 font-medium">Create groups or loans. We'll automatically remind them on WhatsApp to pay back via UPI.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Pricing Section */}
            <section id="pricing" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Simple, Transparent Pricing</h2>
                        <p className="text-slate-400 text-lg">Choose the perfect plan for your financial needs.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {plans.length > 0 ? plans.map((plan: any, i: number) => {
                            const isPro = plan.price_monthly > 0 && plan.price_monthly < 500;
                            return (
                                <div key={plan.id} className={`p-8 rounded-[2.5rem] ${isPro ? 'bg-[#c1522d] text-white shadow-2xl shadow-[#c1522d]/20 scale-105 z-10' : 'bg-[#0c3468] border border-[#344c77]'
                                    }`}>
                                    {isPro && <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 w-fit px-3 py-1 rounded-full mb-6">Most Popular</div>}
                                    <h3 className="text-3xl font-black mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-8">
                                        <span className="text-5xl font-black">₹{plan.price_monthly}</span>
                                        <span className={isPro ? 'text-orange-200' : 'text-slate-400'}>/month</span>
                                    </div>
                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={20} className={isPro ? 'text-white' : 'text-emerald-500'} />
                                            <span className="font-medium">Up to {plan.max_wallets} Wallets</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={20} className={isPro ? 'text-white' : 'text-emerald-500'} />
                                            <span className="font-medium">Up to {plan.max_rules} Automation Rules</span>
                                        </div>
                                        {plan.can_auto_emi && (
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 size={20} className={isPro ? 'text-white' : 'text-emerald-500'} />
                                                <span className="font-medium">Automated WhatsApp EMI Tracking</span>
                                            </div>
                                        )}
                                        {plan.can_export_pdf && (
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 size={20} className={isPro ? 'text-blue-300' : 'text-emerald-500'} />
                                                <span className="font-medium">PDF Statement Export</span>
                                            </div>
                                        )}
                                    </div>
                                    <Link href="http://localhost:5173/signup" className={`block text-center w-full py-4 rounded-2xl font-black transition-all ${isPro ? 'bg-white text-[#c1522d] hover:bg-slate-50' : 'bg-[#08172c] text-white hover:bg-[#061224] border border-[#344c77]'
                                        }`}>
                                        Get Started
                                    </Link>
                                </div>
                            );
                        }) : (
                            <div className="col-span-3 text-center text-slate-500 font-bold py-20">
                                Loading pricing plans from the server...
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-32 px-6 bg-slate-900/30 border-y border-slate-800/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Wall of Love</h2>
                        <p className="text-slate-400 text-lg">Don't just take our word for it. Hear from our incredible users.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Rahul S.", role: "Software Engineer", text: "MyKharcho completely changed how I manage my salary. The UI is just mind-blowing. It feels like a premium iOS app on the web." },
                            { name: "Priya M.", role: "Freelancer", text: "I lend money to friends often and keeping track was a nightmare. The Loan module with auto-EMI is an absolute game changer!" },
                            { name: "Amit K.", role: "Business Owner", text: "I love the automated push notifications. 'Tum tho busy ho, mene add kar diya' always brings a smile to my face. Best app ever." }
                        ].map((t, i) => (
                            <div key={i} className="p-8 bg-[#0c3468] border border-[#344c77] rounded-[2rem] relative">
                                <div className="flex gap-1 text-[#c1522d] mb-6">
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                </div>
                                <p className="text-slate-300 font-medium text-lg leading-relaxed mb-8">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#08172c] rounded-full flex items-center justify-center text-[#c1522d] font-black">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{t.name}</h4>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t border-slate-800 text-center text-slate-500 text-sm font-bold">
                <p>&copy; {new Date().getFullYear()} MyKharcho. All rights reserved.</p>
            </footer>

            {/* Live Chat Widget */}
            <LiveChatWidget />
        </main>
    );
}
