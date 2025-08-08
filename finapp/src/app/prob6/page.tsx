import ChatInterface from "@/components/chat";
import Navbar from "@/components/navbar";
import React from "react";

const PROB6Page = () => {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <ChatInterface pageType="prob6" />
      </div>
    </div>
  );
};

export default PROB6Page;