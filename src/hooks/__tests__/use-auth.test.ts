import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// --- initial state ---

test("returns signIn, signUp functions and isLoading as false initially", () => {
  const { result } = renderHook(() => useAuth());

  expect(typeof result.current.signIn).toBe("function");
  expect(typeof result.current.signUp).toBe("function");
  expect(result.current.isLoading).toBe(false);
});

// --- signIn happy path ---

test("signIn calls signInAction with provided email and password", async () => {
  (signInAction as any).mockResolvedValue({ success: false, error: "Invalid" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "mypassword");
  });

  expect(signInAction).toHaveBeenCalledWith("user@example.com", "mypassword");
});

test("signIn returns the result from signInAction", async () => {
  const mockResult = { success: false, error: "Invalid credentials" };
  (signInAction as any).mockResolvedValue(mockResult);

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("user@example.com", "wrong");
  });

  expect(returnValue).toEqual(mockResult);
});

test("signIn sets isLoading to true during execution", async () => {
  let resolveSignIn!: (val: any) => void;
  (signInAction as any).mockReturnValue(
    new Promise((resolve) => {
      resolveSignIn = resolve;
    })
  );
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "p1" });

  const { result } = renderHook(() => useAuth());

  let signInPromise: Promise<any>;
  act(() => {
    signInPromise = result.current.signIn("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveSignIn({ success: true });
    await signInPromise;
  });
});

test("signIn resets isLoading to false after completion", async () => {
  (signInAction as any).mockResolvedValue({ success: false });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signIn resets isLoading to false even when signInAction throws", async () => {
  (signInAction as any).mockRejectedValue(new Error("Network error"));

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    try {
      await result.current.signIn("user@example.com", "password");
    } catch {
      // expected
    }
  });

  expect(result.current.isLoading).toBe(false);
});

// --- signIn: no post-sign-in side effects on failure ---

test("signIn does not trigger post-sign-in flow on failure", async () => {
  (signInAction as any).mockResolvedValue({ success: false, error: "Bad creds" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "wrong");
  });

  expect(getAnonWorkData).not.toHaveBeenCalled();
  expect(getProjects).not.toHaveBeenCalled();
  expect(createProject).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});

// --- signUp happy path ---

test("signUp calls signUpAction with provided email and password", async () => {
  (signUpAction as any).mockResolvedValue({ success: false, error: "Taken" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "password123");
  });

  expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
});

test("signUp returns the result from signUpAction", async () => {
  const mockResult = { success: false, error: "Email already registered" };
  (signUpAction as any).mockResolvedValue(mockResult);

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signUp("existing@example.com", "password");
  });

  expect(returnValue).toEqual(mockResult);
});

test("signUp sets isLoading to true during execution", async () => {
  let resolveSignUp!: (val: any) => void;
  (signUpAction as any).mockReturnValue(
    new Promise((resolve) => {
      resolveSignUp = resolve;
    })
  );
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "p1" });

  const { result } = renderHook(() => useAuth());

  let signUpPromise: Promise<any>;
  act(() => {
    signUpPromise = result.current.signUp("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveSignUp({ success: true });
    await signUpPromise;
  });
});

test("signUp resets isLoading to false after completion", async () => {
  (signUpAction as any).mockResolvedValue({ success: false });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("user@example.com", "password");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signUp resets isLoading to false even when signUpAction throws", async () => {
  (signUpAction as any).mockRejectedValue(new Error("Server error"));

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    try {
      await result.current.signUp("user@example.com", "password");
    } catch {
      // expected
    }
  });

  expect(result.current.isLoading).toBe(false);
});

test("signUp does not trigger post-sign-in flow on failure", async () => {
  (signUpAction as any).mockResolvedValue({ success: false, error: "Taken" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("user@example.com", "pass");
  });

  expect(getAnonWorkData).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});

// --- post-sign-in: anon work migration ---

test("creates project from anon work and redirects when anon messages exist after signIn", async () => {
  const anonWork = {
    messages: [{ role: "user", content: "Build me a button" }],
    fileSystemData: { "/": {}, "/App.jsx": { content: "<App />" } },
  };
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(anonWork);
  (createProject as any).mockResolvedValue({ id: "anon-proj-42" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({
      messages: anonWork.messages,
      data: anonWork.fileSystemData,
    })
  );
  expect(clearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/anon-proj-42");
  expect(getProjects).not.toHaveBeenCalled();
});

test("anon project name includes a timestamp label", async () => {
  const anonWork = {
    messages: [{ role: "user", content: "Hello" }],
    fileSystemData: {},
  };
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(anonWork);
  (createProject as any).mockResolvedValue({ id: "p" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  const callArg = (createProject as any).mock.calls[0][0];
  expect(callArg.name).toMatch(/^Design from /);
});

test("skips anon work migration when messages array is empty", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue({ messages: [], fileSystemData: {} });
  (getProjects as any).mockResolvedValue([{ id: "existing-proj" }]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).not.toHaveBeenCalled();
  expect(clearAnonWork).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/existing-proj");
});

test("skips anon work migration when getAnonWorkData returns null", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "existing-proj" }]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).not.toHaveBeenCalled();
  expect(getProjects).toHaveBeenCalled();
});

// --- post-sign-in: existing projects ---

test("redirects to most recent project when user has projects and no anon work", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([
    { id: "recent-proj" },
    { id: "older-proj" },
  ]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/recent-proj");
  expect(createProject).not.toHaveBeenCalled();
});

// --- post-sign-in: no projects ---

test("creates new project and redirects when user has no projects and no anon work", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "new-proj-99" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/new-proj-99");
});

test("new project name matches 'New Design #<number>' pattern", async () => {
  (signInAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([]);
  (createProject as any).mockResolvedValue({ id: "new-proj" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password");
  });

  const callArg = (createProject as any).mock.calls[0][0];
  expect(callArg.name).toMatch(/^New Design #\d+$/);
});

// --- signUp triggers the same post-sign-in flow ---

test("signUp redirects to most recent project on success", async () => {
  (signUpAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(null);
  (getProjects as any).mockResolvedValue([{ id: "proj-signup" }]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "password123");
  });

  expect(mockPush).toHaveBeenCalledWith("/proj-signup");
});

test("signUp migrates anon work on success", async () => {
  const anonWork = {
    messages: [{ role: "user", content: "Hello" }],
    fileSystemData: { "/": {} },
  };
  (signUpAction as any).mockResolvedValue({ success: true });
  (getAnonWorkData as any).mockReturnValue(anonWork);
  (createProject as any).mockResolvedValue({ id: "migrated-proj" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "password123");
  });

  expect(createProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: anonWork.messages })
  );
  expect(clearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/migrated-proj");
});
