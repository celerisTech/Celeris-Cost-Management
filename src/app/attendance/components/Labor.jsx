import AttendanceForm from "./AttendanceForm";

export default function Labor() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Attendance</h2>
      <AttendanceForm laborType="Labor" />
    </div>
  );
}
