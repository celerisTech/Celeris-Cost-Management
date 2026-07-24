import { z } from "zod";

export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, "Username/phone is required")
    .transform((val) => val.trim()),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters long"),
});

export const ProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  status: z.enum(["Active", "Completed", "Pending", "Cancelled"]).optional(),
});

export const UserRegistrationSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  phone: z.string().min(8),
  role: z.string().optional(),
  companyId: z.union([z.string(), z.number()]).optional(),
});
