import React from "react";
import Navbar from "../components/Navbar";
import { Home, Wallet, PieChart, Settings } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Celeris Solutions",
};

export default async function DashboardLayout({ children }) {
  // Server-side auth check: ccms_token is HttpOnly, so check it here
  const cookieStore = await cookies();
  const token = cookieStore.get("ccms_token")?.value;

  if (!token) {
    redirect("/");
  }

  return (
    <div className="h-screen bg-white">
      <div className="flex h-screen">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {/* Page container */}
          <div className="mx-auto ">{children}</div> 
        </main>
      </div>
    </div>
  );
}
