import { render, screen, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach } from "vitest";

afterEach(cleanup);
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

function makeInvocation(
  toolName: string,
  args: Record<string, string>,
  state: "call" | "result" | "partial-call" = "call"
): ToolInvocation {
  const base = { toolCallId: "1", toolName, args };
  if (state === "result") {
    return { ...base, state, result: "ok" };
  }
  return { ...base, state };
}

describe("str_replace_editor", () => {
  test("shows 'Creating <file>' while in progress", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/App.jsx" })} />);
    expect(screen.getByText("Creating App.jsx")).toBeTruthy();
  });

  test("shows 'Created <file>' when complete", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/App.jsx" }, "result")} />);
    expect(screen.getByText("Created App.jsx")).toBeTruthy();
  });

  test("shows 'Editing <file>' for str_replace command", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "components/Button.tsx" })} />);
    expect(screen.getByText("Editing Button.tsx")).toBeTruthy();
  });

  test("shows 'Edited <file>' for str_replace when complete", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "components/Button.tsx" }, "result")} />);
    expect(screen.getByText("Edited Button.tsx")).toBeTruthy();
  });

  test("shows 'Editing <file>' for insert command", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "utils/helpers.ts" })} />);
    expect(screen.getByText("Editing helpers.ts")).toBeTruthy();
  });

  test("shows 'Reading <file>' for view command", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "App.tsx" })} />);
    expect(screen.getByText("Reading App.tsx")).toBeTruthy();
  });

  test("shows 'Read <file>' for view command when complete", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "App.tsx" }, "result")} />);
    expect(screen.getByText("Read App.tsx")).toBeTruthy();
  });

  test("uses only the filename, not the full path", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/components/deep/Nested.tsx" })} />);
    expect(screen.getByText("Creating Nested.tsx")).toBeTruthy();
  });
});

describe("file_manager", () => {
  test("shows 'Renaming <file>' for rename command", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "old.tsx", new_path: "new.tsx" })} />);
    expect(screen.getByText("Renaming old.tsx")).toBeTruthy();
  });

  test("shows 'Renamed <file>' for rename when complete", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "rename", path: "old.tsx", new_path: "new.tsx" }, "result")} />);
    expect(screen.getByText("Renamed old.tsx")).toBeTruthy();
  });

  test("shows 'Deleting <file>' for delete command", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "src/unused.ts" })} />);
    expect(screen.getByText("Deleting unused.ts")).toBeTruthy();
  });

  test("shows 'Deleted <file>' for delete when complete", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "src/unused.ts" }, "result")} />);
    expect(screen.getByText("Deleted unused.ts")).toBeTruthy();
  });
});

describe("unknown tool", () => {
  test("falls back to tool name for unknown tools", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("some_other_tool", {})} />);
    expect(screen.getByText("some_other_tool")).toBeTruthy();
  });
});

describe("partial-call state (args still streaming)", () => {
  test("shows in-progress label while args are streaming", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "src/App.jsx" }, "partial-call")} />);
    expect(screen.getByText("Creating App.jsx")).toBeTruthy();
  });

  test("renders spinner during partial-call", () => {
    const { container } = render(
      <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.jsx" }, "partial-call")} />
    );
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
  });

  test("file_manager shows in-progress during partial-call", () => {
    render(<ToolInvocationBadge toolInvocation={makeInvocation("file_manager", { command: "delete", path: "src/old.ts" }, "partial-call")} />);
    expect(screen.getByText("Deleting old.ts")).toBeTruthy();
  });
});

describe("status indicator", () => {
  test("renders spinner when in progress", () => {
    const { container } = render(
      <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.jsx" })} />
    );
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  test("renders green dot when complete", () => {
    const { container } = render(
      <ToolInvocationBadge toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "App.jsx" }, "result")} />
    );
    expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });
});
