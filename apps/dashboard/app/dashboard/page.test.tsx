import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

let DashboardPage: React.ComponentType;

describe("DashboardPage", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";

    const mod = await import("./page");
    DashboardPage = mod.default;
  });

  it("loads and renders meta data as dashboard cards", async () => {
    const mockMeta = {
      totalSubmissions: 42,
      lastExample: {
        name: "Rian Schmits",
        email: "rian@example.com",
        messagePreview: "Voorbeeldbericht vanuit de meta-endpoint."
      },
      updatedAt: "2025-11-17T10:00:00.000Z"
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMeta
    });
    (globalThis as any).fetch = fetchMock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toMatch(/\/dashboard$/);
    expect(callArgs[1]?.method).toBe("GET");

    expect(
      await screen.findByRole("heading", { name: /total submissions/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(String(mockMeta.totalSubmissions))
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /last example message/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(mockMeta.lastExample.name)
    ).toBeInTheDocument();

    expect(
      screen.getByText(mockMeta.lastExample.email)
    ).toBeInTheDocument();

    expect(
      screen.getByText(mockMeta.lastExample.messagePreview)
    ).toBeInTheDocument();
  });

  it("shows an error message when loading meta data fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(
      new Error("Network error")
    );
    (globalThis as any).fetch = fetchMock;

    render(<DashboardPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const error = await screen.findByText(/failed to load dashboard data|request failed|error/i);
    expect(error).toBeInTheDocument();
  });

  it("shows a warning and does not call fetch when NEXT_PUBLIC_API_BASE_URL is not set", async () => {
    vi.resetModules();
    vi.clearAllMocks();

    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    const fetchMock = vi.fn();
    (globalThis as any).fetch = fetchMock;

    const mod = await import("./page");
    const PageWithoutApiBase = mod.default;

    render(<PageWithoutApiBase />);

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled();
    });

    const warning = screen.getByText(/NEXT_PUBLIC_API_BASE_URL is not set/i);
    expect(warning).toBeInTheDocument();
  });
});
