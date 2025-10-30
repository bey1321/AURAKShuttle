import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  UserSchoolID: z.string().min(1, "UserSchoolID is required"),
  role: z.enum(["student", "staff"]),
});

export type UserFormData = z.infer<typeof userSchema>;
