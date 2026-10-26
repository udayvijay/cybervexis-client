import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioSynth } from '../utils/audio';
import { 
  Zap, 
  Shield, 
  Award, 
  ArrowRight, 
  Heart, 
  ShieldAlert, 
  Users, 
  AlertTriangle, 
  Lock,
  Dices,
  CheckCircle2
} from 'lucide-react';

const diceOutcomes = {
  1: {
    key: "BONUS_40",
    title: "+40 BONUS",
    detail: "ADD 40 POINTS TO MISSION SCORE",
    badge: "+40 POINTS ADDED",
    color: "#00f0ff",
    textColor: "#7DD3FC",
    icon: Award
  },
  2: {
    key: "PENALTY_20",
    title: "-20 PENALTY",
    detail: "SUBTRACT 20 POINTS FROM MISSION SCORE",
    badge: "-20 POINTS DEDUCTED",
    color: "#f43f5e",
    textColor: "#FCA5A5",
    icon: ShieldAlert
  },
  3: {
    key: "DOUBLE",
    title: "DOUBLE TURN",
    detail: "DOUBLE TURN / X2 POINTS MODIFIER ENGAGED",
    badge: "X2 TURN ACTIVATED",
    color: "#bd00ff",
    textColor: "#FACC15",
    icon: Zap
  },
  4: {
    key: "EXTRA_LIFE",
    title: "EXTRA LIFE ACQUIRED",
    detail: "SYSTEM INTEGRITY BOOSTED",
    badge: "❤️ +1 LIFE",
    color: "#ff007f",
    textColor: "#FFFFFF",
    icon: Heart
  },
  5: {
    key: "SKIP_PENALTY",
    title: "SKIP PENALTY",
    detail: "BYPASS PENALTY MECHANIC UNLOCKED",
    badge: "BYPASS PROTOCOL UNLOCKED",
    color: "#39ff14",
    textColor: "#7DD3FC",
    icon: Shield
  },
  6: {
    key: "TEAMMATE_ASSIST",
    title: "TEAMMATE ASSIST",
    detail: "TACTICAL SUPPORT ENGAGED FOR UPCOMING QUESTION",
    badge: "TEAMMATE ASSIST ENGAGED",
    color: "#fffb00",
    textColor: "#FACC15",
    icon: Users
  }
};

const TacticalDiceProtocol = ({ onSpinComplete }) => {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revealStep, setRevealStep] = useState('IDLE'); // 'IDLE' | 'SIGNAL' | 'ANALYZING' | 'DECRYPTED'
  const [selectedNum, setSelectedNum] = useState(null);
  const [result, setResult] = useState(null);
  const [isClaimed, setIsClaimed] = useState(false);

  const validateInput = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    // Strict integer check 1 to 6
    if (!/^[1-6]$/.test(trimmed)) return false;
    return true;
  };

  const handleConfirm = () => {
    if (isSubmitting || revealStep !== 'IDLE') return;

    if (!validateInput(inputValue)) {
      setErrorMessage("INVALID DICE SIGNAL — ENTER A VALUE BETWEEN 1 AND 6");
      audioSynth.playWrongAnswer();
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    const num = parseInt(inputValue.trim(), 10);
    setSelectedNum(num);

    // Audio effect for physical dice confirm
    audioSynth.playDiceRoll();

    // Start 3-phase cyber decryption reveal sequence
    setRevealStep('SIGNAL'); // DICE SIGNAL RECEIVED

    setTimeout(() => {
      setRevealStep('ANALYZING'); // ANALYZING TACTICAL DATABASE...
    }, 700);

    setTimeout(() => {
      const chosenOutcome = diceOutcomes[num];
      setResult(chosenOutcome);
      setRevealStep('DECRYPTED'); // MODIFIER DECRYPTED
      setIsSubmitting(false);
      audioSynth.playLevelUnlock();
    }, 1500);
  };

  const handleQuickSelect = (num) => {
    if (isSubmitting || revealStep !== 'IDLE') return;
    setInputValue(num.toString());
    setErrorMessage(null);
  };

  const handleClaim = () => {
    if (isClaimed || !result) return;
    setIsClaimed(true);
    // Pass outcome back to App.jsx game state
    onSpinComplete({
      ...result,
      diceVal: selectedNum
    });
  };

  return (
    <div className="flex flex-col items-center justify-between p-6 sm:p-8 md:p-10 pb-10 sm:pb-12 md:pb-14 bg-cyber-darker/95 border-2 border-cyber-purple/60 rounded-2xl w-full max-w-4xl mx-auto relative overflow-y-auto shadow-[0_0_50px_rgba(189,0,255,0.35)] h-auto max-h-[90vh]">
      {/* Tech Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-purple pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-purple pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-purple pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-purple pointer-events-none" />

      {/* Cyber Grid overlay */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
      
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-radial-gradient from-cyber-purple/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Header */}
      <div className="text-center w-full z-10 mb-4">
        <h2 className="font-cyber text-2xl sm:text-3xl md:text-4xl font-black text-cyber-purple tracking-[0.2em] mb-2 text-glow-purple flex items-center justify-center space-x-3 uppercase">
          <Dices size={28} className="text-cyber-purple animate-pulse" />
          <span>⚡ TACTICAL DICE PROTOCOL ⚡</span>
          <Dices size={28} className="text-cyber-purple animate-pulse" />
        </h2>
        <p className="text-xs sm:text-sm font-mono text-slate-300 tracking-[0.15em] uppercase font-bold">
          ROLL PHYSICAL DICE TO ACQUIRE OPERATIONAL MODIFIER
        </p>
      </div>

      {/* Central Futuristic Dice Display */}
      <div className="w-full z-10 my-3 flex flex-col items-center">
        {revealStep === 'IDLE' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center"
          >
            {/* Status indicator */}
            <div className="flex items-center space-x-2 bg-cyber-darker border border-cyber-blue/40 px-4 py-1.5 rounded-full mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyber-blue animate-ping" />
              <span className="text-xs font-mono font-bold text-cyber-blue tracking-widest uppercase">
                AWAITING PHYSICAL DICE INPUT
              </span>
            </div>

            {/* Large Futuristic Placeholder Dice Box */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-cyber-darker/90 border-2 border-cyber-purple/70 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(189,0,255,0.3)] group transition-all duration-300 hover:border-cyber-blue">
              <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-cyber-purple" />
              <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-cyber-purple" />
              <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-cyber-purple" />
              <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-cyber-purple" />

              <span className="font-cyber text-5xl sm:text-6xl font-black text-cyber-purple group-hover:text-cyber-blue transition-colors text-glow-purple">
                {inputValue && validateInput(inputValue) ? inputValue : '?'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">
                DICE INPUT
              </span>
            </div>

            <p className="text-xs font-mono text-slate-400 mt-3 mb-4 tracking-wider uppercase font-semibold">
              ROLL YOUR PHYSICAL DICE
            </p>

            {/* Numerical Input & Selector */}
            <div className="w-full max-w-sm flex flex-col items-center space-y-3">
              <label className="text-xs font-mono text-cyber-blue font-bold tracking-widest uppercase flex items-center space-x-1.5">
                <span>ENTER DICE RESULT (1 - 6)</span>
              </label>

              <div className="flex items-center space-x-2 w-full justify-center">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setErrorMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                  }}
                  placeholder="?"
                  className="w-16 h-14 bg-cyber-darker border-2 border-cyber-purple text-center font-cyber font-black text-2xl text-white rounded-xl focus:border-cyber-blue focus:outline-none shadow-[0_0_15px_rgba(189,0,255,0.2)] focus:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
                />

                {/* Quick Select Buttons 1 to 6 */}
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={`btn-num-${num}`}
                      onClick={() => handleQuickSelect(num)}
                      className={`w-9 h-14 font-cyber font-bold text-sm rounded-lg border transition-all ${
                        inputValue === num.toString()
                          ? 'border-cyber-blue bg-cyber-blue/30 text-white shadow-[0_0_12px_rgba(0,240,255,0.5)] scale-105'
                          : 'border-cyber-purple/40 bg-cyber-purple/10 text-slate-300 hover:border-cyber-purple hover:bg-cyber-purple/20'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error validation banner */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-950/80 border border-red-500/80 rounded-xl text-center w-full shadow-[0_0_15px_rgba(239,68,68,0.3)] flex flex-col items-center justify-center space-y-0.5"
                  >
                    <div className="flex items-center space-x-2 text-red-400 font-cyber font-black text-xs uppercase tracking-widest">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span>INVALID DICE SIGNAL</span>
                    </div>
                    <span className="text-[11px] font-mono text-red-300 tracking-wider">
                      ENTER A VALUE BETWEEN 1 AND 6
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Prominent Confirm Button */}
              <button
                onClick={handleConfirm}
                className="w-full py-4 px-6 cyber-btn cyber-btn-purple font-cyber font-black text-sm sm:text-base tracking-[0.2em] rounded-xl cursor-pointer text-glow-purple shadow-lg hover:scale-[1.01] transition-all uppercase"
              >
                CONFIRM DICE RESULT
              </button>
            </div>
          </motion.div>
        )}

        {/* Decryption Reveal Sequence State */}
        {(revealStep === 'SIGNAL' || revealStep === 'ANALYZING') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full py-12 flex flex-col items-center justify-center space-y-4"
          >
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-cyber-purple/30 rounded-full animate-ping" />
              <div className="absolute inset-0 border-4 border-t-cyber-blue border-r-transparent border-b-cyber-pink border-l-transparent rounded-full animate-spin" />
              <span className="font-cyber font-black text-3xl text-white">{selectedNum}</span>
            </div>

            <div className="text-center space-y-1">
              <p className="font-cyber text-lg sm:text-xl font-bold text-cyber-blue tracking-widest animate-pulse">
                {revealStep === 'SIGNAL' ? 'DICE SIGNAL RECEIVED' : 'ANALYZING TACTICAL DATABASE...'}
              </p>
              <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">
                DECRYPTING OPERATIONAL MODIFIER PAYLOAD
              </p>
            </div>
          </motion.div>
        )}

        {/* Final Decrypted Result Banner */}
        {revealStep === 'DECRYPTED' && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg p-6 border-2 rounded-2xl text-center bg-cyber-darker/95 backdrop-blur-md shadow-2xl relative overflow-hidden space-y-4 my-2"
            style={{ 
              borderColor: result.color,
              boxShadow: `0 0 35px ${result.color}40`
            }}
          >
            {/* Tech Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: result.color }} />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: result.color }} />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: result.color }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: result.color }} />

            <div className="flex items-center justify-center space-x-2 text-xs font-mono text-slate-300 tracking-[0.2em] uppercase font-bold">
              <CheckCircle2 size={14} style={{ color: result.color }} />
              <span>MODIFIER DECRYPTED</span>
            </div>

            {/* Display Dice Number */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">DICE RESULT</span>
              <div 
                className="w-16 h-16 rounded-xl border-2 flex items-center justify-center my-1 font-cyber font-black text-3xl shadow-lg"
                style={{ 
                  borderColor: result.color, 
                  color: result.color,
                  backgroundColor: `${result.color}15`,
                  boxShadow: `0 0 20px ${result.color}50`
                }}
              >
                #{selectedNum}
              </div>
            </div>

            {/* Main Result Title */}
            <div>
              <h3 
                className="font-cyber font-black text-2xl sm:text-3xl tracking-widest flex items-center justify-center space-x-3 uppercase"
                style={{ 
                  color: result.color,
                  textShadow: `0 0 15px ${result.color}`
                }}
              >
                {result.icon && <result.icon size={26} className="animate-pulse" />}
                <span>{result.title}</span>
                {result.icon && <result.icon size={26} className="animate-pulse" />}
              </h3>
              <p className="text-xs font-mono text-slate-300 mt-1 uppercase tracking-wider font-semibold">
                {result.badge} — {result.detail}
              </p>
            </div>

            {/* Accept Modifier & Continue Button */}
            <button
              disabled={isClaimed}
              onClick={handleClaim}
              className={`w-full py-4 px-6 border-2 font-cyber rounded-xl text-xs sm:text-sm tracking-widest transition-all duration-300 transform flex items-center justify-center space-x-2 mt-4 uppercase font-black ${
                isClaimed 
                  ? 'border-slate-800 bg-slate-950/40 text-slate-650 cursor-not-allowed'
                  : 'bg-cyber-purple/20 border-cyber-purple text-white hover:bg-cyber-purple hover:text-black hover:scale-[1.01] hover:shadow-neon-purple cursor-pointer'
              }`}
            >
              <span>{isClaimed ? "MODIFIER APPLIED..." : "ACCEPT MODIFIER & CONTINUE"}</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Six Modifier Cards Grid (Encrypted Tactical Options) */}
      <div className="w-full z-10 mt-4 pt-4 border-t border-cyber-purple/30">
        <p className="text-[10px] font-mono text-slate-400 text-center uppercase tracking-widest mb-3 font-semibold">
          TACTICAL MODIFIER DATABASE (DICE MAP 1–6)
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const cardItem = diceOutcomes[num];
            const isSelected = selectedNum === num && revealStep === 'DECRYPTED';

            return (
              <div
                key={`tactical-card-${num}`}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all duration-300 ${
                  isSelected
                    ? 'border-2 scale-105 shadow-lg bg-cyber-darker/90'
                    : 'border-cyber-purple/30 bg-cyber-darker/40 opacity-75'
                }`}
                style={{
                  borderColor: isSelected ? cardItem.color : undefined,
                  boxShadow: isSelected ? `0 0 15px ${cardItem.color}40` : undefined
                }}
              >
                <div className="flex items-center space-x-1 mb-1">
                  <span 
                    className="font-cyber font-bold text-xs"
                    style={{ color: isSelected ? cardItem.color : '#94A3B8' }}
                  >
                    #{num}
                  </span>
                  {isSelected ? (
                    <cardItem.icon size={12} style={{ color: cardItem.color }} />
                  ) : (
                    <Lock size={10} className="text-slate-500" />
                  )}
                </div>

                <span 
                  className="font-cyber font-bold text-[10px] tracking-tight uppercase line-clamp-1"
                  style={{ color: isSelected ? cardItem.color : '#CBD5E1' }}
                >
                  {cardItem.title}
                </span>

                <span className="text-[9px] font-mono text-slate-400 tracking-tighter uppercase mt-0.5">
                  {cardItem.badge}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TacticalDiceProtocol;
