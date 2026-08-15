// beepixService.ts — Saldo Beepix dinâmico (TV).
// O backend BeepApp ainda não expõe um endpoint de saldo estável; este serviço
// é resiliente: tenta buscar de {API}/saldo, cai para o último valor persistido
// em localStorage, e finalmente para um valor padrão. Quando o backend passar a
// emitir 'saldo_atualizado' pelo socket, basta chamar setBeepix() a partir dele.

const API_BASE = 'http://192.168.15.3:3002';
const STORAGE_KEY = '@beepapp_beepix_balance';
const DEFAULT_BALANCE = 0;

export const getStoredBalance = (): number => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v != null ? Number(v) || DEFAULT_BALANCE : DEFAULT_BALANCE;
  } catch {
    return DEFAULT_BALANCE;
  }
};

export const storeBalance = (value: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* ignore */
  }
};

export const fetchBeepixBalance = async (): Promise<number> => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${API_BASE}/saldo`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const value = typeof data === 'number' ? data : Number(data?.balance ?? data?.saldo);
    if (!Number.isFinite(value)) throw new Error('formato invalido');
    storeBalance(value);
    return value;
  } catch {
    // Sem backend / erro de rede: mantém o último valor conhecido.
    return getStoredBalance();
  }
};

export const formatBeepix = (value: number): string =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
