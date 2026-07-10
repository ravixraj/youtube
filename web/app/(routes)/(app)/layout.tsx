"use client";

import { useState } from "react";
import { Suspense } from "react";
import Header from "./_components/Header";
import Sidebar from "./_components/Sidebar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onMenuToggle={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 sm:ml-[70px] lg:ml-[250px] pt-[66px] pb-16 sm:pb-0 min-h-screen">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
