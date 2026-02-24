/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw,
  Medal,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  Player, 
  TournamentType, 
  TeamMode, 
  Round, 
  Match, 
  Gender,
  Team,
  FixedTeamSubMode,
  RotationSubMode
} from './types';

// --- Constants & Helpers ---

const generateId = () => Math.random().toString(36).substring(2, 9);

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// --- Components ---

export default function App() {
  const [tournamentType, setTournamentType] = useState<TournamentType>('mixed');
  const [teamMode, setTeamMode] = useState<TeamMode>('rotating');
  const [fixedSubMode, setFixedSubMode] = useState<FixedTeamSubMode>('random');
  const [rotationSubMode, setRotationSubMode] = useState<RotationSubMode>('random');
  const [playerCount, setPlayerCount] = useState<number>(8);
  
  const [men, setMen] = useState<Player[]>(
    Array.from({ length: 8 }, (_, i) => ({ id: `m-${i}`, name: `Uomo ${i + 1}`, gender: 'male', isSeed: false }))
  );
  const [women, setWomen] = useState<Player[]>(
    Array.from({ length: 8 }, (_, i) => ({ id: `w-${i}`, name: `Donna ${i + 1}`, gender: 'female', isSeed: false }))
  );

  // For manual fixed teams
  const [manualTeams, setManualTeams] = useState<{p1: string, p2: string}[]>(
    Array.from({ length: 8 }, () => ({ p1: '', p2: '' }))
  );

  const [rounds, setRounds] = useState<Round[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'calendar' | 'leaderboard'>('setup');

  // Update default names when tournament type or player count changes
  useEffect(() => {
    if (tournamentType === 'mixed') {
      setWomen(prev => prev.map((p, i) => 
        (p.name.startsWith('Giocatore') || p.name.startsWith('Donna')) 
        ? { ...p, name: `Donna ${i + 1}` } 
        : p
      ));
      setMen(prev => prev.map((p, i) => 
        (p.name.startsWith('Giocatore') || p.name.startsWith('Uomo')) 
        ? { ...p, name: `Uomo ${i + 1}` } 
        : p
      ));
    } else {
      setWomen(prev => prev.map((p, i) => 
        (p.name.startsWith('Donna') || p.name.startsWith('Giocatore')) 
        ? { ...p, name: `Giocatore ${i + 1}` } 
        : p
      ));
      setMen(prev => prev.map((p, i) => 
        (p.name.startsWith('Uomo') || p.name.startsWith('Giocatore')) 
        ? { ...p, name: `Giocatore ${i + (playerCount / 2) + 1}` } 
        : p
      ));
    }
  }, [tournamentType, playerCount]);

  // --- Logic ---

  const generateCalendar = () => {
    let groupA: Player[] = [];
    let groupB: Player[] = [];

    if (tournamentType === 'mixed') {
      groupA = shuffleArray(women.slice(0, playerCount / 2).map(p => ({ ...p, gender: 'female' as Gender })));
      groupB = shuffleArray(men.slice(0, playerCount / 2).map(p => ({ ...p, gender: 'male' as Gender })));
    } else {
      const gender: Gender = tournamentType === 'male' ? 'male' : 'female';
      const listA = women.slice(0, playerCount / 2).map(p => ({ ...p, gender }));
      const listB = men.slice(0, playerCount / 2).map(p => ({ ...p, gender }));
      
      if (teamMode === 'rotating') {
        if (rotationSubMode === 'seeded') {
          // In seeded mode, we treat the first list as seeds and the second as non-seeds
          groupA = shuffleArray(listA);
          groupB = shuffleArray(listB);
        } else {
          const allPlayers = shuffleArray([...listA, ...listB]);
          groupA = allPlayers.slice(0, playerCount / 2);
          groupB = allPlayers.slice(playerCount / 2);
        }
      } else {
        // Fixed teams for M/F
        groupA = [...listA, ...listB];
      }
    }

    if (teamMode === 'rotating') {
      const N = playerCount / 2;
      const tempRounds: Round[] = [];

      for (let k = 0; k < N; k++) {
        const teams: Team[] = [];
        for (let i = 0; i < N; i++) {
          teams.push({
            id: generateId(),
            player1: groupA[i],
            player2: groupB[(i + k) % N]
          });
        }

        const shuffledTeams = shuffleArray(teams);
        const matches: Match[] = [];
        for (let i = 0; i < N; i += 2) {
          matches.push({
            id: generateId(),
            round: k + 1,
            team1: shuffledTeams[i],
            team2: shuffledTeams[i + 1],
            score1: null,
            score2: null,
          });
        }
        tempRounds.push({ number: k + 1, matches });
      }

      const shuffledRounds = shuffleArray(tempRounds).map((r, idx) => ({
        ...r,
        number: idx + 1,
        matches: r.matches.map(m => ({ ...m, round: idx + 1 }))
      }));

      setRounds(shuffledRounds);
      setIsStarted(true);
      setActiveTab('calendar');
    } else {
      // Fixed Teams Mode
      let teams: Team[] = [];

      if (fixedSubMode === 'random') {
        if (tournamentType === 'mixed') {
          const shuffledA: Player[] = shuffleArray(women.slice(0, playerCount / 2).map(p => ({ ...p, gender: 'female' as Gender })));
          const shuffledB: Player[] = shuffleArray(men.slice(0, playerCount / 2).map(p => ({ ...p, gender: 'male' as Gender })));
          for (let i = 0; i < playerCount / 2; i++) {
            teams.push({
              id: generateId(),
              player1: shuffledA[i],
              player2: shuffledB[i]
            });
          }
        } else {
          const gender: Gender = tournamentType === 'male' ? 'male' : 'female';
          const allPlayers: Player[] = [...women.slice(0, playerCount / 2), ...men.slice(0, playerCount / 2)].map(p => ({ ...p, gender }));
          const shuffled: Player[] = shuffleArray(allPlayers);
          for (let i = 0; i < playerCount; i += 2) {
            if (shuffled[i] && shuffled[i+1]) {
              teams.push({
                id: generateId(),
                player1: shuffled[i],
                player2: shuffled[i+1]
              });
            }
          }
        }
      } else {
        const numTeams = playerCount / 2;
        for (let i = 0; i < numTeams; i++) {
          const t = manualTeams[i];
          if (!t.p1 || !t.p2) {
            alert("Inserisci tutti i nomi per le squadre manuali.");
            return;
          }
          teams.push({
            id: generateId(),
            player1: { id: `manual-p1-${i}`, name: t.p1, gender: tournamentType === 'female' ? 'female' : 'male' },
            player2: { id: `manual-p2-${i}`, name: t.p2, gender: tournamentType === 'female' ? 'female' : 'male' }
          });
        }
      }

      const T = teams.length;
      const numRounds = T % 2 === 0 ? T - 1 : T;
      const newRounds: Round[] = [];
      const teamIndices = Array.from({ length: T }, (_, i) => i);

      for (let r = 0; r < numRounds; r++) {
        const matches: Match[] = [];
        for (let i = 0; i < T / 2; i++) {
          const t1Idx = teamIndices[i];
          const t2Idx = teamIndices[T - 1 - i];
          if (t1Idx !== undefined && t2Idx !== undefined) {
            matches.push({
              id: generateId(),
              round: r + 1,
              team1: teams[t1Idx],
              team2: teams[t2Idx],
              score1: null,
              score2: null,
            });
          }
        }
        newRounds.push({ number: r + 1, matches });
        const first = teamIndices.shift()!;
        const last = teamIndices.pop()!;
        teamIndices.unshift(last);
        teamIndices.unshift(first);
      }
      setRounds(newRounds);
      setIsStarted(true);
      setActiveTab('calendar');
    }
  };

  const updateScore = (roundIdx: number, matchIdx: number, team: 1 | 2, score: string) => {
    const val = score === '' ? null : parseInt(score, 10);
    if (val !== null && isNaN(val)) return;

    const newRounds = [...rounds];
    if (team === 1) newRounds[roundIdx].matches[matchIdx].score1 = val;
    else newRounds[roundIdx].matches[matchIdx].score2 = val;
    setRounds(newRounds);
  };

  const leaderboard = useMemo(() => {
    if (teamMode === 'fixed') {
      const teamStats: Record<string, { id: string, name: string, won: number, gamesWon: number, gamesLost: number }> = {};
      
      rounds.forEach(r => {
        r.matches.forEach(m => {
          if (m.score1 !== null && m.score2 !== null) {
            const t1Name = `${m.team1.player1.name} / ${m.team1.player2.name}`;
            const t2Name = `${m.team2.player1.name} / ${m.team2.player2.name}`;
            
            if (!teamStats[t1Name]) teamStats[t1Name] = { id: m.team1.id, name: t1Name, won: 0, gamesWon: 0, gamesLost: 0 };
            if (!teamStats[t2Name]) teamStats[t2Name] = { id: m.team2.id, name: t2Name, won: 0, gamesWon: 0, gamesLost: 0 };
            
            teamStats[t1Name].gamesWon += m.score1!;
            teamStats[t1Name].gamesLost += m.score2!;
            if (m.score1! > m.score2!) teamStats[t1Name].won += 1;
            
            teamStats[t2Name].gamesWon += m.score2!;
            teamStats[t2Name].gamesLost += m.score1!;
            if (m.score2! > m.score1!) teamStats[t2Name].won += 1;
          }
        });
      });
      
      const sorted = Object.values(teamStats).sort((a, b) => {
        if (b.won !== a.won) return b.won - a.won;
        return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
      });
      
      return { all: sorted, isTeam: true };
    }

    const stats: Record<string, { id: string, name: string, gender: Gender, won: number, gamesWon: number, gamesLost: number }> = {};
    const playersInTournament = new Map<string, Player>();
    rounds.forEach(r => {
      r.matches.forEach(m => {
        [m.team1.player1, m.team1.player2, m.team2.player1, m.team2.player2].forEach(p => {
          playersInTournament.set(p.id, p);
        });
      });
    });

    playersInTournament.forEach(p => {
      stats[p.id] = { id: p.id, name: p.name, gender: p.gender, won: 0, gamesWon: 0, gamesLost: 0 };
    });

    rounds.forEach(r => {
      r.matches.forEach(m => {
        if (m.score1 !== null && m.score2 !== null) {
          const t1 = [m.team1.player1, m.team1.player2];
          const t2 = [m.team2.player1, m.team2.player2];
          t1.forEach(p => {
            stats[p.id].gamesWon += m.score1!;
            stats[p.id].gamesLost += m.score2!;
            if (m.score1! > m.score2!) stats[p.id].won += 1;
          });
          t2.forEach(p => {
            stats[p.id].gamesWon += m.score2!;
            stats[p.id].gamesLost += m.score1!;
            if (m.score2! > m.score1!) stats[p.id].won += 1;
          });
        }
      });
    });

    const sorted = Object.values(stats).sort((a, b) => {
      if (b.won !== a.won) return b.won - a.won;
      return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });

    return {
      all: sorted,
      men: sorted.filter(p => p.gender === 'male'),
      women: sorted.filter(p => p.gender === 'female'),
      isTeam: false
    };
  }, [rounds, teamMode]);

  const resetTournament = () => {
    if (confirm("Sei sicuro di voler resettare il torneo? Tutti i dati andranno persi.")) {
      setIsStarted(false);
      setRounds([]);
      setActiveTab('setup');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Padel App</h1>
          </div>
          
          {isStarted && (
            <nav className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('calendar')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'calendar' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Calendario
              </button>
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'leaderboard' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Classifica
              </button>
              <button 
                onClick={() => setActiveTab('setup')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'setup' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Setup
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'setup' && (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Tournament Config */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Tipo Torneo
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {(['mixed', 'male', 'female'] as TournamentType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setTournamentType(type)}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-medium transition-all relative overflow-hidden",
                          tournamentType === type 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {type === 'mixed' ? 'Misto' : type === 'male' ? 'Maschile' : 'Femminile'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Modalità Squadre
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {(['rotating', 'fixed'] as TeamMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTeamMode(mode)}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-medium transition-all",
                          teamMode === mode 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {mode === 'rotating' ? 'Rotazione' : 'Fisse'}
                      </button>
                    ))}
                  </div>
                  {teamMode === 'fixed' && (
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mt-2">
                      <button 
                        onClick={() => setFixedSubMode('random')}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                          fixedSubMode === 'random' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500"
                        )}
                      >
                        Sorteggio
                      </button>
                      <button 
                        onClick={() => setFixedSubMode('manual')}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                          fixedSubMode === 'manual' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500"
                        )}
                      >
                        Manuale
                      </button>
                    </div>
                  )}
                  {teamMode === 'rotating' && tournamentType !== 'mixed' && (
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mt-2">
                      <button 
                        onClick={() => setRotationSubMode('random')}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                          rotationSubMode === 'random' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500"
                        )}
                      >
                        Integrale
                      </button>
                      <button 
                        onClick={() => setRotationSubMode('seeded')}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                          rotationSubMode === 'seeded' ? "bg-white shadow-sm text-emerald-600" : "text-gray-500"
                        )}
                      >
                        Teste di Serie
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Numero Giocatori
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {[8, 12, 16].map((count) => (
                      <button
                        key={count}
                        onClick={() => setPlayerCount(count)}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-medium transition-all",
                          playerCount === count 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {count} Giocatori
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Player Input */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamMode === 'fixed' && fixedSubMode === 'manual' ? (
                  <div className="col-span-full bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Inserimento Squadre Manuali ({playerCount / 2})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: playerCount / 2 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-xs font-bold text-gray-400 w-6">S{idx + 1}</span>
                          <input
                            type="text"
                            value={manualTeams[idx]?.p1 || ''}
                            onChange={(e) => {
                              const newTeams = [...manualTeams];
                              newTeams[idx] = { ...newTeams[idx], p1: e.target.value };
                              setManualTeams(newTeams);
                            }}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Giocatore 1"
                          />
                          <span className="text-gray-300">&</span>
                          <input
                            type="text"
                            value={manualTeams[idx]?.p2 || ''}
                            onChange={(e) => {
                              const newTeams = [...manualTeams];
                              newTeams[idx] = { ...newTeams[idx], p2: e.target.value };
                              setManualTeams(newTeams);
                            }}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Giocatore 2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* List 1: Women / Seeds / Group A */}
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <UserIcon className={cn("w-4 h-4", tournamentType === 'male' ? "text-blue-500" : "text-pink-500")} />
                          {tournamentType === 'mixed' ? 'Donne' : rotationSubMode === 'seeded' ? 'Teste di Serie' : `Giocatori (1-${playerCount / 2})`} ({playerCount / 2})
                        </h2>
                      </div>
                      <div className="space-y-2">
                        {women.slice(0, playerCount / 2).map((player, idx) => (
                          <div key={player.id} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) => {
                                const newWomen = [...women];
                                newWomen[idx].name = e.target.value;
                                setWomen(newWomen);
                              }}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                              placeholder={`Nome ${tournamentType === 'mixed' ? 'Donna' : 'Giocatore'} ${idx + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* List 2: Men / Non-Seeds / Group B */}
                    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <UserIcon className={cn("w-4 h-4", tournamentType === 'female' ? "text-pink-500" : "text-blue-500")} />
                          {tournamentType === 'mixed' ? 'Uomini' : rotationSubMode === 'seeded' ? 'Non Teste di Serie' : `Giocatori (${playerCount / 2 + 1}-${playerCount})`} ({playerCount / 2})
                        </h2>
                      </div>
                      <div className="space-y-2">
                        {men.slice(0, playerCount / 2).map((player, idx) => (
                          <div key={player.id} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={player.name}
                              onChange={(e) => {
                                const newMen = [...men];
                                newMen[idx].name = e.target.value;
                                setMen(newMen);
                              }}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                              placeholder={`Nome ${tournamentType === 'mixed' ? 'Uomo' : 'Giocatore'} ${idx + (playerCount / 2) + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </section>

              <div className="flex justify-center pt-4">
                <button
                  onClick={generateCalendar}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-3 active:scale-95"
                >
                  <Calendar className="w-6 h-6" />
                  Sorteggia Calendario
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Calendario Torneo</h2>
                <button 
                  onClick={resetTournament}
                  className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Reset Torneo
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {rounds.map((round, rIdx) => (
                  <div key={round.number} className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-black/5 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Giornata {round.number}</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      {round.matches.map((match, mIdx) => (
                        <div key={match.id} className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            {/* Team 1 */}
                            <div className="flex-1 text-right space-y-1">
                              <div className="text-sm font-bold truncate">{match.team1.player1.name}</div>
                              <div className="text-xs text-gray-500 truncate">{match.team1.player2.name}</div>
                            </div>

                            {/* Score Inputs */}
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={match.score1 ?? ''}
                                onChange={(e) => updateScore(rIdx, mIdx, 1, e.target.value)}
                                className="w-12 h-12 bg-gray-100 border-none rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                              />
                              <span className="text-gray-300 font-bold">-</span>
                              <input
                                type="number"
                                value={match.score2 ?? ''}
                                onChange={(e) => updateScore(rIdx, mIdx, 2, e.target.value)}
                                className="w-12 h-12 bg-gray-100 border-none rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-emerald-500 transition-all"
                              />
                            </div>

                            {/* Team 2 */}
                            <div className="flex-1 text-left space-y-1">
                              <div className="text-sm font-bold truncate">{match.team2.player1.name}</div>
                              <div className="text-xs text-gray-500 truncate">{match.team2.player2.name}</div>
                            </div>
                          </div>
                          {mIdx < round.matches.length - 1 && <div className="h-px bg-gray-100" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div 
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Classifica Generale</h2>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Overall Table */}
                <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-black/5">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Pos</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Giocatore</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Vinte</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Games V</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Games S</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Diff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leaderboard.all.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {idx < 3 ? (
                                  <Medal className={cn(
                                    "w-5 h-5",
                                    idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : "text-amber-600"
                                  )} />
                                ) : (
                                  <span className="w-5 text-center text-sm font-medium text-gray-400">{idx + 1}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {!leaderboard.isTeam && (
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                    (p as any).gender === 'male' ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"
                                  )}>
                                    {p.name.charAt(0)}
                                  </div>
                                )}
                                <span className="font-semibold">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-emerald-600">{p.won}</td>
                            <td className="px-6 py-4 text-center font-medium">{p.gamesWon}</td>
                            <td className="px-6 py-4 text-center font-medium text-gray-400">{p.gamesLost}</td>
                            <td className="px-6 py-4 text-center font-bold">
                              <span className={cn(
                                p.gamesWon - p.gamesLost > 0 ? "text-emerald-500" : p.gamesWon - p.gamesLost < 0 ? "text-red-500" : "text-gray-400"
                              )}>
                                {p.gamesWon - p.gamesLost > 0 ? '+' : ''}{p.gamesWon - p.gamesLost}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Split Rankings */}
                {!leaderboard.isTeam && tournamentType === 'mixed' && leaderboard.women && leaderboard.men && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Women Ranking */}
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-pink-600">
                        <UserIcon className="w-5 h-5" /> Classifica Donne
                      </h3>
                      <div className="space-y-3">
                        {leaderboard.women.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-pink-400">#{idx + 1}</span>
                              <span className="font-semibold text-sm">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                              <span className="text-pink-600">{p.won} V</span>
                              <span className="text-gray-400">{p.gamesWon - p.gamesLost} Diff</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Men Ranking */}
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-blue-600">
                        <UserIcon className="w-5 h-5" /> Classifica Uomini
                      </h3>
                      <div className="space-y-3">
                        {leaderboard.men.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-blue-400">#{idx + 1}</span>
                              <span className="font-semibold text-sm">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                              <span className="text-blue-600">{p.won} V</span>
                              <span className="text-gray-400">{p.gamesWon - p.gamesLost} Diff</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-400 text-sm">
        <p>© 2024 Padel App • Crafted for Champions</p>
      </footer>
    </div>
  );
}
