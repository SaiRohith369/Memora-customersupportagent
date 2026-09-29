'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  LayoutDashboard,
  Loader2,
  MemoryStick,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Ticket,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type {
  ConversationMessage,
  Customer,
  CustomerProfile,
  DashboardStats,
} from '@/types';
import { dashboardStats as defaultStats } from '@/data/seed';

type ActivityState = {
  text: string;
  phase: 'idle' | 'searching' | 'found' | 'using' | 'updated' | 'error';
};

export default function SupportDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string>('CUS-1024');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [hindsightConnected, setHindsightConnected] = useState(false);
  const [activity, setActivity] = useState<ActivityState>({
    text: 'Ready',
    phase: 'idle',
  });
  const [stats] = useState<DashboardStats>(defaultStats);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [expandedMemory, setExpandedMemory] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [view, setView] = useState<'chat' | 'dashboard'>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadCustomers = useCallback(async (q = '') => {
    const res = await fetch(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setHindsightConnected(!!data.hindsightConnected);
  }, []);

  const loadProfile = useCallback(async (id: string) => {
    const res = await fetch(`/api/customers/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setProfile(data);
  }, []);

  useEffect(() => {
    loadCustomers();
    fetch('/api/seed', { method: 'POST' }).catch(() => {});
  }, [loadCustomers]);

  useEffect(() => {
    if (selectedId) {
      loadProfile(selectedId);
      setMessages([]);
      setActivity({ text: 'Ready', phase: 'idle' });
    }
  }, [selectedId, loadProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const t = setTimeout(() => loadCustomers(search), 200);
    return () => clearTimeout(t);
  }, [search, loadCustomers]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !selectedId || loading) return;

    const userMsg: ConversationMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setActivity({ text: 'Searching customer memory...', phase: 'searching' });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedId,
          message: msg,
          memoryEnabled,
          conversationHistory: messages,
        }),
      });
      const data = await res.json();

      if (data.memoriesUsed?.length) {
        setActivity({
          text: `${data.memoriesUsed.length} relevant memories found`,
          phase: 'found',
        });
        await new Promise((r) => setTimeout(r, 400));
        setActivity({
          text: data.activity || 'Using previous successful resolution',
          phase: 'using',
        });
      } else {
        setActivity({
          text: data.activity || 'No prior memories',
          phase: data.memoryUpdated ? 'updated' : 'idle',
        });
      }

      const assistantMsg: ConversationMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.error || 'No response',
        timestamp: new Date().toISOString(),
        memoriesUsed: data.memoriesUsed,
        memoryUpdated: data.memoryUpdated,
        activity: data.activity,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.memoryUpdated) {
        setActivity({ text: 'Memory updated', phase: 'updated' });
        await loadProfile(selectedId);
      }
    } catch {
      setActivity({ text: 'Request failed — try again', phase: 'error' });
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setSelectedId('CUS-1024');
    setMemoryEnabled(true);
    setMessages([]);
    setView('chat');

    const steps = [
      "I can't log into CloudDesk.",
      "My login isn't working again.",
      "Yes, it started after today's update.",
      "Login isn't working again.",
    ];

    let history: ConversationMessage[] = [];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 500 : 1600));
      const msg = steps[i];
      const userMsg: ConversationMessage = {
        id: `demo-u-${i}`,
        role: 'user',
        content: msg,
        timestamp: new Date().toISOString(),
      };
      history = [...history, userMsg];
      setMessages([...history]);
      setLoading(true);
      setActivity({ text: 'Searching customer memory...', phase: 'searching' });
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: 'CUS-1024',
            message: msg,
            memoryEnabled: true,
            conversationHistory: history.slice(0, -1),
          }),
        });
        const data = await res.json();
        if (data.memoriesUsed?.length) {
          setActivity({
            text: `${data.memoriesUsed.length} relevant memories found`,
            phase: 'found',
          });
          await new Promise((r) => setTimeout(r, 300));
          setActivity({
            text: data.activity || 'Using previous successful resolution',
            phase: 'using',
          });
        }
        const assistantMsg: ConversationMessage = {
          id: `demo-a-${i}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
          memoriesUsed: data.memoriesUsed,
          memoryUpdated: data.memoryUpdated,
          activity: data.activity,
        };
        history = [...history, assistantMsg];
        setMessages([...history]);
        if (data.memoryUpdated) {
          setActivity({ text: 'Memory updated', phase: 'updated' });
          await loadProfile('CUS-1024');
        }
      } finally {
        setLoading(false);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    setDemoRunning(false);
  };

  const selected = customers.find((c) => c.id === selectedId);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">SupportMemory AI</div>
            <div className="text-[11px] text-slate-500">AI Support with Long-Term Customer Memory</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${hindsightConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            <Circle className={`h-2 w-2 fill-current ${hindsightConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
            {hindsightConnected ? 'Hindsight Memory Connected' : 'Local Memory (seed)'}
          </div>
          <button onClick={() => setView('dashboard')} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <LayoutDashboard className="mr-1 inline h-3.5 w-3.5" />Dashboard
          </button>
          <button onClick={() => setView('chat')} className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${view === 'chat' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <MessageSquare className="mr-1 inline h-3.5 w-3.5" />Customers
          </button>
          <button onClick={runDemo} disabled={demoRunning} className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {demoRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Run Memory Demo
          </button>
        </div>
      </header>

      {view === 'dashboard' ? (
        <DashboardView stats={stats} customers={customers} onSelect={(id) => { setSelectedId(id); setView('chat'); }} />
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {customers.map((c) => (
                <button key={c.id} onClick={() => setSelectedId(c.id)} className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-3 py-3 text-left transition-colors ${selectedId === c.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${c.avatarColor}`}>
                    {c.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{c.name}</div>
                    <div className="truncate text-[11px] text-slate-500">{c.id} · {c.product}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
              <div className="flex items-center gap-2">
                {selected && (
                  <>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ${selected.avatarColor}`}>
                      {selected.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{selected.name}</div>
                      <div className="text-[11px] text-slate-500">{selected.product} · {selected.environment.os} · {selected.environment.browser}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setMemoryEnabled((v) => !v)} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${memoryEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`} title="Toggle long-term memory">
                  {memoryEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  Memory {memoryEnabled ? 'ON' : 'OFF'}
                </button>
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${activity.phase === 'searching' ? 'bg-amber-50 text-amber-700' : activity.phase === 'found' || activity.phase === 'using' ? 'bg-indigo-50 text-indigo-700' : activity.phase === 'updated' ? 'bg-emerald-50 text-emerald-700' : activity.phase === 'error' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                  {(activity.phase === 'searching' || loading) && <Loader2 className="h-3 w-3 animate-spin" />}
                  {activity.phase === 'updated' && <Check className="h-3 w-3" />}
                  {(activity.phase === 'found' || activity.phase === 'using') && <Brain className="h-3 w-3" />}
                  {activity.text}
                </div>
                <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setShowMemoryDrawer(true)}>
                  <MemoryStick className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">{selected ? `Chat with ${selected.name}` : 'Select a customer'}</h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    {memoryEnabled ? 'Memory is ON. The agent will recall past issues, solutions, and environment from Hindsight.' : 'Memory is OFF. Responses will be generic (great for before/after comparison).'}
                  </p>
                  {selectedId === 'CUS-1024' && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {["I can't log into CloudDesk.", "My login isn't working again.", "It started after today's update."].map((s) => (
                        <button key={s} onClick={() => sendMessage(s)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="mx-auto max-w-2xl space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={`animate-fade-in flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-800 shadow-sm'}`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      {m.role === 'assistant' && m.memoriesUsed && m.memoriesUsed.length > 0 && (
                        <div className="mt-2.5 border-t border-slate-100 pt-2">
                          <button onClick={() => setExpandedMemory((v) => !v)} className="flex items-center gap-1 text-[11px] font-medium text-indigo-600">
                            <Brain className="h-3 w-3" /> Memory used · {m.memoriesUsed.length}
                            {expandedMemory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </button>
                          {expandedMemory && (
                            <ul className="mt-1.5 space-y-0.5">
                              {m.memoriesUsed.map((mem, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                                  <span className="mt-0.5 text-indigo-400">•</span>{mem}
                                </li>
                              ))}
                            </ul>
                          )}
                          {m.activity && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600">
                              <Sparkles className="h-3 w-3" /> Why personalized: {m.activity}
                            </div>
                          )}
                        </div>
                      )}
                      {m.memoryUpdated && <div className="mt-1.5 text-[11px] font-medium text-emerald-600">✓ Memory updated</div>}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-500 shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking with memory...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="mx-auto flex max-w-2xl items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={selected ? `Message as ${selected.name}...` : 'Select a customer first'} disabled={!selected || loading || demoRunning} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50" />
                <button type="submit" disabled={!input.trim() || loading || !selected} className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </main>

          <aside className={`hidden w-80 shrink-0 flex-col border-l border-slate-200 bg-white lg:flex ${showMemoryDrawer ? '!flex fixed inset-y-0 right-0 z-40 shadow-xl' : ''}`}>
            <MemoryPanel profile={profile} onClose={() => setShowMemoryDrawer(false)} showClose={showMemoryDrawer} />
          </aside>
        </div>
      )}
    </div>
  );
}

function DashboardView({ stats, customers, onSelect }: { stats: DashboardStats; customers: Customer[]; onSelect: (id: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">SupportMemory AI · powered by Hindsight long-term memory</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Customers', value: stats.customers, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Support conversations', value: stats.conversations.toLocaleString(), icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
          { label: 'Memories stored', value: stats.memoriesStored.toLocaleString(), icon: Brain, color: 'text-violet-600 bg-violet-50' },
          { label: 'Memory-assisted resolutions', value: `${stats.memoryAssistedResolutions}%`, icon: Sparkles, color: 'text-emerald-600 bg-emerald-50' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              <div className={`rounded-lg p-1.5 ${card.color}`}><card.icon className="h-3.5 w-3.5" /></div>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Demo customers</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {customers.map((c) => (
          <button key={c.id} onClick={() => onSelect(c.id)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${c.avatarColor}`}>{c.name.split(' ').map((n) => n[0]).join('')}</div>
              <div>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-[11px] text-slate-500">{c.id}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600">{c.product} · {c.environment.os}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoryPanel({ profile, onClose, showClose }: { profile: CustomerProfile | null; onClose: () => void; showClose?: boolean }) {
  if (!profile) {
    return <div className="flex flex-1 items-center justify-center p-4 text-xs text-slate-400">Select a customer to view memory</div>;
  }
  const { customer, memories, tickets, successfulFixes, failedSolutions, knownIssues, timeline } = profile;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold">Customer Memory</span>
        </div>
        {showClose && <button onClick={onClose} className="rounded p-1 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section>
          <div className="text-sm font-semibold text-slate-900">{customer.name}</div>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Account</dt><dd className="font-medium text-slate-800">{customer.id}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Product</dt><dd className="font-medium text-slate-800">{customer.product}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Environment</dt><dd className="text-right font-medium text-slate-800">{customer.environment.os}<br />{customer.environment.browser}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-slate-500">Preference</dt><dd className="text-right text-slate-700">{customer.communicationPreference}</dd></div>
          </dl>
        </section>
        {successfulFixes.length > 0 && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800"><Check className="h-3.5 w-3.5" /> What worked last time?</div>
            <ul className="space-y-1">
              {successfulFixes.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-900"><span className="mt-0.5 text-emerald-600">✓</span>{f}</li>
              ))}
            </ul>
            <div className="mt-2 text-[10px] font-medium uppercase tracking-wide text-emerald-600">Previously successful</div>
          </section>
        )}
        {failedSolutions.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold text-slate-600">Previously tried</div>
            <ul className="space-y-1">
              {failedSolutions.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600"><span className="text-slate-400">✗</span>{f}</li>
              ))}
            </ul>
          </section>
        )}
        {knownIssues.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold text-slate-700">Known Issues</h3>
            <ul className="space-y-1">
              {knownIssues.slice(0, 5).map((issue, i) => (
                <li key={i} className="rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">{issue}</li>
              ))}
            </ul>
          </section>
        )}
        {timeline.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold text-slate-700">Memory Timeline</h3>
            <div className="relative space-y-3 border-l-2 border-indigo-100 pl-3">
              {timeline.map((t, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[15px] top-1 h-2.5 w-2.5 rounded-full border-2 border-indigo-500 bg-white" />
                  <div className="text-[10px] font-medium text-indigo-600">{t.date}</div>
                  <div className="text-[11px] text-slate-600">{t.event}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        <section>
          <h3 className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700"><Ticket className="h-3.5 w-3.5" /> Recent Tickets</h3>
          <div className="space-y-1.5">
            {tickets.slice(0, 5).map((t) => (
              <div key={t.id} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-800">{t.id}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600">{t.issue}</div>
                {t.resolution && <div className="mt-0.5 text-[10px] text-slate-400">→ {t.resolution}</div>}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-1.5 text-xs font-semibold text-slate-700">All memories ({memories.length})</h3>
          <div className="space-y-1">
            {memories.slice(0, 12).map((m) => (
              <div key={m.id} className="rounded border border-slate-100 px-2 py-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium uppercase text-slate-500">{m.type.replace('_', ' ')}</span>
                  {m.confidence && <span className="text-[9px] text-slate-400">{m.confidence.replace('_', ' ')}</span>}
                </div>
                <div className="mt-0.5 text-slate-700">{m.content}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
