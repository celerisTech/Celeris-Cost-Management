import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export const CalendarGrid = ({ year, month, logs, selectedDate, onDateClick }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const dateStatusMap = useMemo(() => {
    const map = {};
    if (!logs) return map;

    logs.forEach(log => {
      const status = (log.CM_Status || '').toLowerCase();
      const date = log.CM_Attendance_Date;

      if (date) {
        switch (status) {
          case 'present':
            map[date] = 'present';
            break;
          case 'half-day':
            map[date] = 'half-day';
            break;
          case 'leave':
            map[date] = 'leave';
            break;
          case 'holiday':
            map[date] = 'holiday';
            break;
          case 'absent':
            map[date] = 'absent';
            break;
          case 'on-duty':
            map[date] = 'present';
            break;
          case 'week-off':
            map[date] = 'holiday';
            break;
          default:
            map[date] = 'none';
        }
      }
    });

    return map;
  }, [logs]);

  const getDayClasses = (status) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-200 text-black hover:bg-emerald-300';
      case 'half-day':
        return 'bg-yellow-200 text-black hover:bg-yellow-300';
      case 'leave':
        return 'bg-red-200 text-black hover:bg-red-300';
      case 'holiday':
        return 'bg-gray-200 text-black hover:bg-gray-300';
      case 'absent':
        return 'bg-rose-200 text-black hover:bg-rose-300';
      default:
        return 'bg-slate-200 text-black hover:bg-slate-300';
    }
  };

  return (
    <motion.div
      key={`${year}-${month}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6"
    >
      <div className="grid grid-cols-7 gap-1 mb-3 text-center text-xs font-semibold text-slate-500">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={index}>{day}</div>
        ))}
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-7 gap-1"
      >
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = dateStatusMap[dateStr];
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
            <motion.div key={day} variants={itemVariants}>
              <button
                onClick={() => onDateClick(dateStr)}
                className={`w-full h-8 sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 
                  ${getDayClasses(status)} 
                  ${isToday ? 'ring-2 ring-indigo-400' : ''} 
                  ${selectedDate === dateStr ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
              >
                {day}
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};