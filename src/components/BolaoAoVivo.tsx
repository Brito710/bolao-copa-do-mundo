import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Save, CheckCircle2, Lock, Plus, Trash2, ChevronRight, Radio, Clock, AlertCircle } from 'lucide-react';
import type { Match, AppUser, LiveRound, UserLiveEntry, LiveMatchPrediction } from '../types';
import { TEAMS } from '../data/teams';
import { supabaseService } from '../lib/supabaseService';

// ── Scoring ──────────────────────────────────────────────────────────────────

function calcLivePoints(pred: LiveMatchPrediction, match: Match): number {
  if (match.homeScore === undefined || match.awayScore === undefined) return 0;
  if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) return 5;
  const po = pred.homeScore > pred.awayScore ? 'h' : pred.homeScore < pred.awayScore ? 'a' : 'd';
  const mo = match.homeScore > match.awayScore ? 'h' : match.homeScore < match.awayScore ? 'a' : 'd';
  if (po === mo) return 2;
  return -1;
}

function applyResults(
  entries: UserLiveEntry[],
  matches: Match[],
  roundId: string,
): UserLiveEntry[] {
  return entries
    .filter(e => e.roundId === roundId)
    .map(entry => {
      let pts = 0;
      Object.entries(entry.predictions).forEach(([mid, pred]) => {
        const m = matches.find(x => x.id === mid && x.status === 'completed');
        if (m) pts += calcLivePoints(pred, m);
      });
      return { ...entry, totalPoints: pts };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: LiveRound['status'] }) => {
  const cfg = {
    upcoming: { label: 'Em Breve', cls: 'bg-white/10 text-gray-400', Icon: Clock },
    open: { label: 'Aberta', cls: 'bg-fifa-green/20 text-fifa-green', Icon: Radio },
    closed: { label: 'Encerrada', cls: 'bg-red-500/20 text-red-400', Icon: Lock },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
      <cfg.Icon size={10} /> {cfg.label}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  user: AppUser;
  officialMatches: Match[];
}

export function BolaoAoVivo({ user, officialMatches }: Props) {
  const isAdmin = user.role === 'admin';

  // Data
  const [rounds, setRounds] = useState<LiveRound[]>([]);
  const [entries, setEntries] = useState<UserLiveEntry[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Prediction state (current round)
  const [predictions, setPredictions] = useState<Record<string, LiveMatchPrediction>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin: create round
  const [newRoundName, setNewRoundName] = useState('');
  const [pickedMatchIds, setPickedMatchIds] = useState<Set<string>>(new Set());
  const [adminResults, setAdminResults] = useState<Record<string, { home: number; away: number }>>({});

  // ── Load ──────────────────────────────────────────────────────────────────

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

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedRound = useMemo(() => rounds.find(r => r.id === selectedRoundId), [rounds, selectedRoundId]);
  const roundMatches = useMemo(
    () => officialMatches.filter(m => selectedRound?.matchIds.includes(m.id)),
    [officialMatches, selectedRound],
  );
  const myEntry = useMemo(
    () => entries.find(e => e.userId === user.id && e.roundId === selectedRoundId),
    [entries, user.id, selectedRoundId],
  );
  const isLocked = !selectedRound || selectedRound.status !== 'open';

  const ranking = useMemo(
    () => applyResults(entries, officialMatches, selectedRoundId || ''),
    [entries, officialMatches, selectedRoundId],
  );

  // ── Init predictions when round changes ───────────────────────────────────

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

  // ── Prediction handlers ───────────────────────────────────────────────────

  const handleTap = (matchId: string, side: 'home' | 'away') => {
    if (isLocked) return;
    setPredictions(prev => {
      const cur = prev[matchId] || { homeScore: 0, awayScore: 0 };
      return { ...prev, [matchId]: { ...cur, [side === 'home' ? 'homeScore' : 'awayScore']: (cur[side === 'home' ? 'homeScore' : 'awayScore'] || 0) + 1 } };
    });
  };

  const handleReset = (matchId: string) => {
    if (isLocked) return;
    setPredictions(prev => ({ ...prev, [matchId]: { homeScore: 0, awayScore: 0 } }));
  };

  const handleChange = (matchId: string, side: 'home' | 'away', val: string) => {
    if (isLocked) return;
    const n = parseInt(val) || 0;
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

  // ── Admin: rounds ─────────────────────────────────────────────────────────

  const handleCreateRound = async () => {
    if (!newRoundName.trim() || pickedMatchIds.size === 0) return;
    const round: LiveRound = {
      id: crypto.randomUUID(),
      name: newRoundName.trim(),
      status: 'upcoming',
      matchIds: Array.from(pickedMatchIds),
    };
    await supabaseService.saveLiveRound(round);
    setRounds(prev => [...prev, round]);
    setNewRoundName('');
    setPickedMatchIds(new Set());
    setSelectedRoundId(round.id);
  };

  const handleCycleStatus = async (round: LiveRound) => {
    const next: LiveRound['status'] =
      round.status === 'upcoming' ? 'open' : round.status === 'open' ? 'closed' : 'upcoming';
    const updated = { ...round, status: next };
    await supabaseService.saveLiveRound(updated);
    setRounds(prev => prev.map(r => (r.id === round.id ? updated : r)));
  };

  const handleDeleteRound = async (roundId: string) => {
    await supabaseService.deleteLiveRound(roundId);
    setRounds(prev => prev.filter(r => r.id !== roundId));
    if (selectedRoundId === roundId) {
      const remaining = rounds.filter(r => r.id !== roundId);
      setSelectedRoundId(remaining[0]?.id || null);
    }
  };

  // ── Admin: save results ───────────────────────────────────────────────────

  const handleSaveResults = async () => {
    if (!selectedRound) return;
    const updated = officialMatches.map(m => {
      const r = adminResults[m.id];
      if (!r || !selectedRound.matchIds.includes(m.id)) return m;
      return { ...m, homeScore: r.home, awayScore: r.away, status: 'completed' as const };
    });
    await supabaseService.saveOfficialMatches(updated);
    // Recalculate and persist points for all entries of this round
    const roundEntries = entries.filter(e => e.roundId === selectedRoundId);
    await Promise.all(
      roundEntries.map(entry => {
        let pts = 0;
        Object.entries(entry.predictions).forEach(([mid, pred]) => {
          const m = updated.find(x => x.id === mid && x.status === 'completed');
          if (m) pts += calcLivePoints(pred, m);
        });
        const updated2 = { ...entry, totalPoints: pts };
        return supabaseService.saveLiveEntry(updated2);
      }),
    );
    // Reload entries to show updated points
    const fresh = await supabaseService.getLiveEntries();
    setEntries(fresh);
    setAdminResults({});
    alert('Resultados salvos e pontuação atualizada!');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <div className="w-8 h-8 border-2 border-fifa-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-[3rem] p-6 md:p-10 bg-gradient-to-br from-fifa-purple via-fifa-blue to-fifa-green">
        <div className="relative z-10">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">PALPITES RODADA A RODADA</p>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            BOLÃO<br/><span className="text-fifa-green">AO VIVO</span>
          </h2>
          <p className="text-white/50 text-xs mt-3 max-w-sm">Faça palpites em rodadas específicas durante a Copa. Pontuação mais leve, emoção em dobro.</p>
        </div>
      </div>

      {/* Scoring legend */}
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

      {/* Round tabs */}
      {rounds.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {rounds.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoundId(r.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${
                selectedRoundId === r.id
                  ? 'bg-fifa-green text-black border-fifa-green shadow-[0_0_15px_rgba(0,223,89,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              {r.name}
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                r.status === 'open' ? 'bg-fifa-green/30 text-fifa-green' :
                r.status === 'closed' ? 'bg-red-500/30 text-red-400' :
                'bg-white/10 text-gray-500'
              }`}>
                {r.status === 'open' ? '● AO VIVO' : r.status === 'closed' ? 'ENCERRADA' : 'EM BREVE'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-white/5 rounded-2xl bg-white/2">
          <AlertCircle size={40} className="mx-auto mb-4 text-gray-600" />
          <p className="font-black uppercase italic text-gray-500 text-sm">Nenhuma rodada criada ainda</p>
          {isAdmin && <p className="text-gray-600 text-xs mt-2">Use o painel abaixo para criar a primeira rodada.</p>}
        </div>
      )}

      {/* Selected round content */}
      {selectedRound && (
        <div className="space-y-6">
          {/* Round header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter">{selectedRound.name}</h3>
              <div className="mt-1"><StatusBadge status={selectedRound.status} /></div>
            </div>
            {myEntry && (
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Minha pontuação</p>
                <p className="text-2xl font-black italic text-fifa-green">{applyResults([myEntry], officialMatches, selectedRound.id)[0]?.totalPoints ?? 0} pts</p>
              </div>
            )}
          </div>

          {/* Locked notice */}
          {isLocked && selectedRound.status !== 'upcoming' && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Lock size={16} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-xs font-bold">Esta rodada está encerrada. Os palpites não podem mais ser alterados.</p>
            </div>
          )}
          {isLocked && selectedRound.status === 'upcoming' && (
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
              <Clock size={16} className="text-gray-400 shrink-0" />
              <p className="text-gray-400 text-xs font-bold">Esta rodada ainda não foi aberta. Aguarde o administrador.</p>
            </div>
          )}

          {/* Match cards */}
          {roundMatches.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Nenhuma partida nesta rodada.</p>
          ) : (
            <div className="space-y-3">
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
                        ? pts === 5 ? 'bg-fifa-green/10 border-fifa-green/30' :
                          pts === 2 ? 'bg-fifa-blue/10 border-fifa-blue/30' :
                          pts === -1 ? 'bg-red-500/10 border-red-500/20' :
                          'bg-white/5 border-white/10'
                        : 'bg-white/5 border-white/10 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Home */}
                      <div className="flex-1 flex items-center gap-2 overflow-hidden justify-end">
                        <span className="font-black text-[11px] uppercase truncate tracking-tighter text-right">{ht.name}</span>
                        <img src={ht.crest} alt={ht.name} className="w-6 h-6 object-contain shrink-0" referrerPolicy="no-referrer" />
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mobile tap */}
                        <div className="flex items-center gap-1 md:hidden">
                          <button
                            onClick={() => handleTap(match.id, 'home')}
                            disabled={isLocked}
                            className={`w-10 h-10 rounded-xl font-black text-base border transition-all active:scale-95 select-none ${
                              isLocked
                                ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                                : 'bg-white/10 border-white/20 text-white active:bg-fifa-blue/20'
                            }`}
                          >{pred.homeScore}</button>
                          <button
                            onClick={() => handleReset(match.id)}
                            disabled={isLocked}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 font-black text-[10px] active:text-red-400 transition-colors"
                          >✕</button>
                          <button
                            onClick={() => handleTap(match.id, 'away')}
                            disabled={isLocked}
                            className={`w-10 h-10 rounded-xl font-black text-base border transition-all active:scale-95 select-none ${
                              isLocked
                                ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
                                : 'bg-white/10 border-white/20 text-white active:bg-fifa-blue/20'
                            }`}
                          >{pred.awayScore}</button>
                        </div>
                        {/* Desktop inputs */}
                        <div className="hidden md:flex items-center gap-1.5">
                          <input
                            type="number" min="0"
                            value={pred.homeScore}
                            onChange={e => handleChange(match.id, 'home', e.target.value)}
                            disabled={isLocked}
                            className={`w-10 h-10 rounded-xl border text-center font-black text-base focus:outline-none transition-all ${
                              isLocked ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'bg-white/10 border-white/20 text-white focus:border-fifa-green'
                            }`}
                          />
                          <span className="text-gray-600 font-black text-xs">X</span>
                          <input
                            type="number" min="0"
                            value={pred.awayScore}
                            onChange={e => handleChange(match.id, 'away', e.target.value)}
                            disabled={isLocked}
                            className={`w-10 h-10 rounded-xl border text-center font-black text-base focus:outline-none transition-all ${
                              isLocked ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'bg-white/10 border-white/20 text-white focus:border-fifa-green'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Away */}
                      <div className="flex-1 flex items-center gap-2 overflow-hidden">
                        <img src={at.crest} alt={at.name} className="w-6 h-6 object-contain shrink-0" referrerPolicy="no-referrer" />
                        <span className="font-black text-[11px] uppercase truncate tracking-tighter">{at.name}</span>
                      </div>
                    </div>

                    {/* Official result + points */}
                    {done && (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Resultado oficial:</span>
                          <span className="font-black text-white text-sm">{match.homeScore} × {match.awayScore}</span>
                        </div>
                        <span className={`font-black text-sm ${pts === 5 ? 'text-fifa-green' : pts === 2 ? 'text-fifa-blue' : 'text-red-400'}`}>
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
            <div className="flex items-center justify-center pt-4">
              <AnimatePresence mode="wait">
                {saveSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-2 text-fifa-green font-black text-sm"
                  >
                    <CheckCircle2 size={20} /> Palpites Salvos!
                  </motion.div>
                ) : (
                  <motion.button
                    key="save"
                    initial={{ opacity: 1 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-10 py-4 bg-fifa-green hover:bg-fifa-green/90 text-black font-black rounded-2xl uppercase tracking-tighter italic text-sm shadow-[0_0_25px_rgba(0,223,89,0.3)] transition-all active:scale-95 disabled:opacity-60"
                  >
                    <Save size={20} />
                    {saving ? 'Salvando...' : myEntry ? 'Atualizar Palpites' : 'Salvar Palpites'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Ranking for this round */}
          {ranking.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/5">
              <h3 className="text-sm font-black uppercase italic tracking-widest text-gray-400 flex items-center gap-2">
                <Trophy size={16} className="text-fifa-yellow" /> Ranking da Rodada
              </h3>
              <div className="space-y-2">
                {ranking.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      entry.userId === user.id
                        ? 'bg-fifa-green/10 border-fifa-green/30'
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
                      idx === 0 ? 'bg-fifa-yellow text-black' :
                      idx === 1 ? 'bg-gray-300 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-white/10 text-gray-400'
                    }`}>{idx + 1}</div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userName}`} alt="Avatar" referrerPolicy="no-referrer" />
                    </div>
                    <span className="flex-1 font-black uppercase italic text-sm tracking-tighter truncate">{entry.userName}</span>
                    <span className="font-black text-lg italic tabular-nums text-white">{entry.totalPoints} <span className="text-gray-500 text-xs">pts</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADMIN PANEL ──────────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="space-y-8 pt-8 border-t border-white/10">
          <h3 className="text-base font-black uppercase italic tracking-widest text-gray-400">Painel Admin — Bolão Ao Vivo</h3>

          {/* Manage existing rounds */}
          {rounds.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rodadas</p>
              {rounds.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex-1">
                    <p className="font-black text-sm uppercase italic">{r.name}</p>
                    <p className="text-[10px] text-gray-500">{r.matchIds.length} partidas</p>
                  </div>
                  <StatusBadge status={r.status} />
                  <button
                    onClick={() => handleCycleStatus(r)}
                    className="px-3 py-1.5 bg-fifa-blue/10 border border-fifa-blue/20 text-fifa-blue text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-fifa-blue/20 transition-all flex items-center gap-1"
                  >
                    <ChevronRight size={12} />
                    {r.status === 'upcoming' ? 'Abrir' : r.status === 'open' ? 'Encerrar' : 'Reabrir'}
                  </button>
                  <button
                    onClick={() => handleDeleteRound(r.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Create round */}
          <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nova Rodada</p>
            <input
              type="text"
              placeholder="Nome da rodada (ex: Rodada 1 — Grupos)"
              value={newRoundName}
              onChange={e => setNewRoundName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-fifa-green transition-all"
            />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selecionar Partidas</p>
            <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
              {officialMatches.map(m => {
                const ht = TEAMS.find(t => t.id === m.homeTeamId);
                const at = TEAMS.find(t => t.id === m.awayTeamId);
                if (!ht || !at) return null;
                const picked = pickedMatchIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => setPickedMatchIds(prev => {
                      const n = new Set(prev);
                      picked ? n.delete(m.id) : n.add(m.id);
                      return n;
                    })}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                      picked ? 'bg-fifa-green/10 border-fifa-green/30' : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                      <img src={ht.crest} alt={ht.name} className="w-4 h-4 object-contain shrink-0" referrerPolicy="no-referrer" />
                      <span className="font-bold text-[10px] uppercase truncate">{ht.name}</span>
                      <span className="text-gray-600 text-[10px] font-black shrink-0">×</span>
                      <span className="font-bold text-[10px] uppercase truncate">{at.name}</span>
                      <img src={at.crest} alt={at.name} className="w-4 h-4 object-contain shrink-0" referrerPolicy="no-referrer" />
                    </div>
                    <div className={`w-4 h-4 rounded border flex-shrink-0 transition-all ${picked ? 'bg-fifa-green border-fifa-green' : 'border-white/20'}`}>
                      {picked && <svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="black" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold">{pickedMatchIds.size} partidas selecionadas</span>
              <button
                onClick={handleCreateRound}
                disabled={!newRoundName.trim() || pickedMatchIds.size === 0}
                className="flex items-center gap-2 px-6 py-3 bg-fifa-green disabled:bg-white/10 disabled:text-gray-600 text-black font-black rounded-xl text-[11px] uppercase tracking-widest transition-all"
              >
                <Plus size={14} /> Criar Rodada
              </button>
            </div>
          </div>

          {/* Enter results for selected round */}
          {selectedRound && selectedRound.status === 'closed' && roundMatches.length > 0 && (
            <div className="space-y-4 p-6 bg-fifa-blue/5 border border-fifa-blue/20 rounded-2xl">
              <p className="text-[10px] font-bold text-fifa-blue uppercase tracking-widest">Inserir Resultados Oficiais — {selectedRound.name}</p>
              <div className="space-y-3">
                {roundMatches.map(m => {
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
                        <input
                          type="number" min="0"
                          value={res.home}
                          onChange={e => setAdminResults(prev => ({ ...prev, [m.id]: { ...res, home: parseInt(e.target.value) || 0 } }))}
                          className="w-12 h-12 bg-fifa-blue/10 border border-fifa-blue/30 rounded-xl text-center font-black text-lg focus:outline-none focus:border-fifa-blue transition-all"
                        />
                        <span className="text-gray-600 font-black">×</span>
                        <input
                          type="number" min="0"
                          value={res.away}
                          onChange={e => setAdminResults(prev => ({ ...prev, [m.id]: { ...res, away: parseInt(e.target.value) || 0 } }))}
                          className="w-12 h-12 bg-fifa-blue/10 border border-fifa-blue/30 rounded-xl text-center font-black text-lg focus:outline-none focus:border-fifa-blue transition-all"
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-2 overflow-hidden">
                        <img src={at.crest} alt={at.name} className="w-5 h-5 object-contain shrink-0" referrerPolicy="no-referrer" />
                        <span className="font-black text-[11px] uppercase truncate">{at.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleSaveResults}
                className="w-full flex items-center justify-center gap-2 py-4 bg-fifa-blue hover:bg-fifa-blue/90 text-white font-black rounded-xl uppercase tracking-widest text-[11px] transition-all"
              >
                <Save size={16} /> Salvar Resultados e Calcular Pontuação
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
