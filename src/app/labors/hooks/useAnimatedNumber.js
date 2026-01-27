import { useEffect, useState } from 'react';
import { useSpring } from 'framer-motion';

export function useAnimatedNumber(value) {
  const motionValue = useSpring(0, { damping: 40, stiffness: 300 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => {
      const formattedValue = Number.isInteger(value) ? Math.round(latest) : parseFloat(latest).toFixed(2);
      setDisplayValue(formattedValue);
    });
    return () => unsubscribe();
  }, [motionValue, value]);

  return displayValue;
}