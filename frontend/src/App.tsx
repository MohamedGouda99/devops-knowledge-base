import { useState } from "react";
import { BookOpen, MessageSquare, FolderOpen } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import DocumentManager from "@/components/DocumentManager";
import { cn } from "@/lib/utils";

type MobileTab = "chat" | "documents";

export default function App() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-600/20">
              <BookOpen className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-100">
                DevOps Knowledge Base
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                RAG-powered documentation assistant
              </p>
            </div>
          </div>

          {/* Mobile tab switcher */}
          <div className="flex lg:hidden bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMobileTab("chat")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                mobileTab === "chat"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-500 hover:text-gray-300",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("documents")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                mobileTab === "documents"
                  ? "bg-gray-800 text-gray-100"
                  : "text-gray-500 hover:text-gray-300",
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Docs
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel - 70% on desktop, full on mobile when active */}
        <div
          className={cn(
            "flex-1 lg:flex lg:w-[70%] border-r border-gray-800",
            mobileTab === "chat" ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="flex-1 flex flex-col min-w-0">
            <ChatPanel />
          </div>
        </div>

        {/* Document manager - 30% on desktop, full on mobile when active */}
        <div
          className={cn(
            "lg:w-[30%] lg:min-w-[340px] lg:max-w-[480px] lg:flex lg:flex-col",
            mobileTab === "documents"
              ? "flex flex-col flex-1"
              : "hidden lg:flex",
          )}
        >
          <DocumentManager />
        </div>
      </div>
    </div>
  );
}
