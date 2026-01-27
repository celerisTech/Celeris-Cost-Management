"use client";
import React, { useState } from "react";
import { useAuthStore } from "@/app/store/useAuthScreenStore";
import Navbar from "../components/Navbar";

export default function AccountSettings() {
  const { user } = useAuthStore();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("❌ New password and confirm password do not match");
      return;



    }

    try {
      setLoading(true);
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword, userId: user?.CM_User_ID }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) return;

    try {
      setLoading(true);
      const res = await fetch("/api/deactivate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.CM_user_id }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Account deactivated. Logging out...");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/login";
        }, 2000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Could not deactivate account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white ">
      <Navbar />
      <div className="h-screen overflow-y-auto bg-white py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className=" mx-auto bg-white rounded-xl shadow-md overflow-hidden ">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Account Settings</h1>
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-semibold text-lg">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mb-10">
              <div className="border-b border-gray-200 pb-4 mb-6 text-black">
                <h2 className="text-xl font-semibold text-gray-700">Change Password</h2>
                <p className="text-sm text-gray-500">Ensure your account is secure with a strong password</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    id="oldPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-white transition ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-gray-200 pt-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Danger Zone</h2>
                <p className="text-sm text-gray-500">Irreversible actions</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="text-lg font-medium text-red-800 mb-2">Deactivate Account</h3>
                <p className="text-sm text-red-600 mb-4">
                  This will permanently deactivate your account. You will lose access to all features.
                </p>
                <button
                  onClick={handleDeactivate}
                  disabled={loading}
                  className={`py-2 px-4 rounded-lg font-medium text-white transition ${loading ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {loading ? "Processing..." : "Deactivate Account"}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`mt-6 p-3 rounded-lg text-center font-medium ${message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}       