"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import TopBar from "./topbar";

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
  topP: number;
  topK: number;
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
  pageType: "prob6" | "ev4";
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
    topP: 1.0,
    topK: 250,
  });
  const [previewContent, setPreviewContent] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize custom prompt with default
  useEffect(() => {
    import("@/lib/prompts").then(({ getAssistantPrompt }) => {
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
      content:
        inputMessage ||
        (selectedFile ? `Uploaded file: ${selectedFile.name}` : ""),
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
        const inputTokens = Math.ceil(
          (inputMessage.length + (selectedFile ? 1000 : 0)) / 4
        );
        const outputTokens = Math.ceil(data.message.length / 4);
        addCostLog(
          aiConfig.model,
          inputTokens,
          outputTokens,
          responseTime,
          selectedFile?.name,
          data.message
        );
      } else {
        throw new Error(data.message || data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **Error**: ${
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again."
        }`,
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

  const costsPerModel: {
    [key: string]: {
      inputCostPerMillion: number;
      outputCostPerMillion: number;
      blendedCostPerMillion: number;
    };
  } = {
    "Claude 3.5 Haiku": {
      inputCostPerMillion: 0.8,
      outputCostPerMillion: 4.0,
      blendedCostPerMillion: 4.8,
    },
    "Claude 3.5 Sonnet": {
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      blendedCostPerMillion: 18.0,
    },
    "Claude 3.5 Sonnet v2": {
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      blendedCostPerMillion: 18.0,
    },
    "Claude 3.7 Sonnet": {
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      blendedCostPerMillion: 18.0,
    },
    "Claude Sonnet v2": {
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
      blendedCostPerMillion: 18.0,
    },
    "Claude Opus 4": {
      inputCostPerMillion: 15.0,
      outputCostPerMillion: 75.0,
      blendedCostPerMillion: 90.0,
    },
    "Claude Sonnet 4": {
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 75.0,
      blendedCostPerMillion: 90.0,
    },
    "Amazon Nova Lite": {
      inputCostPerMillion: 0.06,
      outputCostPerMillion: 0.24,
      blendedCostPerMillion: 0.3,
    },
    default: {
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.6,
      blendedCostPerMillion: 0.26,
    },
  };

  const getModelCosts = (model: string) => {
    const modelName = model.includes("haiku")
      ? "Claude 3.5 Haiku"
      : model.includes("3-5-sonnet")
      ? "Claude 3.5 Sonnet"
      : model.includes("3-7-sonnet")
      ? "Claude 3.7 Sonnet"
      : model.includes("sonnet-4")
      ? "Claude Sonnet 4"
      : model.includes("opus-4")
      ? "Claude Opus 4"
      : model.includes("nova-lite")
      ? "Amazon Nova Lite"
      : "default";
    return costsPerModel[modelName] || costsPerModel.default;
  };

  const calculateCost = (
    model: string,
    inputTokens: number,
    outputTokens: number
  ) => {
    const costs = getModelCosts(model);
    const inputCost = (inputTokens / 1000000) * costs.inputCostPerMillion;
    const outputCost = (outputTokens / 1000000) * costs.outputCostPerMillion;
    return inputCost + outputCost;
  };

  const addCostLog = (
    model: string,
    inputTokens: number,
    outputTokens: number,
    responseTime: number,
    fileName?: string,
    reportContent?: string
  ) => {
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
      reportContent,
    };
    setCostLogs((prev) => [newLog, ...prev]);
    setTotalCost((prev) => prev + cost);
  };

  const showPreviewModal = (
    content: string,
    messageId: string,
    isReport: boolean = false
  ) => {
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

  const downloadFile = (
    content: string,
    messageId: string,
    isReport: boolean = false
  ) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (isReport) {
      const pdf = new jsPDF();
      const filename = `${pageType}-report-${timestamp}.pdf`;

      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Add title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const title =
        pageType === "prob6"
          ? "PROB6 Call Evaluation Report"
          : "EV4 Claims Analysis Report";
      pdf.text(title, margin, yPosition);
      yPosition += 15;

      // Add timestamp
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 20;

      // Process content
      const lines = content.split("\n");

      for (const line of lines) {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        if (line.startsWith("#")) {
          // Headers
          yPosition += 5;
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          const headerText = line.replace(/#{1,6}\s/, "");
          const wrappedHeader = pdf.splitTextToSize(headerText, maxWidth);
          pdf.text(wrappedHeader, margin, yPosition);
          yPosition += wrappedHeader.length * 7 + 5;
        } else if (line.includes("**")) {
          // Bold text
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          const boldText = line.replace(/\*\*(.*?)\*\*/g, "$1");
          const wrappedBold = pdf.splitTextToSize(boldText, maxWidth);
          pdf.text(wrappedBold, margin, yPosition);
          yPosition += wrappedBold.length * 6 + 3;
        } else if (line.startsWith("-") || line.startsWith("•")) {
          // Bullet points
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          const bulletText = line.replace(/^[-•]\s/, "");
          const wrappedBullet = pdf.splitTextToSize(
            "• " + bulletText,
            maxWidth - 10
          );
          pdf.text(wrappedBullet, margin + 5, yPosition);
          yPosition += wrappedBullet.length * 5 + 2;
        } else if (line.trim()) {
          // Regular text
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
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
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      className={`flex flex-col transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      }`}
      style={{ height: "calc(100vh - 80px)" }}
    >
      <TopBar
        pageType={pageType}
        aiConfig={aiConfig}
        darkMode={darkMode}
        totalCost={totalCost}
        showCostPanel={showCostPanel}
        setShowCostPanel={setShowCostPanel}
        setDarkMode={setDarkMode}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Cost Panel Sidebar */}
        {showCostPanel && (
          <div
            className={`w-80 border-r backdrop-blur-xl transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800/80 border-gray-700/20"
                : "bg-white/80 border-white/20"
            }`}
          >
            <div className="p-6 border-b border-gray-200/20">
              <h2
                className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                  darkMode ? "text-slate-200" : "text-slate-800"
                }`}
              >
                💰 Cost Tracking
              </h2>
              <div className={`text-2xl font-bold text-green-600 mb-1`}>
                ${totalCost.toFixed(4)}
              </div>
              <p
                className={`text-sm transition-colors duration-300 ${
                  darkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Total spent on {costLogs.length} requests
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {costLogs.length === 0 ? (
                <div
                  className={`text-center py-8 transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-sm">No requests yet</p>
                </div>
              ) : (
                costLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border transition-colors duration-300 ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600/20"
                        : "bg-white/60 border-gray-200/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-xs font-medium transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {log.model.includes("haiku")
                          ? "⚡ Haiku"
                          : log.model.includes("sonnet")
                          ? "🎨 Sonnet"
                          : "🧠 Opus"}
                      </span>
                      <span className="text-xs font-bold text-green-600">
                        ${log.cost.toFixed(4)}
                      </span>
                    </div>
                    <div
                      className={`text-xs space-y-1 transition-colors duration-300 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <div>
                        Input: {log.inputTokens.toLocaleString()} tokens
                      </div>
                      <div>
                        Output: {log.outputTokens.toLocaleString()} tokens
                      </div>
                      <div>⏱️ {(log.responseTime / 1000).toFixed(1)}s</div>
                      <div>{formatTime(log.timestamp)}</div>
                      {log.fileName && (
                        <div
                          className={`text-xs mt-1 px-2 py-1 rounded ${
                            darkMode
                              ? "bg-gray-600/50 text-slate-300"
                              : "bg-gray-200/50 text-slate-600"
                          }`}
                        >
                          📄 {log.fileName}
                        </div>
                      )}
                      {log.reportContent && (
                        <button
                          onClick={() =>
                            showPreviewModal(
                              log.reportContent || "",
                              log.id,
                              true
                            )
                          }
                          className={`text-xs px-2 py-1 rounded mt-1 transition-colors ${
                            darkMode
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
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
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <div
                className={`text-center mt-16 transition-colors duration-300 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <div className="text-8xl mb-6 animate-pulse">
                  {pageType === "prob6" ? "🎯" : "📊"}
                </div>
                <h3
                  className={`text-2xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent ${
                    darkMode
                      ? "from-slate-300 to-slate-100"
                      : "from-slate-600 to-slate-800"
                  }`}
                >
                  {pageType === "prob6"
                    ? "Ready to Evaluate Calls"
                    : "Ready to Analyze Data"}
                </h3>
                <p className="text-lg font-medium">
                  {pageType === "prob6"
                    ? "Upload a PDF transcript or start typing to begin analysis"
                    : "Upload documents or start typing to begin EV4 analysis"}
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
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      darkMode ? "bg-orange-500" : "bg-orange-400"
                    }`}
                  >
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
                        <div
                          className={`prose prose-sm max-w-none transition-colors duration-300 ${
                            darkMode
                              ? "prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300"
                              : "prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900"
                          }`}
                        >
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        <button
                          onClick={() =>
                            showPreviewModal(message.content, message.id, true)
                          }
                          className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                            darkMode
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
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
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      darkMode ? "bg-slate-600" : "bg-slate-500"
                    }`}
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`backdrop-blur-sm border rounded-2xl px-6 py-4 shadow-lg transition-colors duration-300 ${
                    darkMode
                      ? "bg-gray-800/80 border-gray-700/20"
                      : "bg-white/80 border-white/20"
                  }`}
                >
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
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      🧠 AI is analyzing your call...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div
            className={`backdrop-blur-xl border-t px-6 py-6 shadow-lg transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800/80 border-gray-700/20"
                : "bg-white/80 border-white/20"
            }`}
          >
            {selectedFile && (
              <div
                className={`mb-4 p-4 border rounded-xl flex items-center justify-between shadow-sm transition-colors duration-300 ${
                  darkMode
                    ? "bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-700"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
              >
                <span
                  className={`text-sm font-semibold transition-colors duration-300 ${
                    darkMode ? "text-blue-300" : "text-blue-700"
                  }`}
                >
                  📄 {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className={`font-bold text-lg transition-colors ${
                    darkMode
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-500 hover:text-blue-700"
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
                placeholder={
                  pageType === "prob6"
                    ? "Ask me to analyze a call transcript..."
                    : "Ask me to perform EV4 analysis..."
                }
                className={`flex-1 border rounded-xl px-6 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all ${
                  darkMode
                    ? "bg-gray-700/80 border-gray-600 text-slate-200 placeholder-slate-400"
                    : "bg-white/80 border-slate-200 text-slate-800 placeholder-slate-400"
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
        <div
          className={`w-96 border-l backdrop-blur-xl transition-colors duration-300 flex flex-col overflow-hidden ${
            darkMode
              ? "bg-gray-800/80 border-gray-700/20"
              : "bg-white/80 border-white/20"
          }`}
        >
          <div className="p-6 border-b border-gray-200/20 h-1/2 overflow-y-auto">
            <h2
              className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                darkMode ? "text-slate-200" : "text-slate-800"
              }`}
            >
              Settings
            </h2>

            {/* AI Settings */}
            <div className="space-y-4 mb-6">
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  AI Model
                </label>
                <select
                  value={aiConfig.model}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, model: e.target.value })
                  }
                  className={`w-full border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all ${
                    darkMode
                      ? "bg-gray-700/80 border-gray-600 text-white"
                      : "bg-white/80 border-slate-200 text-gray-900"
                  }`}
                >
                  <option value="us.anthropic.claude-3-5-haiku-20241022-v1:0">
                    ⚡ Claude 3.5 Haiku
                  </option>
                  <option value="us.anthropic.claude-3-5-sonnet-20241022-v2:0">
                    🎨 Claude 3.5 Sonnet
                  </option>
                  <option value="us.anthropic.claude-3-opus-20240229-v1:0">
                    🧠 Claude 3 Opus
                  </option>
                  <option value="us.anthropic.claude-3-7-sonnet-20250219-v1:0">
                    🚀 Claude 3.7 Sonnet
                  </option>
                  <option value="us.anthropic.claude-sonnet-4-20250514-v1:0">
                    ⭐ Claude 4 Sonnet
                  </option>
                  <option value="us.anthropic.claude-opus-4-20250514-v1:0">
                    💎 Claude 4 Opus
                  </option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Temperature:{" "}
                  <span className="text-blue-600">{aiConfig.temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiConfig.temperature}
                  onChange={(e) =>
                    setAiConfig({
                      ...aiConfig,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div
                  className={`flex justify-between text-xs font-medium mt-1 transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Max Tokens
                </label>
                <select
                  value={aiConfig.maxTokens}
                  onChange={(e) =>
                    setAiConfig({
                      ...aiConfig,
                      maxTokens: parseInt(e.target.value),
                    })
                  }
                  className={`w-full border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all ${
                    darkMode
                      ? "bg-gray-700/80 border-gray-600 text-white"
                      : "bg-white/80 border-slate-200 text-gray-900"
                  }`}
                >
                  <option value={5000}>5,000 tokens</option>
                  <option value={10000}>10,000 tokens</option>
                  <option value={15000}>15,000 tokens</option>
                  <option value={20000}>20,000 tokens</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Top P:{" "}
                  <span className="text-purple-600">{aiConfig.topP}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={aiConfig.topP}
                  onChange={(e) =>
                    setAiConfig({
                      ...aiConfig,
                      topP: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer"
                />
                <div
                  className={`flex justify-between text-xs font-medium mt-1 transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>Precise</span>
                  <span>Diverse</span>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Top K: <span className="text-green-600">{aiConfig.topK}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  step="1"
                  value={aiConfig.topK}
                  onChange={(e) =>
                    setAiConfig({ ...aiConfig, topK: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-gradient-to-r from-green-200 to-teal-200 rounded-lg appearance-none cursor-pointer"
                />
                <div
                  className={`flex justify-between text-xs font-medium mt-1 transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <span>1</span>
                  <span>500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="p-6 h-1/2 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold transition-colors duration-300 ${
                  darkMode ? "text-slate-200" : "text-slate-700"
                }`}
              >
                Assistant Prompt
              </h3>
              <button
                onClick={() => {
                  import("@/lib/prompts").then(({ getAssistantPrompt }) => {
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
                  ? "bg-gray-700/80 border-gray-600 text-slate-200"
                  : "bg-white/80 border-slate-200 text-gray-900"
              }`}
              placeholder="Enter your custom assistant prompt here..."
            />
            <p
              className={`text-xs mt-2 transition-colors duration-300 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Session-only changes. Not saved permanently.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-4xl w-full max-h-[80vh] rounded-xl shadow-2xl transition-colors duration-300 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`p-6 border-b transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-xl font-bold transition-colors duration-300 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                📄 Report Preview
              </h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div
                className={`prose prose-sm max-w-none transition-colors duration-300 ${
                  darkMode
                    ? "prose-headings:text-slate-200 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300"
                    : "prose-headings:text-slate-800 prose-p:text-slate-700 prose-strong:text-slate-900"
                }`}
              >
                <ReactMarkdown>{previewContent}</ReactMarkdown>
              </div>
            </div>
            <div
              className={`p-6 border-t flex justify-end space-x-3 transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => setShowPreview(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
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
