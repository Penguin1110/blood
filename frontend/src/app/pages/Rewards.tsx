import { useState, useEffect } from "react";
import {
  Trophy, Gift, Award, AlertCircle, Lock, TrendingUp, Wallet,
  ShoppingBag, Ticket, Coffee, Star, BookOpen, Package, Medal, MapPin,
  ClipboardList, type LucideIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { Link } from "react-router";
import {
  getRewards, getEligibleRewards, getDonorLeaderboard, getDonorPoints, redeemReward,
  getSites, getRedemptionsByDonor, getSiteGifts,
  type Reward, type DonorRanking, type PointSummary, type DonationSite,
  type RedemptionRecord, type SiteGift,
} from "@/api";
import { useAuth } from "@/context/AuthContext";

function getLevel(pts: number) {
  if (pts < 100) return { name: "捐血新鮮人", color: "bg-slate-100 text-slate-600", next: 100 };
  if (pts < 300) return { name: "捐血小天使", color: "bg-sky-100 text-sky-600", next: 300 };
  if (pts < 600) return { name: "捐血達人", color: "bg-amber-100 text-amber-600", next: 600 };
  return { name: "捐血英雄", color: "bg-rose-100 text-rose-600", next: 1000 };
}

const GIFT_ICONS: Record<number, LucideIcon> = {};
const ICON_POOL = [ShoppingBag, Ticket, Package, Coffee, Gift, Star, BookOpen];
let iconIdx = 0;
function giftIcon(id: number) {
  if (!GIFT_ICONS[id]) GIFT_ICONS[id] = ICON_POOL[iconIdx++ % ICON_POOL.length];
  return GIFT_ICONS[id];
}

function QuantityBadge({ qty }: { qty: number | undefined }) {
  if (qty === undefined) return null;
  if (qty <= 0)
    return <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400">此站無庫存</span>;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${qty <= 5 ? "bg-rose-100 text-rose-500" : "bg-emerald-100 text-emerald-600"}`}>
      剩餘 {qty} 件
    </span>
  );
}

export function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [eligibleIds, setEligibleIds] = useState<Set<number>>(new Set());
  const [points, setPoints] = useState<PointSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<DonorRanking[]>([]);
  const [sites, setSites] = useState<DonationSite[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [siteInventory, setSiteInventory] = useState<Map<number, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAllRedemptions, setShowAllRedemptions] = useState(false);

  const cumulativePoints = points?.cumulative_points ?? 0;
  const currentPoints = points?.current_points ?? 0;
  const levelInfo = getLevel(cumulativePoints);
  const progressPercent = Math.min((cumulativePoints / levelInfo.next) * 100, 100);

  // Initial data load
  useEffect(() => {
    setIsLoading(true);
    const rewardsP = getRewards().catch(() => { setError("無法載入獎品資料"); return [] as Reward[]; });
    const pointsP = user ? getDonorPoints(user.donor_id).catch(() => null) : Promise.resolve(null);
    const eligibleP = user ? getEligibleRewards(user.donor_id).catch(() => [] as Reward[]) : Promise.resolve([] as Reward[]);
    const leaderboardP = getDonorLeaderboard(5).catch(() => [] as DonorRanking[]);
    const sitesP = getSites().catch(() => [] as DonationSite[]);
    const redemptionsP = user
      ? getRedemptionsByDonor(user.donor_id, 100).catch(() => [] as RedemptionRecord[])
      : Promise.resolve([] as RedemptionRecord[]);

    Promise.all([rewardsP, pointsP, eligibleP, leaderboardP, sitesP, redemptionsP])
      .then(([r, p, e, lb, s, red]) => {
        setRewards(r);
        setPoints(p);
        setEligibleIds(new Set(e.map((x) => x.gift_id)));
        setLeaderboard(lb);
        setSites(s);
        setRedemptions(red);
        if (s.length > 0) setSelectedSiteId((prev) => prev || String(s[0].site_id));
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  // Load site inventory when selected site changes
  useEffect(() => {
    if (!selectedSiteId) return;
    setIsInventoryLoading(true);
    getSiteGifts(Number(selectedSiteId))
      .then((gifts: SiteGift[]) => {
        const map = new Map<number, number>();
        gifts.forEach((g) => map.set(g.gift_id, g.quantity));
        setSiteInventory(map);
      })
      .catch(() => setSiteInventory(new Map()))
      .finally(() => setIsInventoryLoading(false));
  }, [selectedSiteId]);

  const refreshAfterRedeem = async () => {
    if (!user) return;
    const [freshPoints, eligible, freshRedemptions, lb, freshInventory] = await Promise.all([
      getDonorPoints(user.donor_id).catch(() => null),
      getEligibleRewards(user.donor_id).catch(() => [] as Reward[]),
      getRedemptionsByDonor(user.donor_id, 100).catch(() => [] as RedemptionRecord[]),
      getDonorLeaderboard(5).catch(() => [] as DonorRanking[]),
      selectedSiteId ? getSiteGifts(Number(selectedSiteId)).catch(() => [] as SiteGift[]) : Promise.resolve([] as SiteGift[]),
    ]);
    setPoints(freshPoints);
    setEligibleIds(new Set(eligible.map((x) => x.gift_id)));
    setRedemptions(freshRedemptions);
    setLeaderboard(lb);
    const map = new Map<number, number>();
    (freshInventory as SiteGift[]).forEach((g) => map.set(g.gift_id, g.quantity));
    setSiteInventory(map);
  };

  const handleRedeem = async (gift: Reward) => {
    if (!user) return;
    if (currentPoints < gift.needed_points) {
      alert(`現有點數不足！需要 ${gift.needed_points} 點，您目前有 ${currentPoints} 點。`);
      return;
    }
    if (!selectedSiteId) {
      alert("請先選擇兌換據點。");
      return;
    }
    const qty = siteInventory.get(gift.gift_id);
    if (qty !== undefined && qty <= 0) {
      alert("此據點此贈品庫存不足，請選擇其他據點。");
      return;
    }
    try {
      await redeemReward({ donor_id: user.donor_id, gift_id: gift.gift_id, site_id: Number(selectedSiteId) });
      await refreshAfterRedeem();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#f43f5e", "#fbbf24", "#38bdf8"] });
      alert(`兌換「${gift.gift_item}」成功！已扣除 ${gift.needed_points} 點。`);
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

  const visibleRedemptions = showAllRedemptions ? redemptions : redemptions.slice(0, 5);

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">獎勵與兌換區</h1>
          <p className="text-xl text-slate-600 font-medium">您的每一滴熱血，都值得被獎勵！</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /> {error}
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
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="h-12 w-12 text-amber-500" />
                    </div>
                    <div className="space-y-3">
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
                  <Link to="/login" className="inline-flex items-center gap-2 bg-rose-500 text-white font-bold px-6 py-2.5 rounded-2xl hover:bg-rose-600 transition-colors">
                    立即登入 / 註冊
                  </Link>
                </div>
              </div>
            )}

            {/* Gifts grid */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-rose-500" /> 贈品兌換
                </h2>
                {user && (
                  <label className="block text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1 mb-1"><MapPin className="h-3 w-3" /> 兌換據點</span>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-rose-400"
                    >
                      {sites.map((site) => (
                        <option key={site.site_id} value={site.site_id}>{site.loca_name}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {rewards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                  <p className="text-slate-400 font-medium">目前尚無可兌換的贈品</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rewards.map((gift) => {
                    const isEligible = user && eligibleIds.has(gift.gift_id);
                    const canRedeem = user && currentPoints >= gift.needed_points;
                    const GiftIcon = giftIcon(gift.gift_id);
                    const qty = siteInventory.size > 0 ? siteInventory.get(gift.gift_id) : undefined;
                    const outOfStock = qty !== undefined && qty <= 0;
                    return (
                      <div
                        key={gift.gift_id}
                        className={`bg-white p-5 rounded-3xl shadow-sm border hover:shadow-md transition-shadow ${
                          isEligible && !outOfStock ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <GiftIcon className="h-7 w-7 text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className="font-bold text-lg text-slate-800 truncate">{gift.gift_item}</h3>
                              {isEligible && !outOfStock && (
                                <span className="flex-shrink-0 text-xs font-extrabold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg">
                                  可兌換
                                </span>
                              )}
                            </div>
                            <p className="text-rose-500 font-extrabold">{gift.needed_points} 點</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {isInventoryLoading ? (
                              <span className="text-xs text-slate-300 font-medium">查詢中…</span>
                            ) : (
                              <QuantityBadge qty={qty} />
                            )}
                          </div>
                          <button
                            onClick={() => handleRedeem(gift)}
                            disabled={!canRedeem || outOfStock}
                            className={`px-4 py-2 rounded-xl font-bold transition-colors whitespace-nowrap flex-shrink-0 text-sm ${
                              canRedeem && !outOfStock
                                ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {!user ? "登入" : outOfStock ? "庫存不足" : canRedeem ? "兌換" : "點數不足"}
                          </button>
                        </div>
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
                        <div className="text-xs text-slate-400">累積 {cumulativePoints} 點</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                    <Medal className="h-5 w-5 text-amber-500" /> 累積點數排行
                  </h3>
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium text-center py-4">目前尚無排行資料</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((item) => (
                        <div key={item.donor_id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                            item.rank === 1 ? "bg-amber-100 text-amber-700"
                            : item.rank === 2 ? "bg-slate-200 text-slate-700"
                            : item.rank === 3 ? "bg-orange-100 text-orange-700"
                            : "bg-white text-slate-500"
                          }`}>
                            {item.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-700 truncate">{item.nickname}</p>
                            <p className="text-xs text-slate-400 font-bold">目前 {item.current_points} 點</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-extrabold text-rose-600">{item.cumulative_points}</p>
                            <p className="text-xs text-slate-400 font-bold">累積</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redemption history — full width below main grid */}
        {user && (
          <div className="mt-10 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-sky-500" /> 兌換紀錄
              </h2>
              <span className="text-sm font-bold text-slate-400">共 {redemptions.length} 筆</span>
            </div>

            {redemptions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl text-slate-400 font-medium">
                尚無兌換紀錄
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">贈品種類</th>
                        <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">兌換數量</th>
                        <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">兌換點數</th>
                        <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">兌換據點</th>
                        <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">兌換日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRedemptions.map((record) => {
                        const gift = rewards.find((g) => g.gift_id === record.gift_id);
                        const site = sites.find((s) => s.site_id === record.site_id);
                        return (
                          <tr key={record.redemption_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-800">
                              {gift?.gift_item ?? `贈品 #${record.gift_id}`}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              1 件
                            </td>
                            <td className="py-3 px-3 font-extrabold text-rose-500">
                              -{record.points_spent} 點
                            </td>
                            <td className="py-3 px-3">
                              {site ? (
                                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                  {site.loca_name}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">未記錄</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-medium">
                              {record.redeemed_at.slice(0, 10)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {redemptions.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAllRedemptions((v) => !v)}
                      className="text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors"
                    >
                      {showAllRedemptions ? "收起" : `顯示全部 ${redemptions.length} 筆`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
