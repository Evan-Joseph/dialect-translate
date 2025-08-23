import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, TrendingUp } from "lucide-react";
import Home from "@/pages/Home";
import DialectRanking from "@/pages/DialectRanking";

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    {
      path: '/',
      label: '翻译首页',
      icon: HomeIcon
    },
    {
      path: '/ranking',
      label: '方言打榜',
      icon: TrendingUp
    }
  ];

  return (
    <nav className="bg-traditional-red-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-8">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-3 transition-all font-chinese ${
                  isActive
                    ? 'text-traditional-gold-300 border-b-2 border-traditional-gold-300'
                    : 'text-traditional-red-100 hover:text-white hover:bg-traditional-red-700'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<DialectRanking />} />
        </Routes>
      </div>
    </Router>
  );
}
