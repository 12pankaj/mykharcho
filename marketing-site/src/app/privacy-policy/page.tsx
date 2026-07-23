import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0e1117] text-white">
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white hover:text-slate-300 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="font-bold">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                            <span className="font-black text-white text-lg">₹</span>
                        </div>
                        <span className="text-xl font-black tracking-tight">MyKharcho</span>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto bg-slate-900/50 p-8 md:p-12 rounded-[2rem] border border-slate-800">
                    <h1 className="text-4xl font-black mb-8 text-amber-500">Privacy Policy</h1>
                    
                    <div className="space-y-8 text-slate-300 leading-relaxed font-medium">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                            <p>Welcome to MyKharcho. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website or use our mobile app.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. The Data We Collect</h2>
                            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                                <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                                <li><strong>Financial Data:</strong> includes transaction history, loan records, group splits, and expense categories added by you.</li>
                                <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Data</h2>
                            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                            <ul className="list-disc pl-6 mt-4 space-y-2">
                                <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g. providing our financial tracking services).</li>
                                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                                <li>Where we need to comply with a legal obligation.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
                            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Your Legal Rights</h2>
                            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, or to object to processing. If you wish to exercise any of the rights set out above, please contact us.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
                            <p>If you have any questions about this privacy policy or our privacy practices, please contact us at <strong>support@mykharcho.in</strong>.</p>
                        </section>
                        
                        <div className="pt-8 border-t border-slate-800 text-sm text-slate-500">
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-10 border-t border-slate-800 text-center text-slate-500 text-sm font-bold">
                <p>&copy; {new Date().getFullYear()} MyKharcho. All rights reserved.</p>
            </footer>
        </div>
    );
}
