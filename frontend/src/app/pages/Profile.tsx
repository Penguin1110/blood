import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import {
  User, FileText, CalendarHeart, Save, AlertCircle, LogIn, Trash2, CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router";
import {
  getUser, updateUser, deleteUser,
  type User as UserType, type UserUpdate, BLOOD_TYPES, type BloodType,
} from "@/api";
import { useAuth } from "@/context/AuthContext";

// ── Validation ────────────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function isValidPhone(v: string) {
  const digits = v.replace(/[\s\-+() ]/g, "");
  return /^\d{10}$/.test(digits);
}
function ageFromBirthday(d: string) {
  const today = new Date();
  const b = new Date(d);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

interface ProfileEdit {
  name: string;
  nickname: string;
  gender: string;
  birthday: string;
  blood_type: BloodType | "";
  phone: string;
  email: string;
  password: string;
}

function validateProfile(f: ProfileEdit) {
  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "請輸入姓名";
  else if (f.name.trim().length > 100) errors.name = "姓名不得超過 100 字";
  if (!f.nickname.trim()) errors.nickname = "請輸入暱稱";
  else if (f.nickname.trim().length > 50) errors.nickname = "暱稱不得超過 50 字";
  if (!f.gender) errors.gender = "請選擇性別";
  if (!f.birthday) errors.birthday = "請輸入生日";
  else if (ageFromBirthday(f.birthday) < 17) errors.birthday = "須年滿 17 歲";
  if (!f.blood_type) errors.blood_type = "請選擇血型";
  if (!f.phone.trim()) errors.phone = "請輸入電話";
  else if (!isValidPhone(f.phone)) errors.phone = "電話需為 10 碼數字";
  if (!f.email.trim()) errors.email = "請輸入 Email";
  else if (!isValidEmail(f.email)) errors.email = "Email 格式不正確";
  if (f.password && f.password.length < 6) errors.password = "密碼至少 6 個字元";
  return errors;
}

function intervalDaysForCategory(category: string | null) {
  if (category === "全血（500cc）") return 90;
  if (category === "血小板" || category === "血漿" || category === "血小板血漿（單採）") return 14;
  return 60;
}

function calculateNextDonation(lastDate: string | null, lastCategory: string | null) {
  if (!lastDate) return "隨時可捐";
  const d = new Date(lastDate);
  d.setDate(d.getDate() + intervalDaysForCategory(lastCategory));
  if (new Date() >= d) return "隨時可捐";
  return d.toISOString().split("T")[0];
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function inputCls(err?: string) {
  return `w-full bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none font-medium text-slate-700 transition-colors ${
    err ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-sky-400"
  }`;
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Profile() {
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState<ProfileEdit>({
    name: "", nickname: "", gender: "", birthday: "", blood_type: "", phone: "", email: "", password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authUser) { setIsLoading(false); return; }
    getUser(authUser.donor_id)
      .then((u) => {
        setUserData(u);
        setForm({ name: u.name, nickname: u.nickname ?? u.name, gender: u.gender, birthday: u.birthday, blood_type: u.blood_type, phone: u.phone, email: u.email, password: "" });
      })
      .catch(() => setError("無法載入個人資料，請稍後再試"))
      .finally(() => setIsLoading(false));
  }, [authUser]);

  if (!authUser) {
    return (
      <div className="py-12 bg-rose-50/30 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-3xl p-12 shadow-sm border border-slate-100 max-w-md w-full mx-4"
        >
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-4">請先登入</h2>
          <p className="text-slate-600 font-medium mb-8">登入後即可查看及管理您的個人資訊。</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-rose-500 text-white font-bold px-8 py-3 rounded-2xl hover:bg-rose-600 transition-colors shadow-lg">
            <LogIn className="h-5 w-5" /> 前往登入 / 註冊
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-12 bg-rose-50/30 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">載入中…</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="py-12 bg-rose-50/30 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-12 shadow-sm border border-slate-100 max-w-md w-full mx-4">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">{error || "無法載入個人資料，請稍後再試"}</p>
        </div>
      </div>
    );
  }

  const u = userData;
  const nextDate = calculateNextDonation(u.last_date, u.last_category);
  const canDonate = nextDate === "隨時可捐";

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateProfile(form);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setIsSaving(true);
    setError("");
    try {
      const payload: UserUpdate = {
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        gender: form.gender,
        birthday: form.birthday,
        blood_type: form.blood_type as BloodType,
        phone: form.phone.trim(),
        email: form.email.trim(),
        ...(form.password ? { password: form.password } : {}),
      };
      await updateUser(u.donor_id, payload);
      const refreshed = await getUser(u.donor_id);
      setUserData(refreshed);
      setAuthUser(refreshed);
      setForm((p) => ({ ...p, password: "" }));
      setIsEditing(false);
      setSuccessMsg("個人資料已更新");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await deleteUser(u.donor_id);
      logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3">個人資訊</h1>
          <p className="text-lg text-slate-600 font-medium">管理您的帳號基本資料。</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 font-medium flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Donation status */}
        <div className={`rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border mb-8 ${
          canDonate ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${canDonate ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
              <CalendarHeart className="h-7 w-7" />
            </div>
            <div>
              <p className={`font-bold ${canDonate ? "text-emerald-700" : "text-blue-700"}`}>
                {canDonate ? "目前可以捐血！" : "請等候間隔期結束"}
              </p>
              <p className="text-sm mt-0.5 opacity-80">
                上次捐血：{u.last_date ?? "尚無紀錄"}{u.last_category ? `（${u.last_category}）` : ""}
              </p>
            </div>
          </div>
          <div className={`px-5 py-2.5 rounded-2xl font-extrabold text-lg ${canDonate ? "bg-emerald-500 text-white shadow-md" : "bg-blue-100 text-blue-800"}`}>
            下次可捐：{nextDate}
          </div>
        </div>

        {/* Basic info card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-sky-500" /> 基本資料
            </h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-sky-600 font-bold hover:bg-sky-50 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1 transition-colors">
                <FileText className="h-4 w-4" /> 編輯
              </button>
            ) : (
              <button onClick={() => { setIsEditing(false); setFormErrors({}); }} className="text-slate-400 font-bold hover:bg-slate-50 px-3 py-1.5 rounded-xl text-sm transition-colors">
                取消
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">姓名 *</label>
                <input name="name" value={form.name} onChange={handleChange} className={inputCls(formErrors.name)} maxLength={100} />
                <ErrMsg msg={formErrors.name} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">暱稱 *</label>
                <input name="nickname" value={form.nickname} onChange={handleChange} className={inputCls(formErrors.nickname)} maxLength={50} />
                <ErrMsg msg={formErrors.nickname} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">性別 *</label>
                <select name="gender" value={form.gender} onChange={handleChange} className={inputCls(formErrors.gender)}>
                  <option value="">請選擇</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
                <ErrMsg msg={formErrors.gender} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">生日 *</label>
                <input type="date" name="birthday" value={form.birthday} onChange={handleChange} className={inputCls(formErrors.birthday)} />
                <ErrMsg msg={formErrors.birthday} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">血型 *</label>
                <select name="blood_type" value={form.blood_type} onChange={handleChange} className={inputCls(formErrors.blood_type)}>
                  <option value="">請選擇</option>
                  {BLOOD_TYPES.map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
                <ErrMsg msg={formErrors.blood_type} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">電話 *</label>
                <input name="phone" value={form.phone} onChange={handleChange} className={inputCls(formErrors.phone)} maxLength={20} placeholder="0912345678" />
                <ErrMsg msg={formErrors.phone} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className={inputCls(formErrors.email)} />
                <ErrMsg msg={formErrors.email} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">新密碼（留空不變更）</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className={inputCls(formErrors.password)} placeholder="至少 6 個字元" maxLength={100} />
                <ErrMsg msg={formErrors.password} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-2xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                  <Save className="h-4 w-4" />
                  {isSaving ? "儲存中…" : "儲存變更"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow label="姓名" value={u.name} />
              <InfoRow label="暱稱" value={u.nickname ?? u.name} />
              <InfoRow label="性別" value={u.gender} />
              <InfoRow label="血型" value={<span className="inline-block bg-rose-100 text-rose-600 font-extrabold px-3 py-0.5 rounded-lg">{u.blood_type}</span>} />
              <InfoRow label="生日" value={u.birthday} />
              <InfoRow label="電話" value={u.phone} />
              <InfoRow label="Email" value={u.email} />
            </div>
          )}
        </div>

        {/* Delete account */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100">
          <h2 className="text-lg font-extrabold text-rose-600 flex items-center gap-2 mb-3">
            <Trash2 className="h-5 w-5" /> 刪除帳號
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-4">
            刪除後，所有個人資料、健康履歷及捐血紀錄將永久刪除，且無法復原。
          </p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-5 py-2 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors text-sm"
            >
              刪除我的帳號
            </button>
          ) : (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
              <p className="font-bold text-rose-700 mb-3">確定要刪除帳號？此操作無法復原。</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-500 text-white font-bold py-2 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-60"
                >
                  {isDeleting ? "刪除中…" : "確認刪除"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 mb-1">{label}</label>
      <div className="font-bold text-slate-700 break-all">{value}</div>
    </div>
  );
}
