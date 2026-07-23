import Link from 'next/link';
import { Clock, CheckCircle2, ChevronRight, Zap, Users, Star, Shield, Smartphone, MessageSquare, TrendingUp, Workflow, Wallet } from 'lucide-react';
import LiveChatWidget from '@/components/LiveChatWidget';

export const dynamic = 'force-dynamic';

// We'll fetch plans dynamically from the backend on each request
async function getPlans() {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';
        const res = await fetch(`${apiUrl}/public/plans`, { cache: 'no-store' });
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
        <main className="min-h-screen bg-[#0e1117] text-slate-50 font-sans selection:bg-amber-500/30 bg-grid-pattern relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[5%] left-1/4 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none z-0 animate-pulse-slow" />
            <div className="absolute top-[35%] right-1/4 w-[500px] h-[500px] bg-yellow-600/5 blur-[120px] rounded-full pointer-events-none z-0 animate-pulse-reverse" />
            <div className="absolute bottom-[20%] left-1/3 w-[700px] h-[700px] bg-amber-600/5 blur-[160px] rounded-full pointer-events-none z-0 animate-pulse-slow" />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/newlogo.png" alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500" />
                        <span className="text-2xl font-black tracking-tight text-white">My<span className="text-amber-500">Kharcho</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300">
                        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href={`${process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://app.mykharcho.in'}/login`} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-full transition-all shadow-lg shadow-amber-500/10">
                            Dashboard Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-widest mb-8">
                        <Zap size={14} /> The Ultimate Finance Engine
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-8 bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                        Manage Your Wealth.<br />Automate Your Life.
                    </h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium">
                        Track daily expenses, manage loans with friends, generate EMI statements, and automate your entire financial ecosystem in one beautiful app.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href={`${process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://app.mykharcho.in'}/login`} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-full font-black text-lg transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2">
                            Get Started Free <ChevronRight size={20} />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white border border-slate-800 rounded-full font-black text-lg hover:bg-slate-800 transition-all">
                            View Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 bg-slate-950/40 border-t border-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-amber-500 mb-2">1M+</h4>
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
            <section id="features" className="py-32 px-6 bg-[#111318]/30 border-y border-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Powerful Features</h2>
                        <p className="text-slate-400 text-lg">Everything you need to take control of your money.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: Smartphone, title: "WhatsApp Reminders", desc: "Our system automatically sends friendly WhatsApp reminders to friends for their pending EMIs. No awkward talks." },
                            { icon: Shield, title: "AI Receipt Scanner", desc: "Upload a bill or just speak to it! Our AI automatically creates the transaction accurately." },
                            { icon: Clock, title: "Loan & EMI System", desc: "Track money lent to friends. Automatically generate EMI schedules and track due dates effortlessly." },
                            { icon: Users, title: "Group Settlements", desc: "Split expenses on trips. Our algorithm minimizes transactions so you make the fewest payments to settle." },
                            { icon: Wallet, title: "Multi-Wallet Tracking", desc: "Manage multiple bank accounts, cash wallets, and credit cards in a single, unified dashboard." },
                            { icon: Workflow, title: "Smart Financial Rules", desc: "Automate your recurring bills, subscriptions, or salaries. Set custom triggers to record income or expenses automatically." },
                            { icon: TrendingUp, title: "Analytics & PDF Reports", desc: "Understand your cashflow with interactive line, bar, and pie charts. Export beautiful PDF summaries of your transactions." },
                            { icon: MessageSquare, title: "24/7 Support Desk", desc: "Get real-time human chat support directly inside your dashboard. Settle billing queries and resolve technical tickets instantly." }
                        ].map((feat, i) => (
                            <div key={i} className="p-8 rounded-[2rem] bg-[#161920] border border-slate-900 hover:border-amber-500/30 transition-all group">
                                <div className="w-14 h-14 bg-[#0e1117] border border-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feat.icon className="text-amber-500" size={28} />
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
                        <p className="text-slate-400 text-lg">MyKharcho works like magic so you don&apos;t have to.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 -translate-y-1/2 z-0" />

                        <div className="relative z-10 bg-[#161920] border border-slate-900 p-8 rounded-[2rem] text-center">
                            <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-500/20 mb-6">1</div>
                            <h3 className="text-xl font-black mb-3">Connect Wallets</h3>
                            <p className="text-slate-300 font-medium">Add your bank accounts, credit cards, or cash wallets in seconds. No complex setups.</p>
                        </div>
                        <div className="relative z-10 bg-[#161920] border border-slate-900 p-8 rounded-[2rem] text-center">
                            <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-500/20 mb-6">2</div>
                            <h3 className="text-xl font-black mb-3">Add Expenses</h3>
                            <p className="text-slate-300 font-medium">Just upload a receipt or speak it out loud. Our AI categorizes it automatically.</p>
                        </div>
                        <div className="relative z-10 bg-[#161920] border border-slate-900 p-8 rounded-[2rem] text-center">
                            <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-500/20 mb-6">3</div>
                            <h3 className="text-xl font-black mb-3">Lend & Recover</h3>
                            <p className="text-slate-300 font-medium">Create groups or loans. We&apos;ll automatically remind them on WhatsApp to pay back via UPI.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile App Section */}
            <section className="py-32 px-6 bg-gradient-to-b from-slate-950 to-[#0e1117] border-b border-slate-900/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-widest">
                            <Smartphone size={14} /> Mobile App Available
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
                            Track on the Go. <br />
                            Manage Anywhere.
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Access MyKharcho directly from your pocket. Enjoy real-time synchronization with your web dashboard, instant push alerts, and quick smart-add features on your iOS or Android device.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <button className="flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-2xl transition-all shadow-lg active:scale-95">
                                <Star size={20} className="text-amber-500" fill="currentColor" />
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Download on the</p>
                                    <p className="text-sm font-black">App Store</p>
                                </div>
                            </button>
                            <button className="flex items-center gap-3 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 rounded-2xl transition-all shadow-lg active:scale-95">
                                <Zap size={20} className="text-amber-500" fill="currentColor" />
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Get it on</p>
                                    <p className="text-sm font-black">Google Play</p>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center relative">
                        {/* Premium custom mockup using HTML/CSS */}
                        <div className="w-[280px] h-[560px] bg-slate-900 border-[8px] border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between p-6">
                            {/* Camera Notch */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                                <div className="w-3 h-3 bg-slate-900 rounded-full" />
                            </div>
                            
                            {/* App Header */}
                            <div className="pt-6 flex justify-between items-center z-10">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white">₹</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white">MyKharcho</span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                            </div>

                            {/* Card Mockup */}
                            <div className="my-auto space-y-4 z-10">
                                <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-4 shadow-lg text-white">
                                    <p className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">Available Balance</p>
                                    <p className="text-2xl font-black mt-1">₹4,89,500</p>
                                    <div className="flex justify-between items-center mt-6">
                                        <span className="text-[10px] font-bold text-amber-100">Main Account</span>
                                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Pro</span>
                                    </div>
                                </div>

                                <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-3 border border-slate-800">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recent Activity</p>
                                    <div className="flex justify-between items-center mt-2.5">
                                        <span className="text-xs font-bold text-white">Office Rent</span>
                                        <span className="text-xs font-black text-rose-500">-₹12,000</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-bold text-white">Salary Credit</span>
                                        <span className="text-xs font-black text-emerald-500">+₹85,000</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Tab Bar */}
                            <div className="flex justify-between items-center bg-slate-950/80 border border-slate-800/50 rounded-full px-4 py-2.5 z-10">
                                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                                <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                                <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                                <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                            </div>
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
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {plans.length > 0 ? plans.map((plan: any) => {
                            const isPro = plan.price_monthly > 0 && plan.price_monthly < 500;
                            return (
                                <div key={plan.id} className={`p-8 rounded-[2.5rem] ${isPro ? 'bg-gradient-to-b from-amber-500 to-yellow-600 text-white shadow-2xl shadow-amber-500/20 scale-105 z-10' : 'bg-[#161920] border border-slate-900'
                                    }`}>
                                    {isPro && <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 w-fit px-3 py-1 rounded-full mb-6">Most Popular</div>}
                                    <h3 className="text-3xl font-black mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-8">
                                        <span className="text-5xl font-black">₹{plan.price_monthly}</span>
                                        <span className={isPro ? 'text-amber-100' : 'text-slate-400'}>/month</span>
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
                                                <CheckCircle2 size={20} className={isPro ? 'text-amber-100' : 'text-emerald-500'} />
                                                <span className="font-medium">PDF Statement Export</span>
                                            </div>
                                        )}
                                    </div>
                                    <Link href={`${process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://app.mykharcho.in'}/login`} className={`block text-center w-full py-4 rounded-2xl font-black transition-all ${isPro ? 'bg-white text-amber-600 hover:bg-slate-50' : 'bg-[#0e1117] text-white hover:bg-black border border-slate-800'
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
            <section className="py-32 px-6 bg-slate-950/40 border-y border-slate-900/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">Wall of Love</h2>
                        <p className="text-slate-400 text-lg">Don&apos;t just take our word for it. Hear from our incredible users.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Rahul S.", role: "Software Engineer", text: "MyKharcho completely changed how I manage my salary. The UI is just mind-blowing. It feels like a premium iOS app on the web." },
                            { name: "Priya M.", role: "Freelancer", text: "I lend money to friends often and keeping track was a nightmare. The Loan module with auto-EMI is an absolute game changer!" },
                            { name: "Amit K.", role: "Business Owner", text: "I love the automated push notifications. 'Tum tho busy ho, mene add kar diya' always brings a smile to my face. Best app ever." }
                        ].map((t, i) => (
                            <div key={i} className="p-8 bg-[#161920] border border-slate-900 rounded-[2rem] relative">
                                <div className="flex gap-1 text-amber-500 mb-6">
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                </div>
                                <p className="text-slate-300 font-medium text-lg leading-relaxed mb-8">&ldquo;{t.text}&rdquo;</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#0e1117] rounded-full flex items-center justify-center text-amber-500 font-black">
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
            <footer className="py-10 border-t border-slate-900 text-center text-slate-500 text-sm font-bold flex flex-col items-center gap-4">
                <div className="flex gap-6">
                    <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <a href="mailto:support@mykharcho.in" className="hover:text-white transition-colors">Contact Support</a>
                </div>
                <p>&copy; {new Date().getFullYear()} MyKharcho. All rights reserved.</p>
            </footer>

            {/* Live Chat Widget */}
            <LiveChatWidget />
        </main>
    );
}
