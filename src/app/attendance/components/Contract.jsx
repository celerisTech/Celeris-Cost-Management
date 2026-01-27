import AttendanceForm from "./AttendanceForm";

export default function Contract() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Contract Employee Attendance</h2>
      <AttendanceForm laborType="Contract" />
    </div>
  );
}
