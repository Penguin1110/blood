import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import {
  Activity, FileText, Save, AlertCircle, LogIn, Droplets, Plus, Trash2, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  getUser,
  getHealthLogsByDonor, createHealthLog, updateHealthLog, deleteHealthLog,
  getDonationsByUser, createDonation, deleteDonation,
  type HistoryLog, type DonationRecord,
} from "@/api";
import { useAuth } from "@/context/AuthContext";

// ── Points ────────────────────────────────────────────────────────────────────

function pointsForCategory(category: string): number {
  switch (category) {
    case "血小板":
    case "血小板血漿":
      return 60;
    case "血漿":
      return 40;
    default:
      return 50; // 全血 or unspecified
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

interface HealthEdit {
  drugs_record: string;
  location: string;
  weight: string;
}

interface DonationForm {
  donation_date: string;
  address: string;
  category: string;
}

function validateHealth(f: HealthEdit) {
  const errors: Record<string, string> = {};
  if (f.weight !== "") {
    const w = Number(f.weight);
    if (isNaN(w) || w <= 0) errors.weight = "請輸入有效體重";
    else if (w < 30 || w > 300) errors.weight = "體重需介於 30 ~ 300 公斤";
  }
  if (f.location.length > 100) errors.location = "旅遊史不得超過 100 字";
  return errors;
}

function validateDonation(f: DonationForm) {
  const errors: Record<string, string> = {};
  if (!f.donation_date) errors.donation_date = "請選擇捐血日期";
  else if (new Date(f.donation_date) > new Date()) errors.donation_date = "日期不得為未來";
  if (f.address.length > 200) errors.address = "地址不得超過 200 字";
  return errors;
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

export function Records() {
  const { user: authUser, setUser: setAuthUser } = useAuth();

  const [healthLogs, setHealthLogs] = useState<HistoryLog[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingHealth, setIsSavingHealth] = useState(false);
  const [isSavingDonation, setIsSavingDonation] = useState(false);
  const [deletingHealthId, setDeletingHealthId] = useState<number | null>(null);
  const [deletingDonationId, setDeletingDonationId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [isAddingDonation, setIsAddingDonation] = useState(false);
  const [showNoHealthNotice, setShowNoHealthNotice] = useState(false);

  const [healthForm, setHealthForm] = useState<HealthEdit>({
    drugs_record: "", location: "", weight: "",
  });
  const [healthErrors, setHealthErrors] = useState<Record<string, string>>({});

  const [donationForm, setDonationForm] = useState<DonationForm>({
    donation_date: "", address: "", category: "",
  });
  const [donationErrors, setDonationErrors] = useState<Record<string, string>>({});

  const latestLog = healthLogs[0] ?? null;

  useEffect(() => {
    if (!authUser) { setIsLoading(false); return; }

    Promise.all([
      getHealthLogsByDonor(authUser.donor_id),
      getDonationsByUser(authUser.donor_id),
    ])
      .then(([logs, dons]) => {
        setHealthLogs(logs);
        setDonations(dons);
        const latest = logs[0];
        setHealthForm({
          drugs_record: latest?.drugs_record ?? "",
          location: latest?.location ?? "",
          weight: latest?.weight != null ? String(latest.weight) : "",
        });
        const hasData = latest && (latest.drugs_record || latest.location || latest.weight != null);
        if (!hasData) setShowNoHealthNotice(true);
      })
      .catch(() => setError("無法載入紀錄，請稍後再試"))
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
          <p className="text-slate-600 font-medium mb-8">登入後即可管理健康履歷與捐血紀錄。</p>
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

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleHealthChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHealthForm((p) => ({ ...p, [name]: value }));
    if (healthErrors[name]) setHealthErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleDonationChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDonationForm((p) => ({ ...p, [name]: value }));
    if (donationErrors[name]) setDonationErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSaveHealth = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateHealth(healthForm);
    if (Object.keys(errs).length > 0) { setHealthErrors(errs); return; }
    setIsSavingHealth(true);
    setError("");
    try {
      const payload = {
        drugs_record: healthForm.drugs_record || undefined,
        location: healthForm.location || undefined,
        weight: healthForm.weight !== "" ? Number(healthForm.weight) : undefined,
      };
      if (latestLog) {
        await updateHealthLog(latestLog.log_id, payload);
      } else {
        await createHealthLog({ donor_id: authUser.donor_id, ...payload });
      }
      const logs = await getHealthLogsByDonor(authUser.donor_id);
      setHealthLogs(logs);
      setIsEditingHealth(false);
      setShowNoHealthNotice(false);
      setSuccessMsg("健康履歷已更新");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗，請稍後再試");
    } finally {
      setIsSavingHealth(false);
    }
  };

  const handleDeleteHealthLog = async (log_id: number) => {
    if (!confirm("確定要刪除此健康紀錄？")) return;
    setDeletingHealthId(log_id);
    setError("");
    try {
      await deleteHealthLog(log_id);
      const logs = await getHealthLogsByDonor(authUser.donor_id);
      setHealthLogs(logs);
      const latest = logs[0];
      setHealthForm({
        drugs_record: latest?.drugs_record ?? "",
        location: latest?.location ?? "",
        weight: latest?.weight != null ? String(latest.weight) : "",
      });
      const hasData = latest && (latest.drugs_record || latest.location || latest.weight != null);
      if (!hasData) setShowNoHealthNotice(true);
      setSuccessMsg("健康紀錄已刪除");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
    } finally {
      setDeletingHealthId(null);
    }
  };

  const handleAddDonation = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateDonation(donationForm);
    if (Object.keys(errs).length > 0) { setDonationErrors(errs); return; }
    setIsSavingDonation(true);
    setError("");
    try {
      await createDonation({
        donor_id: authUser.donor_id,
        donation_date: donationForm.donation_date,
        ...(donationForm.address ? { address: donationForm.address } : {}),
        ...(donationForm.category ? { category: donationForm.category } : {}),
      });

      // Award points to the most recent health log
      const pts = pointsForCategory(donationForm.category);
      const currentLogs = healthLogs.length > 0 ? healthLogs : await getHealthLogsByDonor(authUser.donor_id);
      if (currentLogs.length > 0) {
        await updateHealthLog(currentLogs[0].log_id, {
          hold_points: currentLogs[0].hold_points + pts,
        });
      } else {
        await createHealthLog({ donor_id: authUser.donor_id, hold_points: pts });
      }

      const [dons, refreshedLogs, refreshed] = await Promise.all([
        getDonationsByUser(authUser.donor_id),
        getHealthLogsByDonor(authUser.donor_id),
        getUser(authUser.donor_id),
      ]);
      setDonations(dons);
      setHealthLogs(refreshedLogs);
      setAuthUser(refreshed);
      setDonationForm({ donation_date: "", address: "", category: "" });
      setIsAddingDonation(false);
      setSuccessMsg(`捐血紀錄已新增，獲得 ${pts} 點！`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗，請稍後再試");
    } finally {
      setIsSavingDonation(false);
    }
  };

  const handleDeleteDonation = async (record_id: number) => {
    if (!confirm("確定要刪除此捐血紀錄？")) return;
    setDeletingDonationId(record_id);
    setError("");
    try {
      await deleteDonation(record_id);
      const [dons, refreshed] = await Promise.all([
        getDonationsByUser(authUser.donor_id),
        getUser(authUser.donor_id),
      ]);
      setDonations(dons);
      setAuthUser(refreshed);
      setSuccessMsg("捐血紀錄已刪除");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
    } finally {
      setDeletingDonationId(null);
    }
  };

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3">健康 & 捐血紀錄</h1>
          <p className="text-lg text-slate-600 font-medium">管理您的健康履歷與每次捐血記錄。</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 font-medium">
            ✓ {successMsg}
          </div>
        )}

        {/* No health data notice */}
        <AnimatePresence>
          {showNoHealthNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl px-6 py-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-slate-800 mb-1">健康履歷尚未填寫</h3>
                <p className="text-sm text-slate-600 font-medium">
                  誠實填寫健康資料有助於系統評估捐血資格，建議盡快建立。
                </p>
                <button
                  onClick={() => { setShowNoHealthNotice(false); setIsEditingHealth(true); }}
                  className="mt-3 bg-amber-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors text-sm"
                >
                  立即填寫健康履歷
                </button>
              </div>
              <button onClick={() => setShowNoHealthNotice(false)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Health log ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" /> 健康履歷
            </h2>
            {!isEditingHealth ? (
              <button
                onClick={() => setIsEditingHealth(true)}
                className="text-sky-600 font-bold hover:bg-sky-50 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1 transition-colors"
              >
                <FileText className="h-4 w-4" /> {latestLog ? "編輯" : "建立履歷"}
              </button>
            ) : (
              <button
                onClick={() => { setIsEditingHealth(false); setHealthErrors({}); }}
                className="text-slate-400 font-bold hover:bg-slate-50 px-3 py-1.5 rounded-xl text-sm"
              >
                取消
              </button>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 font-medium leading-relaxed">
              請誠實填寫健康履歷。若有服用特殊藥物或近期旅遊史，系統將自動評估捐血資格。
            </p>
          </div>

          {isEditingHealth ? (
            <form onSubmit={handleSaveHealth} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">近期用藥紀錄</label>
                <textarea
                  name="drugs_record"
                  value={healthForm.drugs_record}
                  onChange={handleHealthChange}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-400 font-medium text-slate-700 resize-none"
                  placeholder="請填寫近期服用的藥物，若無則填「無」"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">一年內旅遊史</label>
                <textarea
                  name="location"
                  value={healthForm.location}
                  onChange={handleHealthChange}
                  rows={2}
                  maxLength={100}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 focus:outline-none focus:border-sky-400 font-medium text-slate-700 resize-none ${healthErrors.location ? "border-rose-300" : "border-slate-200"}`}
                  placeholder="請填寫近一年出國的地點，若無則填「無」"
                />
                <ErrMsg msg={healthErrors.location} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">體重 (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={healthForm.weight}
                  onChange={handleHealthChange}
                  min={30}
                  max={300}
                  step={0.1}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 focus:outline-none focus:border-sky-400 font-medium text-slate-700 ${healthErrors.weight ? "border-rose-300" : "border-slate-200"}`}
                  placeholder="例如 65.5"
                />
                <ErrMsg msg={healthErrors.weight} />
              </div>
              <button
                type="submit"
                disabled={isSavingHealth}
                className="bg-emerald-500 text-white font-bold hover:bg-emerald-600 px-6 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSavingHealth ? "儲存中…" : "儲存健康履歷"}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5">近期用藥紀錄</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 min-h-[3rem] font-medium text-slate-600">
                  {latestLog?.drugs_record || <span className="text-slate-400 italic">未填寫</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5">一年內旅遊史</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 min-h-[3rem] font-medium text-slate-600">
                  {latestLog?.location || <span className="text-slate-400 italic">未填寫</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5">體重 (kg)</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 min-h-[3rem] font-medium text-slate-600">
                  {latestLog?.weight != null ? `${latestLog.weight} kg` : <span className="text-slate-400 italic">未填寫</span>}
                </div>
              </div>
              {latestLog && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    最後更新：{new Date(latestLog.recorded_at).toLocaleString("zh-TW")}
                  </p>
                  <button
                    onClick={() => handleDeleteHealthLog(latestLog.log_id)}
                    disabled={deletingHealthId === latestLog.log_id}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600 font-bold transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingHealthId === latestLog.log_id ? "刪除中…" : "刪除此紀錄"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Donation records ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-rose-500" /> 捐血紀錄
              <span className="text-sm font-bold text-slate-400">（共 {donations.length} 筆）</span>
            </h2>
            {!isAddingDonation ? (
              <button
                onClick={() => setIsAddingDonation(true)}
                className="flex items-center gap-1 bg-rose-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-rose-600 transition-colors text-sm shadow-sm"
              >
                <Plus className="h-4 w-4" /> 新增紀錄
              </button>
            ) : (
              <button
                onClick={() => { setIsAddingDonation(false); setDonationErrors({}); setDonationForm({ donation_date: "", address: "", category: "" }); }}
                className="text-slate-400 font-bold hover:bg-slate-50 px-3 py-1.5 rounded-xl text-sm"
              >
                取消
              </button>
            )}
          </div>

          <AnimatePresence>
            {isAddingDonation && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddDonation}
                className="mb-6 bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-4 overflow-hidden"
              >
                <h3 className="font-bold text-slate-700">新增捐血紀錄</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">捐血日期 *</label>
                    <input
                      type="date"
                      name="donation_date"
                      value={donationForm.donation_date}
                      onChange={handleDonationChange}
                      max={new Date().toISOString().split("T")[0]}
                      className={inputCls(donationErrors.donation_date)}
                    />
                    <ErrMsg msg={donationErrors.donation_date} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">捐血類型</label>
                    <select name="category" value={donationForm.category} onChange={handleDonationChange} className={inputCls()}>
                      <option value="">請選擇（選填）</option>
                      <option value="全血">全血</option>
                      <option value="血小板">血小板</option>
                      <option value="血漿">血漿</option>
                      <option value="血小板血漿">血小板血漿</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">地點</label>
                    <input
                      name="address"
                      value={donationForm.address}
                      onChange={handleDonationChange}
                      className={inputCls(donationErrors.address)}
                      placeholder="捐血地點（選填）"
                      maxLength={200}
                    />
                    <ErrMsg msg={donationErrors.address} />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSavingDonation}
                  className="bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSavingDonation ? "儲存中…" : "儲存紀錄"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {donations.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl">
              <Droplets className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">尚無捐血紀錄</p>
              <p className="text-xs text-slate-400 mt-1">點擊「新增紀錄」記錄您的每一次捐血！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((d) => (
                <div key={d.record_id} className="flex items-center gap-4 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Droplets className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800">{d.donation_date}</div>
                    <div className="text-sm text-slate-500 truncate">
                      {d.category && (
                        <span className="inline-block bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded mr-2">
                          {d.category}
                        </span>
                      )}
                      {d.address || "地點未記錄"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDonation(d.record_id)}
                    disabled={deletingDonationId === d.record_id}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                    title="刪除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
