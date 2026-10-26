import React from 'react';
import { motion } from 'framer-motion';

// Define board node coordinates and metadata
export const boardNodes = [
  { id: 0, name: "START", level: 0, x: 60, y: 60, color: "#e2e8f0", label: "START" },
  
  // Level 1: Cyber Threats (Blue)
  { id: 1, name: "Weak Password Attack", level: 1, x: 180, y: 60, color: "#00f0ff", label: "Password" },
  { id: 2, name: "Phishing Attack", level: 1, x: 300, y: 60, color: "#00f0ff", label: "Phishing" },
  { id: 3, name: "Malware Infection", level: 1, x: 420, y: 60, color: "#00f0ff", label: "Malware" },
  { id: 4, name: "Unsafe Public Wi-Fi", level: 1, x: 540, y: 60, color: "#00f0ff", label: "WiFi Sec" },
  { id: 5, name: "Data Leak", level: 1, x: 660, y: 60, color: "#00f0ff", label: "Data Leak" },

  // Level 2: Firewall Security (Purple)
  { id: 6, name: "Packet Filtering Firewall", level: 2, x: 660, y: 160, color: "#bd00ff", label: "Packet Fltr" },
  { id: 7, name: "Stateful Inspection Firewall", level: 2, x: 540, y: 160, color: "#bd00ff", label: "Stateful" },
  { id: 8, name: "Proxy Firewall (Application-Level Gateway)", level: 2, x: 420, y: 160, color: "#bd00ff", label: "Proxy FW" },
  { id: 9, name: "Cloud Firewall", level: 2, x: 300, y: 160, color: "#bd00ff", label: "Cloud FW" },
  { id: 10, name: "Software Firewall", level: 2, x: 180, y: 160, color: "#bd00ff", label: "Soft FW" },

  // Level 3: SOC (Pink)
  { id: 11, name: "In-House SOC", level: 3, x: 180, y: 260, color: "#ff007f", label: "In-House" },
  { id: 12, name: "Managed SOC", level: 3, x: 300, y: 260, color: "#ff007f", label: "Managed" },
  { id: 13, name: "Hybrid SOC", level: 3, x: 420, y: 260, color: "#ff007f", label: "Hybrid" },
  { id: 14, name: "Co-Managed SOC", level: 3, x: 540, y: 260, color: "#ff007f", label: "Co-Mngd" },
  { id: 15, name: "Virtual SOC (vSOC)", level: 3, x: 660, y: 260, color: "#ff007f", label: "vSOC" },

  // Level 4: Zero Trust Architecture (Green)
  { id: 16, name: "Identity-Based Architecture", level: 4, x: 660, y: 360, color: "#39ff14", label: "Identity" },
  { id: 17, name: "Device-Based Architecture", level: 4, x: 540, y: 360, color: "#39ff14", label: "Device" },
  { id: 18, name: "Network-Based Architecture", level: 4, x: 420, y: 360, color: "#39ff14", label: "Network" },
  { id: 19, name: "Data-Centric Architecture", level: 4, x: 300, y: 360, color: "#39ff14", label: "Data ZTA" },
  { id: 20, name: "Infrastructure-Based Architecture", level: 4, x: 180, y: 360, color: "#39ff14", label: "Infr ZTA" },

  // Level 5: Cyber Resilience (Yellow)
  { id: 21, name: "Preventive Resilience", level: 5, x: 180, y: 460, color: "#fffb00", label: "Preventive" },
  { id: 22, name: "Detective Resilience", level: 5, x: 300, y: 460, color: "#fffb00", label: "Detective" },
  { id: 23, name: "Responsive Resilience", level: 5, x: 420, y: 460, color: "#fffb00", label: "Responsive" },
  { id: 24, name: "Recovery Resilience", level: 5, x: 540, y: 460, color: "#fffb00", label: "Recovery" },
  { id: 25, name: "Adaptive (Evolving) Resilience", level: 5, x: 660, y: 460, color: "#fffb00", label: "Adaptive" },

  { id: 26, name: "VICTORY", level: 6, x: 760, y: 460, color: "#00ff66", label: "VICTORY" }
];

const BoardGame = ({ playerPosition, teamName, currentLevel = 1, onNodeClick }) => {
  // Generate links between nodes
  const links = [];
  for (let i = 0; i < boardNodes.length - 1; i++) {
    links.push({
      from: boardNodes[i],
      to: boardNodes[i + 1],
      color: boardNodes[i + 1].color
    });
  }

  // Get active node details
  const activeNode = boardNodes[playerPosition] || boardNodes[0];

  return (
    <div className="w-full h-full bg-cyber-dark border border-cyber-blue/30 rounded-xl relative overflow-hidden flex flex-col p-6 shadow-2xl shadow-cyber-blue/5 hover-zoom-board animate-float">
      
      {/* Board Header details */}
      <div className="flex justify-between items-start mb-5 border-b border-cyber-blue/20 pb-3">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-blue animate-pulse"></span>
            <h3 className="font-cyber text-base sm:text-lg tracking-widest text-cyber-blue font-black uppercase">
              GAMEBOARD
            </h3>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Track your progress through all five cybersecurity levels.
          </p>
        </div>
        
        {/* LIVE MISSION Badge */}
        <div className="flex items-center">
          <span className={`flex items-center space-x-2 text-[10px] sm:text-xs font-mono border px-2.5 py-1 rounded ${
            playerPosition > 0 
              ? 'border-cyber-green/50 text-cyber-green bg-cyber-green/5 shadow-neon-green animate-pulse' 
              : 'border-slate-700 text-slate-500 bg-slate-900/10'
          }`}>
            <span className={`w-2 h-2 rounded-full ${playerPosition > 0 ? 'bg-cyber-green animate-ping' : 'bg-slate-600'}`}></span>
            <span>{playerPosition > 0 ? 'LIVE MISSION' : 'INACTIVE'}</span>
          </span>
        </div>
      </div>

      {/* SVG Viewport */}
      <div className="flex-1 relative flex justify-center items-center overflow-auto min-h-[460px]">
        <svg 
          viewBox="0 0 820 520" 
          className="w-full max-w-4xl h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for arrowheads and gradients */}
          <defs>
            <radialGradient id="glow-completed">
              <stop offset="0%" stopColor="#39ff14" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#39ff14" stopOpacity="0" />
            </radialGradient>
            
            {boardNodes.map(node => (
              <radialGradient id={`glow-${node.id}`} key={node.id}>
                <stop offset="0%" stopColor={node.color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={node.color} stopOpacity="0" />
              </radialGradient>
            ))}
            
            {/* Custom Arrow markers for each color level */}
            <marker id="arrow-completed" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#39ff14" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#00f0ff" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#bd00ff" />
            </marker>
            <marker id="arrow-pink" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff007f" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#39ff14" />
            </marker>
            <marker id="arrow-yellow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fffb00" />
            </marker>
            <marker id="arrow-victory" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#00ff66" />
            </marker>
          </defs>

          {/* Radar background sweep effect */}
          <g transform="translate(410, 260)" pointerEvents="none" opacity="0.35">
            <circle cx="0" cy="0" r="380" fill="none" stroke="rgba(0, 240, 255, 0.015)" strokeWidth="1" />
            <circle cx="0" cy="0" r="260" fill="none" stroke="rgba(0, 240, 255, 0.02)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="140" fill="none" stroke="rgba(0, 240, 255, 0.03)" strokeWidth="1" />
            <line x1="0" y1="0" x2="380" y2="0" stroke="rgba(0, 240, 255, 0.12)" strokeWidth="2.5" className="radar-sweep-circle" style={{ filter: 'drop-shadow(0 0 3px rgba(0,240,255,0.4))' }} />
          </g>

          {/* Circuit connection paths */}
          {links.map((link, idx) => {
            const isCompleted = playerPosition > link.to.id;
            const isLocked = link.to.level > currentLevel && link.to.id !== 26;
            
            let markerId = isCompleted ? "arrow-completed" : "arrow-blue";
            if (!isCompleted) {
              if (link.to.level === 2) markerId = "arrow-purple";
              else if (link.to.level === 3) markerId = "arrow-pink";
              else if (link.to.level === 4) markerId = "arrow-green";
              else if (link.to.level === 5) markerId = "arrow-yellow";
              else if (link.to.level === 6) markerId = "arrow-victory";
            }

            const lineColor = isCompleted ? "#39ff14" : link.color;
            const bgOpacity = isLocked ? "0.03" : isCompleted ? "0.2" : "0.25";
            const fgOpacity = isLocked ? "0.08" : isCompleted ? "0.85" : "0.75";

            return (
              <g key={`link-${idx}`} className="transition-all duration-500">
                {/* Background glow path */}
                <line
                  x1={link.from.x}
                  y1={link.from.y}
                  x2={link.to.x}
                  y2={link.to.y}
                  stroke={lineColor}
                  strokeWidth="7"
                  strokeOpacity={bgOpacity}
                  style={{ filter: `drop-shadow(0 0 3px ${lineColor})` }}
                />
                {/* Foreground data path with directional arrow */}
                <line
                  x1={link.from.x}
                  y1={link.from.y}
                  x2={link.to.x}
                  y2={link.to.y}
                  stroke={lineColor}
                  strokeWidth="2"
                  strokeOpacity={fgOpacity}
                  markerEnd={`url(#${markerId})`}
                  strokeDasharray={idx < playerPosition ? "none" : "4 4"}
                  className={idx === playerPosition ? "animate-pulse" : ""}
                />
              </g>
            );
          })}

          {/* Grid nodes */}
          {boardNodes.map((node) => {
            const isActive = playerPosition === node.id;
            const isCompleted = playerPosition > node.id;
            const isLocked = node.level > currentLevel && node.id !== 26 && node.id !== 0;

            const nodeColor = isCompleted ? "#39ff14" : node.color;
            const opacityClass = isLocked ? "opacity-25 pointer-events-none" : "opacity-100";

            return (
              <g 
                key={`node-${node.id}`} 
                className={`cursor-pointer group ${opacityClass} transition-all duration-500`}
                onClick={() => {
                  if (isActive && onNodeClick) {
                    onNodeClick(node);
                  }
                }}
              >
                {/* Node ambient glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="24"
                  fill={isCompleted ? "url(#glow-completed)" : `url(#glow-${node.id})`}
                  className={isActive ? "pulse-node" : "opacity-40 group-hover:opacity-80 transition-opacity duration-300"}
                />

                {/* Node outer ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="16"
                  fill="none"
                  stroke={nodeColor}
                  strokeWidth={isActive ? "3" : "1.5"}
                  strokeDasharray={node.id === 0 || node.id === 26 ? "none" : "3 1"}
                  className="transition-all duration-300"
                />

                {/* Node inner core */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? "10" : "6"}
                  fill={isCompleted ? "#39ff14" : "rgba(10, 11, 16, 0.9)"}
                  stroke={nodeColor}
                  strokeWidth="1"
                  className="transition-all duration-300"
                />

                {/* Topic Label Text */}
                <text
                  x={node.x}
                  y={node.y + 34}
                  textAnchor="middle"
                  fill={isActive ? "#ffffff" : isCompleted ? "#39ff14" : "rgba(148, 163, 184, 0.85)"}
                  fontSize="11.5"
                  fontWeight={isActive ? "bold" : "600"}
                  className="font-sans pointer-events-none select-none tracking-wide text-center"
                >
                  {node.label}
                </text>
                
                {/* Topic Full Tooltip on hover */}
                <title>{node.name} (Level {node.level})</title>
              </g>
            );
          })}

          {/* Player Pawn Token */}
          <motion.g
            animate={{ x: activeNode.x, y: activeNode.y }}
            transition={{ type: "spring", stiffness: 90, damping: 15 }}
          >
            {/* Outer radar ripple */}
            <circle
              cx="0"
              cy="0"
              r="22"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              className="animate-ping"
              style={{ animationDuration: '2s' }}
            />
            {/* Main pawn shape */}
            <circle
              cx="0"
              cy="0"
              r="12"
              fill="#0a0b10"
              stroke="#00f0ff"
              strokeWidth="2.5"
              filter="drop-shadow(0 0 6px #00f0ff)"
            />
            {/* Core glowing eye */}
            <circle
              cx="0"
              cy="0"
              r="5"
              fill="#ff007f"
            />
            {/* Text badge */}
            <text
              x="0"
              y="-18"
              textAnchor="middle"
              fill="#00f0ff"
              fontSize="9"
              fontWeight="900"
              className="font-cyber tracking-widest bg-black px-1"
            >
              {teamName ? teamName.substring(0, 3).toUpperCase() : "P1"}
            </text>
          </motion.g>
        </svg>
      </div>

      {/* Board Legend */}
      <div className="grid grid-cols-5 gap-1.5 mt-4 border-t border-cyber-lightgray pt-3.5 text-xs font-mono text-center">
        <div className="flex items-center justify-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]"></span>
          <span className="text-slate-400">L1: THREATS</span>
        </div>
        <div className="flex items-center justify-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#bd00ff]"></span>
          <span className="text-slate-400">L2: FIREWALL</span>
        </div>
        <div className="flex items-center justify-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff007f]"></span>
          <span className="text-slate-400">L3: SOC</span>
        </div>
        <div className="flex items-center justify-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#39ff14]"></span>
          <span className="text-slate-400">L4: ZTA</span>
        </div>
        <div className="flex items-center justify-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fffb00]"></span>
          <span className="text-slate-400">L5: RESILIENCE</span>
        </div>
      </div>
    </div>
  );
};

export default BoardGame;
