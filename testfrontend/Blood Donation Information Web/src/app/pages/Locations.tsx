import { useState } from "react";
import { Search, MapPin, Phone, Clock, Navigation } from "lucide-react";
import { motion } from "motion/react";

export function Locations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all"); // 'all', 'station', 'mobile'

  const locations = [
    {
      id: 1,
      name: "愛心總站醫療中心",
      address: "1200 台北市中正區忠孝西路一段",
      phone: "(02) 2381-4567",
      hours: "週一至週五: 8am - 6pm, 週六: 9am - 2pm",
      distance: "1.2 公里",
      category: "station"
    },
    {
      id: 2,
      name: "西區社區健康診所",
      address: "450 台北市萬華區西寧南路",
      phone: "(02) 2311-6543",
      hours: "週一至週四: 10am - 7pm, 週五: 8am - 4pm",
      distance: "3.5 公里",
      category: "station"
    },
    {
      id: 4,
      name: "巡迴車 - 台灣大學站",
      address: "羅斯福路四段1號 (鹿鳴廣場)",
      phone: "(02) 3366-0000",
      hours: "今日限定: 10am - 4pm",
      distance: "6.8 公里",
      category: "mobile"
    },
    {
      id: 5,
      name: "巡迴車 - 信義商圈",
      address: "松壽路香堤大道",
      phone: "0800-000-000",
      hours: "本週末限定: 13pm - 8pm",
      distance: "8.2 公里",
      category: "mobile"
    }
  ];

  const filteredLocations = locations.filter(loc => 
    (activeCategory === "all" || loc.category === activeCategory) &&
    (loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     loc.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="py-12 bg-rose-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-4">尋找附近捐血站</h1>
            <p className="text-xl text-slate-600 font-medium max-w-2xl">
              輸入您的位置，讓我們幫您計算最近的捐血地點與距離！
            </p>
          </div>
          
          {/* Search Box */}
          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-rose-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 border-2 border-rose-100 rounded-2xl bg-white placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 sm:text-base shadow-sm transition-all font-bold text-slate-700"
              placeholder="搜尋區域、站名或地址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveCategory("all")}
            className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${activeCategory === "all" ? "bg-slate-800 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            全部顯示
          </button>
          <button 
            onClick={() => setActiveCategory("station")}
            className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${activeCategory === "station" ? "bg-rose-500 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600"}`}
          >
            固定捐血站
          </button>
          <button 
            onClick={() => setActiveCategory("mobile")}
            className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-colors ${activeCategory === "mobile" ? "bg-sky-500 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-sky-50 hover:text-sky-600"}`}
          >
            巡迴捐血車
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Results List */}
          <div className="lg:col-span-1 space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((loc, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={loc.id} 
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-extrabold mb-2 ${loc.category === "station" ? "bg-rose-100 text-rose-600" : "bg-sky-100 text-sky-600"}`}>
                        {loc.category === "station" ? "固定站點" : "巡迴車"}
                      </span>
                      <h3 className="font-extrabold text-xl text-slate-800 group-hover:text-rose-600 transition-colors pr-2">{loc.name}</h3>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-sm font-extrabold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                      {loc.distance}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mt-4 text-sm font-medium text-slate-600">
                    <div className="flex items-start bg-slate-50 p-2 rounded-lg">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-rose-400 flex-shrink-0" />
                      <span>{loc.address}</span>
                    </div>
                    <div className="flex items-center p-1">
                      <Phone className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                      <span>{loc.phone}</span>
                    </div>
                    <div className="flex items-start p-1">
                      <Clock className="h-4 w-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                      <span>{loc.hours}</span>
                    </div>
                  </div>

                  <button className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Navigation className="h-4 w-4 text-sky-500" />
                    導航前往
                  </button>
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

          {/* Map Image Placeholder */}
          <div className="lg:col-span-2 h-[600px] bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden relative shadow-inner p-2">
            <div className="w-full h-full rounded-[22px] overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1764885449332-7eb941d53b7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBoZWFsdGglMjBjZW50ZXJ8ZW58MXx8fHwxNzc5Nzc4NjEyfDA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Map view placeholder showing health centers"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-sky-900/10 mix-blend-multiply"></div>
              
              {/* Cute UI Map Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white/95 backdrop-blur-md px-8 py-6 rounded-3xl shadow-2xl border-4 border-white text-center pointer-events-auto flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 relative">
                    <MapPin className="h-8 w-8 text-rose-500" />
                    <div className="absolute top-0 right-0 w-4 h-4 bg-amber-400 rounded-full border-2 border-white animate-ping"></div>
                  </div>
                  <h3 className="font-extrabold text-xl text-slate-800">互動式地圖預覽</h3>
                  <p className="text-sm font-medium text-slate-500 mt-2 max-w-[200px]">點擊左側列表的據點，即可在此查看詳細路線與導航！</p>
                </motion.div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
