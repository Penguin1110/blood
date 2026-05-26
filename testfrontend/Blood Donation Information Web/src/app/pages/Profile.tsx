import { useState } from "react";
import { User, Activity, FileText, CalendarHeart, Save, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "王小明",
    bloodType: "O+",
    birthday: "1995-05-10",
    weight: 68,
    lastDonation: "2023-12-15",
    medications: "無",
    travelHistory: "無",
    diseaseHistory: "無"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    alert("健康履歷更新成功！");
  };

  // 模擬計算下次可捐血時間 (假設全血需間隔2個月)
  const calculateNextDonation = (lastDateStr: string) => {
    if (!lastDateStr) return "隨時可捐";
    const lastDate = new Date(lastDateStr);
    lastDate.setMonth(lastDate.getMonth() + 2);
    
    const today = new Date();
    if (today >= lastDate) return "隨時可捐";
    
    return lastDate.toISOString().split('T')[0];
  };

  const nextDate = calculateNextDonation(formData.lastDonation);
  const canDonateNow = nextDate === "隨時可捐";

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-4">會員中心與健康紀錄</h1>
          <p className="text-xl text-slate-600 font-medium">
            維護您的基本資料與健康履歷，我們將為您把關捐血資格。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Status Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`md:col-span-3 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border ${
              canDonateNow ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                canDonateNow ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              }`}>
                <CalendarHeart className="h-8 w-8" />
              </div>
              <div>
                <p className={`font-bold ${canDonateNow ? "text-emerald-700" : "text-blue-700"}`}>
                  {canDonateNow ? "太棒了！您目前可以捐血" : "休息是為了走更長遠的路"}
                </p>
                <div className="text-sm mt-1 opacity-80">
                  上次捐血：{formData.lastDonation}
                </div>
              </div>
            </div>
            
            <div className={`px-6 py-3 rounded-2xl text-center font-extrabold text-xl ${
              canDonateNow ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-blue-100 text-blue-800"
            }`}>
              下次可捐日：{nextDate}
            </div>
          </motion.div>

          {/* Basic Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-sky-500" /> 基本資料
                </h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">姓名</label>
                  <p className="font-bold text-slate-700">{formData.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">血型</label>
                  <div className="inline-block bg-rose-100 text-rose-600 font-extrabold px-3 py-1 rounded-lg">
                    {formData.bloodType}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">生日</label>
                  <p className="font-bold text-slate-700">{formData.birthday}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">體重 (kg)</label>
                  {isEditing ? (
                    <input 
                      type="number" 
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-bold text-slate-700"
                    />
                  ) : (
                    <p className="font-bold text-slate-700">{formData.weight}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Health Resume */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-rose-500" /> 健康履歷 (Drugs Record)
                </h2>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-sky-600 font-bold hover:bg-sky-50 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" /> 編輯資料
                  </button>
                ) : (
                  <button 
                    onClick={handleSave}
                    className="bg-emerald-500 text-white font-bold hover:bg-emerald-600 px-4 py-1.5 rounded-xl shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" /> 儲存變更
                  </button>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-medium leading-relaxed">
                  請誠實填寫健康履歷，這關係到血液的品質與受血者的安全。若有服用特殊藥物或近期有旅遊史，系統會自動評估是否需要暫緩捐血。
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">近期用藥紀錄</label>
                  {isEditing ? (
                    <textarea 
                      name="medications"
                      value={formData.medications}
                      onChange={handleChange}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500 font-medium text-slate-700 resize-none"
                      placeholder="請填寫近期服用的藥物，若無則填「無」"
                    />
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 min-h-[3rem] font-medium text-slate-600">
                      {formData.medications}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">一年內旅遊史</label>
                  {isEditing ? (
                    <textarea 
                      name="travelHistory"
                      value={formData.travelHistory}
                      onChange={handleChange}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500 font-medium text-slate-700 resize-none"
                      placeholder="請填寫近一年出國的地點，若無則填「無」"
                    />
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 min-h-[3rem] font-medium text-slate-600">
                      {formData.travelHistory}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">特殊疾病史</label>
                  {isEditing ? (
                    <textarea 
                      name="diseaseHistory"
                      value={formData.diseaseHistory}
                      onChange={handleChange}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500 font-medium text-slate-700 resize-none"
                      placeholder="請填寫過去病史，若無則填「無」"
                    />
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 min-h-[3rem] font-medium text-slate-600">
                      {formData.diseaseHistory}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
