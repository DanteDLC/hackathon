"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 blur-2xl opacity-30 animate-pulse"></div>
            <h1 className="relative text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
              Hackathings PH
            </h1>
          </div>
          <p className="text-xl text-slate-300 font-medium">Choose your analysis tool</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <button
            onClick={() => router.push("/prob6")}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">PROB6</h2>
              <p className="text-blue-100 text-lg font-medium mb-4">Call Evaluator</p>
              <p className="text-blue-200/80 text-sm leading-relaxed">Analyze call transcripts and evaluate veteran benefit eligibility with comprehensive assessment tools</p>
            </div>
          </button>
          
          <button
            onClick={() => router.push("/ev4")}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">EV4</h2>
              <p className="text-emerald-100 text-lg font-medium mb-4">Data Analyzer</p>
              <p className="text-emerald-200/80 text-sm leading-relaxed">Process insurance claims and analyze documentation quality with advanced review capabilities</p>
            </div>
          </button>
        </div>
        
        <div className="text-center mt-16">
          <p className="text-slate-400 text-sm">Powered by advanced AI technology</p>
        </div>
      </div>
    </div>
  );
}
