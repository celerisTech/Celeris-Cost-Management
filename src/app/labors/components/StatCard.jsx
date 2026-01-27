import React from 'react';
import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

export const StatCard = ({ icon: Icon, title, value, unit, color }) => {
  const displayValue = useAnimatedNumber(value);

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
      }}
      className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color.bg}`}>
          <Icon size={18} className={color.text} />
        </div>
        <span className="text-sm font-medium text-slate-500">{title}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-800">
        {displayValue}{unit}
      </p>
    </motion.div>
  );
};