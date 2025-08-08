"use client";
import { GPTMessage } from "@/models/types";
import { invokeCommandStream } from "@/services/bedrock";
import React, { useState } from "react";

const Page = () => {
  const [isPrompt, setPrompt] = useState<string>("");
  const [isResponse, setResponse] = useState<string>("");

  const handleSubmitPrompt = () => {
    setResponse("Response from AI");
  };
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-4">
      <textarea
        className="w-64 border-2 border-black h-64 rounded-md"
        value={isPrompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Write your prompt here"
      />
      <button
        className="bg-zinc-600 text-white rounded-md p-2 w-64 hover:bg-zinc-800"
        onClick={handleSubmitPrompt}
      >
        Submit Prompt
      </button>
      <textarea
        className="w-64 border-2 border-black h-64 rounded-md"
        value={isResponse}
        placeholder="Here's the response"
      />
    </div>
  );
};

export default Page;
