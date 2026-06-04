import React from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { MobileNav } from "../components/MobileNav";

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Top Navbar */}
      <Navbar />
      
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
          <main className="flex-1 pt-20 px-margin-mobile md:px-12 pb-24 md:pb-12">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
