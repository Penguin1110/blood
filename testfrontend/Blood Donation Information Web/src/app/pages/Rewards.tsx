import { useState } from "react";
import { Trophy, Gift, Award, CheckCircle2, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";

export function Rewards() {
  const [points, setPoints] = useState(250);
  
  const getLevel = (pts: number) => {
    if (pts < 100) return { name: "捐血新鮮人", color: "bg-slate-100 text-slate-600", next: 100 };
    if (pts < 300) return { name: "捐血小天使", color: "bg-sky-100 text-sky-600", next: 300 };
    if (pts < 600) return { name: "捐血達人", color: "bg-amber-100 text-amber-600", next: 600 };
    return { name: "捐血英雄", color: "bg-rose-100 text-rose-600", next: 1000 };
  };

  const levelInfo = getLevel(points);
  const progressPercent = (points / levelInfo.next) * 100;

  const gifts = [
    { id: 1, name: "愛心環保帆布袋", pts: 100, img: "🛍️" },
    { id: 2, name: "知名影城電影票", pts: 250, img: "🎫" },
    { id: 3, name: "血寶絨毛玩偶", pts: 300, img: "🧸" },
    { id: 4, name: "咖啡電子兌換券", pts: 50, img: "☕" },
  ];

  const leaderboard = [
    { rank: 1, name: "山西麵壁小肥", pts: 850 },
    { rank: 2, name: "安定周子瑜", pts: 720 },
    { rank: 3, name: "潭子角力倫", pts: 650 },
    { rank: 4, name: "竹北貢丸大王", pts: 580 },
    { rank: 5, name: "中西區奶豆", pts: 510 },
  ];

  const handleRedeem = (cost: number) => {
    if (points >= cost) {
      setPoints(points - cost);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fbbf24', '#38bdf8']
      });
      alert("兌換成功！已扣除點數。");
    } else {
      alert("點數不足喔！繼續加油！");
    }
  };

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">獎勵與兌換區</h1>
          <p className="text-xl text-slate-600 font-medium">
            您的每一滴熱血，都值得被獎勵！
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Points and Gifts */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Points Status Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="h-12 w-12 text-amber-500" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1">目前累積點數</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-slate-800">{points}</span>
                    <span className="text-lg font-bold text-slate-500">點</span>
                  </div>
                  <div className={`inline-block mt-3 px-4 py-1 rounded-full font-bold text-sm ${levelInfo.color}`}>
                    {levelInfo.name}
                  </div>
                </div>
              </div>
              
              <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-2xl">
                <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                  <span>下一階級進度</span>
                  <span>{points} / {levelInfo.next}</span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">再收集 {levelInfo.next - points} 點即可升級！</p>
              </div>
            </motion.div>

            {/* Gifts Grid */}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                <Gift className="h-6 w-6 text-rose-500" /> 贈品兌換
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gifts.map(gift => (
                  <div key={gift.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="text-4xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {gift.img}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800">{gift.name}</h3>
                      <p className="text-rose-500 font-extrabold mt-1">{gift.pts} 點</p>
                    </div>
                    <button 
                      onClick={() => handleRedeem(gift.pts)}
                      disabled={points < gift.pts}
                      className={`px-4 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
                        points >= gift.pts 
                          ? "bg-rose-100 text-rose-600 hover:bg-rose-200" 
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      兌換
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-sky-400 to-blue-600 rounded-3xl p-1 shadow-lg">
              <div className="bg-white rounded-[22px] h-full p-6">
                <div className="flex items-center justify-center gap-2 mb-8">
                  <Trophy className="h-8 w-8 text-amber-500" />
                  <h2 className="text-2xl font-extrabold text-slate-800">捐血排行榜</h2>
                </div>
                
                <div className="space-y-4">
                  {leaderboard.map((user, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-4 rounded-2xl ${
                        index === 0 ? "bg-amber-50 border border-amber-100" :
                        index === 1 ? "bg-slate-50 border border-slate-200" :
                        index === 2 ? "bg-orange-50 border border-orange-100" :
                        "bg-white border border-slate-50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? "bg-amber-400 text-white" :
                          index === 1 ? "bg-slate-300 text-white" :
                          index === 2 ? "bg-orange-400 text-white" :
                          "text-slate-400"
                        }`}>
                          {user.rank}
                        </div>
                        <span className="font-bold text-slate-700">{user.name}</span>
                      </div>
                      <div className="font-extrabold text-rose-500">
                        {user.pts} <span className="text-xs text-rose-400 font-bold">點</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 text-white shadow-md transform -translate-y-2">
                    <div className="flex items-center gap-4">
                      <div className="text-slate-400 font-bold w-8 text-center">42</div>
                      <span className="font-bold">王小明 (您)</span>
                    </div>
                    <div className="font-extrabold text-amber-400">
                      250 <span className="text-xs">點</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
