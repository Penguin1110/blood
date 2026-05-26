import { ClipboardList, Stethoscope, Droplet, Coffee } from "lucide-react";
import { motion } from "motion/react";

export function Process() {
  const steps = [
    {
      icon: ClipboardList,
      title: "1. 登記與評估",
      time: "約 15 分鐘",
      description: "我們的護理人員會協助您完成登記，確認身分證件，並請您填寫保密的健康歷史問卷，確保您符合捐血資格。",
      color: "bg-sky-100 text-sky-600",
      border: "border-sky-200"
    },
    {
      icon: Stethoscope,
      title: "2. 迷你健康檢查",
      time: "約 5 分鐘",
      description: "我們會為您量測體溫、脈搏、血壓以及血紅素，這就像是一次免費的迷你健檢！確認一切指數正常後才會進行捐血。",
      color: "bg-emerald-100 text-emerald-600",
      border: "border-emerald-200"
    },
    {
      icon: Droplet,
      title: "3. 快樂捐血中",
      time: "約 10 分鐘",
      description: "請放鬆坐好！專業護理師會消毒您的手臂並使用全新無菌的針頭。捐全血 250cc 的過程大約只需要一首歌的時間。",
      color: "bg-rose-100 text-rose-600",
      border: "border-rose-200"
    },
    {
      icon: Coffee,
      title: "4. 休息與享用點心",
      time: "約 15 分鐘",
      description: "捐血完成後，請在休息區放鬆一下，享用我們準備的餅乾與飲料。確認身體沒有不適後，帶著滿滿的成就感回家！",
      color: "bg-amber-100 text-amber-600",
      border: "border-amber-200"
    }
  ];

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <div className="inline-block bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100 mb-6">
            <span className="text-rose-500 font-extrabold tracking-widest text-sm">DONATION PROCESS</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">輕鬆捐血 4 步驟</h1>
          <p className="text-xl text-slate-600 font-medium">
            捐血過程安全、簡單，還能救人！整個過程大約只需 45-60 分鐘。
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line connecting steps */}
          <div className="hidden md:block absolute left-12 top-10 bottom-10 w-1 bg-slate-200 rounded-full"></div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={index} 
                className="relative flex flex-col md:flex-row gap-6 md:gap-8"
              >
                {/* Icon Circle */}
                <div className={`flex-shrink-0 w-24 h-24 rounded-[2rem] flex items-center justify-center z-10 border-4 border-white ${step.color} mx-auto md:mx-0 shadow-lg shadow-slate-200`}>
                  <step.icon className="w-10 h-10" />
                </div>
                
                {/* Content */}
                <div className={`bg-white rounded-3xl p-8 shadow-sm border-2 ${step.border} flex-1 relative md:top-2 hover:shadow-md transition-shadow`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <h3 className="text-2xl font-extrabold text-slate-800">{step.title}</h3>
                    <span className="inline-block px-4 py-1.5 bg-slate-100 text-slate-600 text-sm font-extrabold rounded-full w-max">
                      耗時 {step.time}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-lg font-medium">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pre-donation tips */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 bg-gradient-to-br from-sky-400 to-blue-600 rounded-[3rem] p-1 shadow-xl"
        >
          <div className="bg-white rounded-[2.8rem] p-8 md:p-12">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-8 flex items-center justify-center gap-3">
              <span className="text-3xl">💡</span> 捐血小叮嚀
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100">
                <h4 className="font-extrabold text-sky-800 mb-4 text-lg flex items-center gap-2">
                  <div className="w-2 h-6 bg-sky-400 rounded-full"></div> 捐血前準備
                </h4>
                <ul className="space-y-3 text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">✓</span> 充足睡眠，前晚睡滿 6 小時
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">✓</span> 正常進食，請勿空腹捐血
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">✓</span> 補充水分，捐血前多喝水
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">✓</span> 穿著寬鬆、袖子易捲起的衣物
                  </li>
                </ul>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <h4 className="font-extrabold text-emerald-800 mb-4 text-lg flex items-center gap-2">
                  <div className="w-2 h-6 bg-emerald-400 rounded-full"></div> 捐血後照顧
                </h4>
                <ul className="space-y-3 text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> 多喝水，補充流失的水分
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> 扎針處的彈性繃帶請包紮至少 1 小時
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> 當天避免劇烈運動與提重物
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> 若感頭暈，請立即坐下或平躺休息
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
