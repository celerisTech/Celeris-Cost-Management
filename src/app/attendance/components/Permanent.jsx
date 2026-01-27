import AttendanceForm from "./AttendanceForm";

export default function Permanent() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Permanent Employee Attendance</h2>
      <AttendanceForm laborType="Permanent" />
    </div>
  );
}
