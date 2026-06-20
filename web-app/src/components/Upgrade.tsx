import React from 'react';
import { Check, Shield, Zap, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentService, UserService } from '../api/shared/apiService';

const Upgrade: React.FC = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(false);
    const [profile, setProfile] = React.useState<any>(null);
    const [plans, setPlans] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchProfileAndPlans = async () => {
            try {
                const profileRes = await UserService.getProfile();
                setProfile(profileRes.data);
                
                // Fetch public plans to map by name instead of hardcoded ID
                // Using axios directly or assuming api is available, actually we can just use the public endpoint directly
                const plansRes = await fetch('http://localhost:5010/api/public/plans');
                const plansData = await plansRes.json();
                setPlans(plansData.plans || []);
            } catch (err) {
                console.error('Failed to fetch profile or plans', err);
            }
        };
        fetchProfileAndPlans();
    }, []);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (planName: string) => {
        setLoading(true);
        try {
            // Map plan name to our DB UUIDs dynamically
            const targetPlan = plans.find(p => p.name === planName);
            if (!targetPlan) {
                alert('Plan details not loaded yet. Please try again.');
                setLoading(false);
                return;
            }
            const planId = targetPlan.id;

            const res = await PaymentService.createOrder(planId);
            if (!res.data.success) {
                alert('Failed to create order');
                setLoading(false);
                return;
            }

            const { order, plan } = res.data;

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                alert('Razorpay SDK failed to load');
                setLoading(false);
                return;
            }

            // Fetch profile for prefill data
            const profileRes = await UserService.getProfile();
            const user = profileRes.data;

            const options = {
                key: 'rzp_test_Slp9auqtXJL30c', // Using the test key from your .env
                amount: order.amount,
                currency: order.currency,
                name: 'SPARK PRO',
                description: `Upgrade to ${plan.name} Plan`,
                image: 'https://ui-avatars.com/api/?name=SP&background=2563eb&color=fff',
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await PaymentService.verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: planId
                        });

                        if (verifyRes.data.success) {
                            alert('Payment Successful! You are now a Premium user.');
                            // Trigger profile update globally
                            window.dispatchEvent(new Event('profileUpdated'));
                            navigate('/dashboard');
                        }
                    } catch (err) {
                        console.error(err);
                        alert('Payment verification failed.');
                    }
                },
                prefill: {
                    name: user.full_name,
                    email: user.email,
                    contact: '9999999999' // placeholder
                },
                theme: {
                    color: '#2563eb'
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();
            
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-black tracking-widest uppercase mb-6 border border-blue-500/20">
                    <Crown size={16} /> Upgrade to Elite
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    Unlock True Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Freedom</span>
                </h1>
                <p className="text-slate-400 text-lg">
                    Supercharge your expense tracking with unlimited wallets, full automation, and legally compliant loan auto-EMIs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Basic Plan */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-all">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-white mb-2">Basic</h3>
                        <p className="text-slate-500 text-sm font-bold">For personal tracking</p>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">$0</span>
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">/ forever</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 flex-1 mb-8">
                        <Feature icon={<Check size={18} className="text-slate-400"/>} text="2 Wallets (Accounts)" />
                        <Feature icon={<Check size={18} className="text-slate-400"/>} text="2 Automation Rules" />
                        <Feature icon={<Check size={18} className="text-slate-400"/>} text="Basic Manual Loans" />
                        <Feature icon={<Check size={18} className="text-slate-400"/>} text="CSV Exports Only" />
                    </div>

                    <button disabled className="w-full py-4 rounded-xl font-black text-slate-500 bg-slate-800 border border-slate-800 flex items-center justify-center gap-2">
                        {(!profile || profile.current_plan_id === plans.find(p => p.name === 'Free')?.id) ? 'Current Plan' : 'Free Tier'}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-gradient-to-b from-blue-600/20 to-slate-950/50 border border-blue-500/50 rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-blue-900/20 transform md:-translate-y-4">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                    <div className="absolute top-6 right-6">
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-blue-500/30">Popular</span>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-black text-white mb-2">Pro</h3>
                        <p className="text-blue-200/60 text-sm font-bold">For serious budgeters</p>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">$9.99</span>
                            <span className="text-blue-200/60 font-bold uppercase tracking-widest text-xs">/ month</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 flex-1 mb-8">
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="5 Wallets (Accounts)" />
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="10 Automation Rules" />
                        <Feature icon={<Zap size={18} className="text-amber-400"/>} text="Auto-Generate Loan EMIs" />
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="Professional PDF Exports" />
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="Priority Email Support" />
                    </div>

                    <button 
                        disabled={loading || (profile && plans.find(p => p.name === 'Pro') && profile.current_plan_id === plans.find(p => p.name === 'Pro')?.id)} 
                        onClick={() => handleUpgrade('Pro')} 
                        className={`w-full py-4 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${profile && plans.find(p => p.name === 'Pro') && profile.current_plan_id === plans.find(p => p.name === 'Pro')?.id ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/30'}`}
                    >
                        {profile && plans.find(p => p.name === 'Pro') && profile.current_plan_id === plans.find(p => p.name === 'Pro')?.id ? 'Current Plan' : (loading ? 'Processing...' : <>Upgrade to Pro <ArrowRight size={18}/></>)}
                    </button>
                </div>

                {/* Elite Plan */}
                <div className="bg-slate-950/50 border border-amber-500/30 rounded-[2rem] p-8 flex flex-col relative overflow-hidden group hover:border-amber-500/50 transition-all">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-2 flex items-center gap-2">
                            Elite <Crown size={20} className="text-amber-400"/>
                        </h3>
                        <p className="text-slate-500 text-sm font-bold">For businesses & whales</p>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">$19.99</span>
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">/ month</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 flex-1 mb-8">
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="Unlimited Wallets" />
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="Unlimited Automation Rules" />
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="Unlimited Auto-EMIs" />
                        <Feature icon={<Shield size={18} className="text-amber-400"/>} text="White-label PDF Reports" />
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="24/7 Concierge Support" />
                    </div>

                    <button 
                        disabled={loading || (profile && plans.find(p => p.name === 'Elite') && profile.current_plan_id === plans.find(p => p.name === 'Elite')?.id)} 
                        onClick={() => handleUpgrade('Elite')} 
                        className={`w-full py-4 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${profile && plans.find(p => p.name === 'Elite') && profile.current_plan_id === plans.find(p => p.name === 'Elite')?.id ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20'}`}
                    >
                        {profile && plans.find(p => p.name === 'Elite') && profile.current_plan_id === plans.find(p => p.name === 'Elite')?.id ? 'Current Plan' : (loading ? 'Processing...' : 'Become Elite')}
                    </button>
                </div>
            </div>
            
            <div className="mt-20 text-center max-w-xl mx-auto p-8 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950/30">
                <Shield size={32} className="text-slate-600 mx-auto mb-4"/>
                <h3 className="text-lg font-black text-white mb-2">Enterprise Grade Security</h3>
                <p className="text-slate-500 text-sm font-medium">All plans include 256-bit AES encryption, multi-factor authentication compatibility, and daily automated backups. Your financial data never leaves our secure servers.</p>
            </div>
        </div>
    );
};

const Feature = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <span className="text-slate-300 font-bold text-sm leading-tight">{text}</span>
    </div>
);

export default Upgrade;
