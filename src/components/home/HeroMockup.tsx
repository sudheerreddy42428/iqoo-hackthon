import React from 'react';
import { Terminal, PlayCircle, Smartphone, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const HeroMockup: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto md:max-w-none md:w-[500px] lg:w-[600px]">
      {/* Background glow for mockup */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-indigo-500/20 blur-3xl rounded-full -z-10" />

      {/* Main Mockup Window */}
      <div className="relative glass-panel rounded-2xl border border-slate-700/60 shadow-2xl shadow-cyan-900/20 overflow-hidden flex flex-col bg-dark-950/80 backdrop-blur-xl">
        
        {/* Mockup Header */}
        <div className="h-10 border-b border-slate-800/80 bg-slate-900/60 flex items-center px-4 justify-between shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            ReproX Engine - Active Session
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Mockup Body - Split into two sections vertically */}
        <div className="flex flex-col h-[400px]">
          
          {/* Top Section: Scrolling Action Timeline */}
          <div className="flex-1 border-b border-slate-800/80 p-4 overflow-hidden relative bg-dark-900/40">
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-dark-900/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-dark-900/90 to-transparent z-10 pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-slate-400">
              <HistoryIcon />
              <span className="uppercase tracking-widest text-[10px]">Rolling Buffer (15 Actions)</span>
            </div>

            <div className="relative h-full overflow-hidden">
              <div className="animate-marquee space-y-3 pb-8">
                {/* Mock Actions */}
                <ActionRow type="NAVIGATE" icon={<Smartphone className="w-3.5 h-3.5" />} text="Navigated to CheckoutScreen" time="-1.2s" />
                <ActionRow type="INPUT" icon={<Terminal className="w-3.5 h-3.5" />} text="Entered text in 'Card Number'" time="-0.8s" highlight={true} />
                <ActionRow type="TAP" icon={<PlayCircle className="w-3.5 h-3.5" />} text="Tapped 'Confirm Payment' Button" time="-0.2s" />
                
                {/* Crash Event */}
                <div className="flex gap-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                  <div className="mt-0.5">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-rose-300">FATAL CRASH</span>
                      <span className="text-[10px] text-rose-500 font-mono">0.0s</span>
                    </div>
                    <div className="text-[10px] text-rose-200/80 font-mono">java.lang.NullPointerException</div>
                    <div className="text-[10px] text-rose-400/60 font-mono truncate">at com.app.CheckoutScreen.onPayClicked</div>
                  </div>
                </div>

                {/* Repeat for seamless marquee */}
                <ActionRow type="NAVIGATE" icon={<Smartphone className="w-3.5 h-3.5" />} text="Navigated to CheckoutScreen" time="-1.2s" />
                <ActionRow type="INPUT" icon={<Terminal className="w-3.5 h-3.5" />} text="Entered text in 'Card Number'" time="-0.8s" highlight={true} />
                <ActionRow type="TAP" icon={<PlayCircle className="w-3.5 h-3.5" />} text="Tapped 'Confirm Payment' Button" time="-0.2s" />
              </div>
            </div>
          </div>

          {/* Bottom Section: Generated Espresso Test */}
          <div className="h-[180px] bg-[#0d1117] p-4 font-mono text-[10px] leading-relaxed overflow-hidden relative">
            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold border-b border-slate-800/80 pb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="uppercase tracking-widest text-[9px]">Synthesized Espresso Test</span>
            </div>
            <pre className="text-slate-300">
<span className="text-purple-400">@Test</span>
<span className="text-purple-400">fun</span> <span className="text-blue-400">reproduceCheckoutCrash</span>() {'{'}
  <span className="text-slate-500">// Action 1: Navigated to CheckoutScreen</span>
  onView(withId(R.id.<span className="text-cyan-300">btn_checkout</span>)).perform(click())
  
  <span className="text-slate-500">// Action 2: Entered text in 'Card Number'</span>
  onView(withId(R.id.<span className="text-cyan-300">input_card</span>))
      .perform(typeText(<span className="text-emerald-300">"****-1234"</span>))
  
  <span className="text-slate-500">// Action 3: Tapped 'Confirm Payment' Button</span>
  onView(withId(R.id.<span className="text-cyan-300">btn_pay</span>)).perform(click())
  
  <span className="text-slate-500">// Assert crash occurred or fix state</span>
{'}'}
            </pre>
          </div>
          
        </div>
      </div>
    </div>
  );
};

function HistoryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}

const ActionRow = ({ type, icon, text, time, highlight = false }: { type: string, icon: React.ReactNode, text: string, time: string, highlight?: boolean }) => (
  <div className={`flex gap-3 p-2.5 rounded-lg border transition-colors ${
    highlight 
      ? 'bg-cyan-950/30 border-cyan-500/20' 
      : 'bg-slate-900/40 border-slate-800/50'
  }`}>
    <div className={`mt-0.5 ${highlight ? 'text-cyan-400' : 'text-slate-500'}`}>
      {icon}
    </div>
    <div className="flex-1 space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-bold ${highlight ? 'text-cyan-400' : 'text-slate-400'}`}>{type}</span>
        <span className="text-[10px] text-slate-500 font-mono">{time}</span>
      </div>
      <div className={`text-[11px] ${highlight ? 'text-slate-200' : 'text-slate-400'}`}>{text}</div>
    </div>
  </div>
);
