import { createClient } from '@supabase/supabase-js';
import type { Match, UserPrediction, AppUser } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// LocalStorage fallback keys
const LS_MATCHES = 'bolao_official_matches';
const LS_USERS = 'bolao_saved_users';
const LS_REG_USERS = 'bolao_registered_users';
const LS_SETTINGS = 'bolao_settings';

class SupabaseService {
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    if (!supabase) return { ok: false, message: 'Modo localStorage (sem config Supabase)' };
    try {
      const { error } = await supabase.from('registered_users').select('id').limit(1);
      if (error) throw error;
      return { ok: true, message: 'Conectado ao Supabase com sucesso' };
    } catch (e: any) {
      return { ok: false, message: `Erro Supabase: ${e.message}` };
    }
  }

  // ── Official Matches (row-per-match schema) ──────────────────────────────

  async getOfficialMatches(): Promise<Match[] | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('official_matches')
          .select('*')
          .order('id');
        if (error) throw error;
        if (data && data.length > 0) {
          // Map DB columns → Match type (handle both camelCase and snake_case)
          const matches = data.map((row: any) => ({
            id: row.id,
            homeTeamId: row.homeTeamId ?? row.home_team_id,
            awayTeamId: row.awayTeamId ?? row.away_team_id,
            homeScore: row.homeScore ?? row.home_score ?? undefined,
            awayScore: row.awayScore ?? row.away_score ?? undefined,
            status: row.status ?? 'upcoming',
            stage: row.stage ?? 'group',
            date: row.date ?? '',
            venue: row.venue ?? '',
            group: row.group ?? undefined,
          })) as Match[];
          localStorage.setItem(LS_MATCHES, JSON.stringify(matches));
          return matches;
        }
        return this._lsGetMatches();
      } catch {
        return this._lsGetMatches();
      }
    }
    return this._lsGetMatches();
  }

  private _lsGetMatches(): Match[] | null {
    const s = localStorage.getItem(LS_MATCHES);
    return s ? JSON.parse(s) : null;
  }

  async saveOfficialMatches(matches: Match[]): Promise<void> {
    localStorage.setItem(LS_MATCHES, JSON.stringify(matches));
    if (supabase) {
      try {
        // Upsert each match as a row
        const rows = matches.map(m => ({
          id: m.id,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
          status: m.status,
          stage: m.stage,
          date: m.date,
          venue: m.venue,
          group: m.group ?? null,
        }));
        const { error } = await supabase.from('official_matches').upsert(rows);
        if (error) console.warn('[Supabase] saveOfficialMatches:', error.message);
      } catch (e: any) {
        console.warn('[Supabase] saveOfficialMatches exception:', e.message);
      }
    }
  }

  // ── User Predictions ─────────────────────────────────────────────────────

  async getSavedUsers(): Promise<UserPrediction[] | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('user_predictions').select('*');
        if (error) throw error;
        if (data) {
          const users = data.map((row: any) => row.data as UserPrediction);
          localStorage.setItem(LS_USERS, JSON.stringify(users));
          return users;
        }
        return this._lsGetUsers();
      } catch {
        return this._lsGetUsers();
      }
    }
    return this._lsGetUsers();
  }

  private _lsGetUsers(): UserPrediction[] | null {
    const s = localStorage.getItem(LS_USERS);
    return s ? JSON.parse(s) : [];
  }

  async saveUserPrediction(user: UserPrediction): Promise<void> {
    const current = this._lsGetUsers() || [];
    const idx = current.findIndex(u => u.id === user.id);
    if (idx >= 0) current[idx] = user; else current.push(user);
    localStorage.setItem(LS_USERS, JSON.stringify(current));

    if (supabase) {
      try {
        const { error } = await supabase
          .from('user_predictions')
          .upsert({ id: user.id, data: user });
        if (error) console.warn('[Supabase] saveUserPrediction:', error.message);
      } catch (e: any) {
        console.warn('[Supabase] saveUserPrediction exception:', e.message);
      }
    }
  }

  async deleteUserPrediction(userId: string): Promise<void> {
    const current = this._lsGetUsers() || [];
    localStorage.setItem(LS_USERS, JSON.stringify(current.filter(u => u.id !== userId)));
    if (supabase) {
      try {
        await supabase.from('user_predictions').delete().eq('id', userId);
      } catch {}
    }
  }

  // ── Registered Users ─────────────────────────────────────────────────────

  async getRegisteredUsers(): Promise<AppUser[] | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('registered_users').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          localStorage.setItem(LS_REG_USERS, JSON.stringify(data));
          return data as AppUser[];
        }
        return this._lsGetRegUsers();
      } catch {
        return this._lsGetRegUsers();
      }
    }
    return this._lsGetRegUsers();
  }

  private _lsGetRegUsers(): AppUser[] | null {
    const s = localStorage.getItem(LS_REG_USERS);
    return s ? JSON.parse(s) : null;
  }

  async saveRegisteredUser(user: AppUser): Promise<void> {
    const current = this._lsGetRegUsers() || [];
    const idx = current.findIndex(u => u.id === user.id);
    if (idx >= 0) current[idx] = user; else current.push(user);
    localStorage.setItem(LS_REG_USERS, JSON.stringify(current));

    if (supabase) {
      const { error } = await supabase.from('registered_users').upsert(user);
      if (error) throw new Error(error.message);
    }
  }

  async deleteRegisteredUser(userId: string): Promise<void> {
    const current = this._lsGetRegUsers() || [];
    localStorage.setItem(LS_REG_USERS, JSON.stringify(current.filter(u => u.id !== userId)));
    if (supabase) {
      try {
        await supabase.from('registered_users').delete().eq('id', userId);
      } catch {}
    }
  }

  async login(name: string, password: string): Promise<AppUser | null> {
    const users = await this.getRegisteredUsers();
    if (!users) return null;
    return users.find(
      u => u.name.toLowerCase() === name.toLowerCase() && u.password === password
    ) || null;
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  async getSettings(): Promise<Record<string, any> | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const result: Record<string, any> = {};
          data.forEach((row: any) => { result[row.key] = row.value; });
          localStorage.setItem(LS_SETTINGS, JSON.stringify(result));
          return result;
        }
        return this._lsGetSettings();
      } catch {
        return this._lsGetSettings();
      }
    }
    return this._lsGetSettings();
  }

  private _lsGetSettings(): Record<string, any> | null {
    const s = localStorage.getItem(LS_SETTINGS);
    return s ? JSON.parse(s) : null;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    const current = this._lsGetSettings() || {};
    current[key] = value;
    localStorage.setItem(LS_SETTINGS, JSON.stringify(current));

    if (supabase) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert({ key, value });
        if (error) console.warn('[Supabase] saveSetting:', error.message);
      } catch (e: any) {
        console.warn('[Supabase] saveSetting exception:', e.message);
      }
    }
  }
}

export const supabaseService = new SupabaseService();
