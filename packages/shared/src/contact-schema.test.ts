import { describe, it, expect } from "vitest";
import { ContactSchema } from "./index";

describe("ContactSchema", () => {
    it("accepts a valid dashboard payload", () => {
        const result = ContactSchema.safeParse({
            name: "Rian Schmits",
            email: "rian@example.com",
            message: "Dit is een redelijk lange testboodschap."
        });

        expect(result.success).toBe(true);
    });

    it("rejects name that is too short", () => {
        const result = ContactSchema.safeParse({
            name: "R",
            email: "rian@example.com",
            message: "Geldige message inhoud."
        });

        expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
        const result = ContactSchema.safeParse({
            name: "Rian Schmits",
            email: "not-an-email",
            message: "Nog een geldige message inhoud."
        });

        expect(result.success).toBe(false);
    });

    it("rejects too short message", () => {
        const result = ContactSchema.safeParse({
            name: "Rian Schmits",
            email: "rian@example.com",
            message: "Kort"
        });

        expect(result.success).toBe(false);
    });

    it("rejects completely empty object", () => {
        const result = ContactSchema.safeParse({});

        expect(result.success).toBe(false);
    });
});
