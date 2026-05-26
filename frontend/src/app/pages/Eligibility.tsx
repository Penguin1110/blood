import { CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";

export function Eligibility() {
  const requirements = [
    { title: "年齡限制", desc: "17歲以上，65歲以下。未滿17歲需取得法定代理人同意書。" },
    { title: "體重標準", desc: "女性應滿 45 公斤以上，男性應滿 50 公斤以上。" },
    { title: "健康狀況", desc: "身體健康狀況良好，當天無感冒、發燒或喉嚨痛等不適症狀。" },
    { title: "身分證明", desc: "捐血時必須攜帶具身分證字號及照片的有效證件（如身分證、駕照、健保卡）。" },
  ];

  const faqs = [
    {
      question: "我有刺青或穿洞，還可以捐血嗎？",
      answer: "可以！但為了確保安全，刺青、紋眉、穿耳洞等行為後，必須暫緩捐血 1 年。",
    },
    {
      question: "有在吃藥可以捐血嗎？",
      answer: "要看吃什麼藥喔！一般的感冒藥、抗生素需停藥後 1 星期才能捐。但降血壓藥若血壓控制良好是可以捐的。建議填寫健康履歷讓系統評估。",
    },
    {
      question: "多久可以捐一次血？",
      answer: "捐 250cc 全血需間隔 2 個月；捐 500cc 全血需間隔 3 個月。分離術捐血則需間隔 2 星期。",
    },
    {
      question: "剛出國回來可以捐血嗎？",
      answer: "視前往的國家而定。若前往瘧疾、茲卡病毒等傳染病疫區，會有不同的暫緩捐血限制。請於健康履歷中據實填寫旅遊史。",
    },
  ];

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-rose-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white"
          >
            <CheckCircle className="h-10 w-10 text-rose-600" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">我符合捐血資格嗎？</h1>
          <p className="text-xl text-slate-600 font-medium">大部分健康的人都可以捐血！請先確認以下基本條件：</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {requirements.map((req, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={index}
              className="bg-white rounded-3xl p-6 border-2 border-rose-100 flex items-start shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1"
            >
              <div className="bg-rose-100 p-2 rounded-2xl flex-shrink-0 mt-1">
                <CheckCircle className="h-6 w-6 text-rose-500" />
              </div>
              <div className="ml-4">
                <h3 className="font-extrabold text-lg text-slate-800">{req.title}</h3>
                <p className="text-slate-600 mt-2 font-medium leading-relaxed">{req.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl mb-16 flex items-start shadow-sm"
        >
          <div className="bg-amber-200 p-2 rounded-2xl flex-shrink-0 mt-1">
            <AlertCircle className="h-6 w-6 text-amber-700" />
          </div>
          <div className="ml-4">
            <h3 className="font-extrabold text-amber-900 text-lg">最近感覺不舒服嗎？</h3>
            <p className="text-amber-800 mt-2 font-medium">
              如果您感冒、發燒、拉肚子、有傷口發炎，或是前一晚睡眠不足，請先好好休息！等身體完全康復再來捐血喔。
            </p>
          </div>
        </motion.div>

        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="bg-sky-100 p-3 rounded-2xl">
              <HelpCircle className="h-8 w-8 text-sky-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800">常見問題 QA</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:bg-sky-50/50 transition-colors">
                <h4 className="font-extrabold text-lg text-slate-800 mb-3 flex items-start gap-2">
                  <span className="text-sky-500">Q:</span>
                  {faq.question}
                </h4>
                <p className="text-slate-600 font-medium pl-6 leading-relaxed">
                  <span className="text-amber-500 font-extrabold absolute -ml-6">A:</span>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-6 font-bold text-lg">符合資格了嗎？來填寫健康履歷讓系統幫您計算！</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/profile"
              className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-2xl shadow-sm text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-all"
            >
              填寫健康履歷
            </Link>
            <Link
              to="/locations"
              className="inline-flex justify-center items-center px-8 py-4 text-lg font-bold rounded-2xl shadow-lg shadow-rose-500/30 text-white bg-rose-500 hover:bg-rose-600 transition-all hover:-translate-y-1"
            >
              尋找捐血站
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
