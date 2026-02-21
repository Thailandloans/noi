/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  History, 
  Sparkles, 
  Trash2, 
  Delete, 
  RotateCcw, 
  Copy, 
  Check,
  ChevronRight,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { cn } from './lib/utils';

// Types
type HistoryItem = {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
};

type Mode = 'standard' | 'ai';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mode, setMode] = useState<Mode>('standard');
  const [copied, setCopied] = useState(false);
  
  // AI State
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mathflow_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('mathflow_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiResponse]);

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setExpression(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const calculate = () => {
    try {
      const fullExpression = expression + display;
      // Basic sanitization and evaluation
      // In a real app, use a proper math parser like mathjs
      const sanitized = fullExpression.replace(/[^-+/*0-9.]/g, '');
      const result = eval(sanitized).toString();
      
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        expression: fullExpression,
        result,
        timestamp: Date.now()
      };
      
      setHistory([newItem, ...history].slice(0, 20));
      setDisplay(result);
      setExpression('');
    } catch (error) {
      setDisplay('Error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const askAI = async () => {
    if (!aiInput.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse('');
    
    try {
      const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBor_WhtUrCn5bD2grf4WIlENd37NrwZz8";
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Solve and explain this math problem clearly: ${aiInput}`,
        config: {
          systemInstruction: "You are a helpful math tutor. Explain steps clearly using markdown. Keep it concise but thorough.",
        }
      });
      
      setAiResponse(response.text || "Sorry, I couldn't solve that.");
    } catch (error) {
      setAiResponse("Error connecting to AI. Please check your connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Calculator Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Calculator className="text-black w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight">MathFlow</h1>
                  <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Precision Engine</p>
                </div>
              </div>
              
              <div className="flex bg-white/5 p-1 rounded-xl">
                <button 
                  onClick={() => setMode('standard')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                    mode === 'standard' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Standard
                </button>
                <button 
                  onClick={() => setMode('ai')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    mode === 'ai' ? "bg-emerald-500 text-black shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Solver
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'standard' ? (
                <motion.div 
                  key="standard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col h-full"
                >
                  {/* Display */}
                  <div className="bg-black/20 rounded-2xl p-6 mb-6 flex flex-col items-end justify-center min-h-[140px] border border-white/5">
                    <div className="text-white/40 text-sm font-mono h-6 mb-1">
                      {expression}
                    </div>
                    <div className="text-5xl font-mono font-medium tracking-tighter truncate w-full text-right">
                      {display}
                    </div>
                  </div>

                  {/* Keypad */}
                  <div className="calculator-grid flex-1">
                    <button onClick={handleClear} className="btn-calc btn-action">AC</button>
                    <button onClick={handleDelete} className="btn-calc btn-action"><Delete className="w-6 h-6" /></button>
                    <button onClick={() => handleOperator('%')} className="btn-calc btn-action">%</button>
                    <button onClick={() => handleOperator('/')} className="btn-calc btn-operator">÷</button>

                    <button onClick={() => handleNumber('7')} className="btn-calc btn-number">7</button>
                    <button onClick={() => handleNumber('8')} className="btn-calc btn-number">8</button>
                    <button onClick={() => handleNumber('9')} className="btn-calc btn-number">9</button>
                    <button onClick={() => handleOperator('*')} className="btn-calc btn-operator">×</button>

                    <button onClick={() => handleNumber('4')} className="btn-calc btn-number">4</button>
                    <button onClick={() => handleNumber('5')} className="btn-calc btn-number">5</button>
                    <button onClick={() => handleNumber('6')} className="btn-calc btn-number">6</button>
                    <button onClick={() => handleOperator('-')} className="btn-calc btn-operator">−</button>

                    <button onClick={() => handleNumber('1')} className="btn-calc btn-number">1</button>
                    <button onClick={() => handleNumber('2')} className="btn-calc btn-number">2</button>
                    <button onClick={() => handleNumber('3')} className="btn-calc btn-number">3</button>
                    <button onClick={() => handleOperator('+')} className="btn-calc btn-operator">+</button>

                    <button onClick={() => handleNumber('0')} className="btn-calc btn-number col-span-2">0</button>
                    <button onClick={() => handleNumber('.')} className="btn-calc btn-number">.</button>
                    <button onClick={calculate} className="btn-calc btn-equals">=</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex-1 overflow-hidden flex flex-col">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-3">
                        <MessageSquare className="w-3 h-3" />
                        AI Explanation
                      </div>
                      
                      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {!aiResponse && !isAiLoading && (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <Sparkles className="w-12 h-12 text-emerald-500/20 mb-4" />
                            <p className="text-white/40 text-sm">
                              Ask me anything! I can solve word problems, explain calculus, or help with geometry.
                            </p>
                          </div>
                        )}
                        
                        {isAiLoading && (
                          <div className="flex items-center gap-3 text-white/60 italic text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Thinking...
                          </div>
                        )}
                        
                        {aiResponse && (
                          <div className="markdown-body text-sm leading-relaxed prose prose-invert max-w-none">
                            <Markdown>{aiResponse}</Markdown>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="e.g., If a train leaves at 2pm going 60mph..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none h-24 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            askAI();
                          }
                        }}
                      />
                      <button 
                        onClick={askAI}
                        disabled={isAiLoading || !aiInput.trim()}
                        className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar: History & Stats */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6 flex flex-col h-full max-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-white/60" />
                <h2 className="font-semibold">History</h2>
              </div>
              <button 
                onClick={() => setHistory([])}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                  <RotateCcw className="w-10 h-10 mb-2" />
                  <p className="text-sm">No calculations yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id}
                    className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all cursor-pointer"
                    onClick={() => {
                      setDisplay(item.result);
                      setExpression('');
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/30 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.result);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/40" />}
                      </button>
                    </div>
                    <div className="text-sm text-white/50 font-mono mb-1 truncate">{item.expression}</div>
                    <div className="text-xl font-mono font-medium text-emerald-400 flex items-center justify-between">
                      <span className="truncate">= {item.result}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Total Calcs</div>
                  <div className="text-xl font-mono font-medium">{history.length}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Last Result</div>
                  <div className="text-xl font-mono font-medium truncate">
                    {history[0]?.result || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
