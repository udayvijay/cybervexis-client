import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

const ScoreHUD = ({ score = 0, lives = 5, showLifeLost = false }) => {
  const prevScoreRef = useRef(score);
  const [scoreDelta, setScoreDelta] = useState(null); // 'up' | 'down' | null
  const [displayDelta, setDisplayDelta] = useState(0);

  useEffect(() => {
    const diff = score - prevScoreRef.current;
    if (diff !== 0) {
      setScoreDelta(diff > 0 ? 'up' : 'down');
      setDisplayDelta(diff);

      const timer = setTimeout(() => {
        setScoreDelta(null);
      }, 500);

      prevScoreRef.current = score;
      return () => clearTimeout(timer);
    }
  }, [score]);

  return (
    <>
      {/* 5 Glowing Cyber Hearts (Lives UI) - FIXED AT UPPER-LEFT */}
      <div 
        className="fixed top-[20px] sm:top-[28px] left-[20px] sm:left-[32px] z-[1000] pointer-events-none select-none"
      >
        <div className="flex items-center space-x-2 bg-cyber-darker/95 border border-cyber-pink/40 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(255,0,127,0.25)] backdrop-blur-md relative pointer-events-auto">
          <span className="text-[#C5CBD5] font-mono text-[10px] sm:text-xs font-semibold mr-0.5 tracking-wider">
            LIVES:
          </span>

          {/* Small shake animation container on life deduction */}
          <motion.div 
            animate={
              showLifeLost 
                ? { x: [-4, 4, -4, 4, 0] } 
                : { x: 0 }
            }
            transition={{ duration: 0.4 }}
            className="flex items-center space-x-1 sm:space-x-1.5"
          >
            {[1, 2, 3, 4, 5].map((heartIndex) => {
              const isActive = heartIndex <= lives;
              const isJustLost = showLifeLost && heartIndex === lives + 1;
              return (
                <motion.div
                  key={`heart-${heartIndex}`}
                  animate={
                    isJustLost
                      ? { scale: [1, 1.4, 0.9, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  {isActive ? (
                    <Heart 
                      size={16} 
                      className="text-cyber-pink fill-cyber-pink filter drop-shadow(0 0 6px #ff007f) transition-all duration-300" 
                    />
                  ) : (
                    <Heart 
                      size={16} 
                      className={`transition-all duration-300 ${
                        isJustLost 
                          ? 'text-red-500 fill-red-500 animate-pulse filter drop-shadow(0 0 10px #ff0000)' 
                          : 'text-slate-700 fill-slate-800/40 opacity-30'
                      }`} 
                    />
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Short "Life Lost" Toast Message */}
          <AnimatePresence>
            {showLifeLost && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="absolute -bottom-8 left-0 text-[10px] sm:text-xs font-mono font-black text-cyber-pink bg-cyber-darker border border-cyber-pink/80 px-2 py-0.5 rounded-lg shadow-[0_0_12px_#ff007f] whitespace-nowrap uppercase tracking-wider flex items-center space-x-1"
              >
                <Heart size={12} className="fill-cyber-pink animate-ping" />
                <span>Life Lost</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mission Score HUD - FIXED AT UPPER-RIGHT */}
      <div 
        className="fixed top-[20px] sm:top-[28px] right-[20px] sm:right-[32px] z-[1000] pointer-events-none select-none"
      >
        <motion.div 
          animate={
            scoreDelta === 'up'
              ? { scale: [1, 1.05, 1] }
              : scoreDelta === 'down'
              ? { scale: [1, 1.05, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center font-mono text-xs sm:text-sm tracking-wider uppercase bg-cyber-darker/95 border border-cyber-blue/40 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.2)] backdrop-blur-md pointer-events-auto"
        >
          {/* Label */}
          <span className="text-[#C5CBD5] font-medium mr-2">
            MISSION SCORE:
          </span>

          {/* Dynamic Score Value */}
          <span 
            className={`font-cyber font-bold text-sm sm:text-base tracking-wide transition-colors duration-300 ${
              scoreDelta === 'up' 
                ? 'text-[#39FF14]' 
                : scoreDelta === 'down' 
                ? 'text-[#FF007F]' 
                : 'text-[#22D3EE]'
            }`}
          >
            {score} PTS
          </span>

          {/* Instant Delta Notification Indicator (+100 / -50) */}
          <AnimatePresence>
            {scoreDelta && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`ml-2 text-xs font-bold font-mono ${
                  scoreDelta === 'up' ? 'text-[#39FF14]' : 'text-[#FF007F]'
                }`}
              >
                ({scoreDelta === 'up' ? `+${displayDelta}` : `${displayDelta}`})
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default ScoreHUD;
