const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BloodType =
  | "A" | "B" | "AB" | "O"
  | "A+" | "A-" | "B+" | "B-"
  | "AB+" | "AB-" | "O+" | "O-";

export const BLOOD_TYPES: BloodType[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "A", "B", "AB", "O",
];

export interface User {
  donor_id: number;
  name: string;
  nickname: string | null;
  gender: string;
  birthday: string;
  blood_type: BloodType;
  phone: string;
  email: string;
  last_date: string | null;
  spent_points: number;
}

export interface UserCreate {
  name: string;
  nickname: string;
  gender: string;
  birthday: string;
  blood_type: BloodType;
  phone: string;
  email: string;
  password: string;
  weight?: number;
  location?: string;
  drugs_record?: string;
}

export interface UserUpdate {
  name?: string;
  nickname?: string;
  gender?: string;
  birthday?: string;
  blood_type?: BloodType;
  phone?: string;
  email?: string;
  password?: string;
  spent_points?: number;
}

export interface HistoryLog {
  log_id: number;
  donor_id: number;
  weight: number | null;
  location: string | null;
  drugs_record: string | null;
  hold_points: number;
  recorded_at: string;
}

export interface HistoryLogCreate {
  donor_id: number;
  weight?: number;
  location?: string;
  drugs_record?: string;
  hold_points?: number;
}

export interface HistoryLogUpdate {
  weight?: number;
  location?: string;
  drugs_record?: string;
  hold_points?: number;
}

export interface DonationRecord {
  record_id: number;
  donor_id: number;
  donation_date: string;
  address: string | null;
  category: string | null;
}

export interface DonationRecordCreate {
  donor_id: number;
  donation_date: string;
  address?: string;
  category?: string;
}

export interface DonationRecordUpdate {
  donor_id?: number;
  donation_date?: string;
  address?: string;
  category?: string;
}

export interface DonationSite {
  site_id: number;
  loca_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  open_time: string | null;
  close_time: string | null;
  open_days: string | null;
  hours_note: string | null;
  category: string | null;
}

export interface DonationSiteNearby extends DonationSite {
  is_open: boolean;
  navigation_url: string;
  distance_km: number | null;
}

export interface Reward {
  gift_id: number;
  gift_item: string;
  needed_points: number;
}

export interface DonorRanking {
  rank: number;
  donor_id: number;
  nickname: string;
  cumulative_points: number;
  current_points: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface Admin {
  admin_id: number;
  username: string;
  display_name: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  message: string;
  admin: Admin;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

const json = (body: unknown) => JSON.stringify(body);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = (data: LoginRequest) =>
  request<LoginResponse>("/auth/login", { method: "POST", body: json(data) });

export const adminLogin = (data: AdminLoginRequest) =>
  request<AdminLoginResponse>("/admin/login", { method: "POST", body: json(data) });

// ── Users ─────────────────────────────────────────────────────────────────────

export const getUser = (donor_id: number) =>
  request<User>(`/users/${donor_id}`);

export const getUsers = (limit = 200, offset = 0) =>
  request<User[]>(`/users?limit=${limit}&offset=${offset}`);

export const createUser = (data: UserCreate) =>
  request<{ message: string; donor_id: number }>("/users/", {
    method: "POST",
    body: json(data),
  });

export const updateUser = (donor_id: number, data: UserUpdate) =>
  request<{ message: string }>(`/users/${donor_id}`, {
    method: "PUT",
    body: json(data),
  });

export const deleteUser = (donor_id: number) =>
  request<{ message: string }>(`/users/${donor_id}`, { method: "DELETE" });

// ── Donations ─────────────────────────────────────────────────────────────────

export const getDonationsByUser = (donor_id: number, limit = 50, offset = 0) =>
  request<DonationRecord[]>(
    `/donations/user/${donor_id}?limit=${limit}&offset=${offset}`
  );

export const getDonations = (limit = 200, offset = 0) =>
  request<DonationRecord[]>(`/donations?limit=${limit}&offset=${offset}`);

export const createDonation = (data: DonationRecordCreate, adminId: number) =>
  request<DonationRecord>(`/donations?admin_id=${adminId}`, { method: "POST", body: json(data) });

export const updateDonation = (record_id: number, data: DonationRecordUpdate, adminId: number) =>
  request<DonationRecord>(`/donations/${record_id}?admin_id=${adminId}`, {
    method: "PUT",
    body: json(data),
  });

export const deleteDonation = (record_id: number, adminId: number) =>
  request<{ message: string }>(`/donations/${record_id}?admin_id=${adminId}`, { method: "DELETE" });

// ── Sites ─────────────────────────────────────────────────────────────────────

export const getSites = (opts?: { available_at?: string }) => {
  const p = new URLSearchParams();
  if (opts?.available_at) p.set("available_at", opts.available_at);
  const qs = p.toString();
  return request<DonationSite[]>(`/sites${qs ? `?${qs}` : ""}`);
};

export const getOpenSites = () => request<DonationSiteNearby[]>("/sites/open");

export const getNearbySites = (params: {
  latitude: number;
  longitude: number;
  radius_km?: number;
  open_only?: boolean;
  category?: string;
  available_at?: string;
}) => {
  const q = new URLSearchParams({
    latitude: params.latitude.toString(),
    longitude: params.longitude.toString(),
    radius_km: (params.radius_km ?? 5).toString(),
    open_only: (params.open_only ?? false).toString(),
  });
  if (params.category) q.set("category", params.category);
  if (params.available_at) q.set("available_at", params.available_at);
  return request<DonationSiteNearby[]>(`/sites/nearby?${q}`);
};

// ── Rewards ───────────────────────────────────────────────────────────────────

export const getRewards = (opts?: { q?: string; max_points?: number }) => {
  const p = new URLSearchParams();
  if (opts?.q) p.set("q", opts.q);
  if (opts?.max_points !== undefined) p.set("max_points", opts.max_points.toString());
  const qs = p.toString();
  return request<Reward[]>(`/rewards${qs ? `?${qs}` : ""}`);
};

export const getEligibleRewards = (donor_id: number) =>
  request<Reward[]>(`/rewards/donors/${donor_id}/eligible`);

export const getDonorLeaderboard = (limit = 5) =>
  request<DonorRanking[]>(`/rewards/leaderboard?limit=${limit}`);

// ── Health logs ───────────────────────────────────────────────────────────────

export const getHealthLogsByDonor = (donor_id: number, limit = 100, offset = 0) =>
  request<HistoryLog[]>(
    `/health/donor/${donor_id}?limit=${limit}&offset=${offset}`
  );

export const createHealthLog = (data: HistoryLogCreate) =>
  request<HistoryLog>("/health", { method: "POST", body: json(data) });

export const updateHealthLog = (log_id: number, data: HistoryLogUpdate) =>
  request<HistoryLog>(`/health/${log_id}`, { method: "PUT", body: json(data) });

export const deleteHealthLog = (log_id: number) =>
  request<{ message: string }>(`/health/${log_id}`, { method: "DELETE" });
