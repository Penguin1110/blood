import { Heart, Activity, Users, ArrowRight, Gift, CalendarHeart, Award } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";

export function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden px-4">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-200/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-rose-100 text-rose-600 font-bold text-sm mb-6 border border-rose-200 shadow-sm">
                <Gift className="h-4 w-4" />
                <span>捐血集點，換好禮！</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight mb-6">
                捐血一袋，<br className="hidden sm:block" />
                <span className="text-rose-500 relative">
                  救人一命！
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-400 opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" />
                  </svg>
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 font-medium">
                隨時掌握自己的健康紀錄與捐血資格。現在就尋找附近的捐血站，累積點數解鎖專屬稱號與好禮吧！
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/locations" 
                  className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-2xl shadow-lg shadow-rose-500/30 text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 transition-all hover:-translate-y-1"
                >
                  尋找附近捐血站
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/profile" 
                  className="inline-flex justify-center items-center px-8 py-4 border-2 border-slate-200 text-lg font-bold rounded-2xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <CalendarHeart className="mr-2 h-5 w-5 text-slate-500" />
                  查看下次捐血日
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 relative w-full max-w-lg mx-auto"
            >
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-white relative">
                <img 
                  src="https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXJzZSUyMHBhdGllbnQlMjBzbWlsZXxlbnwxfHx8fDE3Nzk3Nzg2MDl8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                  alt="護理師與捐血者"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating badges */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
              >
                <div className="bg-amber-100 p-2 rounded-xl text-amber-500">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">目前等級</p>
                  <p className="text-lg font-extrabold text-slate-800">捐血小天使</p>
                </div>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
              >
                <div className="bg-rose-100 p-2 rounded-xl text-rose-500">
                  <Heart className="h-6 w-6 fill-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">幫助人數</p>
                  <p className="text-lg font-extrabold text-slate-800">拯救 3 人</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="py-12 bg-white rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/profile" className="bg-sky-50 rounded-3xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className="bg-sky-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="h-8 w-8 text-sky-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">健康履歷管理</h3>
              <p className="text-slate-600 font-medium">記錄您的用藥與旅遊史，系統自動幫您判斷下次可捐血時間。</p>
            </Link>
            
            <Link to="/rewards" className="bg-amber-50 rounded-3xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gift className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">獎勵與兌換</h3>
              <p className="text-slate-600 font-medium">每次捐血都能累積點數！查詢目前點數，兌換實用限量贈品。</p>
            </Link>

            <Link to="/locations" className="bg-rose-50 rounded-3xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className="bg-rose-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">地圖與導航</h3>
              <p className="text-slate-600 font-medium">一鍵查詢您附近的捐血站與巡迴捐血車，馬上行動！</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
