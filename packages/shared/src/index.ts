import * as z from "zod";

export const ContactSchema = z.object({
  name: z.string().min(2, { error: "Name is too short" }),
  email: z.email({ error: "Invalid email address" }),
  message: z.string().min(10, { error: "Message must be at least 10 characters" }),
});

export type ContactInput = z.infer<typeof ContactSchema>;
