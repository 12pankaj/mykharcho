import React from 'react';
import { Check, Shield, Zap, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentService, UserService, PlanService } from '../api/shared/apiService';

const Upgrade: React.FC = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(false);
    const [profile, setProfile] = React.useState<any>(null);
    const [plans, setPlans] = React.useState<any[]>([]);
    const [duration, setDuration] = React.useState<'monthly' | 'yearly' | '3_year'>('monthly');
    const [couponCode, setCouponCode] = React.useState('');

    React.useEffect(() => {
        const fetchProfileAndPlans = async () => {
            try {
                const profileRes = await UserService.getProfile();
                setProfile(profileRes.data);
                
                // Fetch public plans to map by name instead of hardcoded ID
                const plansRes = await PlanService.getPublicPlans();
                setPlans(plansRes.data.plans || []);
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

            const res = await PaymentService.createOrder(planId, duration, couponCode);
            if (!res.data.success) {
                alert('Failed to create order');
                setLoading(false);
                return;
            }

            // Handle Free Checkout (e.g. 100% coupon)
            if (res.data.isFree) {
                try {
                    const verifyRes = await PaymentService.verifyPayment({
                        razorpay_payment_id: 'free_checkout',
                        razorpay_order_id: res.data.order.id,
                        razorpay_signature: 'free_signature',
                        planId: planId,
                        duration: duration,
                        couponCode: couponCode
                    });

                    if (verifyRes.data.success) {
                        alert('Upgraded successfully for free!');
                        window.dispatchEvent(new Event('profileUpdated'));
                        navigate('/dashboard');
                        return;
                    }
                } catch(e) {
                    alert('Failed to verify free upgrade.');
                    setLoading(false);
                    return;
                }
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
                            planId: planId,
                            duration: duration,
                            couponCode: couponCode
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

    const freePlanId = plans.find(p => p.name === 'Free')?.id;
    const proPlanId = plans.find(p => p.name === 'Pro')?.id;
    const elitePlanId = plans.find(p => p.name === 'Elite')?.id;

    const currentPlanId = profile?.current_plan_id || freePlanId;

    const isFreeCurrent = currentPlanId === freePlanId;
    const isProCurrent = currentPlanId === proPlanId;
    const isEliteCurrent = currentPlanId === elitePlanId;

    const highlightPro = isFreeCurrent;
    const highlightElite = isFreeCurrent || isProCurrent;

    const renderPricing = (planName: string, defaultPrice: number) => {
        const plan = plans.find(p => p.name === planName);
        if (!plan) {
            return (
                <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">₹{defaultPrice}</span>
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">/ mo</span>
                </div>
            );
        }

        let monthlyEquivalent = 0;
        let strikethrough = 0;
        let billingText = '';
        let savePercent = 0;

        if (duration === 'monthly') {
            monthlyEquivalent = plan.price_monthly;
            strikethrough = Math.round(plan.price_monthly * 1.5); // 50% fake marketing markup
            savePercent = 33; 
            billingText = 'Billed monthly';
        } else if (duration === 'yearly') {
            monthlyEquivalent = Math.round(plan.price_yearly / 12);
            strikethrough = plan.price_monthly; // Cross out standard monthly price
            savePercent = Math.round((1 - (monthlyEquivalent / strikethrough)) * 100);
            billingText = `Billed ₹${plan.price_yearly} every 12 months`;
        } else if (duration === '3_year') {
            monthlyEquivalent = Math.round(plan.price_3_year / 36);
            strikethrough = plan.price_monthly;
            savePercent = Math.round((1 - (monthlyEquivalent / strikethrough)) * 100);
            billingText = `Billed ₹${plan.price_3_year} every 36 months`;
        }

        return (
            <div className="mt-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-slate-500 line-through font-bold">₹{strikethrough}/mo</span>
                    <span className="bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-green-500/20">
                        SAVE {savePercent}%
                    </span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">₹{monthlyEquivalent}</span>
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">/ mo</span>
                </div>
                {duration !== 'monthly' && (
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">{billingText}</p>
                )}
            </div>
        );
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
                <p className="text-slate-400 text-lg mb-8">
                    Supercharge your expense tracking with unlimited wallets, full automation, and legally compliant loan auto-EMIs.
                </p>

                {/* Duration Toggle */}
                <div className="flex flex-col items-center gap-6 mb-12">
                    <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner shadow-slate-950 max-w-fit mx-auto">
                        <button 
                            onClick={() => setDuration('monthly')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${duration === 'monthly' ? 'bg-slate-800 text-white shadow-lg shadow-slate-950/50' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setDuration('yearly')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${duration === 'yearly' ? 'bg-slate-800 text-white shadow-lg shadow-slate-950/50' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Yearly <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-md border border-green-500/20 tracking-wider">SAVE ~15%</span>
                        </button>
                        <button 
                            onClick={() => setDuration('3_year')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${duration === '3_year' ? 'bg-slate-800 text-white shadow-lg shadow-slate-950/50' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            3 Years <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded-md border border-orange-500/20 tracking-wider">SAVE ~30%</span>
                        </button>
                    </div>

                    <div className="w-full max-w-sm relative group">
                        <input 
                            type="text" 
                            placeholder="Have a Promo Code?" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="w-full bg-slate-950/50 border border-slate-800 text-white font-black text-center p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600 uppercase tracking-widest transition-all group-hover:border-slate-700"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Basic Plan */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-all">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-white mb-2">Basic</h3>
                        <p className="text-slate-500 text-sm font-bold">For personal tracking</p>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">₹{plans.find(p => p.name === 'Free')?.price_monthly || 0}</span>
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
                        {isFreeCurrent ? 'Current Plan' : 'Free Tier'}
                    </button>
                </div>

                {/* Pro Plan */}
                <div className={`${highlightPro ? 'bg-gradient-to-b from-blue-600/20 to-slate-950/50 border border-blue-500/50 shadow-2xl shadow-blue-900/20 transform md:-translate-y-4' : 'bg-slate-950/50 border border-slate-800 hover:border-slate-700'} rounded-[2rem] p-8 flex flex-col relative overflow-hidden transition-all group`}>
                    {highlightPro && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>}
                    {highlightPro && (
                        <div className="absolute top-6 right-6">
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-blue-500/30">Popular</span>
                        </div>
                    )}

                    <div className="mb-8">
                        <h3 className="text-xl font-black text-white mb-2">Pro</h3>
                        <p className="text-blue-200/60 text-sm font-bold">For serious budgeters</p>
                        {renderPricing('Pro', 499)}
                    </div>
                    
                    <div className="space-y-4 flex-1 mb-8">
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="5 Wallets (Accounts)" />
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="10 Automation Rules" />
                        <Feature icon={<Zap size={18} className="text-amber-400"/>} text="Auto-Generate Loan EMIs" />
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="Professional PDF Exports" />
                        <Feature icon={<Check size={18} className="text-blue-400"/>} text="Priority Email Support" />
                    </div>

                    <button 
                        disabled={loading || isProCurrent || isEliteCurrent} 
                        onClick={() => handleUpgrade('Pro')} 
                        className={`w-full py-4 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${(isProCurrent || isEliteCurrent) ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : (highlightPro ? 'text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/30' : 'text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700')}`}
                    >
                        {isProCurrent ? 'Current Plan' : (isEliteCurrent ? 'Downgrade to Pro' : (loading ? 'Processing...' : <>Upgrade to Pro <ArrowRight size={18}/></>))}
                    </button>
                </div>

                {/* Elite Plan */}
                <div className={`${highlightElite ? 'bg-slate-900/80 border border-amber-500/50 shadow-2xl shadow-amber-900/20 transform md:-translate-y-4' : 'bg-slate-950/50 border border-slate-800 hover:border-amber-500/50'} rounded-[2rem] p-8 flex flex-col relative overflow-hidden transition-all group`}>
                    {highlightElite && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>}
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-2 flex items-center gap-2">
                            Elite <Crown size={20} className="text-amber-400"/>
                        </h3>
                        <p className="text-slate-500 text-sm font-bold">For businesses & whales</p>
                        {renderPricing('Elite', 999)}
                    </div>
                    
                    <div className="space-y-4 flex-1 mb-8">
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="Unlimited Wallets" />
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="Unlimited Automation Rules" />
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="Unlimited Auto-EMIs" />
                        <Feature icon={<Shield size={18} className="text-amber-400"/>} text="White-label PDF Reports" />
                        <Feature icon={<Check size={18} className="text-amber-400"/>} text="24/7 Concierge Support" />
                    </div>

                    <button 
                        disabled={loading || isEliteCurrent} 
                        onClick={() => handleUpgrade('Elite')} 
                        className={`w-full py-4 rounded-xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${isEliteCurrent ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20'}`}
                    >
                        {isEliteCurrent ? 'Current Plan' : (loading ? 'Processing...' : 'Become Elite')}
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
