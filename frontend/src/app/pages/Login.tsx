import { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router";
import { Heart, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { login as apiLogin, createUser, BLOOD_TYPES, type BloodType, type UserCreate } from "@/api";
import { useAuth } from "@/context/AuthContext";

type Tab = "login" | "register";

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v: string) {
  const digits = v.replace(/[\s\-+() ]/g, "");
  return /^\d{10}$/.test(digits);
}

function ageFromBirthday(birthday: string): number {
  const today = new Date();
  const birth = new Date(birthday);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function validateLogin(email: string, password: string) {
  const errors: Record<string, string> = {};
  if (!email.trim()) errors.email = "請輸入 Email";
  else if (!isValidEmail(email)) errors.email = "Email 格式不正確";
  if (!password) errors.password = "請輸入密碼";
  return errors;
}

function validateRegister(form: RegisterForm) {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) errors.name = "請輸入姓名";
  else if (form.name.trim().length > 100) errors.name = "姓名不得超過 100 字";

  if (!form.nickname.trim()) errors.nickname = "請輸入暱稱";
  else if (form.nickname.trim().length > 50) errors.nickname = "暱稱不得超過 50 字";

  if (!form.gender) errors.gender = "請選擇性別";

  if (!form.birthday) errors.birthday = "請輸入生日";
  else if (new Date(form.birthday) > new Date()) errors.birthday = "生日不得為未來日期";
  else if (ageFromBirthday(form.birthday) < 17) errors.birthday = "須年滿 17 歲才可捐血";
  else if (ageFromBirthday(form.birthday) > 100) errors.birthday = "生日日期不合理";

  if (!form.blood_type) errors.blood_type = "請選擇血型";

  if (!form.phone.trim()) errors.phone = "請輸入電話";
  else if (!isValidPhone(form.phone)) errors.phone = "電話需為 10 碼數字";

  if (!form.email.trim()) errors.email = "請輸入 Email";
  else if (!isValidEmail(form.email)) errors.email = "Email 格式不正確";

  if (!form.password) errors.password = "請輸入密碼";
  else if (form.password.length < 6) errors.password = "密碼至少 6 個字元";
  else if (form.password.length > 100) errors.password = "密碼不得超過 100 字元";

  if (form.weight !== "") {
    const w = Number(form.weight);
    if (isNaN(w) || w <= 0) errors.weight = "請輸入有效體重";
    else if (w < 30 || w > 300) errors.weight = "體重需介於 30 ~ 300 公斤";
  }

  return errors;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RegisterForm {
  name: string;
  nickname: string;
  gender: string;
  birthday: string;
  blood_type: BloodType | "";
  phone: string;
  email: string;
  password: string;
  weight: string;
}

const EMPTY_REGISTER: RegisterForm = {
  name: "",
  nickname: "",
  gender: "",
  birthday: "",
  blood_type: "",
  phone: "",
  email: "",
  password: "",
  weight: "",
};

// ── Shared UI ────────────────────────────────────────────────────────────────

function inputCls(err?: string) {
  return `w-full px-4 py-2.5 rounded-xl border-2 font-medium text-slate-700 bg-slate-50 focus:outline-none focus:bg-white transition-colors ${
    err ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-rose-400"
  }`;
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Register state
  const [regForm, setRegForm] = useState<RegisterForm>(EMPTY_REGISTER);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const { setUser } = useAuth();
  const navigate = useNavigate();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRegChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
    if (regErrors[name]) setRegErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError("");
    const errs = validateLogin(loginEmail, loginPassword);
    if (Object.keys(errs).length > 0) { setLoginErrors(errs); return; }
    setLoginErrors({});
    setIsLoading(true);
    try {
      const res = await apiLogin({ email: loginEmail.trim(), password: loginPassword });
      setUser(res.user);
      navigate("/");
    } catch (err) {
      setApiError(err instanceof Error ? err.detail ?? err.message : "登入失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError("");
    const errs = validateRegister(regForm);
    if (Object.keys(errs).length > 0) { setRegErrors(errs); return; }
    setRegErrors({});
    setIsLoading(true);
    try {
      const payload: UserCreate = {
        name: regForm.name.trim(),
        nickname: regForm.nickname.trim(),
        gender: regForm.gender,
        birthday: regForm.birthday,
        blood_type: regForm.blood_type as BloodType,
        phone: regForm.phone.trim(),
        email: regForm.email.trim(),
        password: regForm.password,
        ...(regForm.weight !== "" ? { weight: Number(regForm.weight) } : {}),
      };
      await createUser(payload);
      // Auto-login after register
      const res = await apiLogin({ email: payload.email, password: payload.password });
      setUser(res.user);
      navigate("/profile");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "註冊失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-2.5 rounded-2xl shadow-md text-white">
              <Heart className="h-7 w-7 fill-white" />
            </div>
            <span className="font-extrabold text-2xl text-slate-800">
              滴滴<span className="text-rose-500">愛心</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setApiError(""); }}
                className={`flex-1 py-4 font-bold text-base transition-colors ${
                  tab === t
                    ? "text-rose-600 border-b-2 border-rose-500 bg-rose-50/50"
                    : "text-slate-500 hover:text-rose-500"
                }`}
              >
                {t === "login" ? "登入" : "註冊新帳號"}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* API error banner */}
            {apiError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {apiError}
              </div>
            )}

            {/* ── Login form ── */}
            {tab === "login" && (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-5">
                <Field label="Email" error={loginErrors.email} required>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: "" })); }}
                    className={inputCls(loginErrors.email)}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </Field>

                <Field label="密碼" error={loginErrors.password} required>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: "" })); }}
                      className={inputCls(loginErrors.password) + " pr-12"}
                      placeholder="請輸入密碼"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-rose-500 text-white font-bold text-lg shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-colors disabled:opacity-60"
                >
                  {isLoading ? "登入中…" : "登入"}
                </button>

                <Link
                  to="/admin/login"
                  className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-base hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-5 w-5 text-rose-500" />
                  管理員登入
                </Link>
              </form>
            )}

            {/* ── Register form ── */}
            {tab === "register" && (
              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="姓名" error={regErrors.name} required>
                    <input
                      name="name"
                      value={regForm.name}
                      onChange={handleRegChange}
                      className={inputCls(regErrors.name)}
                      placeholder="王小明"
                      maxLength={100}
                    />
                  </Field>

                  <Field label="暱稱" error={regErrors.nickname} required>
                    <input
                      name="nickname"
                      value={regForm.nickname}
                      onChange={handleRegChange}
                      className={inputCls(regErrors.nickname)}
                      placeholder="排行榜顯示名稱"
                      maxLength={50}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="性別" error={regErrors.gender} required>
                    <select
                      name="gender"
                      value={regForm.gender}
                      onChange={handleRegChange}
                      className={inputCls(regErrors.gender)}
                    >
                      <option value="">請選擇</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="生日" error={regErrors.birthday} required>
                    <input
                      type="date"
                      name="birthday"
                      value={regForm.birthday}
                      onChange={handleRegChange}
                      className={inputCls(regErrors.birthday)}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </Field>

                  <Field label="血型" error={regErrors.blood_type} required>
                    <select
                      name="blood_type"
                      value={regForm.blood_type}
                      onChange={handleRegChange}
                      className={inputCls(regErrors.blood_type)}
                    >
                      <option value="">請選擇</option>
                      {BLOOD_TYPES.map((bt) => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="電話" error={regErrors.phone} required>
                  <input
                    name="phone"
                    value={regForm.phone}
                    onChange={handleRegChange}
                    className={inputCls(regErrors.phone)}
                    placeholder="0912-345-678"
                    maxLength={20}
                  />
                </Field>

                <Field label="Email" error={regErrors.email} required>
                  <input
                    type="email"
                    name="email"
                    value={regForm.email}
                    onChange={handleRegChange}
                    className={inputCls(regErrors.email)}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </Field>

                <Field label="密碼" error={regErrors.password} required>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      name="password"
                      value={regForm.password}
                      onChange={handleRegChange}
                      className={inputCls(regErrors.password) + " pr-12"}
                      placeholder="至少 6 個字元"
                      autoComplete="new-password"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </Field>

                <Field label="體重 (kg)" error={regErrors.weight}>
                  <input
                    type="number"
                    name="weight"
                    value={regForm.weight}
                    onChange={handleRegChange}
                    className={inputCls(regErrors.weight)}
                    placeholder="選填，例如 60"
                    min={30}
                    max={300}
                    step={0.1}
                  />
                </Field>

                <p className="text-xs text-slate-400 font-medium">
                  標示 <span className="text-rose-500">*</span> 為必填欄位
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-rose-500 text-white font-bold text-lg shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-colors disabled:opacity-60"
                >
                  {isLoading ? "註冊中…" : "建立帳號"}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
