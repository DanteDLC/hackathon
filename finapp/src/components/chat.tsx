"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import jsPDF from 'jspdf';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  fileName?: string;
}

interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

interface CostLog {
  id: string;
  timestamp: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  responseTime: number;
  fileName?: string;
  reportContent?: string;
}

interface ChatInterfaceProps {
  pageType: 'prob6' | 'ev4';
}

export default function ChatInterface({ pageType }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [showCostPanel, setShowCostPanel] = useState(true);
  const [costLogs, setCostLogs] = useState<CostLog[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
    temperature: 0.5,
    maxTokens: 10000,
  });
  const [previewContent, setPreviewContent] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize custom prompt with default
  useEffect(() => {
    import('@/lib/prompts').then(({ getAssistantPrompt }) => {
      if (!customPrompt) {
        setCustomPrompt(getAssistantPrompt(pageType));
      }
    });
  }, [pageType, customPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage || (selectedFile ? `Uploaded file: ${selectedFile.name}` : ""),
      timestamp: new Date(),
      fileName: selectedFile?.name,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("message", inputMessage);
      formData.append("conversationHistory", JSON.stringify(messages));
      formData.append("aiConfig", JSON.stringify(aiConfig));
      formData.append("pageType", pageType);
      formData.append("customPrompt", customPrompt);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Add cost tracking (estimated tokens)
        const responseTime = Date.now() - startTime;
        const inputTokens = Math.ceil((inputMessage.length + (selectedFile ? 1000 : 0)) / 4);
        const outputTokens = Math.ceil(data.message.length / 4);
        addCostLog(aiConfig.model, inputTokens, outputTokens, responseTime, selectedFile?.name, data.message);
      } else {
        throw new Error(data.message || data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please select a PDF file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const calculateCost = (model: string, inputTokens: number, outputTokens: number) => {
    const pricing = {
      'haiku': { input: 0.00025, output: 0.00125 },
      'sonnet': { input: 0.003, output: 0.015 },
      'opus': { input: 0.015, output: 0.075 }
    };
    
    const modelType = model.includes('haiku') ? 'haiku' : 
                     model.includes('sonnet') ? 'sonnet' : 'opus';
    
    return (inputTokens / 1000) * pricing[modelType].input + 
           (outputTokens / 1000) * pricing[modelType].output;
  };

  const addCostLog = (model: string, inputTokens: number, outputTokens: number, responseTime: number, fileName?: string, reportContent?: string) => {
    const cost = calculateCost(model, inputTokens, outputTokens);
    const newLog: CostLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      model,
      inputTokens,
      outputTokens,
      cost,
      responseTime,
      fileName,
      reportContent
    };
    setCostLogs(prev => [newLog, ...prev]);
    setTotalCost(prev => prev + cost);
  };

  const showPreviewModal = (content: string, messageId: string, isReport: boolean = false) => {
    setPreviewContent(content);
    setShowPreview(true);
    // Store download params for confirmation
    (window as any).pendingDownload = { content, messageId, isReport };
  };

  const confirmDownload = () => {
    const { content, messageId, isReport } = (window as any).pendingDownload;
    setShowPreview(false);
    downloadFile(content, messageId, isReport);
  };

  const downloadFile = (content: string, messageId: string, isReport: boolean = false) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (isReport) {
      const pdf = new jsPDF();
      const filename = `${pageType}-report-${timestamp}.pdf`;
      
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const title = pageType === 'prob6' ? 'PROB6 Call Evaluation Report' : 'EV4 Claims Analysis Report';
      pdf.text(title, margin, yPosition);
      yPosition += 15;
      
      // Add timestamp
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 20;
      
      // Process content
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        if (line.startsWith('#')) {
          // Headers
          yPosition += 5;
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const headerText = line.replace(/#{1,6}\s/, '');
          const wrappedHeader = pdf.splitTextToSize(headerText, maxWidth);
          pdf.text(wrappedHeader, margin, yPosition);
          yPosition += wrappedHeader.length * 7 + 5;
        } else if (line.includes('**')) {
          // Bold text
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          const boldText = line.replace(/\*\*(.*?)\*\*/g, '$1');
          const wrappedBold = pdf.splitTextToSize(boldText, maxWidth);
          pdf.text(wrappedBold, margin, yPosition);
          yPosition += wrappedBold.length * 6 + 3;
        } else if (line.startsWith('-') || line.startsWith('•')) {
          // Bullet points
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const bulletText = line.replace(/^[-•]\s/, '');
          const wrappedBullet = pdf.splitTextToSize('• ' + bulletText, maxWidth - 10);
          pdf.text(wrappedBullet, margin + 5, yPosition);
          yPosition += wrappedBullet.length * 5 + 2;
        } else if (line.trim()) {
          // Regular text
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const wrappedText = pdf.splitTextToSize(line, maxWidth);
          pdf.text(wrappedText, margin, yPosition);
          yPosition += wrappedText.length * 5 + 3;
        } else {
          // Empty line
          yPosition += 5;
        }
      }
      
      pdf.save(filename);
    } else {
      const filename = `uploaded-file-${timestamp}.txt`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      <div className="flex flex-1 overflow-hidden">
      {/* Cost Panel Sidebar */}
      {showCostPanel && (
        <div className={`w-80 border-r backdrop-blur-xl transition-colors duration-300 ${
          darkMode 
            ? 'bg-gray-800/80 border-gray-700/20' 
            : 'bg-white/80 border-white/20'
        }`}>
          <div className="p-6 border-b border-gray-200/20">
            <h2 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
              darkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              💰 Cost Tracking
            </h2>
            <div className={`text-2xl font-bold text-green-600 mb-1`}>
              ${totalCost.toFixed(4)}
            </div>
            <p className={`text-sm transition-colors duration-300 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Total spent on {costLogs.length} requests
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {costLogs.length === 0 ? (
              <div className={`text-center py-8 transition-colors duration-300 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              costLogs.map((log) => (
                <div key={log.id} className={`p-3 rounded-lg border transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-700/50 border-gray-600/20' 
                    : 'bg-white/60 border-gray-200/20'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-medium transition-colors duration-300 ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {log.model.includes('haiku') ? '⚡ Haiku' : 
                       log.model.includes('sonnet') ? '🎨 Sonnet' : '🧠 Opus'}
                    </span>
                    <span className="text-xs font-bold text-green-600">
                      ${log.cost.toFixed(4)}
                    </span>
                  </div>
                  <div className={`text-xs space-y-1 transition-colors duration-300 ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <div>Input: {log.inputTokens.toLocaleString()} tokens</div>
                    <div>Output: {log.outputTokens.toLocaleString()} tokens</div>
                    <div>⏱️ {(log.responseTime / 1000).toFixed(1)}s</div>
                    <div>{formatTime(log.timestamp)}</div>
                    {log.fileName && (
                      <div className={`text-xs mt-1 px-2 py-1 rounded ${
                        darkMode ? 'bg-gray-600/50 text-slate-300' : 'bg-gray-200/50 text-slate-600'
                      }`}>
                        📄 {log.fileName}
                      </div>
                    )}
                    {log.reportContent && (
                      <button
                        onClick={() => showPreviewModal(log.reportContent || '', log.id, true)}
                        className={`text-xs px-2 py-1 rounded mt-1 transition-colors ${
                          darkMode 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        📊 Download Report
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className={`backdrop-blur-xl border-b shadow-lg px-6 py-5 flex justify-between items-center transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/80 border-gray-700/20' 
          : 'bg-white/80 border-white/20'
      }`}>
        <div>
          <div className="flex items-center space-x-3">
            {pageType === 'prob6' ? (
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            )}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {pageType === 'prob6' ? 'PROB6 Evaluator' : 'EV4 Analyzer'}
            </h1>
          </div>
          <p className={`text-sm mt-1 font-medium transition-colors duration-300 ${
            darkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {aiConfig.model.includes('haiku') ? '⚡ Claude 3.5 Haiku' : 
             aiConfig.model.includes('sonnet') ? '🎨 Claude 3.5 Sonnet' : '🧠 Claude 3 Opus'} • 
            Temp: {aiConfig.temperature} • Tokens: {aiConfig.maxTokens.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCostPanel(!showCostPanel)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
            </svg>
            ${totalCost.toFixed(4)}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              darkMode 
                ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900' 
                : 'bg-gray-700 hover:bg-gray-800 text-white'
            }`}
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className={`text-center mt-16 transition-colors duration-300 ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <div className="text-8xl mb-6 animate-pulse">{pageType === 'prob6' ? '🎯' : '📊'}</div>
            <h3 className={`text-2xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent ${
              darkMode 
                ? 'from-slate-300 to-slate-100' 
                : 'from-slate-600 to-slate-800'
            }`}>
              {pageType === 'prob6' ? 'Ready to Evaluate Calls' : 'Ready to Analyze Data'}
            </h3>
            <p className="text-lg font-medium">
              {pageType === 'prob6' 
                ? 'Upload a PDF transcript or start typing to begin analysis'
                : 'Upload documents or start typing to begin EV4 analysis'
              }
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                darkMode ? 'bg-orange-500' : 'bg-orange-400'
              }`}>
                <span className="text-white font-bold text-xs">AI</span>
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg transition-colors duration-300 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                  : darkMode 
                    ? "bg-gray-800/80 backdrop-blur-sm border border-gray-700/20 text-slate-200"
                    : "bg-white/80 backdrop-blur-sm border border-white/20 text-slate-800"
              }`}
            >
              <div className="text-sm">
                {message.role === "user" ? (
                  <div>
                    {message.content}
                    {message.fileName && (
                      <div className="mt-2 text-xs bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 font-medium">
                        📄 {message.fileName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className={`prose prose-sm max-w-none transition-colors duration-300 ${
                      darkMode 
                        ? 'prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300'
                        : 'prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900'
                    }`}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    <button
                      onClick={() => showPreviewModal(message.content, message.id, true)}
                      className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        darkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      📥 Download Report
                    </button>
                  </div>
                )}
              </div>
              <div
                className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                  message.role === "user" 
                    ? "text-blue-100" 
                    : darkMode 
                      ? "text-slate-400" 
                      : "text-slate-500"
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
            {message.role === "user" && (
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                darkMode ? 'bg-slate-600' : 'bg-slate-500'
              }`}>
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className={`backdrop-blur-sm border rounded-2xl px-6 py-4 shadow-lg transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800/80 border-gray-700/20' 
                : 'bg-white/80 border-white/20'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  🧠 AI is analyzing your call...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className={`backdrop-blur-xl border-t px-6 py-6 shadow-lg transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/80 border-gray-700/20' 
          : 'bg-white/80 border-white/20'
      }`}>
        {selectedFile && (
          <div className={`mb-4 p-4 border rounded-xl flex items-center justify-between shadow-sm transition-colors duration-300 ${
            darkMode 
              ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-700' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
          }`}>
            <span className={`text-sm font-semibold transition-colors duration-300 ${
              darkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>📄 {selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className={`font-bold text-lg transition-colors ${
                darkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-500 hover:text-blue-700'
              }`}
            >
              ✕
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={pageType === 'prob6' 
              ? 'Ask me to analyze a call transcript...' 
              : 'Ask me to perform EV4 analysis...'
            }
            className={`flex-1 border rounded-xl px-6 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all ${
              darkMode 
                ? 'bg-gray-700/80 border-gray-600 text-slate-200 placeholder-slate-400' 
                : 'bg-white/80 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
            disabled={isLoading}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
            disabled={isLoading}
          >
            📎
          </button>
          <button
            type="submit"
            disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
      </div>

      {/* Right Sidebar - Settings & Prompt Editor */}
      <div className={`w-96 border-l backdrop-blur-xl transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/80 border-gray-700/20' 
          : 'bg-white/80 border-white/20'
      }`}>
        <div className="p-6 border-b border-gray-200/20">
          <h2 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
            darkMode ? 'text-slate-200' : 'text-slate-800'
          }`}>
            Settings & Prompt
          </h2>
          
          {/* AI Settings */}
          <div className="space-y-4 mb-6">
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                AI Model
              </label>
              <select
                value={aiConfig.model}
                onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all ${
                  darkMode 
                    ? 'bg-gray-700/80 border-gray-600 text-white' 
                    : 'bg-white/80 border-slate-200 text-gray-900'
                }`}
              >
                <option value="us.anthropic.claude-3-5-haiku-20241022-v1:0">⚡ Claude 3.5 Haiku</option>
                <option value="us.anthropic.claude-3-5-sonnet-20241022-v2:0">🎨 Claude 3.5 Sonnet</option>
                <option value="us.anthropic.claude-3-opus-20240229-v1:0">🧠 Claude 3 Opus</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                Temperature: <span className="text-blue-600">{aiConfig.temperature}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiConfig.temperature}
                onChange={(e) => setAiConfig({...aiConfig, temperature: parseFloat(e.target.value)})}
                className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className={`flex justify-between text-xs font-medium mt-1 transition-colors duration-300 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                Max Tokens
              </label>
              <select
                value={aiConfig.maxTokens}
                onChange={(e) => setAiConfig({...aiConfig, maxTokens: parseInt(e.target.value)})}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all ${
                  darkMode 
                    ? 'bg-gray-700/80 border-gray-600 text-white' 
                    : 'bg-white/80 border-slate-200 text-gray-900'
                }`}
              >
                <option value={5000}>5,000 tokens</option>
                <option value={10000}>10,000 tokens</option>
                <option value={15000}>15,000 tokens</option>
                <option value={20000}>20,000 tokens</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prompt Editor */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              darkMode ? 'text-slate-200' : 'text-slate-700'
            }`}>
              Assistant Prompt
            </h3>
            <button
              onClick={() => {
                import('@/lib/prompts').then(({ getAssistantPrompt }) => {
                  setCustomPrompt(getAssistantPrompt(pageType));
                });
              }}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className={`w-full h-96 border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all resize-none ${
              darkMode 
                ? 'bg-gray-700/80 border-gray-600 text-slate-200' 
                : 'bg-white/80 border-slate-200 text-gray-900'
            }`}
            placeholder="Enter your custom assistant prompt here..."
          />
          <p className={`text-xs mt-2 transition-colors duration-300 ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Session-only changes. Not saved permanently.
          </p>
        </div>
      </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[80vh] rounded-xl shadow-2xl transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 border-b transition-colors duration-300 ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📄 Report Preview
              </h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className={`prose prose-sm max-w-none transition-colors duration-300 ${
                darkMode 
                  ? 'prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300'
                  : 'prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900'
              }`}>
                <ReactMarkdown>{previewContent}</ReactMarkdown>
              </div>
            </div>
            <div className={`p-6 border-t flex justify-end space-x-3 transition-colors duration-300 ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📥 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}