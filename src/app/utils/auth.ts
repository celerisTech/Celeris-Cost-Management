import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";

export interface AuthenticatedUser {
  id: number | string;
  user: string;
  mobile: string;
  companyId?: number | string;
  role?: string;
  [key: string]: any;
}

export interface AuthValidationResult {
  success: boolean;
  user?: AuthenticatedUser;
  errorResponse?: NextResponse;
}

/**
 * Extract and verify JWT token from cookies or Authorization header.
 */
export async function getAuthUser(req?: Request): Promise<AuthValidationResult> {
  try {
    let token: string | undefined;

    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value || cookieStore.get("ccms_token")?.value;
    }

    if (!token) {
      return {
        success: false,
        errorResponse: NextResponse.json(
          { error: "Unauthorized: Missing authentication token" },
          { status: 401 }
        ),
      };
    }

    const secret = process.env.JWT_SECRET || "default_ccms_secret_key_change_in_prod";
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;

    return {
      success: true,
      user: decoded,
    };
  } catch (error: any) {
    console.error("JWT Verification failed:", error?.message || error);
    return {
      success: false,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Invalid or expired authentication token" },
        { status: 401 }
      ),
    };
  }
}
