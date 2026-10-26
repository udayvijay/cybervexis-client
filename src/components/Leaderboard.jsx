import React, { useEffect, useState } from 'react';
import { Trophy, Award, Calendar, Search } from 'lucide-react';

const Leaderboard = ({ scoresVersion }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Try fetching from the server API, fallback to local storage if API fails or server not started
      const response = await fetch('https://cybervexis-server.onrender.com/api/leaderboard');
      if (!response.ok) throw new Error("Failed to fetch from server");
      const data = await response.json();
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.warn("Express backend offline, falling back to localStorage leaderboard:", err.message);
      
      // Fallback: Read from LocalStorage
      const local = localStorage.getItem('cybrvexis_leaderboard');
      if (local) {
        setLeaderboard(JSON.parse(local).sort((a, b) => b.score - a.score).slice(0, 10));
      } else {
        const defaultScores = [
          { teamName: "NetGuardians", member1: "Alice", member2: "Bob", score: 850, levelReached: 5, timestamp: new Date().toISOString() },
          { teamName: "ZeroTrusters", member1: "Charlie", member2: "David", score: 720, levelReached: 4, timestamp: new Date().toISOString() },
          { teamName: "CyberSamurais", member1: "Eva", member2: "Frank", score: 640, levelReached: 4, timestamp: new Date().toISOString() }
        ];
        localStorage.setItem('cybrvexis_leaderboard', JSON.stringify(defaultScores));
        setLeaderboard(defaultScores);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [scoresVersion]);

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.member1.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.member2.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return <Trophy size={18} className="text-yellow-400 drop-shadow-[0_0_6px_#fbbf24]" />;
      case 1:
        return <Award size={18} className="text-slate-300 drop-shadow-[0_0_6px_#cbd5e1]" />;
      case 2:
        return <Award size={18} className="text-amber-600 drop-shadow-[0_0_6px_#d97706]" />;
      default:
        return <span className="font-mono text-slate-500 font-bold text-xs">{index + 1}</span>;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="w-full bg-cyber-dark/80 border border-cyber-blue/30 rounded-xl p-6 relative overflow-hidden flex flex-col h-full shadow-lg shadow-cyber-blue/5">
      <div className="absolute inset-0 bg-radial-gradient from-cyber-blue/5 to-transparent pointer-events-none" />
      
      {/* Title */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-cyber-blue/20">
        <div>
          <h3 className="font-cyber text-lg sm:text-xl font-black text-cyber-blue tracking-wider uppercase text-glow-blue">LEADERBOARD</h3>
          <p className="text-xs font-mono text-slate-400">TOP 10 TEAMS</p>
        </div>
        <Trophy size={24} className="text-cyber-blue animate-pulse" />
      </div>

      {/* Search Filter */}
      <div className="relative mb-5">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={14} className="text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Filter by Team or Agent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-cyber-darker border border-cyber-lightgray rounded text-xs sm:text-sm font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-blue transition-colors duration-300"
        />
      </div>

      {/* Leaderboard Body */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-8 h-8 border-2 border-t-transparent border-cyber-blue rounded-full animate-spin" />
            <span className="font-mono text-xs sm:text-sm text-slate-500">POLLING SCORESTREAM...</span>
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="text-center py-12">
            <span className="font-mono text-xs sm:text-sm text-slate-500">NO SECURE RECORDS FOUND</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeaderboard.map((entry, idx) => {
              const isTop3 = idx < 3;
              const rowBorderColor = idx === 0 
                ? 'border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_12px_rgba(251,191,36,0.05)]' 
                : idx === 1 
                ? 'border-slate-400/30 bg-slate-400/5' 
                : idx === 2 
                ? 'border-amber-600/30 bg-amber-600/5' 
                : 'border-cyber-lightgray bg-cyber-lightgray/5';

              return (
                <div
                  key={`score-${idx}`}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-300 hover:border-cyber-blue/50 ${rowBorderColor}`}
                >
                  <div className="flex items-center space-x-3.5">
                    {/* Rank */}
                    <div className="w-6 flex items-center justify-center">
                      {getRankBadge(idx)}
                    </div>

                    {/* Team & Members */}
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className={`font-cyber text-xs sm:text-sm md:text-base tracking-wider font-bold break-words ${
                        idx === 0 ? 'text-yellow-400 text-glow-yellow' : 'text-slate-100'
                      }`}>
                        {entry.teamName}
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono text-slate-400 mt-0.5 break-words">
                        Agent: {entry.member1} &amp; {entry.member2}
                      </span>
                    </div>
                  </div>

                  {/* Level & Score */}
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col text-right">
                      <span className="text-sm sm:text-base font-mono font-bold text-cyber-blue text-glow-blue">
                        {entry.score} PTS
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1 justify-end mt-0.5">
                        <Calendar size={10} />
                        <span>{formatDate(entry.timestamp)}</span>
                      </span>
                    </div>
                    
                    {/* Badge showing Level reached */}
                    <span className="text-[10px] sm:text-xs font-mono bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue px-2 py-0.5 rounded">
                      L{entry.levelReached}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
