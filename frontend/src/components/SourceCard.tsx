import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { SourceReference } from "@/types";
import { cn } from "@/lib/utils";

interface SourceCardProps {
  source: SourceReference;
  index: number;
}

function relevanceBadgeColor(score: number): string {
  if (score >= 0.8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (score >= 0.6) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

export default function SourceCard({ source, index }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const previewLimit = 150;
  const isLong = source.content_preview.length > previewLimit;
  const displayText = expanded
    ? source.content_preview
    : source.content_preview.slice(0, previewLimit) +
      (isLong ? "..." : "");

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className={cn(
        "w-full text-left border border-gray-800 rounded-lg p-3 transition-colors",
        "hover:border-gray-700 hover:bg-gray-900/50",
        expanded && "bg-gray-900/50 border-gray-700",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-gray-500">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-sm font-medium text-gray-200 truncate">
              [{index + 1}] {source.document_title}
            </span>
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded border shrink-0",
                relevanceBadgeColor(source.relevance_score),
              )}
            >
              {(source.relevance_score * 100).toFixed(0)}%
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            {displayText}
          </p>
        </div>
      </div>
    </button>
  );
}
