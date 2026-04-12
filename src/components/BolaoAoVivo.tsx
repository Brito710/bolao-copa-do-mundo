import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Save, CheckCircle2, Lock, Plus, Trash2,
  ChevronRight, Radio, Clock, AlertCircle, Zap, ListOrdered,
} from 'lucide-react';
import type { Match, AppUser, LiveRound, UserLiveEntry, LiveMatchPrediction } from '../types';
import { TEAMS } from '../data/teams';
import { supabaseService } from '../lib/supabaseService';
import {
  PREDEFINED_GROUP_ROUNDS,
  KNOCKOUT_ROUND_IDS,
} from '../data/liveRoundsData';

// ── Scoring ───────────────────────────────────────────────────────────────────

function calcLivePoints(pred: LiveMatchPrediction, match: Match): number {
  if (match.homeScore === undefined || match.awayScore === undefined) return 0;
  if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) return 5;
  const po = pred.homeScore > pred.awayScore ? 'h' : pred.homeScore < pred.awayScore ? 'a' : 'd';
  const mo = match.homeScore > match.awayScore ? 'h' : match.homeScore < match.awayScore ? 'a' : 'd';
  return po === mo ? 2 : -1;
}

function scoreRound(entries: UserLiveEntry[], allMatches: Match[], roundId: string): UserLiveEntry[] {
  return entries
    .filter(e => e.roundId === roundId)
    .map(entry => {
      let pts = 0;
      Object.entries(entry.predictions).forEach(([mid, pred]) => {
        const m = allMatches.find(x => x.id === mid && x.status === 'completed');
        if (m) pts += calcLivePoints(pred, m);
      });
      return { ...entry, totalPoints: pts };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

// ── Small components ──────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: LiveRound['status'] }) => {
  const cfg = {
    upcoming: { label: 'Em Breve', cls: 'bg-white/10 text-gray-400', Icon: Clock },
    open:     { label: '● Aberta', cls: 'bg-fifa-green/20 text-fifa-green animate-pulse', Icon: Radio },
    closed:   { label: 'Encerrada', cls: 'bg-red-500/20 text-red-400', Icon: Lock },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  user: AppUser;
  officialMatches: Match[];
  officialRoundOf32: Match[];
  officialRoundOf16: Match[];
  officialQF: Match[];
  officialSF: Match[];
  officialFinal: Match[];
  officialTP: Match | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BolaoAoVivo({
  user, officialMatches,
  officialRoundOf32, officialRoundOf16,
  officialQF, officialSF, officialFinal, officialTP,
}: Props) {
  const isAdmin = user.role === 'admin';

  // All matches the system knows about (group + all knockout stages)
  const allMatches = useMemo(() => [
    ...officialMatches,
    ...officialRoundOf32,
    ...officialRoundOf16,
    ...officialQF,
    ...officialSF,
    ...officialFinal,
    ...(officialTP ? [officialTP] : []),
  ], [officialMatches, officialRoundOf32, officialRoundOf16, officialQF, officialSF, officialFinal, officialTP]);

  // ── State ───────────────────────────────────────────────────────────────────
  const [rounds, setRounds] = useState<LiveRound[]>([]);
  const [entries, setEntries] = useState<UserLiveEntry[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'predict' | 'ranking'>('predict');

  // Prediction state
  const [predictions, setPredictions] = useState<Record<string, LiveMatchPrediction>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin: result entry for a closed round
  const [adminResults, setAdminResults] = useState<Record<string, { home: number; away: number }>>({});
  const [savingResults, setSavingResults] = useState(false);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [r, e] = await Promise.all([
        supabaseService.getLiveRounds(),
        supabaseService.getLiveEntries(),
      ]);
      setRounds(r);
      setEntries(e);
      if (r.length > 0) setSelectedRoundId(r[0].id);
      setLoading(false);
    };
    load();
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedRound = useMemo(() => rounds.find(r => r.id === selectedRoundId), [rounds, selectedRoundId]);
  const roundMatches   = useMemo(
    () => allMatches.filter(m => selectedRound?.matchIds.includes(m.id)),
    [allMatches, selectedRound],
  );
  const myEntry  = useMemo(
    () => entries.find(e => e.userId === user.id && e.roundId === selectedRoundId),
    [entries, user.id, selectedRoundId],
  );
  const isLocked = !selectedRound || selectedRound.status !== 'open';

  const ranking = useMemo(
    () => scoreRound(entries, allMatches, selectedRoundId || ''),
    [entries, allMatches, selectedRoundId],
  );

  const myRankedEntry = useMemo(() => ranking.find(e => e.userId === user.id), [ranking, user.id]);

  // ── Init predictions when round changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedRoundId) return;
    if (myEntry) {
      setPredictions(myEntry.predictions);
    } else {
      const init: Record<string, LiveMatchPrediction> = {};
      roundMatches.forEach(m => { init[m.id] = { homeScore: 0, awayScore: 0 }; });
      setPredictions(init);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoundId, myEntry?.id]);

  // ── Prediction handlers ─────────────────────────────────────────────────────
  const tap = (matchId: string, side: 'home' | 'away') => {
    if (isLocked) return;
    setPredictions(prev => {
      const cur = prev[matchId] || { homeScore: 0, awayScore: 0 };
      const k = side === 'home' ? 'homeScore' : 'awayScore';
      return { ...prev, [matchId]: { ...cur, [k]: (cur[k] || 0) + 1 } };
    });
  };
  const reset = (matchId: string) => {
    if (isLocked) return;
    setPredictions(prev => ({ ...prev, [matchId]: { homeScore: 0, awayScore: 0 } }));
  };
  const change = (matchId: string, side: 'home' | 'away', val: string) => {
    if (isLocked) return;
    const n = Math.max(0, parseInt(val) || 0);
    setPredictions(prev => {
      const cur = prev[matchId] || { homeScore: 0, awayScore: 0 };
      return { ...prev, [matchId]: { ...cur, [side === 'home' ? 'homeScore' : 'awayScore']: n } };
    });
  };

  const handleSave = async () => {
    if (!selectedRound || isLocked) return;
    setSaving(true);
    const entry: UserLiveEntry = {
      id: myEntry?.id || `${user.id}_${selectedRoundId}`,
      userId: user.id,
      userName: user.name,
      roundId: selectedRoundId!,
      predictions: { ...predictions },
      totalPoints: 0,
      savedAt: new Date().toISOString(),
    };
    try {
      await supabaseService.saveLiveEntry(entry);
      setEntries(prev => {
        const idx = prev.findIndex(e => e.id === entry.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
        return [...prev, entry];
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  // ── Admin: initialize predefined group rounds ───────────────────────────────
  const handleInitRounds = async () => {
    const existing = new Set(rounds.map(r => r.id));
    const toCreate = PREDEFINED_GROUP_ROUNDS.filter(r => !existing.has(r.id));
    if (toCreate.length === 0) return;
    const created: LiveRound[] = toCreate.map(def => ({
      id: def.id,
      name: def.name,
      status: 'upcoming' as const,
      matchIds: def.matchIds,
    }));
    await Promise.all(created.map(r => supabaseService.saveLiveRound(r)));
    const merged = [...rounds, ...created].sort((a, b) => a.name.localeCompare(b.name));
    setRounds(merged);
    if (!selectedRoundId) setSelectedRoundId(created[0].id);
  };

  // ── Admin: create knockout round ────────────────────────────────────────────
  const handleCreateKnockoutRound = async (
    stageId: string,
    stageName: string,
    matches: Match[],
  ) => {
    if (matches.length === 0) return;
    const round: LiveRound = {
      id: stageId,
      name: stageName,
      status: 'upcoming',
      matchIds: matches.map(m => m.id),
    };
    await supabaseService.saveLiveRound(round);
    setRounds(prev => [...prev.filter(r => r.id !== stageId), round]);
    setSelectedRoundId(stageId);
  };

  // ── Admin: cycle round status ───────────────────────────────────────────────
  const handleCycleStatus = (round: LiveRound) => {
    const next: LiveRound['status'] =
      round.status === 'upcoming' ? 'open'
      : round.status === 'open' ? 'closed'
      : 'upcoming';
    const updated = { ...round, status: next };
    setRounds(prev => prev.map(r => (r.id === round.id ? updated : r)));
    supabaseService.saveLiveRound(updated);
  };

  const handleDeleteRound = async (roundId: string) => {
    await supabaseService.deleteLiveRound(roundId);
    const remaining = rounds.filter(r => r.id !== roundId);
    setRounds(remaining);
    if (selectedRoundId === roundId) setSelectedRoundId(remaining[0]?.id || null);
  };

  // ── Admin: save official results for Ao Vivo round ─────────────────────────
  const handleSaveResults = async () => {
    if (!selectedRound) return;
    setSavingResults(true);
    // Apply edits to official matches
    const updatedOfficial = officialMatches.map(m => {
      const r = adminResults[m.id];
      if (!r || !selectedRound.matchIds.includes(m.id)) return m;
      return { ...m, homeScore: r.home, awayScore: r.away, status: 'completed' as const };
    });
    await supabaseService.saveOfficialMatches(updatedOfficial);

    // Recalculate all entries for this round and persist
    const roundEntries = entries.filter(e => e.roundId === selectedRoundId);
    const patchedMatches = [
      ...updatedOfficial,
      ...officialRoundOf32, ...officialRoundOf16,
      ...officialQF, ...officialSF, ...officialFinal,
      ...(officialTP ? [officialTP] : []),
    ];
    await Promise.all(
      roundEntries.map(entry => {
        let pts = 0;
        Object.entries(entry.predictions).forEach(([mid, pred]) => {
          const m = patchedMatches.find(x => x.id === mid && x.status === 'completed');
          if (m) pts += calcLivePoints(pred, m);
        });
        return supabaseService.saveLiveEntry({ ...entry, totalPoints: pts });
      }),
    );
    const fresh = await supabaseService.getLiveEntries();
    setEntries(fresh);
    setAdminResults({});
    setSavingResults(false);
  };

  // ── What knockout rounds already exist ─────────────────────────────────────
  const existingIds = useMemo(() => new Set(rounds.map(r => r.id)), [rounds]);
  const groupStageComplete = officialMatches.filter(m => m.stage === 'group').every(m => m.status === 'completed');

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-8 h-8 border-2 border-fifa-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-[3rem] p-6 md:p-10 bg-gradient-to-br from-fifa-purple via-fifa-blue to-fifa-green">
        <div className="relative z-10">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">PALPITES RODADA A RODADA</p>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            BOLÃO<br /><span className="text-fifa-green">AO VIVO</span>
          </h2>
          <p className="text-white/50 text-xs mt-3 max-w-sm">
            Faça palpites para cada rodada da Copa. Pontos: <b className="text-white">+5</b> placar exato · <b className="text-white">+2</b> vencedor/empate · <b className="text-white">-1</b> erro total.
          </p>
        </div>
      </div>

      {/* ── Scoring legend ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-fifa-green/10 border border-fifa-green/20 rounded-2xl text-center">
          <p className="text-[10px] font-black text-fifa-green uppercase tracking-wider mb-1">Placar Exato</p>
          <p className="text-2xl font-black italic">+5</p>
        </div>
        <div className="p-3 bg-fifa-blue/10 border border-fifa-blue/20 rounded-2xl text-center">
          <p className="text-[10px] font-black text-fifa-blue uppercase tracking-wider mb-1">Vencedor / Empate</p>
          <p className="text-2xl font-black italic">+2</p>
        </div>
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">Errou Tudo</p>
          <p className="text-2xl font-black italic">-1</p>
        </div>
      </div>

      {/* ── Round tabs ── */}
      {rounds.length === 0 ? (
        <div className="py-16 text-center border border-white/5 rounded-2xl bg-white/2">
          <AlertCircle size={40} className="mx-auto mb-4 text-gray-600" />
          <p className="font-black uppercase italic text-gray-500 text-sm">Nenhuma rodada criada ainda</p>
          {isAdmin && (
            <button onClick={handleInitRounds} className="mt-6 flex items-center gap-2 mx-auto px-6 py-3 bg-fifa-green text-black font-black text-xs uppercase rounded-xl tracking-widest">
              <Zap size={14} /> Inicializar Rodadas 1, 2 e 3
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {rounds.map(r => (
              <button
                key={r.id}
                onClick={() => { setSelectedRoundId(r.id); setView('predict'); }}
                className={`flex-shrink-0 flex flex-col items-start px-4 py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${
                  selectedRoundId === r.id
                    ? 'bg-fifa-green text-black border-fifa-green shadow-[0_0_15px_rgba(0,223,89,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span>{r.name}</span>
                <span className={`mt-0.5 text-[8px] font-bold ${
                  selectedRoundId === r.id ? 'text-black/60' :
                  r.status === 'open' ? 'text-fifa-green' :
                  r.status === 'closed' ? 'text-red-400' : 'text-gray-600'
                }`}>
                  {r.status === 'open' ? '● AO VIVO' : r.status === 'closed' ? 'ENCERRADA' : 'EM BREVE'}
                </span>
              </button>
            ))}
          </div>

          {/* ── Selected round ── */}
          {selectedRound && (
            <div className="space-y-6">

              {/* Round header + view toggle */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">{selectedRound.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <StatusBadge status={selectedRound.status} />
                    <span className="text-[10px] text-gray-600 font-bold">{roundMatches.length} partidas</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setView('predict')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${view === 'predict' ? 'bg-fifa-blue text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    <Radio size={12} /> Palpites
                  </button>
                  <button onClick={() => setView('ranking')} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${view === 'ranking' ? 'bg-fifa-yellow text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    <ListOrdered size={12} /> Ranking
                  </button>
                </div>
              </div>

              {/* My score chip */}
              {myRankedEntry && (
                <div className="flex items-center gap-4 p-4 bg-fifa-green/10 border border-fifa-green/20 rounded-2xl">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Avatar" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm uppercase italic tracking-tighter">{user.name}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Posição #{ranking.findIndex(e => e.userId === user.id) + 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black italic text-fifa-green tabular-nums">{myRankedEntry.totalPoints}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">pontos</p>
                  </div>
                </div>
              )}

              {/* ── PREDICT VIEW ── */}
              {view === 'predict' && (
                <div className="space-y-6">
                  {/* Lock notices */}
                  {isLocked && selectedRound.status === 'closed' && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <Lock size={16} className="text-red-400 shrink-0" />
                      <p className="text-red-400 text-xs font-bold">Rodada encerrada. Os palpites não podem mais ser alterados.</p>
                    </div>
                  )}
                  {isLocked && selectedRound.status === 'upcoming' && (
                    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                      <Clock size={16} className="text-gray-400 shrink-0" />
                      <p className="text-gray-400 text-xs font-bold">Esta rodada ainda não foi aberta para palpites.</p>
                    </div>
                  )}

                  {/* Match cards */}
                  {roundMatches.length === 0 ? (
                    <p className="text-center text-gray-600 py-12 font-bold uppercase text-xs">Nenhuma partida nesta rodada.</p>
                  ) : (
                    <div className="space-y-2">
                      {roundMatches.map(match => {
                        const ht = TEAMS.find(t => t.id === match.homeTeamId);
                        const at = TEAMS.find(t => t.id === match.awayTeamId);
                        if (!ht || !at) return null;
                        const pred = predictions[match.id] || { homeScore: 0, awayScore: 0 };
                        const done = match.status === 'completed';
                        const pts = done ? calcLivePoints(pred, match) : null;

                        return (
                          <div
                            key={match.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              done
                                ? pts === 5  ? 'bg-fifa-green/10 border-fifa-green/30'
                                : pts === 2  ? 'bg-fifa-blue/10 border-fifa-blue/30'
                                : pts === -1 ? 'bg-red-500/10 border-red-500/20'
                                :              'bg-white/5 border-white/10'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Home team */}
                              <div className="flex-1 flex items-center gap-2 overflow-hidden justify-end">
                                <span className="font-black text-[11px] uppercase truncate tracking-tighter text-right hidden sm:block">{ht.name}</span>
                                <span className="font-black text-[10px] uppercase tracking-tighter text-right sm:hidden">{ht.code}</span>
                                <img src={ht.crest} alt={ht.name} className="w-7 h-7 object-contain shrink-0" referrerPolicy="no-referrer" />
                              </div>

                              {/* Score prediction */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Mobile tap buttons */}
                                <div className="flex items-center gap-1 md:hidden">
                                  <button
                                    onClick={() => tap(match.id, 'home')}
                                    disabled={isLocked}
                                    className={`w-11 h-11 rounded-xl font-black text-lg border transition-all active:scale-90 select-none ${
                                      isLocked ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white/10 border-white/20 text-white active:bg-fifa-blue/20'
                                    }`}
                                  >{pred.homeScore}</button>
                                  <button onClick={() => reset(match.id)} disabled={isLocked} className="px-1 text-gray-600 font-black text-[10px] active:text-red-400 select-none">✕</button>
                                  <button
                                    onClick={() => tap(match.id, 'away')}
                                    disabled={isLocked}
                                    className={`w-11 h-11 rounded-xl font-black text-lg border transition-all active:scale-90 select-none ${
                                      isLocked ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white/10 border-white/20 text-white active:bg-fifa-blue/20'
                                    }`}
                                  >{pred.awayScore}</button>
                                </div>
                                {/* Desktop inputs */}
                                <div className="hidden md:flex items-center gap-1.5">
                                  <input type="number" min="0" value={pred.homeScore} onChange={e => change(match.id, 'home', e.target.value)} disabled={isLocked}
                                    className={`w-11 h-11 rounded-xl border text-center font-black text-lg focus:outline-none transition-all ${isLocked ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white/10 border-white/20 text-white focus:border-fifa-green'}`} />
                                  <span className="text-gray-600 font-black text-xs">×</span>
                                  <input type="number" min="0" value={pred.awayScore} onChange={e => change(match.id, 'away', e.target.value)} disabled={isLocked}
                                    className={`w-11 h-11 rounded-xl border text-center font-black text-lg focus:outline-none transition-all ${isLocked ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white/10 border-white/20 text-white focus:border-fifa-green'}`} />
                                </div>
                              </div>

                              {/* Away team */}
                              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                <img src={at.crest} alt={at.name} className="w-7 h-7 object-contain shrink-0" referrerPolicy="no-referrer" />
                                <span className="font-black text-[11px] uppercase truncate tracking-tighter hidden sm:block">{at.name}</span>
                                <span className="font-black text-[10px] uppercase tracking-tighter sm:hidden">{at.code}</span>
                              </div>
                            </div>

                            {/* Official result + points badge */}
                            {done && (
                              <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-500 font-bold uppercase">Resultado:</span>
                                  <span className="font-black text-white tabular-nums">{match.homeScore} × {match.awayScore}</span>
                                </div>
                                <span className={`font-black text-sm tabular-nums ${pts === 5 ? 'text-fifa-green' : pts === 2 ? 'text-fifa-blue' : 'text-red-400'}`}>
                                  {pts === 5 ? '+5 pts ✓' : pts === 2 ? '+2 pts' : '-1 pt'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Save button */}
                  {!isLocked && (
                    <div className="flex justify-center pt-4">
                      <AnimatePresence mode="wait">
                        {saveSuccess ? (
                          <motion.div key="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-fifa-green font-black text-sm">
                            <CheckCircle2 size={20} /> Palpites Salvos!
                          </motion.div>
                        ) : (
                          <motion.button key="save" onClick={handleSave} disabled={saving}
                            className="flex items-center gap-3 px-10 py-4 bg-fifa-green hover:bg-fifa-green/90 text-black font-black rounded-2xl uppercase tracking-tighter italic text-sm shadow-[0_0_25px_rgba(0,223,89,0.3)] transition-all active:scale-95 disabled:opacity-60">
                            <Save size={20} />
                            {saving ? 'Salvando...' : myEntry ? 'Atualizar Palpites' : 'Salvar Palpites'}
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Admin: enter results for this round (when closed) */}
                  {isAdmin && selectedRound.status === 'closed' && roundMatches.some(m => m.status !== 'completed') && (
                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <p className="text-[10px] font-bold text-fifa-blue uppercase tracking-widest">
                        Inserir Resultados Oficiais — {selectedRound.name}
                      </p>
                      <div className="space-y-2">
                        {roundMatches.filter(m => m.status !== 'completed').map(m => {
                          const ht = TEAMS.find(t => t.id === m.homeTeamId);
                          const at = TEAMS.find(t => t.id === m.awayTeamId);
                          if (!ht || !at) return null;
                          const res = adminResults[m.id] || { home: m.homeScore ?? 0, away: m.awayScore ?? 0 };
                          return (
                            <div key={m.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                              <div className="flex-1 flex items-center gap-2 overflow-hidden justify-end">
                                <span className="font-black text-[11px] uppercase truncate">{ht.name}</span>
                                <img src={ht.crest} alt={ht.name} className="w-5 h-5 object-contain shrink-0" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <input type="number" min="0" value={res.home} onChange={e => setAdminResults(prev => ({ ...prev, [m.id]: { ...res, home: parseInt(e.target.value) || 0 } }))}
                                  className="w-12 h-12 bg-fifa-blue/10 border border-fifa-blue/30 rounded-xl text-center font-black text-xl focus:outline-none focus:border-fifa-blue transition-all" />
                                <span className="text-gray-600 font-black">×</span>
                                <input type="number" min="0" value={res.away} onChange={e => setAdminResults(prev => ({ ...prev, [m.id]: { ...res, away: parseInt(e.target.value) || 0 } }))}
                                  className="w-12 h-12 bg-fifa-blue/10 border border-fifa-blue/30 rounded-xl text-center font-black text-xl focus:outline-none focus:border-fifa-blue transition-all" />
                              </div>
                              <div className="flex-1 flex items-center gap-2 overflow-hidden">
                                <img src={at.crest} alt={at.name} className="w-5 h-5 object-contain shrink-0" referrerPolicy="no-referrer" />
                                <span className="font-black text-[11px] uppercase truncate">{at.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={handleSaveResults} disabled={savingResults}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-fifa-blue hover:bg-fifa-blue/90 text-white font-black rounded-xl uppercase tracking-widest text-[11px] transition-all disabled:opacity-60">
                        <Save size={16} /> {savingResults ? 'Salvando...' : 'Salvar Resultados e Calcular Pontuação'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── RANKING VIEW ── */}
              {view === 'ranking' && (
                <div className="space-y-3">
                  {ranking.length === 0 ? (
                    <div className="py-16 text-center opacity-30">
                      <Trophy size={48} className="mx-auto mb-4" />
                      <p className="font-black uppercase italic text-sm">Nenhum palpite registrado ainda.</p>
                    </div>
                  ) : (
                    ranking.map((entry, idx) => {
                      const isMe = entry.userId === user.id;
                      return (
                        <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isMe ? 'bg-fifa-green/10 border-fifa-green/30' : 'bg-white/5 border-white/5'}`}>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                            idx === 0 ? 'bg-fifa-yellow text-black' :
                            idx === 1 ? 'bg-gray-300 text-black' :
                            idx === 2 ? 'bg-amber-700 text-white' :
                            'bg-white/10 text-gray-400'
                          }`}>{idx + 1}</div>
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userName}`} alt="Avatar" referrerPolicy="no-referrer" />
                          </div>
                          <span className="flex-1 font-black uppercase italic text-sm tracking-tighter truncate">{entry.userName}</span>
                          <div className="text-right shrink-0">
                            <span className="font-black text-xl italic tabular-nums text-white">{entry.totalPoints}</span>
                            <span className="text-gray-500 text-[10px] font-bold ml-1">pts</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── ADMIN PANEL ── */}
      {isAdmin && (
        <div className="space-y-6 pt-8 border-t border-white/10">
          <h3 className="text-sm font-black uppercase italic tracking-widest text-gray-500">
            Painel Admin — Bolão Ao Vivo
          </h3>

          {/* Init group rounds */}
          {PREDEFINED_GROUP_ROUNDS.some(r => !existingIds.has(r.id)) && (
            <button onClick={handleInitRounds}
              className="w-full flex items-center justify-center gap-2 py-4 bg-fifa-green/10 hover:bg-fifa-green/20 border border-fifa-green/30 text-fifa-green font-black rounded-xl text-xs uppercase tracking-widest transition-all">
              <Zap size={14} /> Inicializar Rodadas 1, 2 e 3 da Fase de Grupos
            </button>
          )}

          {/* Manage existing rounds */}
          {rounds.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gerenciar Rodadas</p>
              {rounds.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase italic truncate">{r.name}</p>
                    <p className="text-[10px] text-gray-500">{r.matchIds.length} partidas</p>
                  </div>
                  <StatusBadge status={r.status} />
                  <button onClick={() => handleCycleStatus(r)}
                    className="px-3 py-2 bg-fifa-blue/10 border border-fifa-blue/20 text-fifa-blue text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-fifa-blue/20 transition-all flex items-center gap-1 shrink-0">
                    <ChevronRight size={12} />
                    {r.status === 'upcoming' ? 'Abrir' : r.status === 'open' ? 'Encerrar' : 'Reabrir'}
                  </button>
                  <button onClick={() => handleDeleteRound(r.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Knockout round creation — only after group stage is complete */}
          {groupStageComplete && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Criar Rodadas da Fase Mata-Mata
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: KNOCKOUT_ROUND_IDS.r32, name: '16-avos de Final', matches: officialRoundOf32 },
                  { id: KNOCKOUT_ROUND_IDS.r16, name: 'Oitavas de Final',  matches: officialRoundOf16 },
                  { id: KNOCKOUT_ROUND_IDS.qf,  name: 'Quartas de Final',  matches: officialQF        },
                  { id: KNOCKOUT_ROUND_IDS.sf,  name: 'Semifinais',        matches: officialSF        },
                  {
                    id: KNOCKOUT_ROUND_IDS.final,
                    name: '3° Lugar & Final',
                    matches: [...officialFinal, ...(officialTP ? [officialTP] : [])],
                  },
                ].map(stage => {
                  const exists = existingIds.has(stage.id);
                  const available = stage.matches.length > 0;
                  return (
                    <button
                      key={stage.id}
                      disabled={!available || exists}
                      onClick={() => handleCreateKnockoutRound(stage.id, stage.name, stage.matches)}
                      className={`flex items-center justify-between gap-3 p-4 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${
                        exists        ? 'bg-fifa-green/10 border-fifa-green/30 text-fifa-green cursor-default' :
                        !available    ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed opacity-50' :
                                        'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{stage.name}</span>
                      {exists ? <CheckCircle2 size={14} /> : available ? <Plus size={14} /> : <Clock size={14} />}
                    </button>
                  );
                })}
              </div>
              {!officialRoundOf32.length && (
                <p className="text-[10px] text-gray-600 font-bold">
                  ⚠ Os resultados da fase de grupos precisam ser salvos no painel Admin para gerar os confrontos do mata-mata.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
