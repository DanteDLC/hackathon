"use client";

interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
}

interface TopBarProps {
  pageType: "prob6" | "ev4";
  aiConfig: AIConfig;
  darkMode: boolean;
  totalCost: number;
  showCostPanel: boolean;
  setShowCostPanel: (show: boolean) => void;
  setDarkMode: (dark: boolean) => void;
}

export default function TopBar({
  pageType,
  aiConfig,
  darkMode,
  totalCost,
  showCostPanel,
  setShowCostPanel,
  setDarkMode,
}: TopBarProps) {
  return (
    <div
      className={`w-full backdrop-blur-xl border-b shadow-lg px-6 py-5 flex justify-between items-center transition-colors duration-300 ${
        darkMode
          ? "bg-gray-800/80 border-gray-700/20"
          : "bg-white/80 border-white/20"
      }`}
    >
      <div>
        <div className="flex items-center space-x-3">
          {pageType === "prob6" ? (
            <svg
              className="w-8 h-8 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          )}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {pageType === "prob6" ? "PROB6 Evaluator" : "EV4 Analyzer"}
          </h1>
        </div>
        <p
          className={`text-sm mt-1 font-medium transition-colors duration-300 ${
            darkMode ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {aiConfig.model.includes("haiku")
            ? "⚡ Claude 3.5 Haiku"
            : aiConfig.model.includes("3-5-sonnet")
            ? "🎨 Claude 3.5 Sonnet"
            : aiConfig.model.includes("3-7-sonnet")
            ? "🚀 Claude 3.7 Sonnet"
            : aiConfig.model.includes("sonnet-4")
            ? "⭐ Claude 4 Sonnet"
            : aiConfig.model.includes("opus-4")
            ? "💎 Claude 4 Opus"
            : aiConfig.model.includes("3-opus")
            ? "🧠 Claude 3 Opus"
            : "Unknown Model"}{" "}
          • Temp: {aiConfig.temperature} • Tokens:{" "}
          {aiConfig.maxTokens.toLocaleString()} • Top-P: {aiConfig.topP} •
          Top-K: {aiConfig.topK}
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowCostPanel(!showCostPanel)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
          </svg>
          ${totalCost.toFixed(4)}
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            darkMode
              ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
              : "bg-gray-700 hover:bg-gray-800 text-white"
          }`}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
