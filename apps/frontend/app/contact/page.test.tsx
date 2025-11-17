import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

let ContactPage: React.ComponentType;

describe("ContactPage", () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/";

        const mod = await import("./page");
        ContactPage = mod.default;
    });

    it("renders the dashboard form", () => {
        render(<ContactPage />);

        expect(
            screen.getByRole("heading", { name: /contact/i })
        ).toBeInTheDocument();

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it("submits a valid form and calls fetch", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true, received: { name: "Rian" } }),
        });

        (globalThis as any).fetch = fetchMock;

        render(<ContactPage />);

        fireEvent.change(screen.getByLabelText(/name/i), {
            target: { value: "Rian Schmits" },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "rian@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/message/i), {
            target: { value: "Dit is een testbericht voor het formulier." },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /send/i })
        );

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        const args = fetchMock.mock.calls[0];
        expect(args[0]).toBe("http://localhost:4000/");
        expect(args[1]?.method).toBe("POST");
    });

  it("shows an error when client-side validation fails", async () => {
    const fetchMock = vi.fn();
    (globalThis as any).fetch = fetchMock;

    render(<ContactPage />);


    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "R" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "rian@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "kort" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /send/i })
    );

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled();
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/invalid input|check your input/i);
  });

  it("shows a success message when the backend returns ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    });

    (globalThis as any).fetch = fetchMock;

    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Rian Schmits" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "rian@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Dit is een testbericht van voldoende lengte." },
    });

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const statusMessage = await screen.findByRole("status");
    expect(statusMessage).toBeInTheDocument();
    expect(statusMessage).toHaveTextContent(/thank you/i);
  });

  it("shows a warning when NEXT_PUBLIC_API_BASE_URL is not set", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    const mod = await import("./page");
    const PageWithoutApi = mod.default;

    render(<PageWithoutApi />);

    const button = screen.getByRole("button", { name: /send/i });
    expect(button).toBeDisabled();

    expect(
      screen.getByText(/NEXT_PUBLIC_API_BASE_URL is not set/i)
    ).toBeInTheDocument();
  });
});
