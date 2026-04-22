"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

function getLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args, state } = toolInvocation;
  const done = state === "result";

  if (toolName === "str_replace_editor") {
    const file = getFileName(args?.path ?? "");
    switch (args?.command) {
      case "create":
        return done ? `Created ${file}` : `Creating ${file}`;
      case "str_replace":
      case "insert":
        return done ? `Edited ${file}` : `Editing ${file}`;
      case "view":
        return done ? `Read ${file}` : `Reading ${file}`;
      default:
        return done ? `Edited ${file}` : `Editing ${file}`;
    }
  }

  if (toolName === "file_manager") {
    const file = getFileName(args?.path ?? "");
    switch (args?.command) {
      case "rename":
        return done ? `Renamed ${file}` : `Renaming ${file}`;
      case "delete":
        return done ? `Deleted ${file}` : `Deleting ${file}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const done = toolInvocation.state === "result";
  const label = getLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
