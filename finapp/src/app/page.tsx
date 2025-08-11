"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Select Option</h1>
        <div className="space-y-4">
          <button
            onClick={() => router.push("/prob6")}
            className="block w-48 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            PROB6
          </button>
          <button
            onClick={() => router.push("/ev4")}
            className="block w-48 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            EV4
          </button>
        </div>
      </div>
    </div>
  );
}
