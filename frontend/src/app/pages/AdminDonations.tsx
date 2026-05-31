import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate } from "react-router";
import { AlertCircle, CheckCircle, FileText, LogOut, Save, ShieldCheck, Trash2 } from "lucide-react";
import {
  createDonation,
  deleteDonation,
  getDonations,
  getSites,
  getUsers,
  updateDonation,
  type DonationRecord,
  type DonationSite,
  type User,
} from "@/api";
import { useAdmin } from "@/context/AdminContext";

interface DonationForm {
  donor_id: string;
  donation_date: string;
  address: string;
  category: string;
  donor_weight: string;
}

const EMPTY_FORM: DonationForm = {
  donor_id: "",
  donation_date: "",
  address: "",
  category: "",
  donor_weight: "",
};

const DONATION_CATEGORIES = [
  "全血（250cc）",
  "全血（500cc）",
  "血小板",
  "血漿",
  "血小板血漿（單採）",
];

function intervalDaysForCategory(category: string) {
  if (category === "全血（250cc）") return 60;
  if (category === "全血（500cc）") return 90;
  return 14;
}

function addDays(value: string, days: number) {
  const d = new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function inputCls(err?: string) {
  return `w-full bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none font-medium text-slate-700 transition-colors ${
    err ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-sky-400"
  }`;
}

function validateDonation(
  f: DonationForm,
  donor: User | undefined,
  donations: DonationRecord[],
  editingId?: number | null,
) {
  const errors: Record<string, string> = {};
  if (!f.donor_id) errors.donor_id = "請選擇捐血者";
  if (!f.donation_date) errors.donation_date = "請選擇捐血日期";
  else if (new Date(f.donation_date) > new Date()) errors.donation_date = "日期不得為未來";
  if (!f.category) errors.category = "請選擇捐血種類";
  const weight = Number(f.donor_weight);
  if (!f.donor_weight) errors.donor_weight = "請輸入本次體重";
  else if (!Number.isFinite(weight) || weight <= 0) errors.donor_weight = "體重必須大於 0";
  else if (f.category === "全血（500cc）" && weight < 60) errors.donor_weight = "全血（500cc）需 60 公斤以上";
  else if (f.category === "全血（250cc）" && weight < 45) errors.donor_weight = "全血（250cc）需 45 公斤以上";
  if (donor && f.donation_date && f.category) {
    const donorRecords = donations
      .filter((d) => d.donor_id === donor.donor_id && d.record_id !== editingId)
      .sort((a, b) => a.donation_date.localeCompare(b.donation_date) || a.record_id - b.record_id);
    const previous = [...donorRecords].reverse().find((d) => d.donation_date < f.donation_date);
    const next = donorRecords.find((d) => d.donation_date > f.donation_date);
    const sameDay = donorRecords.find((d) => d.donation_date === f.donation_date);

    if (sameDay) {
      errors.donation_date = "同一天已有捐血紀錄";
    } else if (previous?.category) {
      const allowed = addDays(previous.donation_date, intervalDaysForCategory(previous.category));
      if (f.donation_date < allowed) {
        errors.donation_date = `距離上次 ${previous.category} 未達間隔，最早可捐日期為 ${allowed}`;
      }
    }

    if (!errors.donation_date && next?.category) {
      const allowedNext = addDays(f.donation_date, intervalDaysForCategory(f.category));
      if (next.donation_date < allowedNext) {
        errors.donation_date = `此紀錄會讓下一筆捐血未達間隔，下一筆最早應為 ${allowedNext}`;
      }
    }
  }
  if (f.address.length > 200) errors.address = "地址不得超過 200 字";
  return errors;
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  );
}

export function AdminDonations() {
  const { admin, logoutAdmin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [sites, setSites] = useState<DonationSite[]>([]);
  const [form, setForm] = useState<DonationForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const userById = useMemo(
    () => new Map(users.map((u) => [u.donor_id, u])),
    [users],
  );

  useEffect(() => {
    if (!admin) {
      setIsLoading(false);
      return;
    }

    Promise.all([getUsers(), getDonations(), getSites()])
      .then(([u, d, s]) => {
        setUsers(u);
        setDonations(d);
        setSites(s);
      })
      .catch(() => setError("無法載入管理資料"))
      .finally(() => setIsLoading(false));
  }, [admin]);

  if (!admin) return <Navigate to="/admin/login" replace />;

  const refreshDonations = async () => {
    const [u, d] = await Promise.all([getUsers(), getDonations()]);
    setUsers(u);
    setDonations(d);
  };


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (record: DonationRecord) => {
    setEditingId(record.record_id);
    setForm({
      donor_id: String(record.donor_id),
      donation_date: record.donation_date,
      address: record.address ?? "",
      category: record.category ?? "",
      donor_weight: record.donor_weight != null ? String(record.donor_weight) : "",
    });
    setErrors({});
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const selectedDonor = userById.get(Number(form.donor_id));
    const nextErrors = validateDonation(form, selectedDonor, donations, editingId);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        donor_id: Number(form.donor_id),
        donation_date: form.donation_date,
        ...(form.address ? { address: form.address } : {}),
        category: form.category,
        donor_weight: Number(form.donor_weight),
      };

      if (editingId) {
        await updateDonation(editingId, payload, admin.admin_id);
        setMessage("捐血紀錄已更新");
      } else {
        await createDonation(payload, admin.admin_id);
        setMessage("捐血紀錄已新增");
      }

      resetForm();
      await refreshDonations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm("確定要刪除此捐血紀錄？")) return;
    setError("");
    setMessage("");
    try {
      await deleteDonation(recordId, admin.admin_id);
      if (editingId === recordId) resetForm();
      await refreshDonations();
      setMessage("捐血紀錄已刪除");
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
    }
  };

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-1.5 text-sm font-bold text-slate-500 mb-4">
              <ShieldCheck className="h-4 w-4 text-rose-500" />
              管理員
            </div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-3">捐血紀錄審核</h1>
            <p className="text-lg text-slate-600 font-medium">新增、修改與刪除使用者捐血紀錄。</p>
          </div>
          <button
            onClick={logoutAdmin}
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-2xl hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            登出 {admin.display_name}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
          </div>
        )}
        {message && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <CheckCircle className="h-5 w-5 flex-shrink-0" /> {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-max">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-5">
              <FileText className="h-5 w-5 text-sky-500" />
              {editingId ? "修改紀錄" : "新增紀錄"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">捐血者 *</label>
                <select name="donor_id" value={form.donor_id} onChange={handleChange} className={inputCls(errors.donor_id)}>
                  <option value="">請選擇</option>
                  {users.map((u) => (
                    <option key={u.donor_id} value={u.donor_id}>
                      {u.name}（#{u.donor_id}）
                    </option>
                  ))}
                </select>
                <ErrMsg msg={errors.donor_id} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">捐血日期 *</label>
                <input
                  type="date"
                  name="donation_date"
                  value={form.donation_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className={inputCls(errors.donation_date)}
                />
                <ErrMsg msg={errors.donation_date} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">捐血類型</label>
                <select name="category" value={form.category} onChange={handleChange} className={inputCls(errors.category)}>
                  <option value="">請選擇</option>
                  {DONATION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ErrMsg msg={errors.category} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">本次體重（公斤）*</label>
                <input
                  type="number"
                  name="donor_weight"
                  value={form.donor_weight}
                  onChange={handleChange}
                  min="1"
                  step="0.1"
                  className={inputCls(errors.donor_weight)}
                  placeholder="例如 60"
                />
                <ErrMsg msg={errors.donor_weight} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">地點</label>
                <select name="address" value={form.address} onChange={handleChange} className={inputCls(errors.address)}>
                  <option value="">（不填）</option>
                  {sites.map((s) => (
                    <option key={s.site_id} value={s.loca_name}>
                      {s.loca_name}
                    </option>
                  ))}
                </select>
                <ErrMsg msg={errors.address} />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "儲存中…" : editingId ? "更新紀錄" : "新增紀錄"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  取消
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-800">全部捐血紀錄</h2>
              <span className="text-sm font-bold text-slate-400">共 {donations.length} 筆</span>
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-slate-400 font-bold">載入中…</div>
            ) : donations.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl text-slate-500 font-medium">尚無捐血紀錄</div>
            ) : (
              <div className="space-y-3">
                {donations.map((d) => {
                  const donor = userById.get(d.donor_id);
                  return (
                    <div key={d.record_id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-800">{d.donation_date}</span>
                          <span className="text-xs font-bold text-slate-400">#{d.record_id}</span>
                          {d.category && (
                            <span className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded">
                              {d.category}
                            </span>
                          )}
                          {d.donor_weight != null && (
                            <span className="inline-block bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">
                              {d.donor_weight} kg
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          {donor?.nickname ?? donor?.name ?? `捐血者 #${d.donor_id}`} · {d.address || "地點未記錄"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(d)}
                          className="px-3 py-2 rounded-xl text-sm font-bold bg-sky-50 text-sky-600 hover:bg-sky-100"
                        >
                          修改
                        </button>
                        <button
                          onClick={() => handleDelete(d.record_id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50"
                          title="刪除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
