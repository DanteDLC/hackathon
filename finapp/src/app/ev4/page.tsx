import ChatInterface from "@/components/chat";
import Navbar from "@/components/navbar";
import React from "react";

const EV4Page = () => {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <ChatInterface pageType="ev4" />
      </div>
    </div>
  );
};

export default EV4Page;