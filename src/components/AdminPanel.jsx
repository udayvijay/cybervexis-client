import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, RotateCcw, AlertTriangle, Database, Search, ArrowLeft } from 'lucide-react';

const levels = {
  1: { name: "Cyber Threats", topics: ["Weak Password Attack", "Phishing Attack", "Malware Infection", "Unsafe Public WiFi", "Data Leak"] },
  2: { name: "Firewall Security", topics: ["Packet Filtering Firewall", "Stateful Inspection Firewall", "Proxy Firewall", "Cloud Firewall", "Software Firewall"] },
  3: { name: "SOC", topics: ["In-House SOC", "Managed SOC", "Hybrid SOC", "Co-Managed SOC", "Virtual SOC (vSOC)"] },
  4: { name: "Zero Trust Architecture", topics: ["Identity-Based Architecture", "Device-Based Architecture", "Network-Based Architecture", "Data-Centric Architecture", "Infrastructure-Based Architecture"] },
  5: { name: "Cyber Resilience", topics: ["Preventive Resilience", "Detective Resilience", "Responsive Resilience", "Recovery Resilience", "Adaptive/Evolving Resilience"] }
};

const AdminPanel = ({ onBack, triggerScoreUpdate }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQ, setCurrentQ] = useState({ id: '', level: 1, topic: 'Weak Password Attack', question: '', options: ['', '', '', ''], answer: '' });
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://cybervexis-server.onrender.com/api/questions');
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      console.warn("Express backend offline, utilizing mock question state");
      // Fallback offline mock questions loaded from storage
      const local = localStorage.getItem('cybrvexis_custom_questions');
      if (local) {
        setQuestions(JSON.parse(local));
      } else {
        // Fallback to minimal seeding or let client handle
        setQuestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLevelChange = (lvl) => {
    const levelNum = parseInt(lvl);
    setCurrentQ({
      ...currentQ,
      level: levelNum,
      topic: levels[levelNum].topics[0]
    });
  };

  const handleOptionChange = (idx, val) => {
    const opts = [...currentQ.options];
    opts[idx] = val;
    setCurrentQ({ ...currentQ, options: opts });
  };

  const saveQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!currentQ.question || currentQ.options.some(o => !o) || !currentQ.answer) {
      showNotification("Please fill in all fields and select correct answer", "error");
      return;
    }
    if (!currentQ.options.includes(currentQ.answer)) {
      showNotification("Correct answer must match one of the multiple choice options!", "error");
      return;
    }

    try {
      let savedQ;
      if (isEditing) {
        // PUT
        const res = await fetch(`https://cybervexis-server.onrender.com/api/questions/${currentQ.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentQ)
        });
        if (!res.ok) throw new Error("Failed to edit");
        savedQ = await res.json();
        showNotification("Question updated successfully!");
      } else {
        // POST
        const res = await fetch('https://cybervexis-server.onrender.com/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentQ)
        });
        if (!res.ok) throw new Error("Failed to create");
        savedQ = await res.json();
        showNotification("Question added to database!");
      }

      fetchQuestions();
      resetForm();
    } catch (err) {
      // Offline fallback saving
      const updatedList = [...questions];
      if (isEditing) {
        const idx = updatedList.findIndex(q => q.id === currentQ.id);
        if (idx !== -1) updatedList[idx] = { ...currentQ };
      } else {
        const newOfflineQ = { ...currentQ, id: `q_offline_${Date.now()}` };
        updatedList.push(newOfflineQ);
      }
      setQuestions(updatedList);
      localStorage.setItem('cybrvexis_custom_questions', JSON.stringify(updatedList));
      showNotification(`Offline mode: Saved successfully!`);
      resetForm();
    }
  };

  const handleEditClick = (q) => {
    setIsEditing(true);
    setCurrentQ({ ...q });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`https://cybervexis-server.onrender.com/api/questions/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Delete failed");
      showNotification("Question deleted successfully!");
      fetchQuestions();
    } catch (err) {
      const filtered = questions.filter(q => q.id !== id);
      setQuestions(filtered);
      localStorage.setItem('cybrvexis_custom_questions', JSON.stringify(filtered));
      showNotification("Offline mode: Deleted successfully!");
    }
  };

  const handleResetDatabase = async (type) => {
    if (!confirm(`Are you sure you want to reset ${type}? This action is irreversible.`)) return;

    try {
      const res = await fetch('https://cybervexis-server.onrender.com/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (!res.ok) throw new Error("Reset failed");
      showNotification(`Reset ${type} completed successfully!`);
      fetchQuestions();
      triggerScoreUpdate();
    } catch (err) {
      if (type === 'leaderboard' || type === 'all') {
        localStorage.removeItem('cybrvexis_leaderboard');
        triggerScoreUpdate();
      }
      if (type === 'questions' || type === 'all') {
        localStorage.removeItem('cybrvexis_custom_questions');
        fetchQuestions();
      }
      showNotification(`Offline: Reset completed.`);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentQ({ id: '', level: 1, topic: 'Weak Password Attack', question: '', options: ['', '', '', ''], answer: '' });
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) || q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || q.level === parseInt(levelFilter);
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-cyber-blue/20 pb-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-1.5 border border-cyber-blue/30 text-cyber-blue rounded hover:bg-cyber-blue/10 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-cyber text-2xl font-black text-white text-glow-blue uppercase tracking-widest">
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-xs font-mono text-slate-400">DATABASE INTEGRITY &amp; RESET MANAGEMENT</p>
          </div>
        </div>
        <Database size={24} className="text-cyber-blue animate-pulse" />
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-3.5 mb-5 rounded border font-mono text-center text-xs tracking-wider uppercase transition-all duration-300 ${
          notification.type === 'error' 
            ? 'border-cyber-pink bg-cyber-pink/10 text-cyber-pink shadow-neon-pink' 
            : 'border-cyber-green bg-cyber-green/10 text-cyber-green shadow-neon-green'
        }`}>
          {notification.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Reset Panel & Add/Edit form */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Quick Resets */}
          <div className="cyber-card p-4 rounded-xl border border-cyber-pink/20">
            <h3 className="font-cyber text-xs font-bold text-cyber-pink tracking-wider mb-3 uppercase flex items-center space-x-2">
              <AlertTriangle size={14} />
              <span>DANGER ZONE ACTIONS</span>
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handleResetDatabase('leaderboard')}
                className="w-full text-left py-2 px-3 border border-cyber-pink/30 hover:border-cyber-pink text-cyber-pink bg-cyber-pink/5 hover:bg-cyber-pink/15 text-xs font-mono rounded flex items-center justify-between transition-colors"
              >
                <span>RESET LEADERBOARD</span>
                <RotateCcw size={12} />
              </button>
              
              <button
                onClick={() => handleResetDatabase('questions')}
                className="w-full text-left py-2 px-3 border border-cyber-pink/30 hover:border-cyber-pink text-cyber-pink bg-cyber-pink/5 hover:bg-cyber-pink/15 text-xs font-mono rounded flex items-center justify-between transition-colors"
              >
                <span>RESET QUESTIONS TO DEFAULT</span>
                <RotateCcw size={12} />
              </button>

              <button
                onClick={() => handleResetDatabase('all')}
                className="w-full text-left py-2 px-3 border border-red-600/30 hover:border-red-500 text-red-500 bg-red-600/5 hover:bg-red-600/15 text-xs font-mono rounded flex items-center justify-between transition-colors"
              >
                <span>RESET ALL SYSTEMS</span>
                <AlertTriangle size={12} />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="cyber-card p-4 rounded-xl border border-cyber-blue/20">
            <h3 className="font-cyber text-xs font-bold text-cyber-blue tracking-wider mb-4 uppercase">
              {isEditing ? "EDIT SECURITY RECORD" : "INJECT NEW QUESTION"}
            </h3>

            <form onSubmit={saveQuestionSubmit} className="space-y-4 font-mono text-xs">
              
              {/* Level */}
              <div>
                <label className="text-slate-400 block mb-1">THREAT LEVEL:</label>
                <select
                  value={currentQ.level}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full p-2 bg-cyber-darker border border-cyber-lightgray rounded text-white focus:outline-none focus:border-cyber-blue"
                >
                  {[1, 2, 3, 4, 5].map(l => (
                    <option key={l} value={l}>Level {l}: {levels[l].name}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="text-slate-400 block mb-1">MODULE TOPIC:</label>
                <select
                  value={currentQ.topic}
                  onChange={(e) => setCurrentQ({ ...currentQ, topic: e.target.value })}
                  className="w-full p-2 bg-cyber-darker border border-cyber-lightgray rounded text-white focus:outline-none focus:border-cyber-blue"
                >
                  {levels[currentQ.level].topics.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="text-slate-400 block mb-1">QUESTION DETAILS:</label>
                <textarea
                  rows="3"
                  value={currentQ.question}
                  onChange={(e) => setCurrentQ({ ...currentQ, question: e.target.value })}
                  placeholder="Enter the cybersecurity multiple choice question prompt..."
                  className="w-full p-2 bg-cyber-darker border border-cyber-lightgray rounded text-white focus:outline-none focus:border-cyber-blue resize-none"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-slate-400 block">MULTIPLE CHOICE OPTIONS:</label>
                {currentQ.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5">
                    <span className="text-slate-500 font-bold">{String.fromCharCode(65 + idx)})</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 p-2 bg-cyber-darker border border-cyber-lightgray rounded text-white focus:outline-none focus:border-cyber-blue"
                    />
                  </div>
                ))}
              </div>

              {/* Correct Answer */}
              <div>
                <label className="text-slate-400 block mb-1">CORRECT ANSWER VALUE:</label>
                <select
                  value={currentQ.answer}
                  onChange={(e) => setCurrentQ({ ...currentQ, answer: e.target.value })}
                  className="w-full p-2 bg-cyber-darker border border-cyber-lightgray rounded text-white focus:outline-none focus:border-cyber-blue"
                >
                  <option value="">-- SELECT CORRECT OPTION --</option>
                  {currentQ.options.map((o, idx) => (
                    o ? <option key={idx} value={o}>{String.fromCharCode(65 + idx)}: {o.substring(0, 30)}...</option> : null
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-cyber-blue/10 border border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black font-cyber rounded tracking-widest text-center cursor-pointer transition-colors"
                >
                  {isEditing ? "SAVE CHANGE" : "INJECT"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="py-2 px-3 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded transition-colors"
                  >
                    CANCEL
                  </button>
                )}
              </div>

            </form>
          </div>

        </div>

        {/* Right Side: Questions Browser */}
        <div className="md:col-span-2 space-y-4">
          
          <div className="cyber-card p-4 rounded-xl flex flex-col h-[650px]">
            
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyber-blue/20 pb-3 mb-3">
              <h3 className="font-cyber text-xs font-bold text-white tracking-widest uppercase">
                SECURITY REGISTRY BROWSER ({filteredQuestions.length} ITEMS)
              </h3>
              
              {/* Filters */}
              <div className="flex items-center space-x-2 font-mono text-xs w-full sm:w-auto">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="p-1.5 bg-cyber-darker border border-cyber-lightgray rounded text-slate-300 focus:outline-none focus:border-cyber-blue"
                >
                  <option value="all">ALL LEVELS</option>
                  <option value="1">L1: THREATS</option>
                  <option value="2">L2: FIREWALL</option>
                  <option value="3">L3: SOC</option>
                  <option value="4">L4: ZTA</option>
                  <option value="5">L5: RESILIENCE</option>
                </select>

                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="text"
                    placeholder="Search query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-6 pr-2 py-1.5 bg-cyber-darker border border-cyber-lightgray rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyber-blue"
                  />
                  <Search size={10} className="absolute left-2 top-2.5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2">
                  <div className="w-8 h-8 border-2 border-t-transparent border-cyber-blue rounded-full animate-spin" />
                  <span className="font-mono text-xs text-slate-400">LOADING REGISTRY RECORDS...</span>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="font-mono text-xs text-slate-500">NO MATCHING SECURITY RECORDS FOUND</span>
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <div 
                    key={q.id}
                    className="p-3 bg-cyber-darker/60 border border-cyber-lightgray hover:border-cyber-blue/30 rounded-lg flex items-start justify-between gap-3 group transition-all duration-300"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono font-bold bg-cyber-blue/15 border border-cyber-blue/30 text-cyber-blue px-1 py-0.2 rounded">
                          L{q.level}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                          {q.topic}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-slate-100 font-semibold">{q.question}</p>
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[10px] font-mono text-slate-500">
                        {q.options.map((o, idx) => (
                          <div key={idx} className={o === q.answer ? "text-cyber-green font-semibold" : ""}>
                            {String.fromCharCode(65 + idx)}) {o.substring(0, 25)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(q)}
                        className="p-1 border border-cyber-blue/30 hover:border-cyber-blue text-cyber-blue rounded hover:bg-cyber-blue/10 transition-colors"
                        title="Edit question details"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(q.id)}
                        className="p-1 border border-cyber-pink/30 hover:border-cyber-pink text-cyber-pink rounded hover:bg-cyber-pink/10 transition-colors"
                        title="Delete question from database"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminPanel;
