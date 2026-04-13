import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Calendar, Settings, Play, ChevronRight, ChevronLeft, LayoutGrid,
  Info, Zap, Save, CheckCircle2, ListOrdered, User, LayoutDashboard,
  TrendingUp, ArrowUpRight, Shield, Trash2, Plus, Users, Star, Radio, RefreshCw
} from 'lucide-react';
import { TEAMS } from './data/teams';
import {
  generateGroupMatches, getScoringDetails, calculateStandings,
  getBestThirdPlacedTeams, generateRoundOf32, generateNextStage, generateThirdPlaceMatch
} from './lib/simulation';
import type { Match, Prediction, UserPrediction, AppUser } from './types';
import { supabaseService } from './lib/supabaseService';
import { BolaoAoVivo } from './components/BolaoAoVivo';
import { syncFromAPI } from './lib/footballDataService';

const SidebarItem = ({ icon: Icon, active = false, onClick, label }: { icon: any; active?: boolean; onClick?: () => void; label: string }) => (
  <div onClick={onClick} className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${active ? 'bg-fifa-green/20 text-fifa-green shadow-[0_0_20px_rgba(0,223,89,0.4)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
    <Icon size={20} />
    <div className="absolute left-full ml-4 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">{label}</div>
  </div>
);

const GlassCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`glass-card glass-card-hover overflow-hidden ${className}`}>{children}</div>
);

const Badge = ({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const styles = { default: 'bg-white/10 text-gray-300', success: 'bg-fifa-green/20 text-fifa-green', warning: 'bg-fifa-yellow/20 text-fifa-yellow', danger: 'bg-fifa-red/20 text-fifa-red', info: 'bg-fifa-blue/20 text-fifa-blue' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${styles[variant]}`}>{children}</span>;
};

const BracketMatch = ({ match, matchNumber, color, handlePredictionChange, handleWinnerSelection, userPredictions }: { match: Match | undefined; matchNumber: string; color: string; handlePredictionChange: any; handleWinnerSelection: any; userPredictions: any }) => {
  const pred = match ? (userPredictions[match.id] || { homeScore: 0, awayScore: 0 }) : { homeScore: 0, awayScore: 0 };
  const isDraw = pred.homeScore === pred.awayScore;
  if (!match) return (
    <div className="relative w-48 p-2 rounded-lg border border-white/5 bg-white/5 opacity-50">
      <div className="absolute -top-2 -left-2 bg-black/80 text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10 z-10">M{matchNumber}</div>
      <div className="space-y-1.5"><span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">Aguardando...</span><br /><span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">Aguardando...</span></div>
    </div>
  );
  const homeTeam = TEAMS.find(t => t.id === match.homeTeamId)!;
  const awayTeam = TEAMS.find(t => t.id === match.awayTeamId)!;
  const colorClasses: Record<string, string> = { r32: 'bg-blue-600 border-blue-400/30', r16: 'bg-teal-600 border-teal-400/30', qf: 'bg-green-600 border-green-400/30', sf: 'bg-red-600 border-red-400/30', final: 'bg-amber-600 border-amber-400/30' };
  return (
    <div className={`relative w-48 p-2 rounded-lg border shadow-lg transition-all hover:scale-105 ${colorClasses[color] || 'bg-white/10 border-white/20'}`}>
      <div className="absolute -top-2 -left-2 bg-black/80 text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10 z-10">M{matchNumber}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            <button onClick={() => isDraw && handleWinnerSelection(match.id, homeTeam.id)} className={`p-0.5 rounded transition-all ${pred.winnerId === homeTeam.id ? 'bg-white text-black scale-110' : isDraw ? 'hover:bg-white/20' : ''}`}>
              <img src={homeTeam.crest} alt={homeTeam.name} className="w-3.5 h-3.5 object-contain shrink-0" referrerPolicy="no-referrer" />
            </button>
            <span className={`font-bold text-[9px] uppercase truncate text-white ${pred.winnerId === homeTeam.id ? 'underline' : ''}`}>{homeTeam.name}</span>
          </div>
          <input type="number" min="0" value={pred.homeScore} onChange={e => handlePredictionChange(match.id, 'home', e.target.value)} className="w-7 h-5 bg-black/20 border border-white/10 rounded text-center font-black text-[10px] text-white focus:outline-none focus:border-fifa-green" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            <button onClick={() => isDraw && handleWinnerSelection(match.id, awayTeam.id)} className={`p-0.5 rounded transition-all ${pred.winnerId === awayTeam.id ? 'bg-white text-black scale-110' : isDraw ? 'hover:bg-white/20' : ''}`}>
              <img src={awayTeam.crest} alt={awayTeam.name} className="w-3.5 h-3.5 object-contain shrink-0" referrerPolicy="no-referrer" />
            </button>
            <span className={`font-bold text-[9px] uppercase truncate text-white ${pred.winnerId === awayTeam.id ? 'underline' : ''}`}>{awayTeam.name}</span>
          </div>
          <input type="number" min="0" value={pred.awayScore} onChange={e => handlePredictionChange(match.id, 'away', e.target.value)} className="w-7 h-5 bg-black/20 border border-white/10 rounded text-center font-black text-[10px] text-white focus:outline-none focus:border-fifa-green" />
        </div>
      </div>
      {isDraw && !pred.winnerId && <div className="mt-1 text-[7px] text-white/60 text-center font-bold animate-pulse">Selecione o vencedor</div>}
    </div>
  );
};

const BracketView = ({ roundOf32, roundOf16, quarterFinals, semiFinals, final, thirdPlace, handlePredictionChange, handleWinnerSelection, userPredictions }: { roundOf32: Match[]; roundOf16: Match[]; quarterFinals: Match[]; semiFinals: Match[]; final: Match[]; thirdPlace: Match | null; handlePredictionChange: any; handleWinnerSelection: any; userPredictions: any }) => (
  <div className="w-full overflow-x-auto pb-12 no-scrollbar">
    <div className="min-w-[1400px] flex items-center justify-between gap-2 px-2 py-8 scale-90 origin-top">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic text-center mb-2">16-avos de Final</div>
          {[0,1,2,3,4,5,6,7].map(i => <BracketMatch key={`r32-l-${i}`} match={roundOf32[i]} matchNumber={(73+i).toString()} color="r32" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />)}
        </div>
        <div className="flex flex-col gap-[68px]">
          <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest italic text-center mb-2">Oitavas de Final</div>
          {[0,1,2,3].map(i => roundOf16[i] && <BracketMatch key={`r16-l-${i}`} match={roundOf16[i]} matchNumber={(89+i).toString()} color="r16" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />)}
        </div>
        <div className="flex flex-col gap-[188px]">
          <div className="text-[10px] font-black text-green-400 uppercase tracking-widest italic text-center mb-2">Quartas de Final</div>
          {[0,1].map(i => quarterFinals[i] && <BracketMatch key={`qf-l-${i}`} match={quarterFinals[i]} matchNumber={(97+i).toString()} color="qf" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />)}
        </div>
        <div className="flex flex-col">
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest italic text-center mb-2">Semifinal</div>
          {semiFinals[0] && <BracketMatch match={semiFinals[0]} matchNumber="101" color="sf" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />}
        </div>
      </div>
      <div className="flex flex-col gap-8 items-center">
        {final[0] && <div className="space-y-2 text-center"><div className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Grande Final</div><BracketMatch match={final[0]} matchNumber="104" color="final" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} /></div>}
        {thirdPlace && <div className="space-y-2 text-center"><div className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Disputa de 3º Lugar</div><BracketMatch match={thirdPlace} matchNumber="103" color="final" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} /></div>}
      </div>
      <div className="flex items-center flex-row-reverse gap-4">
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic text-center mb-2">16-avos de Final</div>
          {[8,9,10,11,12,13,14,15].map(i => <BracketMatch key={`r32-r-${i}`} match={roundOf32[i]} matchNumber={(73+i).toString()} color="r32" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />)}
        </div>
        <div className="flex flex-col gap-[68px]">
          <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest italic text-center mb-2">Oitavas de Final</div>
          {[4,5,6,7].map(i => roundOf16[i] && <BracketMatch key={`r16-r-${i}`} match={roundOf16[i]} matchNumber={(89+i).toString()} color="r16" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />)}
        </div>
        <div className="flex flex-col gap-[188px]">
          <div className="text-[10px] font-black text-green-400 uppercase tracking-widest italic text-center mb-2">Quartas de Final</div>
          {[2,3].map(i => quarterFinals[i] && <BracketMatch key={`qf-r-${i}`} match={quarterFinals[i]} matchNumber={(97+i).toString()} color="qf" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />)}
        </div>
        <div className="flex flex-col">
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest italic text-center mb-2">Semifinal</div>
          {semiFinals[1] && <BracketMatch match={semiFinals[1]} matchNumber="102" color="sf" handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions} />}
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'home'|'bolao'|'live'|'ranking'|'results'|'official'|'users'>('home');
  const [officialMatches, setOfficialMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, Prediction>>({});
  const [user, setUser] = useState<AppUser | null>(null);
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);
  const [savedUsers, setSavedUsers] = useState<UserPrediction[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalData, setSaveModalData] = useState({ name: '', bet: '' });
  const [newUserForm, setNewUserForm] = useState({ name: '', password: '', role: 'user' as 'admin'|'user' });
  const [addUserError, setAddUserError] = useState<string|null>(null);
  const [groupPageIndex, setGroupPageIndex] = useState(0);
  const [officialMatchesPageIndex, setOfficialMatchesPageIndex] = useState(0);
  const [adminTeamFilters, setAdminTeamFilters] = useState<Record<string, string|null>>({});
  const [officialKnockoutPredictions, setOfficialKnockoutPredictions] = useState<Record<string, Prediction>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string|null>(null);
  const [syncError, setSyncError] = useState<string|null>(null);
  const [syncStats, setSyncStats] = useState<{live:number;completed:number}|null>(null);
  const [hasUserTouched, setHasUserTouched] = useState(false);
  const [goldenMatchIds, setGoldenMatchIds] = useState<string[]>([]);

  const groups = useMemo(() => Array.from(new Set(TEAMS.map(t => t.group))).sort(), []);
  const groupMatches = useMemo(() => officialMatches.filter(m => m.stage === 'group'), [officialMatches]);
  const officialStandings = useMemo(() => calculateStandings(officialMatches, TEAMS), [officialMatches]);
  const officialBestThirds = useMemo(() => getBestThirdPlacedTeams(officialStandings), [officialStandings]);
  const predictedStandings = useMemo(() => {
    const pm = officialMatches.map(m => { const p = userPredictions[m.id]||{homeScore:0,awayScore:0}; return {...m,homeScore:p.homeScore,awayScore:p.awayScore,status:'completed' as const}; });
    return calculateStandings(pm, TEAMS);
  }, [officialMatches, userPredictions]);
  const allOfficialGroupMatchesFilled = useMemo(() => officialMatches.filter(m=>m.stage==='group').every(m=>m.status==='completed'), [officialMatches]);
  const officialRoundOf32 = useMemo(() => allOfficialGroupMatchesFilled ? generateRoundOf32(officialStandings) : [], [allOfficialGroupMatchesFilled, officialStandings]);
  const officialRoundOf16 = useMemo(() => { if(!officialRoundOf32.length||!officialRoundOf32.every(m=>officialKnockoutPredictions[m.id])) return []; return generateNextStage(officialRoundOf32,officialKnockoutPredictions,'round_of_16'); }, [officialRoundOf32,officialKnockoutPredictions]);
  const officialQF = useMemo(() => { if(!officialRoundOf16.length||!officialRoundOf16.every(m=>officialKnockoutPredictions[m.id])) return []; return generateNextStage(officialRoundOf16,officialKnockoutPredictions,'quarter_final'); }, [officialRoundOf16,officialKnockoutPredictions]);
  const officialSF = useMemo(() => { if(!officialQF.length||!officialQF.every(m=>officialKnockoutPredictions[m.id])) return []; return generateNextStage(officialQF,officialKnockoutPredictions,'semi_final'); }, [officialQF,officialKnockoutPredictions]);
  const officialFinal = useMemo(() => { if(!officialSF.length||!officialSF.every(m=>officialKnockoutPredictions[m.id])) return []; return generateNextStage(officialSF,officialKnockoutPredictions,'final'); }, [officialSF,officialKnockoutPredictions]);
  const officialTP = useMemo(() => { if(!officialSF.length||!officialSF.every(m=>officialKnockoutPredictions[m.id])) return null; return generateThirdPlaceMatch(officialSF,officialKnockoutPredictions); }, [officialSF,officialKnockoutPredictions]);
  const allGroupFilled = useMemo(() => groupMatches.every(m=>userPredictions[m.id]!==undefined), [groupMatches,userPredictions]);
  const r32 = useMemo(() => allGroupFilled ? generateRoundOf32(predictedStandings) : [], [allGroupFilled,predictedStandings]);
  const r16 = useMemo(() => { if(!r32.length||!r32.every(m=>userPredictions[m.id])) return []; return generateNextStage(r32,userPredictions,'round_of_16'); }, [r32,userPredictions]);
  const qf = useMemo(() => { if(!r16.length||!r16.every(m=>userPredictions[m.id])) return []; return generateNextStage(r16,userPredictions,'quarter_final'); }, [r16,userPredictions]);
  const sf = useMemo(() => { if(!qf.length||!qf.every(m=>userPredictions[m.id])) return []; return generateNextStage(qf,userPredictions,'semi_final'); }, [qf,userPredictions]);
  const fn = useMemo(() => { if(!sf.length||!sf.every(m=>userPredictions[m.id])) return []; return generateNextStage(sf,userPredictions,'final'); }, [sf,userPredictions]);
  const tp = useMemo(() => { if(!sf.length||!sf.every(m=>userPredictions[m.id])) return null; return generateThirdPlaceMatch(sf,userPredictions); }, [sf,userPredictions]);
  const adminPreviewStandings = useMemo(() => calculateStandings(officialMatches,TEAMS), [officialMatches]);
  const updatedRanking = useMemo(() => {
    const allKOMatches = [...officialRoundOf32,...officialRoundOf16,...officialQF,...officialSF,...officialFinal,...(officialTP?[officialTP]:[])];
    const koMatchMap = new Map(allKOMatches.map(m=>[m.id,m]));
    const allM = [
      ...officialMatches,
      ...Object.entries(officialKnockoutPredictions).map(([id,pred])=>{
        const ko=koMatchMap.get(id);
        return {id,homeTeamId:ko?.homeTeamId??'',awayTeamId:ko?.awayTeamId??'',homeScore:pred.homeScore,awayScore:pred.awayScore,winnerId:pred.winnerId,status:'completed' as const,stage:(ko?.stage??'final') as Match['stage'],date:'',venue:''};
      })
    ];
    return savedUsers.map(u => {
      let pts=0,ex=0,out=0,wr=0;
      Object.entries(u.predictions as Record<string,Prediction>).forEach(([mid,pred]) => {
        const actual=allM.find(m=>m.id===mid&&m.status==='completed');
        if(actual){const d=getScoringDetails(pred,actual,u.goldenMatchIds?.includes(mid)||false);pts+=d.points;if(d.type==='exact')ex++;else if(['winner_goals','diff','loser_goals','outcome'].includes(d.type))out++;else if(d.type==='wrong')wr++;}
      });
      return {...u,totalPoints:pts,exactScores:ex,correctOutcomes:out,wrongResults:wr};
    }).filter(u=>user?.role==='admin'||!u.isTest).sort((a,b)=>b.totalPoints-a.totalPoints);
  }, [savedUsers,user,officialMatches,officialKnockoutPredictions,officialRoundOf32,officialRoundOf16,officialQF,officialSF,officialFinal,officialTP]);
  const hasSubmittedBolao = useMemo(() => savedUsers.some(u=>u.userName.toLowerCase()===user?.name.toLowerCase()), [savedUsers,user]);

  useEffect(() => {
    const load = async () => {
      const conn = await supabaseService.testConnection();
      console.log(`[Supabase] ${conn.message}`);
      const init = generateGroupMatches(TEAMS);
      const validTeamIds = new Set(TEAMS.map(t => t.id));
      const [matches,users,regUsers,settings] = await Promise.all([supabaseService.getOfficialMatches(),supabaseService.getSavedUsers(),supabaseService.getRegisteredUsers(),supabaseService.getSettings()]);
      const validMatches = matches?.filter(m => validTeamIds.has(m.homeTeamId) && validTeamIds.has(m.awayTeamId));
      setOfficialMatches(validMatches?.length ? validMatches : init);
      if(settings?.official_knockout_predictions) setOfficialKnockoutPredictions(settings.official_knockout_predictions);
      if(settings?.golden_match_ids) setGoldenMatchIds(settings.golden_match_ids);
      if(users) setSavedUsers(users);
      if(regUsers?.length){setRegisteredUsers(regUsers);}
      else{const da:AppUser={id:'00000000-0000-0000-0000-000000000000',name:'admin',password:'123',role:'admin'};setRegisteredUsers([da]);supabaseService.saveRegisteredUser(da);}
    };
    load();
  }, []);

  useEffect(() => { if(activeTab==='users'&&user?.role==='admin') supabaseService.getRegisteredUsers().then(r=>{if(r)setRegisteredUsers(r);}); }, [activeTab,user?.role]);
  useEffect(() => {
    const key=user?.role==='admin'?'admin_test_predictions':'user_predictions';
    const s=localStorage.getItem(key);
    if(s){setUserPredictions(JSON.parse(s));}
    else{const init:Record<string,Prediction>={};const ms=officialMatches.length>0?officialMatches:generateGroupMatches(TEAMS);ms.forEach(m=>{init[m.id]={homeScore:0,awayScore:0};});setUserPredictions(init);setHasUserTouched(false);}
  }, [user?.id,user?.role,officialMatches.length]);
  useEffect(() => { if(showSaveModal&&user) setSaveModalData(p=>({...p,name:user.name})); }, [showSaveModal,user]);

  const handlePredictionChange = (matchId:string,side:'home'|'away',value:string) => {
    const n=value===''?0:parseInt(value); if(isNaN(n)) return;
    setHasUserTouched(true);
    setUserPredictions(prev=>{const cur=prev[matchId]||{homeScore:0,awayScore:0};const next={...cur,[side==='home'?'homeScore':'awayScore']:n};if(next.homeScore!==next.awayScore)delete next.winnerId;return{...prev,[matchId]:next};});
  };
  const handlePredictionTap = (matchId:string,side:'home'|'away') => {
    setHasUserTouched(true);
    setUserPredictions(prev=>{const cur=prev[matchId]||{homeScore:0,awayScore:0};const key=side==='home'?'homeScore':'awayScore';const next={...cur,[key]:(cur[key]||0)+1};if(next.homeScore!==next.awayScore)delete next.winnerId;return{...prev,[matchId]:next};});
  };
  const handlePredictionReset = (matchId:string) => {
    setHasUserTouched(true);
    setUserPredictions(prev=>({...prev,[matchId]:{homeScore:0,awayScore:0}}));
  };
  const handleWinnerSelection = (matchId:string,teamId:string) => {
    setHasUserTouched(true);
    setUserPredictions(prev=>({...prev,[matchId]:{...prev[matchId]||{homeScore:0,awayScore:0},winnerId:teamId}}));
  };
  const handleOfficialWinnerSelection = (matchId:string,teamId:string) => setOfficialKnockoutPredictions(prev=>({...prev,[matchId]:{...prev[matchId]||{homeScore:0,awayScore:0},winnerId:teamId}}));
  const handleAPISync = async () => {
    setIsSyncing(true); setSyncError(null);
    try {
      const allKO = [...officialRoundOf32,...officialRoundOf16,...officialQF,...officialSF,...officialFinal,...(officialTP?[officialTP]:[])];
      const result = await syncFromAPI(officialMatches, allKO, officialKnockoutPredictions);
      setOfficialMatches(result.groupUpdated);
      setOfficialKnockoutPredictions(result.knockoutPreds);
      supabaseService.saveOfficialMatches(result.groupUpdated);
      supabaseService.saveSetting('official_knockout_predictions', result.knockoutPreds);
      setLastSync(result.lastSync);
      setSyncStats({live: result.liveCount, completed: result.completedCount});
    } catch(e:any) {
      setSyncError(e.message||'Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };
  const handleLogin = async (e:FormEvent) => {
    e.preventDefault(); setLoginErrorMsg(null); setShowLoginError(false);
    try{const found=await supabaseService.login(loginForm.name,loginForm.password);if(found)setUser(found);else setShowLoginError(true);}
    catch(err:any){setLoginErrorMsg(err.message||'Erro de conexão');}
  };
  const handleLogout = () => { setUser(null); setLoginForm({name:'',password:''}); setActiveTab('home'); };
  const addUser = async (e:FormEvent) => {
    e.preventDefault(); if(!newUserForm.name.trim()) return;
    setAddUserError(null);
    const nu:AppUser={id:crypto.randomUUID(),name:newUserForm.name.trim(),password:newUserForm.password.trim(),role:newUserForm.role};
    setRegisteredUsers(p=>[...p,nu]);
    try {
      await supabaseService.saveRegisteredUser(nu);
    } catch(err:any) {
      setAddUserError(err.message||'Erro ao salvar usuário no Supabase');
    }
    setNewUserForm({name:'',password:'',role:'user'});
  };
  const deleteRegisteredUser = (id:string) => { if(id==='00000000-0000-0000-0000-000000000000') return; setRegisteredUsers(p=>p.filter(u=>u.id!==id)); supabaseService.deleteRegisteredUser(id); };
  const deleteUser = (id:string) => { supabaseService.deleteUserPrediction(id); setSavedUsers(p=>p.filter(u=>u.id!==id)); };
  const sim = (m:Match):Prediction => { const h=Math.floor(Math.random()*4),a=Math.floor(Math.random()*4);const p:Prediction={homeScore:h,awayScore:a};if(h===a)p.winnerId=Math.random()>0.5?m.homeTeamId:m.awayTeamId;return p; };
  const simulateOfficialResults = () => {
    const nm=officialMatches.map(m=>m.stage==='group'?{...m,...sim(m),status:'completed' as const}:m);
    const nk:Record<string,Prediction>={};
    const standings=calculateStandings(nm,TEAMS);
    const sr32=generateRoundOf32(standings);sr32.forEach(m=>{nk[m.id]=sim(m);});
    const sr16=generateNextStage(sr32,nk,'round_of_16');sr16.forEach(m=>{nk[m.id]=sim(m);});
    const sqf=generateNextStage(sr16,nk,'quarter_final');sqf.forEach(m=>{nk[m.id]=sim(m);});
    const ssf=generateNextStage(sqf,nk,'semi_final');ssf.forEach(m=>{nk[m.id]=sim(m);});
    const sf2=generateNextStage(ssf,nk,'final');sf2.forEach(m=>{nk[m.id]=sim(m);});
    const stp=generateThirdPlaceMatch(ssf,nk);if(stp)nk[stp.id]=sim(stp);
    setOfficialMatches(nm);setOfficialKnockoutPredictions(nk);
    // Simulação é apenas preview local — não persiste no Supabase/localStorage
    setShowSaveSuccess(true);setTimeout(()=>setShowSaveSuccess(false),3000);
  };
  const clearOfficialResults = () => {
    const rm=generateGroupMatches(TEAMS);setOfficialMatches(rm);setOfficialKnockoutPredictions({});
    supabaseService.saveOfficialMatches(rm);supabaseService.saveSetting('official_knockout_predictions',{});
  };
  const simulateAllPredictions = () => {
    const np:Record<string,Prediction>={...userPredictions};
    groupMatches.forEach(m=>{np[m.id]=sim(m);});
    const pm=officialMatches.map(m=>{const p=np[m.id]||{homeScore:0,awayScore:0};return{...m,homeScore:p.homeScore,awayScore:p.awayScore,status:'completed' as const};});
    const st=calculateStandings(pm,TEAMS);
    const pr32=generateRoundOf32(st);pr32.forEach(m=>{np[m.id]=sim(m);});
    const pr16=generateNextStage(pr32,np,'round_of_16');pr16.forEach(m=>{np[m.id]=sim(m);});
    const pqf=generateNextStage(pr16,np,'quarter_final');pqf.forEach(m=>{np[m.id]=sim(m);});
    const psf=generateNextStage(pqf,np,'semi_final');psf.forEach(m=>{np[m.id]=sim(m);});
    const pf=generateNextStage(psf,np,'final');pf.forEach(m=>{np[m.id]=sim(m);});
    const ptp=generateThirdPlaceMatch(psf,np);if(ptp)np[ptp.id]=sim(ptp);
    setUserPredictions(np);setHasUserTouched(true);
  };
  const toggleGoldenMatch = (id:string) => setGoldenMatchIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):prev.length>=3?prev:[...prev,id]);
  const saveBolao = () => {
    const nu:UserPrediction={id:Date.now().toString(),userName:saveModalData.name||user?.name||'Anônimo',betAmount:parseFloat(saveModalData.bet)||0,predictions:{...userPredictions},totalPoints:0,exactScores:0,correctOutcomes:0,wrongResults:0,isTest:user?.role==='admin',goldenMatchIds:[...goldenMatchIds]};
    setSavedUsers(p=>[...p,nu]);supabaseService.saveUserPrediction(nu);
    const key=user?.role==='admin'?'admin_test_predictions':'user_predictions';
    localStorage.setItem(key,JSON.stringify(userPredictions));
    setShowSaveSuccess(true);setShowSaveModal(false);setSaveModalData({name:'',bet:''});
    setTimeout(()=>{setShowSaveSuccess(false);setActiveTab('ranking');},1500);
    setUserPredictions({});setHasUserTouched(false);setGoldenMatchIds([]);localStorage.removeItem(key);
  };

  if (!user) return (
    <div className="min-h-screen bg-[#05070a] text-gray-100 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fifa-green/10 blur-[120px] rounded-full"/><div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fifa-blue/10 blur-[120px] rounded-full"/></div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md relative z-10">
        <GlassCard className="p-10 border-fifa-green/20 bg-black/40 backdrop-blur-2xl">
          <div className="flex flex-col items-center mb-10">
            <img src="https://s2-ge.glbimg.com/RGU5LEYpvpcPRro8r9wxAEvmltU=/0x0:2048x2048/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2023/q/Q/e3U1thRemgE9lEG0J4gQ/logo-fifa.jpg" alt="FIFA 2026" className="w-32 h-32 object-contain rounded-2xl mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" referrerPolicy="no-referrer"/>
            <h1 className="text-3xl font-black tracking-tighter text-center leading-none uppercase italic">BOLÃO <br/><span className="fifa-gradient-text">COPA 2026</span></h1>
            <p className="text-gray-500 text-sm mt-4 text-center">Acesse para fazer seus palpites e acompanhar o ranking.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome de Usuário</label>
              <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/><input type="text" required value={loginForm.name} onChange={e=>setLoginForm(p=>({...p,name:e.target.value}))} placeholder="Ex: Matheus" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-fifa-green transition-all"/></div>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative"><Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/><input type="password" value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-fifa-green transition-all"/></div>
            </div>
            {showLoginError&&<p className="text-red-400 text-xs font-bold text-center">Usuário ou senha incorretos.</p>}
            {loginErrorMsg&&<p className="text-red-400 text-xs font-bold text-center">{loginErrorMsg}</p>}
            <button type="submit" className="fifa-btn-primary w-full py-4 text-xs">ENTRAR NO SISTEMA <ArrowUpRight size={20}/></button>
          </form>
          <div className="mt-8 pt-8 border-t border-white/5 text-center"><p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Acesso Administrativo: admin / 123</p></div>
        </GlassCard>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans selection:bg-fifa-green/30">
      <div className="fifa-pattern"/>
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fifa-green/10 blur-[120px] rounded-full"/><div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fifa-blue/10 blur-[120px] rounded-full"/></div>
      <div className="relative flex h-screen overflow-hidden flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="hidden md:flex w-20 flex-col items-center py-8 border-r border-white/5 bg-black/20 backdrop-blur-xl z-20">
          <div className="mb-12"><img src="https://s2-ge.glbimg.com/RGU5LEYpvpcPRro8r9wxAEvmltU=/0x0:2048x2048/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2023/q/Q/e3U1thRemgE9lEG0J4gQ/logo-fifa.jpg" alt="FIFA" className="w-12 h-12 object-contain rounded-lg" referrerPolicy="no-referrer"/></div>
          <nav className="flex flex-col gap-6 flex-1">
            <SidebarItem label="Início" icon={LayoutDashboard} active={activeTab==='home'} onClick={()=>setActiveTab('home')}/>
            <SidebarItem label="Classificação Oficial" icon={LayoutGrid} active={activeTab==='official'} onClick={()=>setActiveTab('official')}/>
            <SidebarItem label="Bolão" icon={Calendar} active={activeTab==='bolao'} onClick={()=>setActiveTab('bolao')}/>
            <SidebarItem label="Bolão Ao Vivo" icon={Radio} active={activeTab==='live'} onClick={()=>setActiveTab('live')}/>
            <SidebarItem label="Ranking" icon={ListOrdered} active={activeTab==='ranking'} onClick={()=>setActiveTab('ranking')}/>
            {user.role==='admin'&&<SidebarItem label="Usuários" icon={Users} active={activeTab==='users'} onClick={()=>setActiveTab('users')}/>}
            {user.role==='admin'&&<SidebarItem label="Admin" icon={Settings} active={activeTab==='results'} onClick={()=>setActiveTab('results')}/>}
          </nav>
          <div className="mt-auto flex flex-col gap-6">
            <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group relative"><ArrowUpRight className="rotate-180" size={20}/><span className="absolute left-14 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase">Sair</span></button>
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/10"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" referrerPolicy="no-referrer"/></div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
          <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-md z-10">
            <div className="flex items-center gap-2 md:gap-4">
              <img src="https://s2-ge.glbimg.com/RGU5LEYpvpcPRro8r9wxAEvmltU=/0x0:2048x2048/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_bc8228b6673f488aa253bbcb03c80ec5/internal_photos/bs/2023/q/Q/e3U1thRemgE9lEG0J4gQ/logo-fifa.jpg" alt="FIFA" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-lg" referrerPolicy="no-referrer"/>
              <h1 className="text-sm md:text-xl font-black tracking-tight uppercase italic">FIFA <span className="fifa-gradient-text">BOLÃO 2026</span></h1>
              <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10"><div className="w-2 h-2 rounded-full bg-fifa-green animate-pulse"/><span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Análise em Tempo Real</span></div>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <div className="flex flex-col items-end"><span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tighter">{user.name}</span><span className="text-[8px] md:text-[9px] font-bold text-fifa-green uppercase tracking-widest">{user.role==='admin'?'Administrador':'Participante'}</span></div>
              <AnimatePresence>{showSaveSuccess&&<motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} className="flex items-center gap-2 text-green-400 text-sm font-bold"><CheckCircle2 size={16}/> Bolão Salvo!</motion.div>}</AnimatePresence>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">

            {/* HOME */}
            {activeTab==='home'&&(
              <div className="space-y-6 md:space-y-8">
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <GlassCard className="lg:col-span-2 relative h-[300px] md:h-[400px] group">
                    <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop" alt="Stadium" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-transparent to-transparent"/><div className="absolute inset-0 bg-gradient-to-r from-[#05070a]/80 via-transparent to-transparent"/>
                    <div className="relative h-full p-6 md:p-10 flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-4"><Badge variant="success">Copa do Mundo 2026</Badge></div>
                      <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter leading-none uppercase italic">ACOMPANHE A <br/><span className="text-green-500">COPA DO MUNDO</span></h2>
                      <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">Veja a classificação oficial, os resultados reais e faça seus palpites no nosso Bolão exclusivo.</p>
                      <button onClick={()=>setActiveTab('bolao')} className="bg-green-500 hover:bg-green-400 text-black font-black px-8 py-3 rounded-xl flex items-center gap-2 transition-all w-fit uppercase text-xs shadow-[0_0_20px_rgba(34,197,94,0.4)]"><Play size={20} fill="currentColor"/> MEU BOLÃO</button>
                    </div>
                  </GlassCard>
                  <div className="grid grid-cols-2 lg:grid-rows-2 lg:grid-cols-1 gap-4 md:gap-8">
                    <GlassCard className="p-4 md:p-6 flex flex-col justify-between bg-gradient-to-br from-green-500/10 to-transparent"><div className="flex items-center justify-between mb-2"><div className="p-1.5 bg-green-500/20 rounded-lg text-green-400"><Shield size={18}/></div><Badge variant="success">Oficial</Badge></div><div><p className="text-2xl md:text-3xl font-black">48</p><p className="text-[8px] md:text-xs text-gray-500 uppercase font-bold">Seleções Participantes</p></div></GlassCard>
                    <GlassCard className="p-4 md:p-6 flex flex-col justify-between bg-gradient-to-br from-blue-500/10 to-transparent"><div className="flex items-center justify-between mb-2"><div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400"><Calendar size={18}/></div><Badge variant="info">2026</Badge></div><div><p className="text-2xl md:text-3xl font-black">104</p><p className="text-[8px] md:text-xs text-gray-500 uppercase font-bold">Total de Partidas</p></div></GlassCard>
                  </div>
                </section>
                <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <GlassCard className="xl:col-span-2 p-12 text-center space-y-6 bg-gradient-to-br from-green-500/5 to-blue-500/5">
                    <div className="w-20 h-20 bg-green-500/20 rounded-3xl flex items-center justify-center text-green-500 mx-auto"><Trophy size={40}/></div>
                    <div className="space-y-2"><h2 className="text-3xl font-black uppercase italic tracking-tighter">Bem-vindo ao <span className="text-green-500">Bolão Oficial</span></h2><p className="text-gray-500 max-w-2xl mx-auto">Acompanhe a classificação oficial, faça seus palpites e dispute o topo do ranking.</p></div>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={()=>setActiveTab('official')} className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all">Ver Classificação</button>
                      <button onClick={()=>setActiveTab('bolao')} className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">Fazer Palpites</button>
                    </div>
                  </GlassCard>
                  <GlassCard className="p-8 border-fifa-yellow/20 bg-fifa-yellow/5 flex flex-col items-center text-center justify-center space-y-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-fifa-yellow/10 rounded-full blur-3xl"/>
                    <div className="w-20 h-20 bg-fifa-yellow/20 rounded-full flex items-center justify-center text-fifa-yellow"><Trophy size={40}/></div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-fifa-yellow uppercase tracking-[0.3em]">Líder do Ranking</p>
                      {updatedRanking.length>0?(<><h3 className="text-3xl font-black uppercase italic tracking-tighter">{updatedRanking[0].userName}</h3><p className="text-gray-400 text-sm">Topo com <span className="text-fifa-yellow font-bold">{updatedRanking[0].totalPoints} pontos</span>.</p></>):(<><h3 className="text-2xl font-black uppercase italic tracking-tighter">Aguardando...</h3><p className="text-gray-500 text-xs">Seja o primeiro a salvar seu bolão!</p></>)}
                    </div>
                    <button onClick={()=>setActiveTab('ranking')} className="w-full py-4 bg-fifa-yellow/10 hover:bg-fifa-yellow/20 border border-fifa-yellow/20 rounded-2xl text-fifa-yellow font-black uppercase tracking-widest text-[10px] transition-all">Ver Ranking Completo</button>
                  </GlassCard>
                </section>
              </div>
            )}

            {/* BOLAO */}
            {activeTab==='bolao'&&(
              <div className="max-w-7xl mx-auto space-y-12">
                {hasSubmittedBolao?(
                  <div className="py-20 text-center"><GlassCard className="p-12 border-fifa-green/20 bg-fifa-green/5 max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-fifa-green/20 rounded-2xl flex items-center justify-center text-fifa-green mx-auto mb-6"><CheckCircle2 size={32}/></div>
                    <h3 className="text-xl font-black mb-2 uppercase italic">Bolão Enviado com Sucesso!</h3>
                    <p className="text-gray-400 text-sm mb-8">Seus palpites já foram registrados. Acompanhe sua pontuação no Ranking.</p>
                    <button onClick={()=>setActiveTab('ranking')} className="fifa-btn-primary mx-auto">Ver Ranking</button>
                  </GlassCard></div>
                ):(
                  <>
                    <div className="relative overflow-hidden rounded-2xl md:rounded-[3rem] p-6 md:p-12 bg-gradient-to-br from-fifa-blue via-fifa-purple to-fifa-orange">
                      <div className="relative z-10"><p className="text-white/60 text-[8px] md:text-xs font-black uppercase tracking-[0.3em]">FAÇA SEUS PALPITES | FIFA 2026</p><h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">BOLÃO</h2></div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 gap-4">
                      <div className="flex items-center gap-3"><div className="p-2 bg-fifa-green/20 rounded-xl text-fifa-green"><LayoutGrid size={20}/></div><div><h2 className="text-lg font-black uppercase tracking-tighter">Fase de <span className="fifa-gradient-text">Grupos</span></h2><p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Página {groupPageIndex+1} de {Math.ceil(groups.length/2)}</p></div></div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>setGroupPageIndex(p=>Math.max(0,p-1))} disabled={groupPageIndex===0} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl disabled:opacity-30 transition-all"><ChevronLeft size={20}/></button>
                        <button onClick={()=>setGroupPageIndex(p=>Math.min(Math.ceil(groups.length/2)-1,p+1))} disabled={groupPageIndex>=Math.ceil(groups.length/2)-1} className="p-3 bg-fifa-green hover:bg-fifa-green/90 text-black rounded-xl disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(0,223,89,0.3)]"><ChevronRight size={20}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                      {groups.slice(groupPageIndex*2,groupPageIndex*2+2).map(groupName=>(
                        <div key={groupName} className="flex flex-col rounded-[2rem] overflow-hidden shadow-2xl">
                          <div className="bg-black py-4 px-6 text-center border-b border-white/10"><span className="text-white font-black text-sm uppercase tracking-[0.3em] italic">GROUP {groupName}</span></div>
                          <div className="bg-white p-4 md:p-6 space-y-4 md:space-y-6">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left min-w-[300px]">
                                <thead><tr className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-black/5"><th className="px-2 py-2">#</th><th className="px-2 py-2">Seleção</th><th className="px-1 py-2 text-center">J</th><th className="px-1 py-2 text-center">SG</th><th className="px-2 py-2 text-right">PTS</th></tr></thead>
                                <tbody className="text-[10px]">{predictedStandings[groupName]?.map((s,idx)=>{const team=TEAMS.find(t=>t.id===s.teamId);if(!team)return null;return(<tr key={s.teamId} className="border-b border-black/5 hover:bg-black/5 transition-colors"><td className="px-2 py-2 font-bold text-gray-400">{idx+1}</td><td className="px-2 py-2"><div className="flex items-center gap-2"><img src={team.crest} alt={team.name} className="w-4 h-4 object-contain" referrerPolicy="no-referrer"/><span className="font-black text-black uppercase tracking-tighter">{team.name}</span></div></td><td className="px-1 py-2 text-center font-mono text-gray-400">{s.played}</td><td className="px-1 py-2 text-center font-mono text-gray-400">{s.gd>0?`+${s.gd}`:s.gd}</td><td className="px-2 py-2 text-right font-black text-fifa-green">{s.pts}</td></tr>);})}</tbody>
                              </table>
                            </div>
                            <div className="space-y-3 pt-6 border-t border-black/5 bg-slate-50/50 -mx-6 px-6 pb-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Palpites das Partidas</p>
                              {officialMatches.filter(m=>{const ht=TEAMS.find(t=>t.id===m.homeTeamId);const at=TEAMS.find(t=>t.id===m.awayTeamId);return ht?.group===groupName&&at?.group===groupName&&m.stage==='group';}).map(match=>{const ht=TEAMS.find(t=>t.id===match.homeTeamId);const at=TEAMS.find(t=>t.id===match.awayTeamId);if(!ht||!at)return null;const pred=userPredictions[match.id]||{homeScore:0,awayScore:0};return(
                                <div key={match.id} className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                  <div className="flex-1 flex items-center gap-2 overflow-hidden"><img src={ht.crest} alt={ht.name} className="w-5 h-5 object-contain shrink-0" referrerPolicy="no-referrer"/><span className="font-black text-[10px] text-slate-900 uppercase truncate tracking-tighter">{ht.name}</span></div>
                                  <div className="flex items-center gap-1 shrink-0 md:hidden">
                                    <button type="button" onClick={()=>handlePredictionTap(match.id,'home')} className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-black text-sm text-slate-900 active:bg-fifa-blue/10 active:scale-95 transition-all select-none">{pred.homeScore}</button>
                                    <button type="button" onClick={()=>handlePredictionReset(match.id)} className="w-6 h-6 flex items-center justify-center text-slate-400 font-black text-[10px] active:text-red-400 transition-colors select-none">X</button>
                                    <button type="button" onClick={()=>handlePredictionTap(match.id,'away')} className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-black text-sm text-slate-900 active:bg-fifa-blue/10 active:scale-95 transition-all select-none">{pred.awayScore}</button>
                                  </div>
                                  <div className="hidden md:flex items-center gap-1 shrink-0"><input type="number" min="0" value={pred.homeScore} onChange={e=>handlePredictionChange(match.id,'home',e.target.value)} className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-xs text-slate-900 focus:outline-none focus:border-fifa-blue"/><span className="text-slate-300 font-black text-[8px]">X</span><input type="number" min="0" value={pred.awayScore} onChange={e=>handlePredictionChange(match.id,'away',e.target.value)} className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-xs text-slate-900 focus:outline-none focus:border-fifa-blue"/></div>
                                  <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden"><span className="font-black text-[10px] text-slate-900 uppercase truncate tracking-tighter text-right">{at.name}</span><img src={at.crest} alt={at.name} className="w-5 h-5 object-contain shrink-0" referrerPolicy="no-referrer"/></div>
                                </div>
                              );})}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-12 pt-12 border-t border-white/5">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-2"><h2 className="text-4xl font-black tracking-tighter italic uppercase">Chaveamento <span className="fifa-gradient-text">Mata-Mata</span></h2><p className="text-gray-500 text-sm">Preencha os resultados para avançar as seleções.</p></div>
                        {user?.role==='admin'&&<button onClick={simulateAllPredictions} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"><Zap size={14} className="text-yellow-500"/> Simular Todos Resultados</button>}
                      </div>
                      <BracketView roundOf32={r32} roundOf16={r16} quarterFinals={qf} semiFinals={sf} final={fn} thirdPlace={tp} handlePredictionChange={handlePredictionChange} handleWinnerSelection={handleWinnerSelection} userPredictions={userPredictions}/>
                    </div>
                    <div className="pt-12 border-t border-white/5 space-y-8">
                      <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-fifa-yellow/10 border border-fifa-yellow/20 rounded-full text-fifa-yellow text-[10px] font-black uppercase tracking-widest mb-2"><Star size={12} fill="currentColor"/> Recurso Exclusivo</div>
                        <h2 className="text-5xl font-black tracking-tighter italic uppercase leading-none">Dica de <span className="text-fifa-yellow">Ouro</span></h2>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">Escolha exatamente <span className="text-white font-bold">3 partidas</span> para dobrar sua pontuação nelas.</p>
                        <div className="flex justify-center gap-3 mt-6">{[1,2,3].map(i=><motion.div key={i} animate={goldenMatchIds.length>=i?{scale:[1,1.2,1]}:{}} className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 ${goldenMatchIds.length>=i?'bg-fifa-yellow border-fifa-yellow text-black shadow-[0_0_30px_rgba(255,234,0,0.4)]':'border-white/10 text-white/10 bg-white/5'}`}><Star size={24} fill={goldenMatchIds.length>=i?'currentColor':'none'}/><span className="text-[8px] font-black mt-1">{i}º</span></motion.div>)}</div>
                      </div>
                      <GlassCard className="max-h-[500px] overflow-hidden border-white/5 p-0">
                        <div className="overflow-y-auto max-h-[500px] p-6 space-y-3 custom-scrollbar">
                          {officialMatches.map(match=>{const ht=TEAMS.find(t=>t.id===match.homeTeamId)!;const at=TEAMS.find(t=>t.id===match.awayTeamId)!;const isSel=goldenMatchIds.includes(match.id);const pred=userPredictions[match.id]||{homeScore:0,awayScore:0};return(
                            <button key={match.id} onClick={()=>toggleGoldenMatch(match.id)} className={`w-full p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${isSel?'bg-fifa-yellow/10 border-fifa-yellow':'bg-white/5 border-white/10 hover:border-white/20'}`}>
                              {isSel&&<div className="absolute top-0 left-0 w-1 h-full bg-fifa-yellow"/>}
                              <div className="flex items-center gap-6 flex-1">
                                <div className="flex items-center gap-3 w-[40%] justify-end"><span className="text-xs font-black uppercase tracking-tighter truncate text-right">{ht.name}</span><img src={ht.crest} alt={ht.name} className="w-6 h-6 object-contain" referrerPolicy="no-referrer"/></div>
                                <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-xl border border-white/10"><span className="font-black text-lg tabular-nums">{pred.homeScore}</span><span className="text-gray-600 text-xs font-black">X</span><span className="font-black text-lg tabular-nums">{pred.awayScore}</span></div>
                                <div className="flex items-center gap-3 w-[40%] justify-start"><img src={at.crest} alt={at.name} className="w-6 h-6 object-contain" referrerPolicy="no-referrer"/><span className="text-xs font-black uppercase tracking-tighter truncate">{at.name}</span></div>
                              </div>
                              <div className={`ml-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isSel?'bg-fifa-yellow text-black':'bg-white/5 text-white/10'}`}><Star size={20} fill={isSel?'currentColor':'none'}/></div>
                            </button>
                          );})}
                        </div>
                      </GlassCard>
                    </div>
                    <div className="pt-12 flex flex-col items-center gap-4">
                      {!hasUserTouched&&<p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">Altere pelo menos um resultado para salvar seu bolão</p>}
                      {hasUserTouched&&goldenMatchIds.length<3&&<p className="text-[10px] font-bold text-fifa-yellow uppercase tracking-widest animate-pulse">Selecione as 3 Dicas de Ouro para finalizar</p>}
                      <button onClick={()=>setShowSaveModal(true)} disabled={!hasUserTouched||goldenMatchIds.length!==3} className={`px-12 py-5 rounded-2xl font-black text-lg flex items-center gap-3 transition-all active:scale-95 uppercase tracking-tighter italic ${hasUserTouched&&goldenMatchIds.length===3?'bg-fifa-green text-black hover:bg-fifa-green/90 shadow-[0_0_30px_rgba(0,223,89,0.3)]':'bg-white/5 text-gray-600 cursor-not-allowed grayscale'}`}>
                        <Save size={24}/>{hasUserTouched?(goldenMatchIds.length===3?'SALVAR MEU BOLÃO':`FALTAM ${3-goldenMatchIds.length} DICAS DE OURO`):'MEXA EM ALGO PARA SALVAR'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Save Modal */}
            <AnimatePresence>
              {showSaveModal&&(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowSaveModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm"/>
                  <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:20}} className="relative w-full max-w-md">
                    <GlassCard className="p-8 border-fifa-green/30 bg-black/60 backdrop-blur-2xl">
                      <div className="flex flex-col items-center mb-8"><div className="w-16 h-16 bg-fifa-green/20 rounded-2xl flex items-center justify-center text-fifa-green mb-4"><Save size={32}/></div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Salvar Bolão</h3><p className="text-gray-500 text-sm text-center mt-2">Insira seus dados para aparecer no ranking oficial.</p></div>
                      <div className="space-y-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Seu Nome</label><input type="text" value={saveModalData.name} disabled={!!user} onChange={e=>setSaveModalData(p=>({...p,name:e.target.value}))} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fifa-green transition-all font-bold ${user?'opacity-50 cursor-not-allowed':''}`}/></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Valor Apostado (R$)</label><input type="number" value={saveModalData.bet} onChange={e=>setSaveModalData(p=>({...p,bet:e.target.value}))} placeholder="Ex: 50" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-fifa-green transition-all font-bold"/></div>
                        <div className="flex gap-4 pt-4">
                          <button onClick={()=>setShowSaveModal(false)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all">Cancelar</button>
                          <button onClick={saveBolao} disabled={!saveModalData.name.trim()||!saveModalData.bet} className="flex-1 px-6 py-4 bg-fifa-green hover:bg-fifa-green/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">Confirmar e Salvar</button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* BOLÃO AO VIVO */}
            {activeTab==='live'&&(
              <BolaoAoVivo
                user={user}
                officialMatches={officialMatches}
                officialRoundOf32={officialRoundOf32}
                officialRoundOf16={officialRoundOf16}
                officialQF={officialQF}
                officialSF={officialSF}
                officialFinal={officialFinal}
                officialTP={officialTP}
              />
            )}

            {/* OFFICIAL */}
            {activeTab==='official'&&(
              <div className="space-y-12">
                <div className="relative overflow-hidden rounded-[3rem] p-12 bg-gradient-to-br from-fifa-purple via-fifa-red to-fifa-green"><div className="relative z-10"><p className="text-white/60 text-xs font-black uppercase tracking-[0.3em]">PRELIMINARY DRAW | FIFA</p><h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">CLASSIFICAÇÃO <span className="text-fifa-green">OFICIAL</span></h2></div></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {groups.map(group=>(
                    <div key={group} className="flex flex-col rounded-2xl overflow-hidden shadow-2xl hover:scale-105 transition-all duration-300">
                      <div className="bg-black py-3 px-4 text-center"><span className="text-white font-black text-xs uppercase tracking-[0.2em] italic">GROUP {group}</span></div>
                      <div className="bg-white p-4 space-y-3 min-h-[160px]">{officialStandings[group]?.map((s,idx)=>{const team=TEAMS.find(t=>t.id===s.teamId)!;const isTop2=idx<2;const isBT=idx===2&&officialBestThirds.some(bt=>bt.teamId===s.teamId);const adv=isTop2||isBT;return(<div key={team.id} className="flex items-center gap-3"><div className="w-6 h-6 flex items-center justify-center shrink-0"><img src={team.crest} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer"/></div><span className={`text-black font-black text-[10px] uppercase truncate tracking-tighter leading-none ${adv?'opacity-100':'opacity-40'}`}>{team.name}</span><div className="ml-auto flex items-center gap-1"><span className={`font-mono text-sm font-black ${adv?'text-black':'text-black/20'}`}>{s.pts}P</span>{adv&&<div className={`w-1.5 h-1.5 rounded-full ${isTop2?'bg-fifa-green':'bg-fifa-blue'}`}/>}</div></div>);})}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-8 pt-12 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-4xl font-black tracking-tighter italic uppercase">Resultados <span className="fifa-gradient-text">das Partidas</span></h2><p className="text-gray-500 text-sm">Confira os placares oficiais.</p></div>
                    <div className="flex items-center gap-2"><button onClick={()=>setOfficialMatchesPageIndex(p=>Math.max(0,p-1))} disabled={officialMatchesPageIndex===0} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl disabled:opacity-30 transition-all"><ChevronLeft size={20}/></button><button onClick={()=>setOfficialMatchesPageIndex(p=>Math.min(Math.ceil(groups.length/3)-1,p+1))} disabled={officialMatchesPageIndex>=Math.ceil(groups.length/3)-1} className="p-3 bg-fifa-blue hover:bg-fifa-blue/90 text-white rounded-xl disabled:opacity-30 transition-all"><ChevronRight size={20}/></button></div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {groups.slice(officialMatchesPageIndex*3,officialMatchesPageIndex*3+3).map(groupName=>(
                      <div key={groupName} className="space-y-4">
                        <div className="bg-black/40 py-2 px-4 rounded-lg border border-white/5"><span className="text-white font-black text-[10px] uppercase tracking-[0.2em] italic">GRUPO {groupName}</span></div>
                        <div className="space-y-2">{officialMatches.filter(m=>m.group===groupName).map(match=>{const ht=TEAMS.find(t=>t.id===match.homeTeamId)!;const at=TEAMS.find(t=>t.id===match.awayTeamId)!;const done=match.status==='completed';return(<div key={match.id} className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-all group"><div className="flex-1 flex items-center gap-2 overflow-hidden"><img src={ht.crest} alt={ht.name} className="w-5 h-5 object-contain shrink-0" referrerPolicy="no-referrer"/><span className="font-bold text-[10px] text-gray-300 uppercase truncate tracking-tighter">{ht.name}</span></div><div className="flex items-center gap-2 shrink-0"><div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm ${done?'bg-fifa-blue text-white':'bg-white/5 text-gray-600'}`}>{done?match.homeScore:'-'}</div><span className="text-gray-600 font-black text-[10px]">X</span><div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm ${done?'bg-fifa-blue text-white':'bg-white/5 text-gray-600'}`}>{done?match.awayScore:'-'}</div></div><div className="flex-1 flex items-center justify-end gap-2 overflow-hidden"><span className="font-bold text-[10px] text-gray-300 uppercase truncate tracking-tighter text-right">{at.name}</span><img src={at.crest} alt={at.name} className="w-5 h-5 object-contain shrink-0" referrerPolicy="no-referrer"/></div></div>);})}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-12 pt-12 border-t border-white/5">
                  <div><h2 className="text-4xl font-black tracking-tighter italic uppercase">Chaveamento <span className="fifa-gradient-text">Mata-Mata Oficial</span></h2><p className="text-gray-500 text-sm">Acompanhe a fase final com os resultados reais.</p></div>
                  {allOfficialGroupMatchesFilled?(
                    <BracketView roundOf32={officialRoundOf32} roundOf16={officialRoundOf16} quarterFinals={officialQF} semiFinals={officialSF} final={officialFinal} thirdPlace={officialTP} handlePredictionChange={()=>{}} handleWinnerSelection={()=>{}} userPredictions={officialKnockoutPredictions}/>
                  ):(
                    <div className="py-20 text-center"><GlassCard className="p-12 border-blue-500/20 bg-blue-500/5 max-w-2xl mx-auto"><div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-6"><Info size={32}/></div><h3 className="text-xl font-black mb-2 uppercase italic">Aguardando Resultados Oficiais</h3><p className="text-gray-400 text-sm">O chaveamento oficial será liberado assim que todos os jogos da fase de grupos forem concluídos.</p></GlassCard></div>
                  )}
                </div>
              </div>
            )}

            {/* RANKING */}
            {activeTab==='ranking'&&(
              <div className="space-y-8">
                <div><h2 className="text-3xl font-black tracking-tight uppercase italic">RANKING <span className="fifa-gradient-text">GERAL</span></h2><p className="text-gray-500 text-sm">Veja quem está liderando o bolão da Copa 2026.</p></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <GlassCard className="lg:col-span-2 p-6 border-white/5">
                    <p className="text-[10px] font-black text-fifa-green uppercase tracking-[0.3em] mb-5">Pontuação de Placar</p>
                    <div className="space-y-1">
                      {([
                        {pts:'25',badge:'text-fifa-green bg-fifa-green/20',label:'Placar exato',example:'Apostou 2×1 → terminou 2×1'},
                        {pts:'18',badge:'text-fifa-blue bg-fifa-blue/20',label:'Vencedor + gols do vencedor',example:'Apostou 2×0 → terminou 2×1'},
                        {pts:'15',badge:'text-fifa-blue bg-fifa-blue/20',label:'Vencedor + diferença de gols',example:'Apostou 3×1 → terminou 2×0'},
                        {pts:'12',badge:'text-fifa-blue bg-fifa-blue/20',label:'Vencedor + gols do perdedor',example:'Apostou 2×1 → terminou 3×1'},
                        {pts:'10',badge:'text-fifa-yellow bg-fifa-yellow/20',label:'Apenas vencedor ou empate',example:'Acertou o resultado sem critério de gols'},
                        {pts:'0', badge:'text-gray-500 bg-white/5',        label:'Resultado errado',example:'Errou o vencedor ou empate'},
                      ] as const).map(r=>(
                        <div key={r.pts} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
                          <span className={`w-10 text-center font-black text-sm rounded-lg py-1 shrink-0 ${r.badge}`}>{r.pts}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white leading-tight">{r.label}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{r.example}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                  <div className="space-y-4">
                    <GlassCard className="p-6 border-fifa-yellow/20 bg-fifa-yellow/5">
                      <p className="text-[10px] font-black text-fifa-yellow uppercase tracking-[0.3em] mb-2">Bônus Eliminatórias</p>
                      <p className="text-3xl font-black italic tracking-tighter">+10 PTS</p>
                      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">Independente do placar, acertar quem avança de fase vale +10 pontos extras (tempo normal, prorrogação ou pênaltis).</p>
                    </GlassCard>
                    <GlassCard className="p-6 border-white/5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Multiplicadores por Fase</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Fase de Grupos</span><span className="font-black text-sm bg-white/10 px-2 py-0.5 rounded-lg">×1</span></div>
                        <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Oitavas / Quartas</span><span className="font-black text-sm text-fifa-blue bg-fifa-blue/20 px-2 py-0.5 rounded-lg">×1.5</span></div>
                        <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Semifinal / Final</span><span className="font-black text-sm text-fifa-green bg-fifa-green/20 px-2 py-0.5 rounded-lg">×2</span></div>
                      </div>
                    </GlassCard>
                  </div>
                </div>
                <GlassCard className="hidden md:block overflow-hidden border-white/5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead><tr className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 bg-white/5"><th className="px-8 py-6">Posição</th><th className="px-8 py-6">Participante</th><th className="px-8 py-6 text-center">Valor (R$)</th><th className="px-8 py-6 text-center">Cravadas</th><th className="px-8 py-6 text-center">Vencedor</th><th className="px-8 py-6 text-center">Erros</th><th className="px-8 py-6 text-right">Pontos</th>{user?.role==='admin'&&<th className="px-8 py-6 text-center">Ações</th>}</tr></thead>
                      <tbody className="text-sm">{updatedRanking.length>0?updatedRanking.map((p,idx)=>(<tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group"><td className="px-8 py-6"><div className="flex items-center gap-4"><span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-lg ${idx===0?'bg-fifa-yellow text-black':idx===1?'bg-gray-300 text-black':idx===2?'bg-amber-700 text-white':'bg-white/5 text-gray-400'}`}>{idx+1}</span>{idx<3&&<Trophy size={18} className={idx===0?'text-fifa-yellow':idx===1?'text-gray-300':'text-amber-700'}/>}</div></td><td className="px-8 py-6"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-fifa-green transition-all"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userName}`} alt="Avatar" referrerPolicy="no-referrer"/></div><span className="font-black group-hover:text-fifa-green transition-colors uppercase tracking-tighter italic text-sm">{p.userName}</span></div></td><td className="px-8 py-6 text-center font-mono text-xs text-gray-500">R$ {p.betAmount?.toFixed(2)||'0.00'}</td><td className="px-8 py-6 text-center font-mono text-sm text-fifa-green font-black">{p.exactScores}</td><td className="px-8 py-6 text-center font-mono text-sm text-fifa-blue font-black">{p.correctOutcomes}</td><td className="px-8 py-6 text-center font-mono text-sm text-fifa-red/50 font-black">{p.wrongResults}</td><td className="px-8 py-6 text-right"><span className="font-black text-white text-2xl italic tracking-tighter">{p.totalPoints}</span></td>{user?.role==='admin'&&<td className="px-8 py-6 text-center"><button onClick={()=>deleteUser(p.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button></td>}</tr>)):(<tr><td colSpan={user?.role==='admin'?8:7} className="px-8 py-32 text-center"><div className="flex flex-col items-center gap-6 opacity-20"><Trophy size={64} strokeWidth={1}/><p className="font-black uppercase italic tracking-[0.2em] text-xl">Nenhum palpite salvo ainda</p></div></td></tr>)}</tbody>
                    </table>
                  </div>
                </GlassCard>
                <div className="md:hidden space-y-4">{updatedRanking.length>0?updatedRanking.map((p,idx)=>(<GlassCard key={p.id} className={`p-4 border-white/5 relative overflow-hidden ${p.id===user?.id?'bg-fifa-green/5 border-fifa-green/20':''}`}><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-sm ${idx===0?'bg-fifa-yellow text-black':idx===1?'bg-gray-300 text-black':idx===2?'bg-amber-700 text-white':'bg-white/5 text-gray-400'}`}>{idx+1}</div><div className="w-10 h-10 rounded-full overflow-hidden border border-white/10"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userName}`} alt="Avatar" referrerPolicy="no-referrer"/></div><div><p className="font-black uppercase italic text-sm tracking-tighter">{p.userName}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">R$ {p.betAmount?.toFixed(2)||'0.00'}</p></div></div><div className="text-right"><p className="text-[9px] font-black text-fifa-green uppercase tracking-widest">Pontos</p><p className="text-2xl font-black italic tracking-tighter text-white">{p.totalPoints}</p></div></div><div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5"><div className="text-center"><p className="text-[8px] font-bold text-gray-500 uppercase mb-1">Cravadas</p><p className="text-xs font-black text-fifa-green">{p.exactScores}</p></div><div className="text-center border-x border-white/5"><p className="text-[8px] font-bold text-gray-500 uppercase mb-1">Vencedor</p><p className="text-xs font-black text-fifa-blue">{p.correctOutcomes}</p></div><div className="text-center"><p className="text-[8px] font-bold text-gray-500 uppercase mb-1">Erros</p><p className="text-xs font-black text-fifa-red/50">{p.wrongResults}</p></div></div>{user?.role==='admin'&&<button onClick={()=>deleteUser(p.id)} className="absolute top-2 right-2 p-2 text-red-500/30 hover:text-red-500"><Trash2 size={14}/></button>}</GlassCard>)):(<GlassCard className="p-12 text-center opacity-20"><Trophy size={48} className="mx-auto mb-4"/><p className="font-black uppercase italic text-sm">Nenhum palpite ainda</p></GlassCard>)}</div>
              </div>
            )}

            {/* USERS */}
            {activeTab==='users'&&user?.role==='admin'&&(
              <div className="space-y-8 md:space-y-12">
                <div><h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic">GESTÃO DE <span className="fifa-gradient-text">USUÁRIOS</span></h2><p className="text-gray-500 text-xs md:text-sm">Adicione e gerencie os usuários que podem acessar o sistema.</p></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <GlassCard className="p-6 md:p-8 border-fifa-green/20 bg-fifa-green/5 h-fit">
                    <h3 className="text-lg md:text-xl font-black mb-6 uppercase italic">Novo Usuário</h3>
                    <form onSubmit={addUser} className="space-y-4 md:space-y-6">
                      {addUserError&&<p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{addUserError}</p>}
                      <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nome de Usuário</label><input type="text" required value={newUserForm.name} onChange={e=>setNewUserForm(p=>({...p,name:e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-fifa-green transition-all" placeholder="Ex: Matheus"/></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Senha</label><input type="password" value={newUserForm.password} onChange={e=>setNewUserForm(p=>({...p,password:e.target.value}))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-fifa-green transition-all" placeholder="••••••••"/></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Função</label><select value={newUserForm.role} onChange={e=>setNewUserForm(p=>({...p,role:e.target.value as 'admin'|'user'}))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-fifa-green transition-all"><option value="user">Apostador</option><option value="admin">Administrador</option></select></div>
                      <button type="submit" className="fifa-btn-primary w-full py-4 text-xs"><Plus size={18}/> Adicionar Usuário</button>
                    </form>
                  </GlassCard>
                  <div className="lg:col-span-2"><GlassCard className="overflow-hidden border-white/5"><div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead><tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/5"><th className="px-4 md:px-6 py-4">Usuário</th><th className="px-4 md:px-6 py-4">Função</th><th className="px-4 md:px-6 py-4">Senha</th><th className="px-4 md:px-6 py-4 text-right">Ações</th></tr></thead><tbody className="text-sm">{registeredUsers.map(u=>(<tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="px-4 md:px-6 py-4 font-bold uppercase tracking-tight text-xs">{u.name}</td><td className="px-4 md:px-6 py-4"><Badge variant={u.role==='admin'?'danger':'default'}>{u.role==='admin'?'Admin':'Apostador'}</Badge></td><td className="px-4 md:px-6 py-4 font-mono text-xs text-gray-400">{u.password||<span className="italic opacity-50">Sem senha</span>}</td><td className="px-4 md:px-6 py-4 text-right">{u.id!=='00000000-0000-0000-0000-000000000000'&&(<button onClick={()=>deleteRegisteredUser(u.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>)}</td></tr>))}</tbody></table></div></GlassCard></div>
                </div>
              </div>
            )}

            {/* ADMIN RESULTS */}
            {activeTab==='results'&&(
              <div className="space-y-8 md:space-y-12">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic">RESULTADOS <span className="fifa-gradient-text">OFICIAIS</span></h2>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">Sincronize os resultados reais via API ou simule para testes.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={clearOfficialResults} className="flex-1 lg:flex-none bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-black px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-tighter text-[10px] border border-red-500/20"><Trash2 size={16}/> Limpar</button>
                    <button onClick={simulateOfficialResults} className="flex-1 lg:flex-none bg-fifa-orange/10 hover:bg-fifa-orange text-fifa-orange hover:text-black font-black px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-tighter text-[10px] border border-fifa-orange/20"><Zap size={16}/> Simular</button>
                  </div>
                </div>

                {/* API Sync Panel */}
                <GlassCard className="p-6 md:p-8 border-fifa-green/20 bg-fifa-green/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-fifa-green animate-pulse"/>
                        <span className="text-[10px] font-black text-fifa-green uppercase tracking-[0.2em]">football-data.org API</span>
                      </div>
                      <h3 className="text-xl font-black uppercase italic">Sincronização Automática</h3>
                      <p className="text-gray-500 text-xs">Busca todos os resultados oficiais da Copa 2026 e atualiza o bolão automaticamente.</p>
                      {lastSync&&<p className="text-[10px] text-gray-500 font-bold">Última sync: {new Date(lastSync).toLocaleString('pt-BR')}</p>}
                      {syncStats&&(
                        <div className="flex gap-4 mt-1">
                          <span className="text-[10px] font-black text-fifa-blue">{syncStats.completed} jogos concluídos</span>
                          {syncStats.live>0&&<span className="text-[10px] font-black text-fifa-green animate-pulse">● {syncStats.live} ao vivo agora</span>}
                        </div>
                      )}
                      {syncError&&<p className="text-[10px] font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">{syncError}</p>}
                    </div>
                    <button
                      onClick={handleAPISync}
                      disabled={isSyncing}
                      className="flex items-center justify-center gap-3 px-8 py-4 bg-fifa-green hover:bg-fifa-green/90 disabled:opacity-60 text-black font-black rounded-2xl uppercase tracking-tighter text-sm shadow-[0_0_25px_rgba(0,223,89,0.3)] transition-all active:scale-95 shrink-0"
                    >
                      <RefreshCw size={20} className={isSyncing?'animate-spin':''}/>
                      {isSyncing?'Sincronizando...':'Sincronizar com API'}
                    </button>
                  </div>
                </GlassCard>

                {/* Classificação por grupo (leitura) */}
                <div className="space-y-6">
                  <h3 className="text-lg font-black uppercase italic text-gray-400 flex items-center gap-2"><TrendingUp size={18}/> Classificação Atual por Grupo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {groups.map(group=>(
                      <div key={group} className="flex flex-col rounded-2xl overflow-hidden shadow-lg">
                        <div className="bg-black py-2 px-3 text-center"><span className="text-white font-black text-[10px] uppercase tracking-[0.2em] italic">GROUP {group}</span></div>
                        <div className="bg-white p-3 space-y-2">
                          {adminPreviewStandings[group]?.map((s,idx)=>{const team=TEAMS.find(t=>t.id===s.teamId);if(!team)return null;const adv=idx<2;return(
                            <div key={team.id} className="flex items-center gap-2">
                              <img src={team.crest} alt={team.name} className="w-4 h-4 object-contain shrink-0" referrerPolicy="no-referrer"/>
                              <span className={`text-black font-black text-[9px] uppercase truncate flex-1 ${adv?'':'opacity-30'}`}>{team.name}</span>
                              <span className={`font-black text-[10px] tabular-nums ${adv?'text-black':'text-black/20'}`}>{s.pts}</span>
                              {adv&&<div className="w-1.5 h-1.5 rounded-full bg-fifa-green shrink-0"/>}
                            </div>
                          );})}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resultados das partidas por grupo (leitura) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase italic text-gray-400">Placares das Partidas</h3>
                    <div className="flex gap-2">
                      <button onClick={()=>setOfficialMatchesPageIndex(p=>Math.max(0,p-1))} disabled={officialMatchesPageIndex===0} className="p-2 bg-white/5 border border-white/10 rounded-lg disabled:opacity-30"><ChevronLeft size={16}/></button>
                      <button onClick={()=>setOfficialMatchesPageIndex(p=>Math.min(Math.ceil(groups.length/4)-1,p+1))} disabled={officialMatchesPageIndex>=Math.ceil(groups.length/4)-1} className="p-2 bg-fifa-blue text-white rounded-lg disabled:opacity-30"><ChevronRight size={16}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {groups.slice(officialMatchesPageIndex*4,officialMatchesPageIndex*4+4).map(group=>(
                      <div key={group} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black text-fifa-blue uppercase tracking-widest italic">Grupo {group}</span>
                          <select value={adminTeamFilters[group]||''} onChange={e=>setAdminTeamFilters(p=>({...p,[group]:e.target.value||null}))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold focus:outline-none focus:border-fifa-blue">
                            <option value="">Todos</option>
                            {TEAMS.filter(t=>t.group===group).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        {officialMatches.filter(m=>m.group===group).filter(m=>{const f=adminTeamFilters[group];return!f||m.homeTeamId===f||m.awayTeamId===f;}).map(match=>{
                          const ht=TEAMS.find(t=>t.id===match.homeTeamId);
                          const at=TEAMS.find(t=>t.id===match.awayTeamId);
                          if(!ht||!at)return null;
                          const done=match.status==='completed';
                          const live=match.status==='live';
                          return(
                            <div key={match.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${live?'bg-fifa-green/10 border-fifa-green/30':done?'bg-white/5 border-white/5':'bg-white/2 border-white/5 opacity-60'}`}>
                              <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
                                <img src={ht.crest} alt={ht.name} className="w-4 h-4 object-contain shrink-0" referrerPolicy="no-referrer"/>
                                <span className="font-black text-[9px] uppercase truncate">{ht.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {live&&<span className="text-[8px] text-fifa-green font-black animate-pulse mr-1">●</span>}
                                <span className={`font-black text-sm tabular-nums w-5 text-center ${done||live?'text-white':'text-gray-600'}`}>{done||live?(match.homeScore??'-'):'-'}</span>
                                <span className="text-gray-600 font-black text-[10px]">×</span>
                                <span className={`font-black text-sm tabular-nums w-5 text-center ${done||live?'text-white':'text-gray-600'}`}>{done||live?(match.awayScore??'-'):'-'}</span>
                              </div>
                              <div className="flex-1 flex items-center justify-end gap-1.5 overflow-hidden">
                                <span className="font-black text-[9px] uppercase truncate text-right">{at.name}</span>
                                <img src={at.crest} alt={at.name} className="w-4 h-4 object-contain shrink-0" referrerPolicy="no-referrer"/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mata-mata — seleção de vencedor em caso de empate */}
                {allOfficialGroupMatchesFilled&&(
                  <div className="space-y-8 pt-8 border-t border-white/5">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase italic">MATA-MATA <span className="text-blue-500">OFICIAL</span></h2>
                      <p className="text-gray-500 text-xs mt-1">A API preenche os placares. Em caso de empate, selecione o vencedor manualmente.</p>
                    </div>
                    <BracketView roundOf32={officialRoundOf32} roundOf16={officialRoundOf16} quarterFinals={officialQF} semiFinals={officialSF} final={officialFinal} thirdPlace={officialTP} handlePredictionChange={()=>{}} handleWinnerSelection={handleOfficialWinnerSelection} userPredictions={officialKnockoutPredictions}/>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 z-50">
          <button onClick={()=>setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab==='home'?'text-fifa-green':'text-gray-500'}`}><LayoutDashboard size={20}/><span className="text-[9px] font-bold uppercase">Início</span></button>
          <button onClick={()=>setActiveTab('official')} className={`flex flex-col items-center gap-1 ${activeTab==='official'?'text-fifa-green':'text-gray-500'}`}><LayoutGrid size={20}/><span className="text-[9px] font-bold uppercase">Oficial</span></button>
          <button onClick={()=>setActiveTab('bolao')} className={`flex flex-col items-center gap-1 ${activeTab==='bolao'?'text-fifa-green':'text-gray-500'}`}><Calendar size={20}/><span className="text-[9px] font-bold uppercase">Bolão</span></button>
          <button onClick={()=>setActiveTab('live')} className={`flex flex-col items-center gap-1 ${activeTab==='live'?'text-fifa-green':'text-gray-500'}`}><Radio size={20}/><span className="text-[9px] font-bold uppercase">Ao Vivo</span></button>
          <button onClick={()=>setActiveTab('ranking')} className={`flex flex-col items-center gap-1 ${activeTab==='ranking'?'text-fifa-green':'text-gray-500'}`}><ListOrdered size={20}/><span className="text-[9px] font-bold uppercase">Ranking</span></button>
          {user.role==='admin'&&<button onClick={()=>setActiveTab('results')} className={`flex flex-col items-center gap-1 ${activeTab==='results'?'text-fifa-green':'text-gray-500'}`}><Settings size={20}/><span className="text-[9px] font-bold uppercase">Admin</span></button>}
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-500"><ArrowUpRight className="rotate-180" size={20}/><span className="text-[9px] font-bold uppercase">Sair</span></button>
        </nav>
      </div>
    </div>
  );
}
