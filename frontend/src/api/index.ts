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
  id_number: string | null;
  gender: string;
  birthday: string;
  blood_type: BloodType;
  phone: string;
  email: string;
  last_date: string | null;
  last_category: string | null;
}

export interface UserCreate {
  name: string;
  nickname: string;
  id_number: string;
  gender: string;
  birthday: string;
  blood_type: BloodType;
  phone: string;
  email: string;
  password: string;
}

export interface UserUpdate {
  name?: string;
  nickname?: string;
  id_number?: string;
  gender?: string;
  birthday?: string;
  blood_type?: BloodType;
  phone?: string;
  email?: string;
  password?: string;
}

export interface HistoryLog {
  log_id: number;
  donor_id: number;
  has_cold_or_infection: boolean;
  had_dental_treatment: boolean;
  had_surgery_or_transfusion: boolean;
  taking_medication: boolean;
  had_vaccine_or_injection: boolean;
  pregnancy_or_postpartum: boolean;
  unexplained_weight_loss: boolean;
  had_tattoo_piercing: boolean;
  traveled_epidemic_area: boolean;
  contact_infectious_disease: boolean;
  high_risk_behavior: boolean;
  understood_process_and_risk: boolean;
  consent_blood_donation: boolean;
  consent_medical_reuse: boolean;
  recorded_at: string;
}

export interface HistoryLogCreate {
  donor_id: number;
  has_cold_or_infection?: boolean;
  had_dental_treatment?: boolean;
  had_surgery_or_transfusion?: boolean;
  taking_medication?: boolean;
  had_vaccine_or_injection?: boolean;
  pregnancy_or_postpartum?: boolean;
  unexplained_weight_loss?: boolean;
  had_tattoo_piercing?: boolean;
  traveled_epidemic_area?: boolean;
  contact_infectious_disease?: boolean;
  high_risk_behavior?: boolean;
  understood_process_and_risk?: boolean;
  consent_blood_donation?: boolean;
  consent_medical_reuse?: boolean;
}

export interface HistoryLogUpdate {
  has_cold_or_infection?: boolean;
  had_dental_treatment?: boolean;
  had_surgery_or_transfusion?: boolean;
  taking_medication?: boolean;
  had_vaccine_or_injection?: boolean;
  pregnancy_or_postpartum?: boolean;
  unexplained_weight_loss?: boolean;
  had_tattoo_piercing?: boolean;
  traveled_epidemic_area?: boolean;
  contact_infectious_disease?: boolean;
  high_risk_behavior?: boolean;
  understood_process_and_risk?: boolean;
  consent_blood_donation?: boolean;
  consent_medical_reuse?: boolean;
}

export interface Question {
  question_id: number;
  question_no: string;
  question_text: string;
  question_category: string;
  answer_key: string;
}

export interface SurveyAnswer {
  answer_id: number;
  log_id: number;
  question_id: number;
  answer_value: boolean;
}

export interface DonationRecord {
  record_id: number;
  donor_id: number;
  donation_date: string;
  address: string | null;
  category: string | null;
  donor_weight: number | null;
  created_by: number | null;
}

export interface DonationRecordCreate {
  donor_id: number;
  donation_date: string;
  address?: string;
  category?: string;
  donor_weight?: number;
}

export interface DonationRecordUpdate {
  donor_id?: number;
  donation_date?: string;
  address?: string;
  category?: string;
  donor_weight?: number;
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

export interface SiteGift {
  site_gift_id: number;
  site_id: number;
  gift_id: number;
  gift_item: string;
  needed_points: number;
  quantity: number;
}

export interface Transportation {
  trans_id: number;
  site_id: number;
  trans_type: string;
  description: string;
  sort_order: number;
}

export interface DonorRanking {
  rank: number;
  donor_id: number;
  nickname: string;
  cumulative_points: number;
  current_points: number;
}

export interface PointSummary {
  donor_id: number;
  cumulative_points: number;
  current_points: number;
}

export interface RedemptionRecord {
  redemption_id: number;
  donor_id: number;
  gift_id: number;
  site_id: number | null;
  points_spent: number;
  redeemed_at: string;
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

export const getSites = (opts?: {
  available_date?: string;
  available_from?: string;
  available_to?: string;
  available_at?: string;
}) => {
  const p = new URLSearchParams();
  if (opts?.available_date) p.set("available_date", opts.available_date);
  if (opts?.available_from) p.set("available_from", opts.available_from);
  if (opts?.available_to) p.set("available_to", opts.available_to);
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
  available_date?: string;
  available_from?: string;
  available_to?: string;
  available_at?: string;
}) => {
  const q = new URLSearchParams({
    latitude: params.latitude.toString(),
    longitude: params.longitude.toString(),
    radius_km: (params.radius_km ?? 5).toString(),
    open_only: (params.open_only ?? false).toString(),
  });
  if (params.category) q.set("category", params.category);
  if (params.available_date) q.set("available_date", params.available_date);
  if (params.available_from) q.set("available_from", params.available_from);
  if (params.available_to) q.set("available_to", params.available_to);
  if (params.available_at) q.set("available_at", params.available_at);
  return request<DonationSiteNearby[]>(`/sites/nearby?${q}`);
};

export const getSiteTransportation = (site_id: number) =>
  request<Transportation[]>(`/sites/transportation/${site_id}`);

export const getAllTransportation = () =>
  request<Transportation[]>("/sites/transportation");

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

export const getDonorPoints = (donor_id: number) =>
  request<PointSummary>(`/rewards/donors/${donor_id}/points`);

export const getDonorLeaderboard = (limit = 5) =>
  request<DonorRanking[]>(`/rewards/leaderboard?limit=${limit}`);

export const getRedemptionsByDonor = (donor_id: number, limit = 50, offset = 0) =>
  request<RedemptionRecord[]>(`/rewards/donors/${donor_id}/redemptions?limit=${limit}&offset=${offset}`);

export const redeemReward = (data: { donor_id: number; gift_id: number; site_id?: number }) =>
  request<RedemptionRecord>("/rewards/redeem", { method: "POST", body: json(data) });

export const getSiteGifts = (site_id: number) =>
  request<SiteGift[]>(`/rewards/sites/${site_id}`);

// ── Health logs ───────────────────────────────────────────────────────────────

export const getHealthLogsByDonor = (donor_id: number, limit = 100, offset = 0) =>
  request<HistoryLog[]>(
    `/health/donor/${donor_id}?limit=${limit}&offset=${offset}`
  );

export const getQuestions = () =>
  request<Question[]>("/health/questions");

export const getSurveyAnswers = (log_id: number) =>
  request<SurveyAnswer[]>(`/health/${log_id}/answers`);

export const createHealthLog = (data: HistoryLogCreate) =>
  request<HistoryLog>("/health", { method: "POST", body: json(data) });

export const updateHealthLog = (log_id: number, data: HistoryLogUpdate) =>
  request<HistoryLog>(`/health/${log_id}`, { method: "PUT", body: json(data) });

export const deleteHealthLog = (log_id: number) =>
  request<{ message: string }>(`/health/${log_id}`, { method: "DELETE" });
