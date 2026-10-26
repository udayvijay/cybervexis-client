import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Shield, Zap, Award, Play, 
  Settings, RefreshCw, UserCheck, CheckCircle,
  AlertTriangle, XCircle, Globe, GraduationCap
} from 'lucide-react';

import CyberBackground from './components/CyberBackground';
import BoardGame, { boardNodes } from './components/BoardGame';
import SpinWheel from './components/SpinWheel';
import QuestionPopup from './components/QuestionPopup';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import ScoreHUD from './components/ScoreHUD';

import { audioSynth } from './utils/audio';
import { generateQuestionsLocally } from './utils/questions';

const LOCAL_STORAGE_KEY = 'cybrvexis_game_state';
const LOCAL_HISTORY_KEY = 'cybrvexis_question_history';

// Helper for 10-game persistent history across refreshes/restarts
const getPersistentHistory = () => {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const recordQuestionInHistory = (comboKey, questionId) => {
  try {
    const history = getPersistentHistory();
    const list = history[comboKey] || [];
    if (!list.includes(questionId)) {
      list.push(questionId);
    }
    // Cap history at 250 questions (10 games x 25 questions)
    if (list.length > 250) {
      list.splice(0, list.length - 250);
    }
    history[comboKey] = list;
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save persistent question history:", err);
  }
};

function App() {
  // Navigation Screens: 'landing' | 'game' | 'admin'
  const [screen, setScreen] = useState('landing');

  // Education Level & Language State
  const [educationMode, setEducationMode] = useState('school'); // 'school' | 'university'
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'

  // Game Engine & Team State
  const [teamName, setTeamName] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [playerPosition, setPlayerPosition] = useState(0); // Index in boardNodes (0 = START, 26 = VICTORY)
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Life System & Game Over States
  const [lives, setLives] = useState(5);
  const [showLifeLost, setShowLifeLost] = useState(false);
  const [threatsMitigated, setThreatsMitigated] = useState(0);
  const [totalThreatsEncountered, setTotalThreatsEncountered] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showBreachAlert, setShowBreachAlert] = useState(false);
  const [flashRedBorder, setFlashRedBorder] = useState(false);
  
  // Modifiers (Tactical Dice outcomes)
  const [shieldActive, setShieldActive] = useState(false);
  const [doublePointsActive, setDoublePointsActive] = useState(false);
  const [skipPenaltyActive, setSkipPenaltyActive] = useState(false);
  const [retryActive, setRetryActive] = useState(false);
  const [teammateAssistActive, setTeammateAssistActive] = useState(false);
  const [spinModifierText, setSpinModifierText] = useState(null);
  
  // Spin Wheel & Level Complete overlay states
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [levelCompletedNum, setLevelCompletedNum] = useState(0);

  // Question Engine
  const [questions, setQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [usedQuestionIds, setUsedQuestionIds] = useState(new Set());

  // Score versions to trigger Leaderboard re-renders
  const [scoresVersion, setScoresVersion] = useState(0);

  // Load questions database on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('https://cybervexis-server.onrender.com/api/questions');
        if (!response.ok) throw new Error("Failed to fetch questions");
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        console.warn("Backend offline. Loading fallback question set locally...");
        const localData = generateQuestionsLocally();
        setQuestions(localData);
      }
    };
    loadQuestions();
  }, []);

  // Auto-trigger / refresh active question when questions load or playerPosition changes
  useEffect(() => {
    if (isGameStarted && playerPosition > 0 && playerPosition < 26 && !showLevelComplete && !showSpinWheel) {
      if (!activeQuestion || activeQuestion.id === "loading_fallback") {
        triggerQuestionForNode(playerPosition);
      }
    }
  }, [questions, playerPosition, isGameStarted, activeQuestion, showLevelComplete, showSpinWheel]);

  // Seamless language translation for currently active question without resetting question ID or timers
  useEffect(() => {
    if (activeQuestion && activeQuestion.id !== "loading_fallback") {
      const optsEn = activeQuestion.options_en || activeQuestion.options || [];
      const optsHi = activeQuestion.options_hi || activeQuestion.options || [];
      const perm = activeQuestion.permOrder || [0, 1, 2, 3];
      const curOptions = (language === 'hi' ? optsHi : optsEn);
      const shuffledOptions = perm.map(i => curOptions[i] || "");
      const qText = (language === 'hi' && activeQuestion.question_hi) ? activeQuestion.question_hi : (activeQuestion.question_en || activeQuestion.question);
      const explanationText = (language === 'hi' && activeQuestion.explanation_hi) ? activeQuestion.explanation_hi : (activeQuestion.explanation_en || activeQuestion.explanation || "");

      let correctAnsStr = "";
      if (typeof activeQuestion.correctAnswerIndex === 'number' && curOptions[activeQuestion.correctAnswerIndex]) {
        correctAnsStr = curOptions[activeQuestion.correctAnswerIndex];
      } else {
        correctAnsStr = (language === 'hi' && activeQuestion.answer_hi) ? activeQuestion.answer_hi : (activeQuestion.correctAnswer || activeQuestion.answer || curOptions[0] || "");
      }

      setActiveQuestion(prev => ({
        ...prev,
        question: qText,
        options: shuffledOptions,
        correctAnswer: correctAnsStr,
        explanation: explanationText,
        language: language
      }));
    }
  }, [language]);

  // Auto-Save Game Progress
  useEffect(() => {
    if (screen === 'game') {
      const stateToSave = {
        educationMode,
        language,
        teamName,
        member1,
        member2,
        score,
        currentLevel,
        playerPosition,
        isGameStarted,
        lives,
        threatsMitigated,
        totalThreatsEncountered,
        isGameOver,
        shieldActive,
        doublePointsActive,
        skipPenaltyActive,
        retryActive,
        spinModifierText,
        usedQuestionIds: Array.from(usedQuestionIds)
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [
    screen, educationMode, language, teamName, member1, member2, score, currentLevel, 
    playerPosition, isGameStarted, lives, threatsMitigated,
    totalThreatsEncountered, isGameOver, shieldActive, doublePointsActive,
    skipPenaltyActive, retryActive, spinModifierText, usedQuestionIds
  ]);

  // Load Saved Game Progress
  const loadSavedGame = () => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.educationMode) setEducationMode(state.educationMode);
        if (state.language) setLanguage(state.language);
        setTeamName(state.teamName || '');
        setMember1(state.member1 || '');
        setMember2(state.member2 || '');
        setScore(state.score || 0);
        setCurrentLevel(state.currentLevel || 1);
        setPlayerPosition(state.playerPosition || 1);
        setIsGameStarted(state.isGameStarted || false);
        setLives(state.lives !== undefined ? state.lives : 5);
        setThreatsMitigated(state.threatsMitigated || 0);
        setTotalThreatsEncountered(state.totalThreatsEncountered || 0);
        setIsGameOver(state.isGameOver || false);
        setShieldActive(state.shieldActive || false);
        setDoublePointsActive(state.doublePointsActive || false);
        setSkipPenaltyActive(state.skipPenaltyActive || false);
        setRetryActive(state.retryActive || false);
        setSpinModifierText(state.spinModifierText || null);
        setUsedQuestionIds(new Set(state.usedQuestionIds || []));
        
        // Resume game
        setScreen('game');
        
        // If player position is active, trigger the question
        if (state.playerPosition > 0 && state.playerPosition < 26 && !state.isGameOver) {
          setTimeout(() => {
            triggerQuestionForNode(state.playerPosition);
          }, 300);
        }
      } catch (err) {
        console.error("Failed to load saved state:", err);
      }
    }
  };

  // Warn player before browser refresh or navigate away during active gameplay
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isGameStarted && screen === 'game' && !isGameOver && playerPosition < 26) {
        e.preventDefault();
        e.returnValue = 'Mission in progress. Leaving or refreshing will cause loss of unsaved state.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isGameStarted, screen, isGameOver, playerPosition]);

  // Start New Game setup
  const handleStartGame = (e) => {
    e.preventDefault();
    const cleanTeam = teamName.trim();
    const cleanM1 = member1.trim();
    const cleanM2 = member2.trim();

    if (!cleanTeam || !cleanM1 || !cleanM2) return;

    setTeamName(cleanTeam.slice(0, 25));
    setMember1(cleanM1.slice(0, 20));
    setMember2(cleanM2.slice(0, 20));

    // Reset game variables
    setScore(0);
    setCurrentLevel(1);
    setPlayerPosition(1);
    setIsGameStarted(true);
    setShieldActive(false);
    setDoublePointsActive(false);
    setSkipPenaltyActive(false);
    setRetryActive(false);
    setSpinModifierText(null);
    setUsedQuestionIds(new Set());
    setActiveQuestion(null);

    // Life system resets (Initial lives = 5)
    setLives(5);
    setShowLifeLost(false);
    setThreatsMitigated(0);
    setTotalThreatsEncountered(0);
    setIsGameOver(false);
    setShowBreachAlert(false);
    setFlashRedBorder(false);

    setScreen('game');
    
    // Play sound and trigger first question immediately
    audioSynth.resume();
    audioSynth.playLevelUnlock();
    setTimeout(() => {
      triggerQuestionForNode(1);
    }, 400);
  };

  // Fetch / Select question based on board node topic
  const triggerQuestionForNode = (position) => {
    const node = boardNodes[position];
    if (!node || node.level === 0 || node.level === 6) return;

    if (questions.length === 0) {
      setActiveQuestion({
        id: "loading_fallback",
        level: node.level,
        topic: node.name,
        question: language === 'hi' ? "खतरा डेटाबेस लोड हो रहा है..." : "Threat database loading...",
        options: language === 'hi' 
          ? ["सिस्टम प्रारंभ हो रहा है...", "डेटाबेस सिंक्रनाइज़ हो रहा है...", "प्रतिक्रिया की प्रतीक्षा है...", "फिर से प्रयास करें"]
          : ["Initializing system...", "Syncing database...", "Awaiting response...", "Retry Handshake"],
        answer: language === 'hi' ? "डेटाबेस सिंक्रनाइज़ हो रहा है..." : "Syncing database...",
        language: language
      });
      return;
    }

    const comboKey = `${educationMode}_${language}`;
    const persistentHistory = getPersistentHistory();
    const historyList = persistentHistory[comboKey] || [];
    const historySet = new Set(historyList);

    const normalizeTopic = (str) => (str || '').replace(/[\s/()\-]/g, '').toLowerCase();

    // Filter questions matching level, topic, and education mode
    let pool = questions.filter(q => 
      q.level === node.level && 
      (q.topic === node.name || q.topicId === node.name || normalizeTopic(q.topic) === normalizeTopic(node.name)) &&
      (!q.mode || q.mode === educationMode)
    );
    
    // If pool is empty for specific topic, expand filter to level & mode
    if (pool.length === 0) {
      pool = questions.filter(q => q.level === node.level && (!q.mode || q.mode === educationMode));
    }
    // Final fallback: questions matching educationMode (strictly prevent mixing school and university)
    if (pool.length === 0) {
      pool = questions.filter(q => (!q.mode || q.mode === educationMode));
    }

    if (pool.length === 0) {
      setActiveQuestion({
        id: "loading_fallback",
        level: node.level,
        topic: node.name,
        question: language === 'hi' ? "खतरा डेटाबेस लोड हो रहा है..." : "Threat database loading...",
        options: language === 'hi' 
          ? ["सिस्टम प्रारंभ हो रहा है...", "डेटाबेस सिंक्रनाइज़ हो रहा है...", "प्रतिक्रिया की प्रतीक्षा है...", "फिर से प्रयास करें"]
          : ["Initializing system...", "Syncing database...", "Awaiting response...", "Retry Handshake"],
        answer: language === 'hi' ? "डेटाबेस सिंक्रनाइज़ हो रहा है..." : "Syncing database...",
        language: language
      });
      return;
    }

    // Attempt to select an unused question (not in active game AND not in 10-game persistent history)
    let eligiblePool = pool.filter(q => !usedQuestionIds.has(q.id) && !historySet.has(q.id));

    // If persistent history exhausted the topic pool, drop persistent history constraint first
    if (eligiblePool.length === 0) {
      eligiblePool = pool.filter(q => !usedQuestionIds.has(q.id));
    }

    // If all questions are used in active game, recycle the pool
    if (eligiblePool.length === 0) {
      eligiblePool = [...pool];
    }

    // Randomize pick from available eligible questions
    const selected = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];

    if (selected) {
      // Determine language-specific options and fields
      const optsEn = selected.options_en || selected.options || [];
      const optsHi = selected.options_hi || selected.options || [];

      // Determine deterministic random permutation for options [0, 1, 2, 3]
      const permOrder = [0, 1, 2, 3].sort(() => Math.random() - 0.5);

      const curOptions = (language === 'hi' ? optsHi : optsEn);
      const shuffledOptions = permOrder.map(i => curOptions[i] || "");

      const qText = (language === 'hi' && selected.question_hi) ? selected.question_hi : (selected.question_en || selected.question);
      const explanationText = (language === 'hi' && selected.explanation_hi) ? selected.explanation_hi : (selected.explanation_en || selected.explanation || "");

      // Determine correct answer string
      let correctAnsStr = "";
      if (typeof selected.correctAnswerIndex === 'number' && curOptions[selected.correctAnswerIndex]) {
        correctAnsStr = curOptions[selected.correctAnswerIndex];
      } else {
        correctAnsStr = (language === 'hi' && selected.answer_hi) ? selected.answer_hi : (selected.correctAnswer || selected.answer || curOptions[0] || "");
      }

      setActiveQuestion({
        ...selected,
        permOrder: permOrder,
        question: qText,
        options: shuffledOptions,
        correctAnswer: correctAnsStr,
        explanation: explanationText,
        language: language
      });

      setUsedQuestionIds(prev => new Set(prev).add(selected.id));
      recordQuestionInHistory(comboKey, selected.id);
    }
  };

  // Tactical Dice complete modifier application
  const handleSpinComplete = (outcome) => {
    setSpinModifierText(outcome.title || outcome.text);
    
    // Apply exact dice modifiers (1: +40, 2: -20, 3: DOUBLE, 4: EXTRA LIFE, 5: SKIP PENALTY, 6: TEAMMATE ASSIST)
    if (outcome.key === 'BONUS_40' || outcome.key === 'BONUS') {
      setScore(prev => prev + 40);
      confetti({ particleCount: 30, colors: ['#00f0ff'] });
    } else if (outcome.key === 'PENALTY_20' || outcome.key === 'MINUS_100') {
      setScore(prev => Math.max(0, prev - 20));
    } else if (outcome.key === 'DOUBLE') {
      setDoublePointsActive(true);
    } else if (outcome.key === 'EXTRA_LIFE') {
      setLives(prev => Math.min(5, prev + 1));
      confetti({ particleCount: 30, colors: ['#ff007f'] });
    } else if (outcome.key === 'SKIP_PENALTY') {
      setSkipPenaltyActive(true);
    } else if (outcome.key === 'TEAMMATE_ASSIST') {
      setTeammateAssistActive(true);
    } else if (outcome.key === 'SHIELD') {
      setShieldActive(true);
    } else if (outcome.key === 'RETRY') {
      setRetryActive(true);
    }

    // Close Spin Wheel and advance to next level when player clicks Claim Reward button
    setShowSpinWheel(false);
    
    const nextPos = playerPosition + 1;
    setPlayerPosition(nextPos);

    if (nextPos === 26) {
      handleVictory();
    } else {
      const nextLevel = Math.floor((nextPos - 1) / 5) + 1;
      setCurrentLevel(nextLevel);
      triggerQuestionForNode(nextPos);
    }
  };

  // Deduct 1 life on WRONG answer, trigger small shake & red flash animation on life UI, show "Life Lost"
  const handleWrongAnswer = () => {
    if (shieldActive) return; // Shield active: 0 life penalty

    setLives((prevLives) => {
      // Ensure no negative lives are possible
      const nextLives = Math.max(0, prevLives - 1);
      
      // When all 5 lives are lost (lives become 0): immediately trigger game over
      if (nextLives === 0) {
        setIsGameOver(true);
      }
      return nextLives;
    });

    // Trigger red flash border and "Life Lost" animation on top-right life icon UI
    setShowLifeLost(true);
    setFlashRedBorder(true);

    setTimeout(() => {
      setShowLifeLost(false);
      setFlashRedBorder(false);
    }, 1500);
  };

  // Restart Mission Callback for GAME OVER modal:
  // reset score to 0, reset lives to 5, reset timer, restart from Sector 1 / Question 1
  const handleRestartMission = () => {
    setScore(0);
    setLives(5);
    setCurrentLevel(1);
    setPlayerPosition(1);
    setIsGameOver(false);
    setShowBreachAlert(false);
    setFlashRedBorder(false);
    setShowLifeLost(false);

    setShieldActive(false);
    setDoublePointsActive(false);
    setSkipPenaltyActive(false);
    setRetryActive(false);
    setSpinModifierText(null);
    setShowSpinWheel(false);
    setShowLevelComplete(false);
    setUsedQuestionIds(new Set());
    setActiveQuestion(null);

    audioSynth.resume();
    audioSynth.playLevelUnlock();
    setTimeout(() => {
      triggerQuestionForNode(1);
    }, 300);
  };

  // Question Answered Callback
  const handleAnswered = (isCorrect, isTimeout = false) => {
    // Prevent game progression if lives reached 0
    if (isGameOver || lives <= 0) return;

    // Increment telemetry statistics
    setTotalThreatsEncountered(prev => prev + 1);
    if (isCorrect) {
      setThreatsMitigated(prev => prev + 1);
    }

    // Score update
    let diff = 0;
    if (isCorrect) {
      diff = doublePointsActive ? 200 : 100;
      setScore(prev => prev + diff);
    } else {
      if (!shieldActive && !skipPenaltyActive) {
        diff = -50;
        setScore(prev => prev + diff);
      }
    }

    // Reset active modifiers
    setShieldActive(false);
    setDoublePointsActive(false);
    setSkipPenaltyActive(false);
    setSpinModifierText(null);
    
    // Close question modal
    setActiveQuestion(null);

    // If timeout, apply warning visuals
    if (isTimeout) {
      setFlashRedBorder(true);
      setShowBreachAlert(true);
      
      setTimeout(() => {
        setFlashRedBorder(false);
        setShowBreachAlert(false);
      }, 2500);

      if (lives <= 0) return;
    }

    // Check if we just completed the 5th question of the current level
    const isLevelEnd = playerPosition % 5 === 0;

    if (isLevelEnd) {
      audioSynth.playLevelUnlock();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setLevelCompletedNum(currentLevel);
      setShowLevelComplete(true);
    } else {
      // Proceed linearly to the next question immediately on player click
      const nextPos = playerPosition + 1;
      setPlayerPosition(nextPos);
      triggerQuestionForNode(nextPos);
    }
  };

  // Skip Question Callback (from Skip Penalty modifier)
  const handleSkipQuestion = () => {
    setTotalThreatsEncountered(prev => prev + 1);
    setSkipPenaltyActive(false);
    setSpinModifierText(null);
    setActiveQuestion(null);

    const isLevelEnd = playerPosition % 5 === 0;
    if (isLevelEnd) {
      audioSynth.playLevelUnlock();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setLevelCompletedNum(currentLevel);
      setShowLevelComplete(true);
    } else {
      const nextPos = playerPosition + 1;
      setPlayerPosition(nextPos);
      
      setTimeout(() => {
        triggerQuestionForNode(nextPos);
      }, 300);
    }
  };

  // Victory processing
  const handleVictory = async () => {
    confetti({ particleCount: 150, spread: 80 });
    audioSynth.playLevelUnlock();
    
    // Submit score to database
    const payload = {
      teamName,
      member1,
      member2,
      score,
      levelReached: 5
    };

    try {
      await fetch('https://cybervexis-server.onrender.com/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Local fallback submission
      const local = localStorage.getItem('cybrvexis_leaderboard');
      const leaderboard = local ? JSON.parse(local) : [];
      leaderboard.push({ ...payload, timestamp: new Date().toISOString() });
      localStorage.setItem('cybrvexis_leaderboard', JSON.stringify(leaderboard));
    }

    setScoresVersion(prev => prev + 1);
  };

  // Reset Game completely (from Mid-game Abort)
  const handleResetClick = () => {
    if (confirm("Reset current mission parameters? All progress will be deleted.")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      
      setPlayerPosition(0);
      setIsGameStarted(false);
      setScore(0);
      setCurrentLevel(1);
      setActiveQuestion(null);
      setUsedQuestionIds(new Set());
      
      setTeamName('');
      setMember1('');
      setMember2('');
      
      setShieldActive(false);
      setDoublePointsActive(false);
      setSkipPenaltyActive(false);
      setRetryActive(false);
      setTeammateAssistActive(false);
      setSpinModifierText(null);
      setShowSpinWheel(false);
      setShowLevelComplete(false);

      // Reset Life system variables
      setLives(5);
      setShowLifeLost(false);
      setThreatsMitigated(0);
      setTotalThreatsEncountered(0);
      setIsGameOver(false);
      setShowBreachAlert(false);
      setFlashRedBorder(false);
      
      setScreen('landing');
    }
  };

  // Return to HQ from Victory screen (without confirm dialog)
  const handleReturnToHQ = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    setPlayerPosition(0);
    setIsGameStarted(false);
    setScore(0);
    setCurrentLevel(1);
    setActiveQuestion(null);
    setUsedQuestionIds(new Set());
    
    setTeamName('');
    setMember1('');
    setMember2('');
    
    setShieldActive(false);
    setDoublePointsActive(false);
    setSkipPenaltyActive(false);
    setRetryActive(false);
    setTeammateAssistActive(false);
    setSpinModifierText(null);
    setShowSpinWheel(false);
    setShowLevelComplete(false);

    // Reset Life system variables
    setLives(5);
    setShowLifeLost(false);
    setThreatsMitigated(0);
    setTotalThreatsEncountered(0);
    setIsGameOver(false);
    setShowBreachAlert(false);
    setFlashRedBorder(false);
    
    setScreen('landing');
  };

  return (
    <>
      {/* Visual cyber background */}
      <CyberBackground />
      <div className="scanlines" />

      {/* PERSISTENT LIVE SCORE & LIVES HUD (FIXED AT TOP-RIGHT ACROSS ALL GAME SCREENS & STATES) */}
      <ScoreHUD score={score} lives={lives} showLifeLost={showLifeLost} />

      {/* GLOBAL INTEGRITY HUD (FIXED / STICKY AT TOP-LEFT) */}
      {isGameStarted && screen === 'game' && (
        <div className="fixed top-6 left-6 z-40 bg-cyber-darker/90 border-2 border-cyber-blue/60 rounded-xl px-6 py-3.5 shadow-[0_0_20px_rgba(0,240,255,0.3)] backdrop-blur-md flex flex-col justify-center">
          <div className="font-cyber text-[10px] tracking-widest text-cyber-blue font-bold">SYSTEM INTEGRITY</div>
          <div className="flex items-center space-x-2 mt-1.5">
            {[1, 2, 3, 4, 5].map((heartIndex) => {
              const isActive = heartIndex <= lives;
              return (
                <div key={`heart-${heartIndex}`} className="relative">
                  {isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, delay: heartIndex * 0.4 }}
                    >
                      <Shield 
                        size={18} 
                        className="text-cyber-pink fill-cyber-pink filter drop-shadow(0 0 6px #ff007f)" 
                      />
                    </motion.div>
                  ) : (
                    <Shield 
                      size={18} 
                      className="text-slate-700 fill-slate-800/40 opacity-30 border-dashed" 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADMIN PANEL CONSOLE VIEW (FULL-SCREEN MODE) */}
      {screen === 'admin' ? (
        <div className="min-h-screen p-4">
          <AdminPanel 
            onBack={() => setScreen('landing')} 
            triggerScoreUpdate={() => setScoresVersion(prev => prev + 1)}
          />
        </div>
      ) : (
        /* UNIFIED STRATEGY DASHBOARD VIEW */
        <div className="min-h-screen flex flex-col py-8 px-6 relative max-w-7xl mx-auto w-full">
          
          {/* Logo / Header */}
          <header className="text-center mb-8">
            <h1 className="font-cyber text-5xl sm:text-7xl font-black tracking-widest text-glow-blue uppercase cyber-glitch-text text-white">
              CYBERVEXIS
            </h1>
            <p className="font-mono text-sm sm:text-base tracking-[0.4em] text-cyber-purple uppercase mt-2.5">
              Defend the Digital Nation
            </p>
          </header>

          {/* 1. TEAM LOGIN PANEL / MISSION CONTROL STATUS (FULL WIDTH) */}
          <section className="mb-8 w-full">
            {screen === 'landing' ? (
              /* IDLE STATE: LOGIN PANEL */
              <div className="cyber-card p-6 sm:p-8 rounded-xl border border-cyber-pink/25 w-full transition-all duration-300 hover:border-cyber-pink/50 shadow-lg shadow-cyber-pink/5">
                <h3 className="font-cyber text-sm sm:text-base font-bold text-cyber-pink tracking-widest uppercase mb-5 flex items-center space-x-2.5">
                  <UserCheck size={18} />
                  <span>INITIALIZE OPERATIVE LOGINS</span>
                </h3>
                
                <form onSubmit={handleStartGame} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-2 tracking-wider">TEAM NAME:</label>
                      <input
                        type="text"
                        required
                        maxLength={25}
                        placeholder="e.g. CyberGhosts"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full p-3 bg-cyber-dark border border-cyber-lightgray rounded text-sm sm:text-base text-white focus:outline-none focus:border-cyber-pink placeholder-slate-600 transition-colors duration-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-2 tracking-wider">MEMBER 1:</label>
                      <input
                        type="text"
                        required
                        maxLength={20}
                        placeholder="e.g. Alice"
                        value={member1}
                        onChange={(e) => setMember1(e.target.value)}
                        className="w-full p-3 bg-cyber-dark border border-cyber-lightgray rounded text-sm sm:text-base text-white focus:outline-none focus:border-cyber-pink placeholder-slate-600 transition-colors duration-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-2 tracking-wider">MEMBER 2:</label>
                      <input
                        type="text"
                        required
                        maxLength={20}
                        placeholder="e.g. Bob"
                        value={member2}
                        onChange={(e) => setMember2(e.target.value)}
                        className="w-full p-3 bg-cyber-dark border border-cyber-lightgray rounded text-sm sm:text-base text-white focus:outline-none focus:border-cyber-pink placeholder-slate-600 transition-colors duration-300"
                      />
                    </div>
                  </div>

                  {/* EDUCATION LEVEL & LANGUAGE SELECTION ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-cyber-lightgray/40">
                    {/* Education Level Selector */}
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-2 tracking-wider flex items-center space-x-1.5">
                        <GraduationCap size={14} className="text-cyber-blue" />
                        <span>EDUCATION LEVEL:</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setEducationMode('school')}
                          className={`p-3 rounded border text-xs sm:text-sm font-mono tracking-wider font-bold transition-all text-left ${
                            educationMode === 'school'
                              ? 'border-cyber-blue bg-cyber-blue/20 text-white shadow-neon-blue'
                              : 'border-cyber-lightgray bg-cyber-dark text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div>SCHOOL STUDENT</div>
                          <div className="text-[10px] font-sans text-slate-400 font-normal mt-0.5">Classes 8–12 (Easy)</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEducationMode('university')}
                          className={`p-3 rounded border text-xs sm:text-sm font-mono tracking-wider font-bold transition-all text-left ${
                            educationMode === 'university'
                              ? 'border-cyber-pink bg-cyber-pink/20 text-white shadow-neon-pink'
                              : 'border-cyber-lightgray bg-cyber-dark text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div>UNIVERSITY</div>
                          <div className="text-[10px] font-sans text-slate-400 font-normal mt-0.5">Undergraduate (Medium)</div>
                        </button>
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div>
                      <label className="text-xs font-mono text-slate-400 block mb-2 tracking-wider flex items-center space-x-1.5">
                        <Globe size={14} className="text-cyber-purple" />
                        <span>LANGUAGE / भाषा:</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`p-3 rounded border text-xs sm:text-sm font-mono tracking-wider font-bold transition-all text-left ${
                            language === 'en'
                              ? 'border-cyber-purple bg-cyber-purple/20 text-white shadow-[0_0_15px_rgba(189,0,255,0.4)]'
                              : 'border-cyber-lightgray bg-cyber-dark text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div>ENGLISH</div>
                          <div className="text-[10px] font-sans text-slate-400 font-normal mt-0.5">Standard Technical</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('hi')}
                          className={`p-3 rounded border text-xs sm:text-sm font-mono tracking-wider font-bold transition-all text-left ${
                            language === 'hi'
                              ? 'border-cyber-yellow bg-cyber-yellow/20 text-white shadow-[0_0_15px_rgba(255,251,0,0.4)]'
                              : 'border-cyber-lightgray bg-cyber-dark text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div>हिंदी</div>
                          <div className="text-[10px] font-sans text-slate-400 font-normal mt-0.5">Hindi Translation</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-4 pt-3">
                    <button
                      type="submit"
                      className="py-3.5 px-10 cyber-btn cyber-btn-pink flex items-center justify-center space-x-2.5 cursor-pointer font-bold text-sm sm:text-base tracking-widest max-w-md w-full mx-auto"
                    >
                      <Play size={16} fill="currentColor" />
                      <span>DECRYPT &amp; START MISSION</span>
                    </button>
                    
                    {localStorage.getItem(LOCAL_STORAGE_KEY) && (
                      <button
                        type="button"
                        onClick={loadSavedGame}
                        className="py-3.5 px-8 border border-cyber-blue bg-cyber-blue/10 hover:bg-cyber-blue hover:text-black font-cyber rounded text-xs sm:text-sm tracking-wider transition-colors duration-300 mx-auto sm:mx-0 cursor-pointer"
                      >
                        RESUME SESSION
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              /* ACTIVE STATE: LIVE STATUS PANEL */
              <div className="cyber-card p-6 rounded-xl border border-cyber-blue/20 w-full shadow-lg shadow-cyber-blue/5">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center text-center md:text-left">
                  {/* Column 1: Team Info */}
                  <div className="border-b md:border-b-0 md:border-r border-cyber-lightgray pb-4 md:pb-0 md:pr-4">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-widest mb-1">TACTICAL OPERATIVES</span>
                    <h3 className="font-cyber text-base font-bold text-white tracking-widest uppercase mb-1">
                      {teamName || "DEFENDER_HQ"}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-1 truncate">
                      {member1} // {member2}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">LANG:</span>
                      <button
                        type="button"
                        onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
                        className="px-2 py-0.5 rounded border border-cyber-purple/50 bg-cyber-purple/10 hover:bg-cyber-purple/20 text-white font-mono text-[10px] font-bold tracking-wider cursor-pointer transition-all duration-300"
                        title={language === 'en' ? "हिंदी में बदलें" : "Switch to English"}
                      >
                        {language === 'en' ? "EN ➜ हिंदी" : "हिंदी ➜ EN"}
                      </button>
                    </div>
                  </div>

                  {/* Column 2: Level & Progress */}
                  <div className="border-b md:border-b-0 md:border-r border-cyber-lightgray pb-4 md:pb-0 md:px-4">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-widest font-semibold mb-1">CURRENT SECTOR</span>
                    <h3 className="font-cyber text-xl font-bold text-cyber-blue tracking-wide mt-1">
                      SECTOR {currentLevel}
                    </h3>
                    {/* Progress Bar */}
                    <div className="mt-2 w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-cyber-blue h-full shadow-neon-blue transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, Math.round(((playerPosition - 1) / 25) * 100)))}%` }}
                      />
                    </div>
                  </div>

                  {/* Column 3: Question Tracker */}
                  <div className="border-b md:border-b-0 md:border-r border-cyber-lightgray pb-4 md:pb-0 md:px-4">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-widest mb-1">SECTOR RESOLUTION</span>
                    <h3 className="font-cyber text-base font-bold text-white mt-1 uppercase tracking-wider">
                      Threat {Math.min(5, ((playerPosition - 1) % 5) + 1)} / 5
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      {playerPosition < 26 ? boardNodes[playerPosition]?.name : "Completed"}
                    </p>
                  </div>

                  {/* Column 4: Spin Status */}
                  <div className="border-b md:border-b-0 md:border-r border-cyber-lightgray pb-4 md:pb-0 md:px-4 flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-widest mb-1">REWARD WHEEL</span>
                    {playerPosition % 5 === 0 && playerPosition > 0 && playerPosition < 26 ? (
                      <span className="inline-flex items-center space-x-1.5 mt-1 text-xs font-mono text-cyber-green bg-cyber-green/10 border border-cyber-green/30 px-2 py-1 rounded animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
                        <span>STANDBY // READY</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 mt-1 text-xs font-mono text-slate-500 bg-slate-955 border border-slate-800/60 px-2 py-1 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-750" />
                        <span>STANDBY // LOCKED</span>
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-500 mt-1">
                      Spins on Sector Clear
                    </span>
                  </div>

                  {/* Column 5: Score & Modifiers */}
                  <div className="flex flex-col items-center md:items-end justify-center md:pl-4">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-widest mb-1">NET CREDITS</span>
                    <div className="font-cyber text-3xl font-black text-cyber-blue text-glow-blue my-0.5">
                      {score} PTS
                    </div>
                    {/* Active Modifiers inline summary */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5 justify-center md:justify-end min-h-[16px]">
                      {shieldActive && (
                        <span className="text-[9px] font-mono bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/40 px-2 py-0.5 rounded-full uppercase" title="Shield Protection Active">
                          SHIELD
                        </span>
                      )}
                      {doublePointsActive && (
                        <span className="text-[9px] font-mono bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/40 px-2 py-0.5 rounded-full uppercase" title="Double Points Active">
                          X2 PTS
                        </span>
                      )}
                      {skipPenaltyActive && (
                        <span className="text-[9px] font-mono bg-white/10 text-white border border-white/30 px-2 py-0.5 rounded-full uppercase" title="Skip Penalty Active">
                          BYPASS
                        </span>
                      )}
                      {retryActive && (
                        <span className="text-[9px] font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded-full uppercase" title="Retry Incorrect Question Active">
                          RETRY
                        </span>
                      )}
                      {!shieldActive && !doublePointsActive && !skipPenaltyActive && !retryActive && (
                        <button 
                          onClick={handleResetClick}
                          className="text-[10px] font-mono text-cyber-pink hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          ABORT MISSION
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2. MAIN GRID LAYOUT */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
            {/* GAMEBOARD */}
            <article className="h-full flex flex-col">
              <BoardGame 
                playerPosition={playerPosition}
                teamName={teamName}
                currentLevel={currentLevel}
                onNodeClick={(node) => {
                  if (node.id === playerPosition) {
                    triggerQuestionForNode(playerPosition);
                  }
                }}
              />
            </article>

            {/* LEADERBOARD */}
            <article className="h-full flex flex-col">
              <Leaderboard scoresVersion={scoresVersion} />
            </article>
          </section>


          {/* Overlay Modals: QuestionPopup, SpinWheel, LevelComplete, Victory Overlay */}
          {/* Question Popup Overlay */}
          {activeQuestion && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 md:p-12">
              <div className="max-w-6xl w-full max-h-[85vh] h-auto flex flex-col justify-center">
                <QuestionPopup 
                  question={activeQuestion}
                  onAnswered={handleAnswered}
                  onWrongAnswer={handleWrongAnswer}
                  lives={lives}
                  isGameOver={isGameOver}
                  shieldActive={shieldActive}
                  doublePointsActive={doublePointsActive}
                  retryActive={retryActive}
                  onRetryConsumed={() => setRetryActive(false)}
                  skipPenaltyActive={skipPenaltyActive}
                  onSkip={handleSkipQuestion}
                  teammateAssistActive={teammateAssistActive}
                  onTeammateAssistConsumed={() => setTeammateAssistActive(false)}
                  playerPosition={playerPosition}
                  score={score}
                  language={language}
                  onLanguageChange={setLanguage}
                />
              </div>
            </div>
          )}

          {/* Level Complete Overlay */}
          {showLevelComplete && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="cyber-card p-6 sm:p-10 md:p-12 pb-10 sm:pb-12 md:pb-14 rounded-2xl border-2 border-cyber-blue max-w-4xl sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col justify-between text-center shadow-2xl shadow-cyber-blue/20"
                style={{ boxShadow: '0 0 40px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(0, 240, 255, 0.1)' }}
              >
                <div className="flex justify-center mb-3 sm:mb-4">
                  <Award size={64} className="text-cyber-blue animate-bounce text-glow-blue" />
                </div>
                
                <div className="space-y-5">
                  <h2 className="font-cyber text-3xl sm:text-4xl md:text-6xl font-black text-cyber-blue text-glow-blue uppercase tracking-widest leading-none">
                    SECTOR {levelCompletedNum} COMPLETED!
                  </h2>
                  
                  <div className="border-t-2 border-b-2 border-cyber-blue/30 py-5 sm:py-6 my-3 sm:my-4 bg-cyber-darker/50 rounded-xl space-y-3">
                    <p className="text-xs sm:text-sm md:text-base font-mono text-slate-300 tracking-wider">
                      STATUS: SYSTEM LEVEL VULNERABILITIES MITIGATED IN SECTOR {levelCompletedNum}
                    </p>
                    <p className="font-cyber text-lg sm:text-xl md:text-2xl font-black text-cyber-pink text-glow-pink">
                      CURRENT MISSION SCORE: <span className="text-white text-glow-blue text-xl sm:text-2xl md:text-3xl">{score} PTS</span>
                    </p>
                  </div>
                  
                  <p className="text-[11px] sm:text-xs md:text-sm font-sans text-slate-400 max-w-xl w-[75%] mx-auto leading-normal text-center mb-8">
                    HQ authorization granted. Operatives are authorized to initialize the tactical system spin to recover bonus modifiers before entering the next sector grid.
                  </p>
                </div>
                
                <div>
                  <button
                    onClick={() => {
                      setShowLevelComplete(false);
                      setShowSpinWheel(true);
                    }}
                    className="w-full py-4 px-8 bg-cyber-blue/15 border-2 border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black font-cyber rounded-xl text-xs sm:text-sm md:text-base tracking-widest transition-all hover:scale-[1.01] hover:shadow-neon-blue uppercase font-black cursor-pointer"
                  >
                    INITIALIZE TACTICAL DICE PROTOCOL
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Spin Wheel Overlay */}
          {showSpinWheel && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 md:p-12">
              <div className="max-w-4xl w-full max-h-[90vh] h-auto flex flex-col justify-center">
                <SpinWheel onSpinComplete={handleSpinComplete} />
              </div>
            </div>
          )}

          {/* Victory Screen Modal Overlay */}
          {playerPosition === 26 && (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="cyber-card p-6 sm:p-10 md:p-12 pb-12 sm:pb-14 md:pb-16 rounded-2xl border-2 border-cyber-green max-w-4xl sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col justify-between text-center shadow-2xl shadow-cyber-green/20 break-words"
                style={{ boxShadow: '0 0 40px rgba(57, 255, 20, 0.25), inset 0 0 20px rgba(57, 255, 20, 0.1)' }}
              >
                <div>
                  <CheckCircle size={64} className="text-cyber-green mx-auto animate-bounce text-glow-green mb-3 sm:mb-4" />
                  <h2 className="font-cyber text-[clamp(2rem,5vw,4.5rem)] font-black text-cyber-green text-glow-green uppercase tracking-widest leading-none">
                    MISSION SUCCESSFUL!
                  </h2>
                </div>
                
                <div className="space-y-4 my-4">
                  <p className="text-xs sm:text-sm md:text-base font-mono text-slate-300 leading-relaxed max-w-2xl mx-auto break-words">
                    Operatives have achieved 100% network defense and vulnerability mitigation metrics. You are certified Cyber Resilient Champions!
                  </p>
                  
                  <div className="bg-cyber-darker/60 p-5 sm:p-6 md:p-8 border-2 border-cyber-green/30 rounded-xl font-mono text-xs sm:text-sm md:text-base max-w-2xl mx-auto text-slate-300 text-left space-y-2.5 break-words">
                    <div className="break-words">TACTICAL TEAM: <strong className="text-white font-cyber break-all">{teamName}</strong></div>
                    <div className="break-words">HQ OPERATIVES: <strong className="text-white break-all">{member1} &amp; {member2}</strong></div>
                    <div className="text-cyber-green font-black text-base sm:text-lg md:text-xl pt-2.5 border-t border-cyber-green/20 mt-2.5">
                      FINAL SYSTEM SCORE: {score} PTS
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleReturnToHQ}
                    className="w-full py-4 px-8 bg-cyber-green/15 border-2 border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-black font-cyber rounded-xl text-xs sm:text-sm md:text-base tracking-widest transition-all hover:scale-[1.01] hover:shadow-neon-green font-black uppercase cursor-pointer"
                  >
                    RETURN TO CENTRAL HQ
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Full-Screen Red Warning Flash */}
          {flashRedBorder && (
            <div className="fixed inset-0 z-50 pointer-events-none border-4 border-cyber-pink shadow-[inset_0_0_60px_rgba(255,0,127,0.5)] animate-pulse" />
          )}

          {/* Breach Warning Alert Overlay */}
          {showBreachAlert && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center pointer-events-none p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-cyber-darker border-2 border-cyber-pink px-6 sm:px-8 py-6 rounded-xl text-center shadow-[0_0_30px_rgba(255,0,127,0.4)] max-w-md w-full relative"
              >
                {/* Visual glitches corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyber-pink" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-pink" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyber-pink" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyber-pink" />

                <AlertTriangle size={48} className="text-cyber-pink mx-auto animate-bounce mb-3 filter drop-shadow(0 0 5px #ff007f)" />
                <h3 className="font-cyber text-lg sm:text-xl font-black text-cyber-pink tracking-widest uppercase text-glow-pink">
                  SYSTEM BREACH DETECTED
                </h3>
                <p className="font-mono text-xs text-slate-400 mt-2 tracking-wider">
                  INCORRECT ENTRY // FIREWALL INTEGRITY LOSS
                </p>
                <p className="font-cyber text-base sm:text-lg font-black text-white tracking-widest mt-4 uppercase animate-pulse">
                  SYSTEM INTEGRITY: {lives} / 5 LIVES
                </p>
              </motion.div>
            </div>
          )}

          {/* Centered GAME OVER Modal Overlay */}
          {isGameOver && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="cyber-card p-6 sm:p-10 md:p-12 pb-12 sm:pb-14 md:pb-16 rounded-2xl border-2 border-cyber-pink max-w-2xl sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col justify-between text-center shadow-2xl shadow-cyber-pink/20 break-words"
                style={{ boxShadow: '0 0 50px rgba(255, 0, 127, 0.3), inset 0 0 20px rgba(255, 0, 127, 0.15)' }}
              >
                <div>
                  <XCircle size={64} className="text-cyber-pink mx-auto animate-pulse text-glow-pink mb-3 sm:mb-4" />
                  <h2 className="font-cyber text-[clamp(2.5rem,6vw,4.5rem)] font-black text-cyber-pink text-glow-pink uppercase tracking-[0.15em] leading-none cyber-glitch-text">
                    GAME OVER
                  </h2>
                  <p className="font-mono text-xs sm:text-sm md:text-base tracking-[0.3em] text-cyber-purple uppercase mt-2 sm:mt-3 font-semibold">
                    SYSTEM INTEGRITY CRITICAL // ALL 5 LIVES LOST
                  </p>
                </div>
                
                <div className="space-y-4 my-6">
                  <p className="text-xs sm:text-sm md:text-base font-mono text-slate-300 leading-relaxed max-w-xl mx-auto break-words">
                    Host defenses bypassed. Mission parameters failed and system offline.
                  </p>
                  
                  <div className="bg-cyber-darker/80 p-5 sm:p-6 md:p-8 border-2 border-cyber-pink/40 rounded-xl font-mono text-xs sm:text-sm md:text-base max-w-xl mx-auto text-slate-300 text-left space-y-3 break-words shadow-inner">
                    <div className="flex justify-between items-center border-b border-cyber-pink/20 pb-2">
                      <span className="text-slate-400">TACTICAL TEAM:</span>
                      <strong className="text-white font-cyber">{teamName || "DEFENDER_HQ"}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyber-pink/20 pb-2">
                      <span className="text-slate-400">FINAL SCORE:</span>
                      <span className="font-cyber font-black text-cyber-blue text-lg sm:text-xl">{score} PTS</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyber-pink/20 pb-2">
                      <span className="text-slate-400">SECTOR REACHED:</span>
                      <span className="font-cyber font-bold text-cyber-pink text-base sm:text-lg">SECTOR {currentLevel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">ACCURACY:</span>
                      <span className="font-cyber font-bold text-cyber-yellow">
                        {totalThreatsEncountered > 0 
                          ? Math.round((threatsMitigated / totalThreatsEncountered) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto w-full pt-2">
                  <button
                    onClick={handleRestartMission}
                    className="w-full py-4 px-6 bg-cyber-pink/20 border-2 border-cyber-pink text-cyber-pink hover:bg-cyber-pink hover:text-black font-cyber rounded-xl text-xs sm:text-sm md:text-base tracking-widest transition-all hover:scale-[1.02] hover:shadow-neon-pink font-black uppercase cursor-pointer"
                  >
                    RESTART MISSION
                  </button>
                  <button
                    onClick={handleReturnToHQ}
                    className="w-full py-4 px-6 bg-slate-900 border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-cyber rounded-xl text-xs sm:text-sm md:text-base tracking-widest transition-all hover:scale-[1.02] font-black uppercase cursor-pointer"
                  >
                    RETURN TO HQ
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Footer Controls */}
          <footer className="flex justify-between items-center border-t border-cyber-lightgray pt-4 text-xs font-mono text-slate-500 mt-auto">
            <div className="flex items-center space-x-3">
              <span>PLATFORM BUILD v1.5.0 // DEPLOY STATUS: OPERATIONAL</span>
              {isGameStarted && (
                <button 
                  onClick={() => setPlayerPosition(26)}
                  className="text-cyber-yellow hover:underline tracking-widest text-[10px] uppercase font-bold cursor-pointer"
                >
                  [DEBUG: TRIGGER VICTORY]
                </button>
              )}
            </div>
            <button 
              onClick={() => setScreen('admin')}
              className="text-cyber-blue hover:underline tracking-widest flex items-center space-x-1 cursor-pointer"
            >
              <Settings size={12} />
              <span>LAUNCH DATABASE CONSOLE</span>
            </button>
          </footer>

        </div>
      )}
    </>
  );
}

export default App;
