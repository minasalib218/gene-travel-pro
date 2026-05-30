
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const plans = [
  { id: 1, title: 'Arctic Escape', emoji: '❄️', location: 'Iceland', days: 5 },
  { id: 2, title: 'Tropical Island', emoji: '🌴', location: 'Bali', days: 7 },
  { id: 3, title: 'Mountain Trek', emoji: '🥾', location: 'Alps', days: 4 },
];

export default function Slider() {
  const [index, setIndex] = useState(0);

  const next = () => {
    setIndex((index + 1) % plans.length);
  };

  const prev = () => {
    setIndex((index - 1 + plans.length) % plans.length);
  };

  // Auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      next();
    }, 5000);
    return () => clearInterval(timer);
  }, [index]);

  return (
    <div className="relative w-full max-w-md mx-auto h-[300px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={plans[index].id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-lg text-white"
        >
          <div className="text-4xl">{plans[index].emoji}</div>
          <h2 className="text-xl font-bold mt-4">{plans[index].title}</h2>
          <p className="text-sm mt-2">{plans[index].location}</p>
          <p className="text-xs mt-1">{plans[index].days} days</p>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-4 w-full flex justify-between px-4">
        <button onClick={prev} className="bg-orange-500 text-white px-4 py-1 rounded-full">
          ◀
        </button>
        <button onClick={next} className="bg-orange-500 text-white px-4 py-1 rounded-full">
          ▶
        </button>
      </div>
    </div>
  );
}
