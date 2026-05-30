import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Heart, Menu, X, User, Award, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: "首頁", path: "/" },
    { name: "尋找據點", path: "/locations" },
    { name: "健康 & 捐血", path: "/records" },
    { name: "獎勵任務", path: "/rewards" },
    { name: "捐血須知", path: "/eligibility" },
    { name: "流程介紹", path: "/process" },
    { name: "個人資訊", path: "/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-rose-50/30">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b-4 border-rose-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  className="bg-gradient-to-br from-rose-400 to-pink-500 p-2.5 rounded-2xl shadow-md text-white"
                >
                  <Heart className="h-7 w-7 fill-white" />
                </motion.div>
                <span className="font-extrabold text-2xl tracking-tight text-slate-800 ml-1">
                  血盅紅我都吃<span className="text-rose-500"> BLOOD </span>
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-xl text-base font-bold transition-all ${
                    isActive(link.path)
                      ? "text-rose-600 bg-rose-50 shadow-inner"
                      : "text-slate-500 hover:text-rose-500 hover:bg-rose-50/50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="w-px h-8 bg-slate-200 mx-2" />

              {user ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-500 text-sm font-bold transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    登出
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-2xl font-bold text-sm hover:bg-rose-600 transition-colors shadow-sm"
                >
                  <Award className="h-5 w-5" />
                  登入 / 註冊
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              {user ? (
                <Link
                  to="/profile"
                  className="flex items-center justify-center bg-amber-100 text-amber-700 h-10 w-10 rounded-full shadow-sm"
                >
                  <User className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center bg-rose-100 text-rose-600 h-10 w-10 rounded-full shadow-sm"
                >
                  <Award className="h-5 w-5" />
                </Link>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-500 hover:text-rose-500 focus:outline-none bg-rose-50 p-2 rounded-xl"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t-2 border-rose-50 overflow-hidden"
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-4 py-3 rounded-2xl text-lg font-bold ${
                      isActive(link.path)
                        ? "text-rose-600 bg-rose-50"
                        : "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                {user ? (
                  <>
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-400 px-2 mb-2">{user.name}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-base font-bold text-slate-500 hover:bg-slate-50"
                    >
                      <LogOut className="h-5 w-5" />
                      登出
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="mt-4 flex items-center justify-center gap-2 w-full bg-rose-500 text-white px-4 py-3 rounded-2xl font-bold text-lg hover:bg-rose-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Award className="h-5 w-5" />
                    登入 / 註冊
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12 mt-12 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link to="/" className="flex items-center gap-2 mb-4 md:mb-0">
              <Heart className="h-6 w-6 text-rose-400 fill-rose-400" />
              <span className="font-bold text-2xl tracking-tight text-white">
                滴滴<span className="text-rose-400">愛心</span>
              </span>
            </Link>
            <p className="text-slate-400 text-center md:text-left max-w-sm">
              整合捐血資訊、健康紀錄與獎勵機制，讓捐血變得更簡單、更有趣！
            </p>
            <div className="flex space-x-4">
              <Link to="/locations" className="text-slate-400 hover:text-rose-400 transition-colors font-bold">
                尋找捐血站
              </Link>
              <Link to="/rewards" className="text-slate-400 hover:text-rose-400 transition-colors font-bold">
                點數兌換
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} 捐血資料庫系統_第22組. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
