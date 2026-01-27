// src\app\attendance\components\Office.jsx
"use client";
import React from "react";
import AttendanceForm from "./AttendanceForm";

export default function Office() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-left mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Office Employee Attendance
                </h2>
            </div>

            {/* Attendance Form */}
            <AttendanceForm laborType="Office" />
        </div>
    );
}