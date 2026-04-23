"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolName: string;
  input: Record<string, any> | undefined;
  done: boolean;
}

function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

function getLabel(toolName: string, input: Record<string, any> | undefined, done: boolean): string {
  const file = getFileName(input?.path ?? "");

  if (toolName === "str_replace_editor") {
    switch (input?.command) {
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
    switch (input?.command) {
      case "rename":
        return done ? `Renamed ${file}` : `Renaming ${file}`;
      case "delete":
        return done ? `Deleted ${file}` : `Deleting ${file}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolName, input, done }: ToolInvocationBadgeProps) {
  const label = getLabel(toolName, input, done);

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
