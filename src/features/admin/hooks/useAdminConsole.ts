import { useCallback, useEffect, useRef, useState } from 'react';
import { adminConsoleService, type AdminUser } from '../services/adminConsoleService';

export interface AdminResource<T> { data: T | null; loading: boolean; error: unknown | null }

/** Each endpoint owns its request/version; a failed or older request cannot replace another section. */
export function useAdminResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<AdminResource<T>>({ data: null, loading: true, error: null });
  const mounted = useRef(false);
  const version = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const cancel = useCallback(() => { version.current++; controller.current?.abort(); }, []);
  const reload = useCallback(async () => {
    cancel();
    const current = version.current;
    const request = new AbortController(); controller.current = request;
    setState(previous => ({ ...previous, loading: true, error: null }));
    try {
      const data = await load(request.signal);
      if (mounted.current && current === version.current && !request.signal.aborted) setState({ data, loading: false, error: null });
    } catch (error) {
      if (mounted.current && current === version.current && !request.signal.aborted) {
        const status = (error as { status?: number })?.status;
        setState(previous => ({ data: status === 401 || status === 403 ? null : previous.data, loading: false, error }));
      }
    }
  }, [cancel, load]);
  useEffect(() => {
    mounted.current = true; void reload();
    return () => { mounted.current = false; cancel(); };
  }, [cancel, reload]);
  const update = useCallback((apply: (data: T | null) => T | null) => {
    cancel();
    if (mounted.current) setState(previous => ({ data: apply(previous.data), loading: false, error: null }));
  }, [cancel]);
  return { ...state, reload, update };
}

export type AdminAction = 'role' | 'status' | 'delete';
export type MutationOutcome = { ok: true; isActive?: boolean } | { ok: false; error?: unknown };

export function useAdminConsole(currentUserId?: number) {
  const stats = useAdminResource(adminConsoleService.stats);
  const users = useAdminResource(adminConsoleService.users);
  const logs = useAdminResource(adminConsoleService.logs);
  const [pending, setPending] = useState<ReadonlyMap<number, AdminAction>>(() => new Map());
  const requests = useRef(new Map<number, AbortController>());
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const active = requests.current;
    return () => { mounted.current = false; active.forEach(request => request.abort()); active.clear(); };
  }, []);

  const updateUsers = users.update, reloadStats = stats.reload;
  const mutate = useCallback(async (target: AdminUser, action: AdminAction, role?: AdminUser['role']): Promise<MutationOutcome> => {
    if (requests.current.has(target.id) || target.id === currentUserId || (action !== 'role' && target.role === 'ADMIN')
      || (action === 'role' && (!role || target.role === role))) return { ok: false };
    const request = new AbortController(); requests.current.set(target.id, request);
    setPending(previous => new Map(previous).set(target.id, action));
    // Cancel any pre-mutation list response before it can overwrite a confirmed row.
    updateUsers(data => data);
    try {
      let isActive: boolean | undefined;
      if (action === 'role') {
        const confirmedRole = await adminConsoleService.role(target.id, role!, request.signal);
        if (request.signal.aborted || !mounted.current) return { ok: false };
        updateUsers(data => data?.map(user => user.id === target.id ? { ...user, role: confirmedRole } : user) ?? null);
      } else if (action === 'status') {
        const confirmedStatus = await adminConsoleService.status(target.id, !target.isActive, request.signal);
        if (request.signal.aborted || !mounted.current) return { ok: false };
        updateUsers(data => data?.map(user => user.id === target.id ? { ...user, isActive: confirmedStatus } : user) ?? null);
        isActive = confirmedStatus;
      } else {
        await adminConsoleService.remove(target.id, request.signal);
        if (request.signal.aborted || !mounted.current) return { ok: false };
        updateUsers(data => data?.filter(user => user.id !== target.id) ?? null);
      }
      // Counts remain sourced from the stats API rather than guessed from a loaded subset.
      void reloadStats();
      return { ok: true, isActive };
    } catch (error) {
      return request.signal.aborted || !mounted.current ? { ok: false } : { ok: false, error };
    } finally {
      requests.current.delete(target.id);
      if (mounted.current) setPending(previous => { const next = new Map(previous); next.delete(target.id); return next; });
    }
  }, [currentUserId, reloadStats, updateUsers]);

  const refresh = () => { if (requests.current.size) return; void stats.reload(); void users.reload(); void logs.reload(); };
  return { stats, users, logs, pending, mutate, refresh };
}
