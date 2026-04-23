/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Home, 
  Play, 
  Users, 
  BarChart2, 
  Settings as SettingsIcon,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Award,
  Zap,
  Target,
  BookOpen,
  Calculator
} from 'lucide-react';
import { generateFootballQuestion, Question } from './lib/gemini';
import { GameState, Subject, Difficulty, Screen } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [subject, setSubject] = useState<Subject>("maths");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState>({
    xp: 0,
    soloStats: { correct: 0, total: 0, streak: 0, bestStreak: 0 },
    players: {
      p1: { name: "Player 1", xp: 0, wins: 0, correct: 0 },
      p2: { name: "Player 2", xp: 0, wins: 0, correct: 0 }
    },
    totalMatches: 0,
    totalQuestions: 0
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Versus state
  const [vsState, setVsState] = useState({
    p1Score: 0,
    p2Score: 0,
    round: 1,
    turn: 1 as 1 | 2,
    isComplete: false
  });

  const MAX_ROUNDS = 5;

  const loadQuestion = async () => {
    setLoading(true);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedOption(null);
    try {
      const q = await generateFootballQuestion(subject, difficulty);
      setCurrentQuestion(q);
    } catch (error) {
      console.error("Failed to load question", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoloAnswer = (option: string) => {
    if (!currentQuestion || selectedOption) return;
    
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.answer;
    
    setGameState(prev => {
      const newStreak = isCorrect ? prev.soloStats.streak + 1 : 0;
      return {
        ...prev,
        xp: prev.xp + (isCorrect ? 10 : 0),
        totalQuestions: prev.totalQuestions + 1,
        soloStats: {
          ...prev.soloStats,
          correct: prev.soloStats.correct + (isCorrect ? 1 : 0),
          total: prev.soloStats.total + 1,
          streak: newStreak,
          bestStreak: Math.max(prev.soloStats.bestStreak, newStreak)
        }
      };
    });

    setFeedback({
      isCorrect,
      text: isCorrect ? `Goal! Correct. ${currentQuestion.explanation}` : `Missed! ${currentQuestion.explanation}`
    });
  };

  const handleVsAnswer = (option: string) => {
    if (!currentQuestion || selectedOption) return;
    
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.answer;
    
    if (isCorrect) {
      setVsState(prev => ({
        ...prev,
        [vsState.turn === 1 ? 'p1Score' : 'p2Score']: (vsState.turn === 1 ? prev.p1Score : prev.p2Score) + 1
      }));
      setGameState(prev => ({
        ...prev,
        xp: prev.xp + 10,
        players: {
          ...prev.players,
          [vsState.turn === 1 ? 'p1' : 'p2']: {
            ...prev.players[vsState.turn === 1 ? 'p1' : 'p2'],
            xp: prev.players[vsState.turn === 1 ? 'p1' : 'p2'].xp + 10,
            correct: prev.players[vsState.turn === 1 ? 'p1' : 'p2'].correct + 1
          }
        }
      }));
    }

    setFeedback({
      isCorrect,
      text: isCorrect ? `Goal! ${vsState.turn === 1 ? gameState.players.p1.name : gameState.players.p2.name} scores!` : `Saved! Great effort though.`
    });
  };

  const nextVsTurn = () => {
    if (vsState.turn === 2) {
      if (vsState.round === MAX_ROUNDS) {
        setVsState(prev => ({ ...prev, isComplete: true }));
        // Update wins
        setGameState(prev => {
          const p1won = vsState.p1Score > vsState.p2Score;
          const p2won = vsState.p2Score > vsState.p1Score;
          return {
            ...prev,
            totalMatches: prev.totalMatches + 1,
            players: {
              p1: { ...prev.players.p1, wins: prev.players.p1.wins + (p1won ? 1 : 0) },
              p2: { ...prev.players.p2, wins: prev.players.p2.wins + (p2won ? 1 : 0) }
            }
          };
        });
      } else {
        setVsState(prev => ({ ...prev, round: prev.round + 1, turn: 1 }));
        loadQuestion();
      }
    } else {
      setVsState(prev => ({ ...prev, turn: 2 }));
      loadQuestion();
    }
  };

  const startVersus = () => {
    setVsState({
      p1Score: 0,
      p2Score: 0,
      round: 1,
      turn: 1,
      isComplete: false
    });
    setScreen("versus");
    loadQuestion();
  };

  const startSolo = () => {
    setScreen("solo");
    loadQuestion();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation - Desktop Visible */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
            ⚽
          </div>
          <div>
            <h1 className="font-['Bebas_Neue'] text-2xl tracking-wider leading-none">Soccer Academy</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Kick & Learn</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "solo", icon: Play, label: "Solo Training", onClick: startSolo },
            { id: "versus", icon: Users, label: "2-Player Match", onClick: startVersus },
            { id: "stats", icon: BarChart2, label: "Leaderboard" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.onClick) item.onClick();
                else setScreen(item.id as Screen);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                screen === item.id 
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700 font-bold" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <item.icon size={20} className={screen === item.id ? "text-indigo-400" : ""} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 bg-slate-950/50 mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-wider opacity-40 font-bold">Total Power</span>
            <div className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-bold">LEGEND</div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-['Bebas_Neue'] text-indigo-400">{gameState.xp}</span>
            <span className="text-xs pb-1 opacity-40 font-bold uppercase tracking-tighter">XP</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm shadow-slate-900/5">
          <div className="flex items-center gap-4">
             <div className="px-3 py-1.5 bg-slate-100 rounded-xl flex items-center gap-2">
               <Star size={14} className="text-indigo-600" fill="currentColor" />
               <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Level 1: Rookie</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold leading-none">{gameState.players.p1.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Active Captain</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold shadow-sm">
              {gameState.players.p1.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {screen === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <section className="relative overflow-hidden bg-slate-900 rounded-[40px] p-12 text-white shadow-2xl">
                  <div className="relative z-10 space-y-6 max-w-lg">
                    <h2 className="text-6xl font-['Bebas_Neue'] tracking-wide">Elite Training Ground</h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                      Elevate your squad's performance through data-driven mathematics and linguistics. 
                      Every successful play earns you rank and prestige.
                    </p>
                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={startSolo}
                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold transition-all hover:bg-indigo-500 hover:translate-y-[-2px] shadow-lg shadow-indigo-500/20"
                      >
                        Launch Solo Training
                      </button>
                      <button 
                        onClick={() => setScreen("stats")}
                        className="bg-white/5 backdrop-blur-md px-10 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10 text-white"
                      >
                        Performance Metrics
                      </button>
                    </div>
                  </div>
                  <div className="absolute right-[-5%] bottom-[-15%] text-[300px] text-indigo-500 opacity-10 select-none rotate-12 pointer-events-none">⚽</div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <SettingsIcon size={24} />
                      </div>
                      <h3 className="text-xl font-bold">Training Configuration</h3>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tactical Squad</label>
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="text" 
                            value={gameState.players.p1.name}
                            onChange={(e) => setGameState(p => ({ ...p, players: { ...p.players, p1: { ...p.players.p1, name: e.target.value }}}))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 ring-indigo-500 outline-none font-medium text-sm"
                            placeholder="Player 1"
                          />
                          <input 
                            type="text" 
                            value={gameState.players.p2.name}
                            onChange={(e) => setGameState(p => ({ ...p, players: { ...p.players, p2: { ...p.players.p2, name: e.target.value }}}))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 ring-indigo-500 outline-none font-medium text-sm"
                            placeholder="Player 2"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Primary Discipline</label>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setSubject("maths")}
                            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl border transition-all ${
                              subject === "maths" ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20" : "bg-transparent border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            <Calculator size={18} />
                            <span className="font-bold tracking-tight">Mathematics</span>
                          </button>
                          <button 
                            onClick={() => setSubject("english")}
                            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl border transition-all ${
                              subject === "english" ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20" : "bg-transparent border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            <BookOpen size={18} />
                            <span className="font-bold tracking-tight">Linguistics</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience Tier</label>
                        <div className="flex gap-2">
                          {["easy", "medium", "hard"].map((l) => (
                            <button
                              key={l}
                              onClick={() => setDifficulty(l as Difficulty)}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                difficulty === l 
                                  ? "bg-slate-900 text-white border-transparent" 
                                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {l === 'easy' ? 'Rookie' : l === 'medium' ? 'Veteran' : 'Grandmaster'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Activity Velocity</h3>
                        <Zap size={20} className="text-indigo-500" fill="currentColor" />
                      </div>
                      <div className="flex justify-between gap-2">
                        {[1, 1, 1, 0, 0, 0, 0].map((active, i) => (
                          <div 
                            key={i} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              active ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-50 border-slate-200 opacity-30"
                            }`}
                          >
                            <CheckCircle2 size={16} />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Consistent performance detected. 3 days above threshold.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Squad XP</p>
                        <div className="flex items-center gap-2">
                          <Trophy size={16} className="text-indigo-400" />
                          <span className="text-2xl font-['Bebas_Neue'] text-indigo-400">{gameState.xp}</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-3xl p-6 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Win Probability</p>
                        <div className="flex items-center gap-2">
                          <Target size={16} className="text-indigo-600" />
                          <span className="text-2xl font-['Bebas_Neue']">
                            {gameState.totalMatches > 0 ? Math.round((gameState.players.p1.wins / gameState.totalMatches) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {screen === "solo" && (
              <motion.div
                key="solo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                     <button onClick={() => setScreen("home")} className="p-3 hover:bg-white rounded-2xl border border-slate-200 transition-all shadow-sm">
                       <Home size={20} className="text-slate-400" />
                     </button>
                     <h2 className="text-2xl font-bold capitalize">{subject} Intelligence</h2>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Streak</p>
                        <p className="text-2xl font-['Bebas_Neue'] text-indigo-500">{gameState.soloStats.streak} 🔥</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Score</p>
                        <p className="text-2xl font-['Bebas_Neue']">
                          <span className="text-indigo-600">{gameState.soloStats.correct}</span>
                          <span className="mx-1 opacity-20 text-sm">/</span>
                          <span className="opacity-40">{gameState.soloStats.total}</span>
                        </p>
                      </div>
                   </div>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(gameState.soloStats.correct / (gameState.soloStats.total || 1)) * 100}%` }}
                    className="bg-indigo-600 h-full"
                  />
                </div>

                {loading ? (
                  <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
                    <Loader2 size={48} className="animate-spin text-indigo-600" />
                    <p className="font-bold text-slate-400 animate-pulse uppercase tracking-[0.2em] text-[10px]">Processing data</p>
                  </div>
                ) : currentQuestion ? (
                  <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
                      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                         <div className="w-full h-[1px] bg-indigo-400 absolute top-1/2" />
                         <div className="w-64 h-64 border border-indigo-400 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <span className="inline-block px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-indigo-500/20">
                        {currentQuestion.topic}
                      </span>
                      {currentQuestion.passage && (
                        <blockquote className="bg-white/5 p-8 rounded-3xl text-base italic mb-8 leading-relaxed border-l-4 border-indigo-500 backdrop-blur-sm">
                          "{currentQuestion.passage}"
                        </blockquote>
                      )}
                      <h3 className="text-3xl font-medium leading-snug relative z-10 tracking-tight">
                        {currentQuestion.question}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options.map((opt, i) => (
                        <button
                          key={i}
                          disabled={!!selectedOption}
                          onClick={() => handleSoloAnswer(opt)}
                          className={`p-6 rounded-3xl text-left border-2 transition-all font-bold group ${
                            selectedOption === opt
                              ? opt === currentQuestion.answer
                                ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                                : "bg-red-50 border-red-600 text-red-600"
                              : selectedOption && opt === currentQuestion.answer
                              ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                              : "bg-white border-slate-100 hover:border-slate-200 text-slate-700 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-5">
                            <span className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-lg">{opt}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {feedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-8 rounded-[32px] border-2 space-y-3 ${
                          feedback.isCorrect ? "bg-indigo-50 border-indigo-600 text-indigo-900" : "bg-red-50 border-red-600 text-red-900"
                        }`}
                      >
                         <h4 className="font-bold text-xl flex items-center gap-3">
                           {feedback.isCorrect ? <Award size={24} /> : <Target size={24} />}
                           {feedback.isCorrect ? "Data Confirmed!" : "Recalibration Needed!"}
                         </h4>
                         <p className="text-sm italic opacity-80 leading-relaxed font-medium">{feedback.text}</p>
                         <button 
                          onClick={loadQuestion}
                          className="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-indigo-600 hover:gap-5 transition-all"
                         >
                           Analyze Next Instance <ChevronRight size={18} />
                         </button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-white rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <Target size={40} />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Communication lost with referee</p>
                    <button onClick={loadQuestion} className="text-indigo-600 font-bold text-sm">Initialize New Session</button>
                  </div>
                )}
              </motion.div>
            )}

            {screen === "versus" && (
              <motion.div
                key="versus"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                {!vsState.isComplete ? (
                  <>
                    <div className="grid grid-cols-3 items-center gap-8">
                       <div className={`p-10 rounded-[40px] border-2 text-center transition-all ${vsState.turn === 1 ? "bg-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105" : "bg-slate-100 border-transparent opacity-60"}`}>
                         <div className="w-20 h-20 rounded-3xl bg-slate-200 mx-auto mb-5 flex items-center justify-center text-2xl font-bold border border-slate-300">
                           {gameState.players.p1.name.slice(0, 2).toUpperCase()}
                         </div>
                         <h3 className="font-bold text-xl mb-1">{gameState.players.p1.name}</h3>
                         <div className="text-6xl font-['Bebas_Neue'] text-indigo-600">{vsState.p1Score}</div>
                         <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Scientific Points</p>
                       </div>

                       <div className="text-center space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">Phase {vsState.round} / {MAX_ROUNDS * 2}</p>
                          <div className="font-['Bebas_Neue'] text-8xl text-indigo-100">VS</div>
                          <div className="py-2.5 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-bold tracking-[0.2em] uppercase shadow-lg">
                            {vsState.turn === 1 ? gameState.players.p1.name : gameState.players.p2.name}'S Turn
                          </div>
                       </div>

                       <div className={`p-10 rounded-[40px] border-2 text-center transition-all ${vsState.turn === 2 ? "bg-white border-indigo-600 shadow-xl shadow-indigo-100 scale-105" : "bg-slate-100 border-transparent opacity-60"}`}>
                         <div className="w-20 h-20 rounded-3xl bg-slate-200 mx-auto mb-5 flex items-center justify-center text-2xl font-bold border border-slate-300">
                           {gameState.players.p2.name.slice(0, 2).toUpperCase()}
                         </div>
                         <h3 className="font-bold text-xl mb-1">{gameState.players.p2.name}</h3>
                         <div className="text-6xl font-['Bebas_Neue'] text-indigo-600">{vsState.p2Score}</div>
                         <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Scientific Points</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                      {loading ? (
                        <div className="h-[200px] flex items-center justify-center">
                          <Loader2 size={32} className="animate-spin text-indigo-600 opacity-20" />
                        </div>
                      ) : currentQuestion && (
                        <div className="space-y-6">
                          <div className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-sm text-center space-y-8">
                             <div className="inline-block px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-indigo-100">
                               Module: {currentQuestion.topic}
                             </div>
                             <h4 className="text-4xl font-medium tracking-tight max-w-2xl mx-auto leading-tight">{currentQuestion.question}</h4>
                             
                             <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto pt-6">
                               {currentQuestion.options.map((opt, i) => (
                                 <button
                                   key={i}
                                   disabled={!!selectedOption}
                                   onClick={() => handleVsAnswer(opt)}
                                   className={`p-6 rounded-3xl text-left border-2 transition-all font-bold group ${
                                     selectedOption === opt
                                       ? opt === currentQuestion.answer
                                         ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-100 transform -translate-y-1"
                                         : "bg-red-50 border-red-600 text-red-600"
                                       : selectedOption && opt === currentQuestion.answer
                                       ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-100"
                                       : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-700"
                                   }`}
                                 >
                                   <div className="flex items-center gap-4">
                                      <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        {i + 1}
                                      </span>
                                      <span className="text-lg">{opt}</span>
                                   </div>
                                 </button>
                               ))}
                             </div>
                          </div>

                          {feedback && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`p-10 rounded-[48px] text-center space-y-6 border-2 transition-all shadow-2xl ${
                                feedback.isCorrect ? "bg-indigo-600 border-indigo-500 text-white" : "bg-red-600 border-red-500 text-white"
                              }`}
                            >
                               <div className="text-5xl">{feedback.isCorrect ? "⚡" : "📉"}</div>
                               <h5 className="text-3xl font-bold uppercase tracking-tight">{feedback.isCorrect ? "Target Acquired!" : "System Deflection!"}</h5>
                               <p className="opacity-80 text-base max-w-lg mx-auto italic font-medium leading-relaxed font-sans">"{currentQuestion.explanation}"</p>
                               <button 
                                onClick={nextVsTurn}
                                className="bg-white text-slate-900 px-12 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 active:scale-100 transition-all uppercase tracking-widest text-[10px]"
                               >
                                 {vsState.turn === 2 && vsState.round === MAX_ROUNDS ? "Final Computation" : "Deploy Next Asset"}
                               </button>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-900 rounded-[64px] p-24 text-white text-center space-y-12 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                       <BarChart2 size={500} className="absolute -right-20 -bottom-20 rotate-12 text-indigo-500" />
                    </div>
                    <div className="relative z-10 space-y-4">
                       <Award size={100} className="mx-auto text-indigo-500 animate-bounce" fill="none" strokeWidth={1} />
                       <h2 className="text-8xl font-['Bebas_Neue'] tracking-wider leading-none">Simulation Complete</h2>
                       <p className="text-slate-500 uppercase tracking-[0.4em] text-xs font-bold">Final Data Aggregate</p>
                    </div>

                    <div className="flex justify-center items-center gap-24 relative z-10">
                      <div className="text-center group">
                         <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center text-3xl font-bold mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                           {gameState.players.p1.name.slice(0, 2).toUpperCase()}
                         </div>
                         <p className="font-bold text-slate-500 mb-2 uppercase tracking-widest text-[10px]">{gameState.players.p1.name}</p>
                         <p className="text-8xl font-['Bebas_Neue'] text-white leading-none">{vsState.p1Score}</p>
                      </div>
                      <div className="h-20 w-[1px] bg-white/10" />
                      <div className="text-center group">
                         <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center text-3xl font-bold mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                           {gameState.players.p2.name.slice(0, 2).toUpperCase()}
                         </div>
                         <p className="font-bold text-slate-500 mb-2 uppercase tracking-widest text-[10px]">{gameState.players.p2.name}</p>
                         <p className="text-8xl font-['Bebas_Neue'] text-white leading-none">{vsState.p2Score}</p>
                      </div>
                    </div>

                    <div className="relative z-10 py-8 px-12 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 inline-block">
                       <p className="text-3xl font-bold tracking-tight">
                        {vsState.p1Score === vsState.p2Score 
                          ? "Parity Achieved. Symmetric Brilliance." 
                          : `${vsState.p1Score > vsState.p2Score ? gameState.players.p1.name : gameState.players.p2.name} is the Superior Intelligence.`}
                       </p>
                    </div>

                    <div className="flex gap-6 justify-center relative z-10">
                      <button 
                        onClick={startVersus}
                        className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-bold shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-all text-sm uppercase tracking-widest"
                       >
                         Initialize Rematch
                       </button>
                       <button 
                        onClick={() => setScreen("home")}
                        className="bg-white/5 px-12 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10 text-white text-sm uppercase tracking-widest"
                       >
                         Return to Control Center
                       </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {screen === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                   <h2 className="text-3xl font-bold tracking-tight">Intelligence Dashboard</h2>
                   <div className="flex gap-2">
                     <button className="px-5 py-2.5 bg-white rounded-xl shadow-sm text-[10px] font-bold uppercase tracking-widest border border-slate-200 text-slate-600">Real-time</button>
                     <button className="px-5 py-2.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">Historical</button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: "Operations Logged", val: gameState.totalMatches, icon: Target, color: "bg-indigo-50", text: "text-indigo-600" },
                    { label: "Data Points Processed", val: gameState.totalQuestions, icon: Calculator, color: "bg-slate-100", text: "text-slate-600" },
                    { label: "Precision Rating", val: `${gameState.totalQuestions > 0 ? Math.round((gameState.soloStats.correct / gameState.totalQuestions) * 100) : 0}%`, icon: Award, color: "bg-indigo-50", text: "text-indigo-600" },
                    { label: "Accumulated XP", val: gameState.xp, icon: Zap, color: "bg-slate-950", text: "text-indigo-400" }
                  ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-[32px] p-8 shadow-sm border border-slate-200 flex flex-col justify-between h-44 transition-all hover:shadow-md ${stat.color === 'bg-slate-950' ? 'bg-slate-900 border-slate-800' : ''}`}>
                      <div className={`p-3 w-fit rounded-2xl ${stat.color} ${stat.text}`}>
                         <stat.icon size={20} />
                      </div>
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${stat.color === 'bg-slate-950' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                        <p className={`text-4xl font-['Bebas_Neue'] ${stat.color === 'bg-slate-950' ? 'text-white' : 'text-slate-900'}`}>{stat.val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold mb-8">High-Value Assets</h3>
                    <div className="space-y-8">
                      {[gameState.players.p1, gameState.players.p2].map((p, i) => (
                        <div key={i} className="flex items-center gap-6 group">
                          <div className="w-6 font-['Bebas_Neue'] text-2xl text-slate-200 group-hover:text-indigo-600 transition-colors">0{i + 1}</div>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-bold border ${i === 0 ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{p.name}</h4>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{p.wins} Victories · {p.correct} Units</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-['Bebas_Neue'] text-indigo-600">{p.xp} XP</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[40px] p-10 border border-slate-200 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
                    <div className="w-24 h-24 bg-indigo-600 rounded-[32px] rotate-12 flex items-center justify-center text-4xl shadow-2xl shadow-indigo-200 relative z-10">
                      🏅
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold">Elite Recognition</h3>
                      <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-2 leading-relaxed">Top performers are inducted into the Hall of Science.</p>
                    </div>
                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] border-b-2 border-indigo-600 pb-1.5 hover:text-indigo-500 hover:border-indigo-500 transition-all">
                      Access Global Registry
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
