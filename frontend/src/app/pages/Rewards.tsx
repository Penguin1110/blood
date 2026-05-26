import { useState, useEffect } from "react";
import { Trophy, Gift, Award, AlertCircle, Lock, TrendingUp, Wallet } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { Link } from "react-router";
import { getRewards, getHealthLogsByDonor, getEligibleRewards, updateUser, getUser, type Reward, type HistoryLog } from "@/api";
import { useAuth } from "@/context/AuthContext";

function getLevel(pts: number) {
  if (pts < 100) return { name: "捐血新鮮人", color: "bg-slate-100 text-slate-600", next: 100 };
  if (pts < 300) return { name: "捐血小天使", color: "bg-sky-100 text-sky-600", next: 300 };
  if (pts < 600) return { name: "捐血達人", color: "bg-amber-100 text-amber-600", next: 600 };
  return { name: "捐血英雄", color: "bg-rose-100 text-rose-600", next: 1000 };
}

const GIFT_ICONS: Record<number, string> = {};
const ICON_POOL = ["🛍️", "🎫", "🧸", "☕", "🎁", "🌟", "🍵", "📚"];
let iconIdx = 0;
function giftIcon(id: number) {
  if (!GIFT_ICONS[id]) GIFT_ICONS[id] = ICON_POOL[iconIdx++ % ICON_POOL.length];
  return GIFT_ICONS[id];
}

export function Rewards() {
  const { user, setUser } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [eligibleIds, setEligibleIds] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 累積點數 = all earned points ever (never decremented)
  const cumulativePoints = logs.reduce((sum, l) => sum + l.hold_points, 0);
  // 現有點數 = cumulative minus what was spent on redemptions
  const currentPoints = Math.max(0, cumulativePoints - (user?.spent_points ?? 0));

  const levelInfo = getLevel(cumulativePoints);
  const progressPercent = Math.min((cumulativePoints / levelInfo.next) * 100, 100);

  useEffect(() => {
    setIsLoading(true);
    const rewardsPromise = getRewards().catch(() => {
      setError("無法載入獎品資料");
      return [] as Reward[];
    });
    const logsPromise = user
      ? getHealthLogsByDonor(user.donor_id).catch(() => [] as HistoryLog[])
      : Promise.resolve([] as HistoryLog[]);
    const eligiblePromise = user
      ? getEligibleRewards(user.donor_id).catch(() => [] as Reward[])
      : Promise.resolve([] as Reward[]);

    Promise.all([rewardsPromise, logsPromise, eligiblePromise]).then(([r, l, e]) => {
      setRewards(r);
      setLogs(l);
      setEligibleIds(new Set(e.map((x) => x.gift_id)));
      setIsLoading(false);
    });
  }, [user]);

  const handleRedeem = async (cost: number, name: string) => {
    if (!user) return;
    if (currentPoints < cost) {
      alert(`現有點數不足！需要 ${cost} 點，您目前有 ${currentPoints} 點。`);
      return;
    }
    try {
      const newSpent = (user.spent_points ?? 0) + cost;
      await updateUser(user.donor_id, { spent_points: newSpent });
      // Refresh user in auth context so spent_points stays in sync
      const refreshed = await getUser(user.donor_id);
      setUser(refreshed);
      // Refresh eligible rewards based on new balance
      const eligible = await getEligibleRewards(user.donor_id).catch(() => [] as Reward[]);
      setEligibleIds(new Set(eligible.map((x) => x.gift_id)));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f43f5e", "#fbbf24", "#38bdf8"],
      });
      alert(`兌換「${name}」成功！已扣除 ${cost} 點。`);
    } catch {
      alert("兌換失敗，請稍後再試。");
    }
  };

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

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">獎勵與兌換區</h1>
          <p className="text-xl text-slate-600 font-medium">您的每一滴熱血，都值得被獎勵！</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: points + gifts */}
          <div className="lg:col-span-2 space-y-8">

            {/* Points card */}
            {user ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  {/* Points breakdown */}
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="h-12 w-12 text-amber-500" />
                    </div>
                    <div className="space-y-3">
                      {/* Current (spendable) points */}
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Wallet className="h-4 w-4 text-rose-500" />
                          <p className="text-slate-500 font-bold text-sm">現有點數（可兌換）</p>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-extrabold text-rose-600">{currentPoints}</span>
                          <span className="text-base font-bold text-slate-400">點</span>
                        </div>
                      </div>
                      {/* Cumulative points */}
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                          <p className="text-slate-500 font-bold text-sm">累積點數（歷史總計）</p>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold text-slate-700">{cumulativePoints}</span>
                          <span className="text-sm font-bold text-slate-400">點</span>
                        </div>
                      </div>
                      <div className={`inline-block px-4 py-1 rounded-full font-bold text-sm ${levelInfo.color}`}>
                        {levelInfo.name}
                      </div>
                    </div>
                  </div>
                  {/* Progress */}
                  <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                      <span>等級進度（累積）</span>
                      <span>{cumulativePoints} / {levelInfo.next}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                      再累積 {Math.max(0, levelInfo.next - cumulativePoints)} 點即可升級！
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6">
                <Lock className="h-12 w-12 text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xl text-slate-800 mb-2">登入查看您的點數</h3>
                  <p className="text-slate-600 font-medium mb-4">登入後可查看累積點數、等級進度，並享受兌換功能。</p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-rose-500 text-white font-bold px-6 py-2.5 rounded-2xl hover:bg-rose-600 transition-colors"
                  >
                    立即登入 / 註冊
                  </Link>
                </div>
              </div>
            )}

            {/* Gifts grid */}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <Gift className="h-6 w-6 text-rose-500" /> 贈品兌換
              </h2>
              {rewards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                  <p className="text-slate-400 font-medium">目前尚無可兌換的贈品</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rewards.map((gift) => {
                    const isEligible = user && eligibleIds.has(gift.gift_id);
                    const canRedeem = user && currentPoints >= gift.needed_points;
                    return (
                      <div
                        key={gift.gift_id}
                        className={`bg-white p-6 rounded-3xl shadow-sm border hover:shadow-md transition-shadow flex items-center gap-4 ${
                          isEligible ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-100"
                        }`}
                      >
                        <div className="text-4xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0">
                          {giftIcon(gift.gift_id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-lg text-slate-800 truncate">{gift.gift_item}</h3>
                            {isEligible && (
                              <span className="flex-shrink-0 text-xs font-extrabold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg">
                                可兌換
                              </span>
                            )}
                          </div>
                          <p className="text-rose-500 font-extrabold mt-1">{gift.needed_points} 點</p>
                        </div>
                        <button
                          onClick={() => handleRedeem(gift.needed_points, gift.gift_item)}
                          disabled={!canRedeem}
                          className={`px-4 py-2 rounded-xl font-bold transition-colors whitespace-nowrap flex-shrink-0 ${
                            canRedeem
                              ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          {!user ? "登入" : canRedeem ? "兌換" : "點數不足"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: info panel */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-sky-400 to-blue-600 rounded-3xl p-1 shadow-lg">
              <div className="bg-white rounded-[22px] h-full p-6">
                <div className="flex items-center justify-center gap-2 mb-8">
                  <Trophy className="h-8 w-8 text-amber-500" />
                  <h2 className="text-2xl font-extrabold text-slate-800">等級說明</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "捐血新鮮人", range: "0 – 99 點", color: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-600" },
                    { name: "捐血小天使", range: "100 – 299 點", color: "bg-sky-50 border-sky-100", badge: "bg-sky-100 text-sky-600" },
                    { name: "捐血達人", range: "300 – 599 點", color: "bg-amber-50 border-amber-100", badge: "bg-amber-100 text-amber-600" },
                    { name: "捐血英雄", range: "600 點以上", color: "bg-rose-50 border-rose-100", badge: "bg-rose-100 text-rose-600" },
                  ].map((lv, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${lv.color}`}>
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-0.5 rounded-lg text-xs font-extrabold ${lv.badge}`}>
                          {["新鮮人", "小天使", "達人", "英雄"][i]}
                        </div>
                        <span className="font-bold text-slate-700">{lv.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{lv.range}</span>
                    </div>
                  ))}
                </div>

                {user && (
                  <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 text-white shadow-md">
                      <span className="font-bold">{user.name}（您）</span>
                      <div className="text-right">
                        <div className="font-extrabold text-amber-400">
                          {currentPoints} <span className="text-xs">現有</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          累積 {cumulativePoints} 點
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
