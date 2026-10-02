import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Bot, Send, Mic, Sparkles, Globe, ShieldAlert, CheckCircle2, Link as LinkIcon } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Personal Health & Wellness Assistant. I analyze your profession, schedule, environment, workouts, nutrition, and sleep to generate personalized guidance.',
      source_type: 'LOCAL_DATA'
    }
  ]);
  const [input, setInput] = useState('');
  const [useInternet, setUseInternet] = useState(false);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Speech Recognition
  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res: any = await apiRequest('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message: currentInput, use_internet: useInternet, language })
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.response,
          source_type: res.source_type,
          tool_executed: res.tool_executed,
          citations: res.citations,
          disclaimer: res.disclaimer
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', source_type: 'ERROR' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const promptChips = [
    { label: "What is my schedule today?", lang: "en" },
    { label: "இன்றைக்கு என்னுடைய schedule என்ன?", lang: "ta" },
    { label: "How many workouts did I complete this week?", lang: "en" },
    { label: "Move my workout to evening.", lang: "en" },
    { label: "What is the latest official WHO nutrition guideline?", lang: "en", internet: true }
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <DisclaimerBanner />

      {/* Assistant Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-glow">
            <Bot className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100">AI Personal Chatbot</h2>
            <p className="text-[11px] text-slate-400">Integrated Tool Execution & Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Internet Toggle */}
          <button
            onClick={() => setUseInternet(!useInternet)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              useInternet ? 'bg-sky-950 border-sky-500 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Internet Verification: {useInternet ? 'ON' : 'OFF'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-semibold"
          >
            {language === 'en' ? 'EN' : 'TA'}
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Tool Execution Badge */}
              {msg.tool_executed && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Tool Executed: {msg.tool_executed}
                </div>
              )}

              {/* Internet Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px] text-sky-400">
                  <p className="font-semibold flex items-center gap-1 text-slate-400">
                    <LinkIcon className="w-3 h-3" /> External Verification Sources:
                  </p>
                  {msg.citations.map((cite: any, cIdx: number) => (
                    <a key={cIdx} href={cite.url} target="_blank" rel="noreferrer" className="block hover:underline truncate">
                      • {cite.source}
                    </a>
                  ))}
                </div>
              )}

              {/* Source Tag */}
              {msg.source_type && msg.role === 'assistant' && (
                <p className="text-[9px] text-slate-500 uppercase font-mono tracking-wider pt-1">
                  Source: {msg.source_type}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Chips */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInput(chip.label);
              if (chip.internet) setUseInternet(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs text-slate-300 transition-all"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Control Box */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'ta' ? 'கேள்வி அல்லது கட்டளை தட்டச்சு செய்யுங்...' : 'Ask your AI assistant or command a schedule change...'}
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 focus:border-sky-500 focus:outline-none text-xs text-slate-100"
        />

        <button
          type="button"
          onClick={startVoiceRecognition}
          className={`p-3 rounded-2xl border text-slate-300 transition-all ${
            isListening ? 'bg-red-950 border-red-500 text-red-400 animate-pulse' : 'bg-slate-900 border-slate-800'
          }`}
          title="Voice Speech Input"
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center gap-2 disabled:opacity-50"
        >
          <span>Send</span> <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
