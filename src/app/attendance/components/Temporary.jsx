import AttendanceForm from "./AttendanceForm";

export default function Temporary() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Temporary Employee Attendance</h2>
      <AttendanceForm laborType="Temporary" />
    </div>
  );
}
