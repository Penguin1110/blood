import { useState, useEffect, type FormEvent } from "react";
import {
  Activity, AlertCircle, CalendarHeart, CheckCircle, Droplets, FileText,
  LogIn, Save, Trash2, X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import {
  createHealthLog, deleteHealthLog, getDonationsByUser,
  getHealthLogsByDonor, updateHealthLog,
  type DonationRecord, type HistoryLog,
} from "@/api";
import { useAuth } from "@/context/AuthContext";

type HealthField =
  | "has_cold_or_infection"
  | "had_dental_treatment"
  | "had_surgery_or_transfusion"
  | "taking_medication"
  | "had_vaccine_or_injection"
  | "pregnancy_or_postpartum"
  | "unexplained_weight_loss"
  | "had_tattoo_piercing"
  | "traveled_epidemic_area"
  | "contact_infectious_disease"
  | "high_risk_behavior"
  | "understood_process_and_risk"
  | "consent_blood_donation"
  | "consent_medical_reuse";

type HealthEdit = Record<HealthField, boolean>;

const EMPTY_HEALTH_FORM: HealthEdit = {
  has_cold_or_infection: false,
  had_dental_treatment: false,
  had_surgery_or_transfusion: false,
  taking_medication: false,
  had_vaccine_or_injection: false,
  pregnancy_or_postpartum: false,
  unexplained_weight_loss: false,
  had_tattoo_piercing: false,
  traveled_epidemic_area: false,
  contact_infectious_disease: false,
  high_risk_behavior: false,
  understood_process_and_risk: false,
  consent_blood_donation: false,
  consent_medical_reuse: false,
};

const QUESTION_SECTIONS: {
  title: string;
  desc: string;
  questions: { key: HealthField; label: string }[];
}[] = [
  {
    title: "近期健康與生活狀況",
    desc: "請依近期身體狀況、治療、用藥與生活變化勾選。",
    questions: [
      { key: "has_cold_or_infection", label: "近期是否有感冒、發燒、腹瀉或急性感染？" },
      { key: "had_dental_treatment", label: "7 天內是否曾接受拔牙或牙科治療？" },
      { key: "had_surgery_or_transfusion", label: "近期是否曾進行外科手術或接受輸血？" },
      { key: "taking_medication", label: "目前是否正在服藥？" },
      { key: "had_vaccine_or_injection", label: "過去 1 個月內是否曾接種疫苗或接受注射？" },
      { key: "pregnancy_or_postpartum", label: "女性是否懷孕中、產後或流產未滿 6 個月？" },
      { key: "unexplained_weight_loss", label: "是否近期有不明原因體重驟降？" },
      { key: "had_tattoo_piercing", label: "是否曾在近幾個月內刺青、紋眉或穿耳洞？" },
    ],
  },
  {
    title: "旅遊史與傳染病風險",
    desc: "請確認旅遊、接觸史與高風險行為。",
    questions: [
      { key: "traveled_epidemic_area", label: "過去一段時間是否曾出國至傳染病疫區（如瘧疾、茲卡病毒等）？" },
      { key: "contact_infectious_disease", label: "是否曾與傳染病患者密切接觸？" },
      { key: "high_risk_behavior", label: "是否曾有危險性行為、吸毒等高風險行為？" },
    ],
  },
  {
    title: "同意與簽名",
    desc: "請確認您已理解流程與同意事項。",
    questions: [
      { key: "understood_process_and_risk", label: "確認已了解捐血流程、用血安全及相關刑責。" },
      { key: "consent_blood_donation", label: "同意無償捐血。" },
      { key: "consent_medical_reuse", label: "若血液不適合輸給病人，是否同意供作國內外醫藥資源再利用？" },
    ],
  },
];

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

function fieldValue(log: HistoryLog | null, key: HealthField) {
  return log ? Boolean(log[key]) : false;
}

function StatusBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-12 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
      value ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
    }`}>
      {value ? "是" : "否"}
    </span>
  );
}

function ConsentBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-12 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
      value ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
    }`}>
      {value ? "是" : "否"}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
      <div className="font-bold text-slate-700">{value}</div>
    </div>
  );
}

export function Records() {
  const { user: authUser } = useAuth();

  const [healthLogs, setHealthLogs] = useState<HistoryLog[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingHealth, setIsSavingHealth] = useState(false);
  const [deletingHealthId, setDeletingHealthId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");

  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [showNoHealthNotice, setShowNoHealthNotice] = useState(false);
  const [healthForm, setHealthForm] = useState<HealthEdit>(EMPTY_HEALTH_FORM);

  const latestLog = healthLogs[0] ?? null;
  const nextDate = calculateNextDonation(authUser?.last_date ?? null, authUser?.last_category ?? null);
  const canDonate = nextDate === "隨時可捐";

  useEffect(() => {
    if (!authUser) { setIsLoading(false); return; }

    Promise.all([
      getHealthLogsByDonor(authUser.donor_id),
      getDonationsByUser(authUser.donor_id),
    ])
      .then(([logs, dons]) => {
        setHealthLogs(logs);
        setDonations(dons);
        const latest = logs[0] ?? null;
        setHealthForm({
          ...EMPTY_HEALTH_FORM,
          ...(latest
            ? Object.fromEntries(
                Object.keys(EMPTY_HEALTH_FORM).map((key) => [key, Boolean(latest[key as HealthField])]),
              ) as HealthEdit
            : {}),
        });
        if (!latest) setShowNoHealthNotice(true);
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

  const handleHealthCheck = (key: HealthField, value: boolean) => {
    setHealthForm((prev) => ({ ...prev, [key]: value }));
    setFormError("");
  };

  const handleSaveHealth = async (e: FormEvent) => {
    e.preventDefault();
    if (!healthForm.understood_process_and_risk || !healthForm.consent_blood_donation) {
      setFormError("請確認已了解捐血流程與同意無償捐血。");
      return;
    }

    setIsSavingHealth(true);
    setError("");
    try {
      const payload = { ...healthForm };
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
      const latest = logs[0] ?? null;
      setHealthForm({
        ...EMPTY_HEALTH_FORM,
        ...(latest
          ? Object.fromEntries(
              Object.keys(EMPTY_HEALTH_FORM).map((key) => [key, Boolean(latest[key as HealthField])]),
            ) as HealthEdit
          : {}),
      });
      if (!latest) setShowNoHealthNotice(true);
      setSuccessMsg("健康紀錄已刪除");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
    } finally {
      setDeletingHealthId(null);
    }
  };

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3">健康 & 捐血紀錄</h1>
          <p className="text-lg text-slate-600 font-medium">維護基本資料、健康問卷與每次捐血記錄。</p>
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

        <div className={`rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border mb-8 ${
          canDonate ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${canDonate ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
              <CalendarHeart className="h-7 w-7" />
            </div>
            <div>
              <p className={`font-bold ${canDonate ? "text-emerald-700" : "text-blue-700"}`}>
                {canDonate ? "目前可以捐血" : "請等候間隔期結束"}
              </p>
              <p className="text-sm mt-0.5 opacity-80">
                上次捐血：{authUser.last_date ?? "尚無紀錄"}{authUser.last_category ? `（${authUser.last_category}）` : ""}
              </p>
            </div>
          </div>
          <div className={`px-5 py-2.5 rounded-2xl font-extrabold text-lg ${canDonate ? "bg-emerald-500 text-white shadow-md" : "bg-blue-100 text-blue-800"}`}>
            下次可捐：{nextDate}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-5">
            <FileText className="h-5 w-5 text-sky-500" /> 基本資料
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoRow label="姓名" value={authUser.name} />
            <InfoRow label="身分證字號" value={authUser.id_number ?? <span className="text-slate-400 italic">未填寫</span>} />
            <InfoRow label="出生年月日" value={authUser.birthday} />
            <InfoRow label="聯絡方式（電話）" value={authUser.phone} />
          </div>
        </div>

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
                  建議完成健康問卷，以利捐血資格評估。
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

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" /> 健康問卷
            </h2>
            {!isEditingHealth ? (
              <button
                onClick={() => { setHealthForm({ ...EMPTY_HEALTH_FORM, ...(latestLog ? Object.fromEntries(Object.keys(EMPTY_HEALTH_FORM).map((key) => [key, Boolean(latestLog[key as HealthField])])) as HealthEdit : {}) }); setIsEditingHealth(true); }}
                className="text-sky-600 font-bold hover:bg-sky-50 px-3 py-1.5 rounded-xl text-sm flex items-center gap-1 transition-colors"
              >
                <FileText className="h-4 w-4" /> {latestLog ? "編輯" : "建立問卷"}
              </button>
            ) : (
              <button
                onClick={() => { setIsEditingHealth(false); setFormError(""); }}
                className="text-slate-400 font-bold hover:bg-slate-50 px-3 py-1.5 rounded-xl text-sm"
              >
                取消
              </button>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 font-medium leading-relaxed">
              請依實際狀況填寫。若對愛滋病毒空窗期、傳染病風險或其他安全性有疑慮，請暫緩捐血。
            </p>
          </div>

          {isEditingHealth ? (
            <form onSubmit={handleSaveHealth} className="space-y-6">
              {QUESTION_SECTIONS.map((section) => (
                <section key={section.title} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                  <div className="mb-4">
                    <h3 className="font-extrabold text-slate-800">{section.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">{section.desc}</p>
                  </div>
                  <div className="space-y-3">
                    {section.questions.map((q) => (
                      <label key={q.key} className="flex items-start justify-between gap-4 bg-white rounded-xl border border-slate-100 px-4 py-3 cursor-pointer">
                        <span className="text-sm font-bold text-slate-700 leading-relaxed">{q.label}</span>
                        <input
                          type="checkbox"
                          checked={healthForm[q.key]}
                          onChange={(e) => handleHealthCheck(q.key, e.target.checked)}
                          className="mt-1 h-5 w-5 accent-rose-500 flex-shrink-0"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}

              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {formError}
                </div>
              )}

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
            <div className="space-y-6">
              {QUESTION_SECTIONS.map((section) => (
                <section key={section.title} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
                  <div className="mb-4">
                    <h3 className="font-extrabold text-slate-800">{section.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">{section.desc}</p>
                  </div>
                  <div className="space-y-3">
                    {section.questions.map((q) => (
                      <div key={q.key} className="flex items-start justify-between gap-4 bg-white rounded-xl border border-slate-100 px-4 py-3">
                        <span className="text-sm font-bold text-slate-700 leading-relaxed">{q.label}</span>
                        {section.title === "同意與簽名" ? (
                          <ConsentBadge value={fieldValue(latestLog, q.key)} />
                        ) : (
                          <StatusBadge value={fieldValue(latestLog, q.key)} />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

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

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-rose-500" /> 捐血紀錄
              <span className="text-sm font-bold text-slate-400">（共 {donations.length} 筆）</span>
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
              由管理員審核維護
            </span>
          </div>

          {donations.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl">
              <Droplets className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">尚無捐血紀錄</p>
              <p className="text-xs text-slate-400 mt-1">捐血紀錄會由管理員審核後建立。</p>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
