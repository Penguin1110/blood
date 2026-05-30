import { useState, useEffect } from "react";
import { Search, MapPin, Clock, Navigation, Locate, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { getSites, getNearbySites, getOpenSites, type DonationSite, type DonationSiteNearby } from "@/api";
import { SiteMap } from "@/app/components/SiteMap";

type Category = "all" | "捐血站" | "捐血車";
type SiteWithDistance = DonationSite & { distance_km?: number | null; is_open?: boolean; navigation_url?: string };

function formatTime(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

function timeToMinutes(t: string | null) {
  if (!t) return null;
  const [hours, minutes] = t.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function isAvailableAt(site: DonationSite, selectedTime: string) {
  if (!selectedTime) return true;

  const target = timeToMinutes(selectedTime);
  const open = timeToMinutes(site.open_time);
  const close = timeToMinutes(site.close_time);

  if (target == null || open == null || close == null) return false;
  if (open <= close) return open <= target && target <= close;
  return target >= open || target <= close;
}

export function Locations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [availableAt, setAvailableAt] = useState("");
  const [sites, setSites] = useState<SiteWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");
  const [hasNearbySites, setHasNearbySites] = useState(false);
  const [isOpenOnly, setIsOpenOnly] = useState(false);

  useEffect(() => {
    getSites()
      .then((data) => setSites(data))
      .catch(() => setError("無法載入捐血站資料，請稍後再試"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError("您的瀏覽器不支援定位功能");
      return;
    }
    setIsLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const nearby = await getNearbySites({
            latitude: coords.latitude,
            longitude: coords.longitude,
            radius_km: 10,
            ...(activeCategory !== "all" ? { category: activeCategory } : {}),
            ...(availableAt ? { available_at: availableAt } : {}),
          });
          setSites(nearby as DonationSiteNearby[]);
          setHasNearbySites(true);
          if (nearby.length === 0) {
            setError("附近 10 公里內找不到捐血據點，請嘗試擴大範圍或選擇「全部顯示」");
          }
        } catch {
          setError("定位或搜尋失敗，請稍後再試");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError("無法取得您的位置，請允許瀏覽器定位權限");
        setIsLocating(false);
      }
    );
  };

  const handleResetLocation = () => {
    setHasNearbySites(false);
    setIsOpenOnly(false);
    setError("");
    setIsLoading(true);
    getSites()
      .then((data) => setSites(data))
      .catch(() => setError("無法載入捐血站資料"))
      .finally(() => setIsLoading(false));
  };

  const handleOpenOnly = () => {
    if (isOpenOnly) {
      handleResetLocation();
      return;
    }
    setIsOpenOnly(true);
    setHasNearbySites(false);
    setError("");
    setIsLoading(true);
    getOpenSites()
      .then((data) => setSites(data))
      .catch(() => setError("無法載入開放中站點資料"))
      .finally(() => setIsLoading(false));
  };

  const filtered = sites.filter((s) => {
    const cat = s.category ?? "";
    const matchCat =
      activeCategory === "all" ||
      (activeCategory === "捐血站"
        ? cat.includes("捐血站") || cat === "固定捐血點"
        : cat.includes("捐血車"));
    const q = searchTerm.toLowerCase();
    const matchQ =
      !q ||
      s.loca_name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q);
    const matchTime = isAvailableAt(s, availableAt);
    return matchCat && matchQ && matchTime;
  });

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-4">尋找附近捐血站</h1>
            <p className="text-xl text-slate-600 font-medium max-w-2xl">
              輸入您的位置，讓我們幫您計算最近的捐血地點與距離！
            </p>
          </div>
          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-rose-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 border-2 border-rose-100 rounded-2xl bg-white placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 sm:text-base shadow-sm transition-all font-bold text-slate-700"
              placeholder="搜尋區域、站名或地址…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters + Locate button */}
        <div className="flex flex-wrap gap-2 mb-8 items-center">
          {(["all", "捐血站", "捐血車"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? cat === "all"
                    ? "bg-slate-800 text-white shadow-md"
                    : cat === "捐血站"
                    ? "bg-rose-500 text-white shadow-md"
                    : "bg-sky-500 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat === "all" ? "全部顯示" : cat}
            </button>
          ))}

          <div className="flex gap-2 ml-auto flex-wrap">
            <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-sm">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="whitespace-nowrap">可用時間</span>
              <input
                type="time"
                value={availableAt}
                onChange={(e) => setAvailableAt(e.target.value)}
                className="bg-transparent text-slate-700 font-bold focus:outline-none"
              />
            </label>
            {availableAt && (
              <button
                onClick={() => setAvailableAt("")}
                className="px-4 py-2 rounded-full font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                清除時間
              </button>
            )}
            {(hasNearbySites || isOpenOnly) && (
              <button
                onClick={handleResetLocation}
                className="px-4 py-2 rounded-full font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                顯示全部
              </button>
            )}
            <button
              onClick={handleOpenOnly}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-colors shadow-sm ${
                isOpenOnly
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              目前開放中
            </button>
            <button
              onClick={handleLocate}
              disabled={isLocating}
              className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-colors shadow-sm"
            >
              <Locate className="h-4 w-4" />
              {isLocating ? "定位中…" : "附近搜尋"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results list */}
          <div className="lg:col-span-1 space-y-4 h-[600px] overflow-y-auto pr-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-44" />
              ))
            ) : filtered.length > 0 ? (
              filtered.map((site, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={site.site_id}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-extrabold mb-2 ${
                        (site.category ?? "").includes("捐血車")
                          ? "bg-sky-100 text-sky-600"
                          : "bg-rose-100 text-rose-600"
                      }`}>
                        {site.category ?? "捐血站"}
                      </span>
                      {"is_open" in site && (
                        <span className={`ml-2 inline-block px-2 py-1 rounded text-xs font-extrabold ${
                          (site as DonationSiteNearby).is_open
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {(site as DonationSiteNearby).is_open ? "開放中" : "未開放"}
                        </span>
                      )}
                      <h3 className="font-extrabold text-xl text-slate-800 group-hover:text-rose-600 transition-colors pr-2 mt-1">
                        {site.loca_name}
                      </h3>
                    </div>
                    {site.distance_km != null && (
                      <span className="bg-amber-100 text-amber-700 text-sm font-extrabold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                        {site.distance_km.toFixed(1)} 公里
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mt-4 text-sm font-medium text-slate-600">
                    <div className="flex items-start bg-slate-50 p-2 rounded-lg">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-rose-400 flex-shrink-0" />
                      <span>{site.address}</span>
                    </div>
                    {(site.open_time || site.close_time) && (
                      <div className="flex items-center p-1">
                        <Clock className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span>
                          {formatTime(site.open_time)} – {formatTime(site.close_time)}
                        </span>
                      </div>
                    )}
                    {site.hours_note && (
                      <div className="flex items-center p-1">
                        <Clock className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span>{site.hours_note}</span>
                      </div>
                    )}
                  </div>

                  {"navigation_url" in site && (site as DonationSiteNearby).navigation_url ? (
                    <a
                      href={(site as DonationSiteNearby).navigation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation className="h-4 w-4 text-sky-500" />
                      導航前往
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation className="h-4 w-4 text-sky-500" />
                      導航前往
                    </a>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">找不到相關地點</h3>
                <p className="text-slate-500 font-medium mt-1">請嘗試調整搜尋條件或分類。</p>
              </div>
            )}
          </div>

          {/* Interactive map */}
          <div className="lg:col-span-2 h-[600px] bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-inner">
            <SiteMap sites={filtered} />
          </div>
        </div>
      </div>
    </div>
  );
}
