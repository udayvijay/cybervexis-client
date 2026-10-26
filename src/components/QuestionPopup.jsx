import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioSynth } from '../utils/audio';
import { AlertTriangle, CheckCircle, Shield, Zap, RefreshCw, X, ArrowRight, Users, Eye, Globe } from 'lucide-react';

const QuestionPopup = ({ 
  question, 
  onAnswered,
  onWrongAnswer,
  lives = 5,
  isGameOver = false, 
  shieldActive, 
  doublePointsActive, 
  retryActive, 
  onRetryConsumed, 
  skipPenaltyActive, 
  onSkip,
  teammateAssistActive,
  onTeammateAssistConsumed,
  playerPosition = 1,
  score = 0,
  language = 'en',
  onLanguageChange
}) => {
  const [localSelection, setLocalSelection] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Timer States: 5s Reading Phase followed by 30s Answer Countdown
  const [readingPhase, setReadingPhase] = useState(true);
  const [readingTimer, setReadingTimer] = useState(5);
  const [timer, setTimer] = useState(30);

  const [showFeedback, setShowFeedback] = useState(false);
  const [isTimeOut, setIsTimeOut] = useState(false);

  // Options and retry cache
  const [options, setOptions] = useState([]);
  const [failedOptions, setFailedOptions] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  // Compute question number based on node index
  const questionNumber = ((playerPosition - 1) % 5) + 1;
  const correctAnswer = question.correctAnswer || question.answer;

  const isHindi = question?.language === 'hi';

  const texts = {
    sector: isHindi 
      ? `क्षेत्र ${question.level} // खतरा ${questionNumber} / 5`
      : `SECTOR ${question.level} // THREAT ${questionNumber} OF 5`,
    readingPhaseTitle: isHindi ? `पढ़ने की अवधि (${readingTimer}से)` : `READING PHASE (${readingTimer}s)`,
    readingPhaseSubtitle: isHindi ? `प्रश्न और विकल्पों की समीक्षा करें` : `Review Question & Options`,
    answerTime: isHindi ? `समय: ${timer}से` : `SEC: ${timer}s`,
    lockAnswer: isHindi ? "उत्तर लॉक करें" : "LOCK ANSWER",
    nextQuestion: isHindi ? "अगला प्रश्न" : "NEXT QUESTION",
    explanation: isHindi ? "स्पष्टीकरण" : "EXPLANATION",
    correct: isHindi 
      ? `सही उत्तर! खतरा निष्प्रभावी हो गया (+${doublePointsActive ? "200" : "100"} अंक)`
      : `CORRECT! VULNERABILITY MITIGATED (+${doublePointsActive ? "200" : "100"} POINTS)`,
    wrong: isHindi 
      ? "गलत उत्तर! अनधिकृत घुसपैठ पाई गई (-50 अंक)"
      : "INCORRECT ACCESS! MALICIOUS INTRUSION DETECTED (-50 POINTS)",
    timeout: isHindi 
      ? "समय समाप्त! कनेक्शन टूट गया (-50 अंक)"
      : "CONNECTION TIMED OUT! HOST DISRUPTED (-50 PTS)",
    shieldBlocked: isHindi 
      ? "गलत उत्तर! शील्ड ने नुकसान रोका (0 अंक हानि)"
      : "WRONG ANSWER! SHIELD BLOCKED COMPROMISE (0 POINTS LOSS)",
    retryMsg: isHindi 
      ? "गलत प्रविष्टि। पुनः प्रयास प्रोटोकॉल लागू... फिर कोशिश करें!"
      : "INCORRECT ENTRY. RETRY PROTOCOL ENGAGED... TRY AGAIN!",
    bypassThreat: isHindi 
      ? "खतरा बायपास करें (प्रश्न छोड़ें - 0 अंक हानि)"
      : "BYPASS THREAT (SKIP QUESTION - 0 PTS LOSS)",
    shieldActive: isHindi ? "शील्ड सक्रिय (0 अंक हानि)" : "SHIELD ACTIVE (0 PTS PENALTY)",
    x2Active: isHindi ? "2X अंक सक्रिय" : "X2 POINTS ACTIVE",
    retryActive: isHindi ? "पुनः प्रयास प्रोटोकॉल तैयार" : "RETRY PROTOCOL STANDBY",
    bypassUnlocked: isHindi ? "बायपास प्रोटोकॉल खुला" : "BYPASS PROTOCOL UNLOCKED",
    teammateAssist: isHindi ? "टीममेट सहायता सक्रिय (-1 गलत विकल्प)" : "TEAMMATE ASSIST ACTIVE (-1 INCORRECT OPTION)"
  };

  const prevQuestionIdRef = useRef(question?.id);

  useEffect(() => {
    if (!question) return;

    if (question.id !== prevQuestionIdRef.current) {
      // New question arrived: perform clean full reset
      prevQuestionIdRef.current = question.id;
      const qOptions = question.options || [];
      const correct = question.correctAnswer || question.answer;
      setOptions(qOptions);
      setLocalSelection(null);
      setSelectedOption(null);
      
      // Reset reading phase (5s) and timer (30s)
      setReadingPhase(true);
      setReadingTimer(5);
      setTimer(30);

      setShowFeedback(false);
      setIsTimeOut(false);
      setIsRetrying(false);
      setIsProceeding(false);

      // Teammate Assist: Eliminate 1 wrong option automatically
      if (teammateAssistActive && qOptions.length > 2) {
        const wrongOptions = qOptions.filter(opt => opt !== correct);
        if (wrongOptions.length > 0) {
          setFailedOptions([wrongOptions[0]]);
          if (onTeammateAssistConsumed) onTeammateAssistConsumed();
        } else {
          setFailedOptions([]);
        }
      } else {
        setFailedOptions([]);
      }
    } else {
      // Same question ID: language switched in-flight!
      // Preserve timers, reading phase, and translate option selections smoothly
      const qOptions = question.options || [];
      setOptions(prevOptions => {
        if (localSelection) {
          const idx = prevOptions.indexOf(localSelection);
          if (idx !== -1 && qOptions[idx]) setLocalSelection(qOptions[idx]);
        }
        if (selectedOption) {
          const idx = prevOptions.indexOf(selectedOption);
          if (idx !== -1 && qOptions[idx]) setSelectedOption(qOptions[idx]);
        }
        if (failedOptions.length > 0) {
          const updatedFailed = failedOptions.map(f => {
            const idx = prevOptions.indexOf(f);
            return (idx !== -1 && qOptions[idx]) ? qOptions[idx] : f;
          });
          setFailedOptions(updatedFailed);
        }
        return qOptions;
      });
    }
  }, [question, teammateAssistActive]);

  // Phase 1 Timer: 5-Second Reading Phase Countdown
  useEffect(() => {
    if (!readingPhase || showFeedback || isTimeOut || isGameOver || lives <= 0) return;

    if (readingTimer <= 0) {
      setReadingPhase(false);
      return;
    }

    const interval = setInterval(() => {
      setReadingTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [readingPhase, readingTimer, showFeedback, isTimeOut, isGameOver, lives]);

  // Phase 2 Timer: 30-Second Answer Phase Countdown
  useEffect(() => {
    if (readingPhase || showFeedback || isTimeOut || isGameOver || lives <= 0) return;

    if (timer <= 0) {
      setIsTimeOut(true);
      setShowFeedback(true);
      audioSynth.playWrongAnswer();
      if (onWrongAnswer) onWrongAnswer();
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [readingPhase, timer, showFeedback, isTimeOut, isGameOver, lives, onWrongAnswer]);

  const handleSelectOption = (option) => {
    if (showFeedback || isTimeOut || failedOptions.includes(option) || isGameOver || lives <= 0) return;
    setLocalSelection(option);
  };

  const handleProceedNext = () => {
    if (isProceeding || isGameOver || lives <= 0) return;
    setIsProceeding(true);

    if (isRetrying) {
      setShowFeedback(false);
      setSelectedOption(null);
      setLocalSelection(null);
      setIsRetrying(false);
      setIsProceeding(false);
      if (onRetryConsumed) onRetryConsumed();
    } else {
      const isCorrect = selectedOption === correctAnswer || (!selectedOption && localSelection === correctAnswer);
      onAnswered(isCorrect, isTimeOut);
    }
  };

  const handleSubmit = () => {
    if (!localSelection || showFeedback || isTimeOut || isGameOver || lives <= 0) return;

    // End reading phase if user answered early
    if (readingPhase) {
      setReadingPhase(false);
    }

    setSelectedOption(localSelection);
    setShowFeedback(true);

    const isCorrect = localSelection === correctAnswer;

    if (isCorrect) {
      audioSynth.playCorrectAnswer();
    } else {
      audioSynth.playWrongAnswer();
      if (retryActive) {
        setIsRetrying(true);
        setFailedOptions((prev) => [...prev, localSelection]);
      } else {
        if (onWrongAnswer) onWrongAnswer();
      }
    }
  };

  const handleClose = () => {
    if (!localSelection && !showFeedback) return;
    if (onWrongAnswer) onWrongAnswer();
    onAnswered(false, false);
  };

  const getOptionStyles = (option) => {
    if (failedOptions.includes(option)) {
      return "border-cyber-pink/40 bg-cyber-pink/5 text-cyber-pink/40 line-through opacity-50 cursor-not-allowed";
    }

    const isSelectedLocally = option === localSelection;

    if (!showFeedback) {
      if (isSelectedLocally) {
        return "border-cyber-blue bg-cyber-blue/20 text-white shadow-neon-blue scale-[1.01]";
      }
      return "border-cyber-lightgray bg-cyber-lightgray/10 hover:border-cyber-blue/70 hover:bg-cyber-blue/10 text-slate-300 hover:text-white hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]";
    }

    const isCorrectOption = option === correctAnswer;
    const isSubmittedSelection = option === selectedOption;

    if (isRetrying) {
      if (isSubmittedSelection) {
        return "border-cyber-pink bg-cyber-pink/15 text-cyber-pink shadow-neon-pink";
      }
      return "border-cyber-lightgray bg-cyber-lightgray/10 text-slate-400";
    }

    if (isCorrectOption) {
      return "border-cyber-green bg-cyber-green/15 text-cyber-green shadow-neon-green font-bold";
    }
    if (isSubmittedSelection && !isCorrectOption) {
      return "border-cyber-pink bg-cyber-pink/15 text-cyber-pink shadow-neon-pink";
    }
    return "border-slate-800 bg-slate-800/10 text-slate-600 line-through opacity-50";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="w-full flex flex-col h-auto max-h-[90vh] overflow-y-auto bg-cyber-darker/95 backdrop-blur-md border-2 border-cyber-blue/40 rounded-2xl p-5 sm:p-7 md:p-9 pb-10 sm:pb-12 md:pb-14 relative shadow-[0_0_50px_rgba(0,240,255,0.25)] justify-between break-words"
    >
      <div className="absolute inset-0 bg-radial-gradient from-cyber-blue/5 to-transparent pointer-events-none" />
      
      {/* Header Topic & Timer */}
      <div className="flex justify-between items-start mb-3 border-b border-cyber-blue/20 pb-3">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-mono text-cyber-blue uppercase tracking-[0.2em] font-semibold">
            {texts.sector}
          </span>
          <h3 className="font-cyber text-lg sm:text-2xl md:text-3xl font-black text-white mt-1 tracking-wider uppercase text-glow-blue break-words">
            {question.topic}
          </h3>
        </div>
        
        <div className="flex flex-col items-end space-y-1.5 ml-2">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* In-Question Language Switcher */}
            {onLanguageChange && (
              <button
                type="button"
                onClick={() => onLanguageChange(isHindi ? 'en' : 'hi')}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-cyber-purple/50 bg-cyber-purple/15 hover:bg-cyber-purple/30 text-white font-mono text-xs transition-all duration-300 shadow-[0_0_10px_rgba(189,0,255,0.25)] cursor-pointer"
                title={isHindi ? "Switch to English" : "हिंदी में बदलें"}
              >
                <Globe size={13} className="text-cyber-purple" />
                <span className="font-bold">{isHindi ? "EN" : "हिंदी"}</span>
              </button>
            )}

            {/* Phase Badge & Timer Text */}
            {readingPhase ? (
              <div className="flex items-center space-x-2 border border-cyber-yellow bg-cyber-yellow/10 text-cyber-yellow px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold shadow-[0_0_12px_rgba(255,251,0,0.3)] animate-pulse">
                <Eye size={14} />
                <span>{texts.readingPhaseTitle}</span>
              </div>
            ) : (
              <div className={`font-mono text-xs sm:text-sm border px-3 py-1 rounded-lg font-bold ${
                timer <= 10 ? 'border-cyber-pink text-cyber-pink shadow-neon-pink animate-pulse bg-cyber-pink/5' : 'border-cyber-blue text-cyber-blue shadow-neon-blue bg-cyber-blue/5'
              }`}>
                {texts.answerTime}
              </div>
            )}

            {/* Close Button - Disabled until answer selected */}
            <button
              onClick={handleClose}
              disabled={!localSelection && !showFeedback}
              className={`p-2 border rounded-lg transition-all duration-300 ${
                (!localSelection && !showFeedback)
                  ? 'border-slate-800 text-slate-650 cursor-not-allowed opacity-30'
                  : 'border-cyber-pink/60 text-cyber-pink hover:bg-cyber-pink/20 cursor-pointer shadow-neon-pink'
              }`}
              title={(!localSelection && !showFeedback) ? "Select an option first to unlock exit control" : "Force disconnect terminal"}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Timer / Progress Bar */}
      <div className="w-full bg-slate-950/80 h-3 rounded-full overflow-hidden border border-slate-800/80 mb-3 shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)]">
        {readingPhase ? (
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: `${(readingTimer / 5) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className="h-full relative rounded-full bg-gradient-to-r from-cyber-yellow to-amber-400 shadow-[0_0_15px_#fffb00]"
          />
        ) : (
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: `${(timer / 30) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className={`h-full relative rounded-full ${
              timer <= 10 
                ? 'bg-gradient-to-r from-cyber-pink to-red-500 shadow-[0_0_20px_#ff007f]' 
                : 'bg-gradient-to-r from-cyber-blue to-blue-500 shadow-[0_0_20px_#00f0ff]'
            }`}
          />
        )}
      </div>

      {/* Modifier Indicators */}
      {(shieldActive || doublePointsActive || retryActive || skipPenaltyActive || teammateAssistActive) && (
        <div className="flex flex-wrap gap-2.5 mb-2.5">
          {shieldActive && (
            <span className="flex items-center space-x-1.5 text-xs font-mono bg-cyber-pink/10 text-cyber-pink border border-cyber-pink/40 px-3 py-1 rounded-full">
              <Shield size={11} />
              <span>{texts.shieldActive}</span>
            </span>
          )}
          {doublePointsActive && (
            <span className="flex items-center space-x-1.5 text-xs font-mono bg-cyber-yellow/10 text-cyber-yellow border border-cyber-yellow/40 px-3 py-1 rounded-full">
              <Zap size={11} className="fill-cyber-yellow" />
              <span>{texts.x2Active}</span>
            </span>
          )}
          {retryActive && (
            <span className="flex items-center space-x-1.5 text-xs font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/40 px-3 py-1 rounded-full">
              <RefreshCw size={11} />
              <span>{texts.retryActive}</span>
            </span>
          )}
          {skipPenaltyActive && (
            <span className="flex items-center space-x-1.5 text-xs font-mono bg-white/10 text-slate-300 border border-white/20 px-3 py-1 rounded-full">
              <Zap size={11} />
              <span>{texts.bypassUnlocked}</span>
            </span>
          )}
          {teammateAssistActive && (
            <span className="flex items-center space-x-1.5 text-xs font-mono bg-amber-400/10 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full">
              <Users size={11} />
              <span>{texts.teammateAssist}</span>
            </span>
          )}
        </div>
      )}

      {/* Question Body */}
      <div className="flex-1 flex flex-col justify-center my-2 sm:my-3 min-h-[45px]">
        <p className="font-sans text-sm sm:text-base md:text-lg text-slate-100 leading-relaxed font-semibold border-l-4 border-cyber-blue pl-4 py-1 break-words">
          {question.question}
        </p>
      </div>

      {/* Options Stack */}
      <div className="grid grid-cols-1 gap-2 sm:gap-2.5 mt-1 sm:mt-2">
        {options.map((option, idx) => (
          <button
            key={`opt-${idx}`}
            onClick={() => handleSelectOption(option)}
            disabled={showFeedback || failedOptions.includes(option) || isGameOver || lives <= 0}
            className={`w-full py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl text-left text-xs sm:text-sm md:text-base font-bold font-mono border transition-all duration-300 transform break-words ${getOptionStyles(option)}`}
          >
            <div className="flex justify-between items-center gap-2">
              <span className="break-words">{option}</span>
              {showFeedback && option === correctAnswer && <CheckCircle size={18} className="text-cyber-green shadow-neon-green rounded-full shrink-0" />}
              {showFeedback && option === selectedOption && option !== correctAnswer && <AlertTriangle size={18} className="text-cyber-pink shadow-neon-pink rounded-full shrink-0" />}
            </div>
          </button>
        ))}
      </div>

      {/* Submit Button */}
      {!showFeedback && (
        <button
          onClick={handleSubmit}
          disabled={!localSelection || isGameOver || lives <= 0}
          className={`mt-3 w-full py-3 sm:py-3.5 px-6 font-cyber text-xs sm:text-sm tracking-widest rounded-xl border transition-all duration-300 transform active:scale-95 ${
            (!localSelection || isGameOver || lives <= 0)
              ? 'border-slate-800 bg-slate-950/40 text-slate-650 cursor-not-allowed'
              : 'border-cyber-blue bg-cyber-blue/15 hover:bg-cyber-blue hover:text-black text-cyber-blue shadow-lg hover:shadow-neon-blue hover:scale-[1.01] cursor-pointer font-black'
          }`}
        >
          {texts.lockAnswer}
        </button>
      )}

      {/* Skip Button Option */}
      {skipPenaltyActive && !showFeedback && (
        <button
          onClick={onSkip}
          disabled={isGameOver || lives <= 0}
          className="mt-2.5 w-full py-2.5 bg-cyber-pink/10 hover:bg-cyber-pink/25 border border-cyber-pink/50 text-white font-cyber text-[10px] sm:text-xs tracking-[0.25em] rounded-xl transition-all duration-300 uppercase hover:shadow-neon-pink cursor-pointer font-bold"
        >
          {texts.bypassThreat}
        </button>
      )}

      {/* Answer Feedback Banner */}
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3.5 rounded-xl border text-center font-cyber tracking-widest text-xs sm:text-sm uppercase font-bold"
          style={{
            borderColor: isTimeOut ? '#ff007f' : selectedOption === correctAnswer ? '#39ff14' : isRetrying ? '#fffb00' : '#ff007f',
            backgroundColor: isTimeOut ? 'rgba(255, 0, 127, 0.15)' : selectedOption === correctAnswer ? 'rgba(57, 255, 20, 0.15)' : isRetrying ? 'rgba(255, 251, 0, 0.15)' : 'rgba(255, 0, 127, 0.15)',
            color: isTimeOut ? '#ff007f' : selectedOption === correctAnswer ? '#39ff14' : isRetrying ? '#fffb00' : '#ff007f'
          }}
        >
          {isTimeOut ? (
            <span>{texts.timeout}</span>
          ) : selectedOption === correctAnswer ? (
            <span>{texts.correct}</span>
          ) : isRetrying ? (
            <span className="flex items-center justify-center space-x-2.5 animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span>{texts.retryMsg}</span>
            </span>
          ) : shieldActive ? (
            <span>{texts.shieldBlocked}</span>
          ) : (
            <span>{texts.wrong}</span>
          )}
        </motion.div>
      )}

      {/* Question Explanation Card */}
      {showFeedback && question.explanation && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2.5 p-3 bg-cyber-darker/90 border border-cyber-blue/30 rounded-xl text-left"
        >
          <div className="text-[10px] font-mono text-cyber-blue uppercase tracking-wider font-bold mb-1 flex items-center space-x-1.5">
            <span>💡 {texts.explanation}:</span>
          </div>
          <p className="text-xs font-sans text-slate-300 leading-relaxed font-medium">
            {question.explanation}
          </p>
        </motion.div>
      )}

      {/* FLOATING ACTION BUTTON: NEXT QUESTION */}
      <AnimatePresence>
        {showFeedback && !isGameOver && lives > 0 && (
          <motion.button
            key="floating-next-question-btn"
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={handleProceedNext}
            disabled={isProceeding || isGameOver || lives <= 0}
            style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}
            className={`bg-slate-950/90 backdrop-blur-md border-2 border-cyber-blue text-white font-cyber text-xs sm:text-sm font-bold tracking-widest px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all duration-300 transform flex items-center space-x-2.5 uppercase select-none ${
              (isProceeding || isGameOver || lives <= 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-blue hover:text-black hover:shadow-neon-blue hover:scale-[1.03] cursor-pointer'
            }`}
          >
            <span>{texts.nextQuestion}</span>
            <ArrowRight size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestionPopup;
