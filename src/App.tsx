import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Plus, 
  History, 
  BarChart3, 
  Settings, 
  ChevronRight, 
  Timer, 
  Scale, 
  ArrowLeft,
  Star,
  Check,
  Calendar,
  Moon,
  Sun,
  Pencil,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Search,
  Download,
  Upload,
  Share2,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell
} from 'recharts';
import { Shot, Stats, WeeklyData, RatingDistribution } from './types';

type Screen = 'home' | 'new-shot' | 'edit-shot' | 'shot-detail' | 'stats' | 'history' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [shots, setShots] = useState<Shot[]>([]);
  const [stats, setStats] = useState<{ stats: Stats; weekly: WeeklyData[]; ratings: RatingDistribution[] } | null>(null);
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('lota-dark-mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('lota-dark-mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const storedShots = localStorage.getItem('lota_shots');
      const shotsData: Shot[] = storedShots ? JSON.parse(storedShots) : [];
      
      // Calculate stats
      const total_shots = shotsData.length;
      let totalRating = 0;
      let ratedCount = 0;
      const ratingsCount: Record<string, number> = {};
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyData = Array.from({ length: 7 }, (_, i) => ({ day: i.toString(), count: 0, avg_time: 0, total_time: 0 }));

      shotsData.forEach((s) => {
        // Ratings
        if (s.rating) {
          ratingsCount[s.rating] = (ratingsCount[s.rating] || 0) + 1;
          let val = 0;
          if (s.rating === 'Great') val = 5;
          if (s.rating === 'Good') val = 4;
          if (s.rating === 'Okay') val = 3;
          if (s.rating === 'Off') val = 2;
          if (s.rating === 'Bad') val = 1;
          if (val > 0) {
            totalRating += val;
            ratedCount++;
          }
        }
        
        // Weekly
        const d = new Date(s.created_at);
        if (d >= sevenDaysAgo) {
          const dayOfWeek = d.getDay().toString();
          const dayObj = weeklyData.find(w => w.day === dayOfWeek);
          if (dayObj) {
            dayObj.count++;
            dayObj.total_time = (dayObj.total_time || 0) + (s.time || 0);
          }
        }
      });
      
      weeklyData.forEach(w => {
        if (w.count > 0) w.avg_time = w.total_time / w.count;
      });
      
      const avg_rating = ratedCount > 0 ? totalRating / ratedCount : 0;
      const ratingsArray = Object.entries(ratingsCount).map(([rating, count]) => ({ rating, count }));

      const statsData = {
        stats: { total_shots, avg_rating },
        weekly: weeklyData,
        ratings: ratingsArray
      };

      setShots(shotsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddShot = async (shotData: Partial<Shot>) => {
    if (!shotData.bean_name) {
      alert("Please enter a bean name!");
      return;
    }

    try {
      const storedShots = localStorage.getItem('lota_shots');
      const currentShots: Shot[] = storedShots ? JSON.parse(storedShots) : [];
      
      const newShot: Shot = {
        ...shotData,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      } as Shot;
      
      const updatedShots = [newShot, ...currentShots];
      localStorage.setItem('lota_shots', JSON.stringify(updatedShots));

      await fetchData();
      setCurrentScreen('home');
    } catch (error) {
      console.error('Error adding shot:', error);
      alert("Failed to save shot. Please try again.");
    }
  };

  const handleUpdateShot = async (id: string, shotData: Partial<Shot>, navigateHome: boolean = true) => {
    try {
      const storedShots = localStorage.getItem('lota_shots');
      const currentShots: Shot[] = storedShots ? JSON.parse(storedShots) : [];
      
      const updatedShots = currentShots.map(s => s.id === id ? { ...s, ...shotData } : s);
      localStorage.setItem('lota_shots', JSON.stringify(updatedShots));

      await fetchData();
      if (navigateHome) {
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Error updating shot:', error);
      alert("Failed to update shot. Please try again.");
    }
  };

  const handleDeleteShot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shot?")) return;

    try {
      const storedShots = localStorage.getItem('lota_shots');
      const currentShots: Shot[] = storedShots ? JSON.parse(storedShots) : [];
      
      const updatedShots = currentShots.filter(s => s.id !== id);
      localStorage.setItem('lota_shots', JSON.stringify(updatedShots));

      await fetchData();
      setCurrentScreen('home');
    } catch (error) {
      console.error('Error deleting shot:', error);
      alert("Failed to delete shot. Please try again.");
    }
  };

  return (
    <div className="max-w-[390px] mx-auto min-h-screen notion-app-container flex flex-col relative overflow-hidden shadow-sm border-x border-notion-border">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            {currentScreen === 'home' && (
              <HomeScreen 
                key="home" 
                shots={shots} 
                stats={stats?.stats} 
                onSelectShot={(shot) => {
                  setSelectedShot(shot);
                  setCurrentScreen('shot-detail');
                }}
                onEditShot={(shot) => {
                  setSelectedShot(shot);
                  setCurrentScreen('edit-shot');
                }}
                setCurrentScreen={setCurrentScreen}
              />
            )}
            {currentScreen === 'new-shot' && (
              <NewShotScreen 
                key="new" 
                onBack={() => setCurrentScreen('home')} 
                onSubmit={handleAddShot}
              />
            )}
            {currentScreen === 'edit-shot' && selectedShot && (
              <NewShotScreen 
                key="edit" 
                initialData={selectedShot}
                onBack={() => setCurrentScreen('shot-detail')} 
                onSubmit={(data) => handleUpdateShot(selectedShot.id, data)}
              />
            )}
            {currentScreen === 'shot-detail' && selectedShot && (
              <ShotDetailScreen 
                key="detail" 
                shot={selectedShot} 
                onBack={() => setCurrentScreen('home')} 
                onEdit={() => setCurrentScreen('edit-shot')}
                onDelete={() => handleDeleteShot(selectedShot.id)}
                onUpdate={(data) => {
                  handleUpdateShot(selectedShot.id, data, false);
                  setSelectedShot({ ...selectedShot, ...data });
                }}
              />
            )}
            {currentScreen === 'stats' && stats && (
              <StatsScreen 
                key="stats" 
                weekly={stats.weekly} 
                stats={stats.stats}
                ratings={stats.ratings}
                onBack={() => setCurrentScreen('home')}
              />
            )}
            {currentScreen === 'history' && (
              <HistoryScreen 
                key="history" 
                shots={shots} 
                onSelectShot={(shot) => {
                  setSelectedShot(shot);
                  setCurrentScreen('shot-detail');
                }}
                onEditShot={(shot) => {
                  setSelectedShot(shot);
                  setCurrentScreen('edit-shot');
                }}
                onBack={() => setCurrentScreen('home')}
              />
            )}
            {currentScreen === 'settings' && (
              <SettingsScreen 
                key="settings" 
                onBack={() => setCurrentScreen('home')}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                shots={shots}
                onRefresh={fetchData}
              />
            )}
          </AnimatePresence>
        </main>

        {/* Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 notion-nav px-6 py-3 flex justify-between items-center z-50">
          <NavButton 
            active={currentScreen === 'home'} 
            onClick={() => setCurrentScreen('home')} 
            icon={<Coffee size={20} />} 
            label="Brew"
          />
          <NavButton 
            active={currentScreen === 'stats'} 
            onClick={() => setCurrentScreen('stats')} 
            icon={<BarChart3 size={20} />} 
            label="Stats"
          />
          <button 
            onClick={() => setCurrentScreen('new-shot')}
            className="bg-notion-text text-white p-3 rounded-full shadow-md -mt-8 active:scale-90 transition-transform"
          >
            <Plus size={24} />
          </button>
          <NavButton 
            active={currentScreen === 'history'} 
            onClick={() => setCurrentScreen('history')} 
            icon={<History size={20} />} 
            label="History"
          />
          <NavButton 
            active={currentScreen === 'settings'} 
            onClick={() => setCurrentScreen('settings')} 
            icon={<Settings size={20} />} 
            label="Settings"
          />
        </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-notion-text' : 'text-notion-secondary'}`}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

function ShotListItem({ shot, onClick, onEdit }: { shot: Shot; onClick: () => void; onEdit?: (e: React.MouseEvent) => void; key?: React.Key }) {
  const ratingColors: Record<string, string> = {
    'Great': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'Good': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'Okay': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'Off': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    'Bad': 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const ratingStars: Record<string, number> = {
    'Great': 5,
    'Good': 4,
    'Okay': 3,
    'Off': 2,
    'Bad': 1,
  };

  return (
    <div 
      onClick={onClick}
      className="notion-card flex justify-between items-center group hover:border-notion-text transition-all active:scale-[0.98] p-4"
    >
      {/* Left Group (Icon & Text) */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-12 h-12 rounded-xl bg-notion-hover flex items-center justify-center text-notion-secondary group-hover:text-notion-text transition-colors shrink-0">
          <Coffee size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-notion-text truncate">{shot.bean_name}</p>
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            <span className="text-[10px] text-notion-secondary uppercase font-bold tracking-wider whitespace-nowrap shrink-0">
              {new Date(shot.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span className="w-1 h-1 rounded-full bg-notion-border shrink-0" />
            <span className="text-[10px] text-notion-secondary font-medium truncate">
              {shot.brew_method || 'Espresso Machine'} • {shot.time}s • {shot.dose}g/{shot.yield}g
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 min-w-0">
            <div className="flex gap-0.5 shrink-0">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={10} 
                  className={i < (ratingStars[shot.rating] || 0) ? "text-amber-500 fill-amber-500" : "text-notion-border"} 
                />
              ))}
            </div>
            {shot.notes && (
              <div className="flex items-center gap-1 min-w-0">
                <span className="w-1 h-1 rounded-full bg-notion-border shrink-0" />
                <MessageSquare size={10} className="text-notion-secondary shrink-0" />
                <p className="text-[10px] text-notion-secondary truncate italic">
                  {shot.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Group (Badge & Pencil) */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight whitespace-nowrap ${ratingColors[shot.rating] || 'bg-notion-hover text-notion-secondary'}`}>
          {shot.rating}
        </span>
        {onEdit && (
          <button 
            onClick={onEdit}
            className="p-2 hover:bg-notion-hover rounded-lg text-notion-secondary hover:text-notion-text transition-colors opacity-0 group-hover:opacity-100"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function HomeScreen({ shots, stats, onSelectShot, onEditShot, setCurrentScreen }: { shots: Shot[]; stats?: Stats; onSelectShot: (shot: Shot) => void; onEditShot: (shot: Shot) => void; setCurrentScreen: (s: Screen) => void; key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex justify-between items-center px-1">
        <h1 className="text-xl font-bold tracking-tight">Lota Espresso Tracker</h1>
        <div className="w-8 h-8 rounded-full bg-notion-hover flex items-center justify-center">
          <Coffee size={18} className="text-notion-text" />
        </div>
      </header>

      <div className="w-full aspect-square rounded-xl overflow-hidden border border-notion-border bg-notion-hover">
        <img 
          src="https://i.postimg.cc/jS9xz1nC/new-lota-helmet-girl.png" 
          alt="Illustration of a girl wearing a Lota Kopi helmet drinking coffee" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <button 
        onClick={() => setCurrentScreen('new-shot')}
        className="notion-btn-primary w-full py-2.5"
      >
        New Shot
      </button>

      <div className="border border-notion-border rounded-xl p-5 space-y-5">
        <h2 className="text-sm font-semibold text-notion-secondary uppercase tracking-widest">Overall Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="notion-stat-box">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Shots</span>
            <span className="text-xl font-semibold">{stats?.total_shots || 0}</span>
          </div>
          <div className="notion-stat-box">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Beans</span>
            <span className="text-xl font-semibold">{new Set(shots.map(s => s.bean_name)).size}</span>
          </div>
          <div className="notion-stat-box">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Quality</span>
            <span className="text-xl font-semibold">{shots.filter(s => s.rating === 'Great' || s.rating === 'Good').length}</span>
          </div>
          <div className="notion-stat-box">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Avg Time</span>
            <span className="text-xl font-semibold">{Math.round(shots.reduce((acc, s) => acc + s.time, 0) / (shots.length || 1))}s</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-semibold text-notion-secondary uppercase tracking-widest">Recent Brews</h2>
          <button 
            onClick={() => setCurrentScreen('history')}
            className="text-xs text-notion-secondary hover:text-notion-text transition-colors"
          >
            View All
          </button>
        </div>
        <div className="space-y-2">
          {shots.slice(0, 3).map((shot) => (
            <ShotListItem 
              key={shot.id} 
              shot={shot} 
              onClick={() => onSelectShot(shot)} 
              onEdit={(e) => {
                e.stopPropagation();
                onEditShot(shot);
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function NewShotScreen({ onBack, onSubmit, initialData }: { onBack: () => void; onSubmit: (data: any) => void; initialData?: Shot; key?: string }) {
  const [formData, setFormData] = useState({
    bean_name: initialData?.bean_name || '',
    roaster: initialData?.roaster || '',
    bean_type: initialData?.bean_type || 'Arabica',
    roast_level: initialData?.roast_level || 'Medium',
    grind_setting: initialData?.grind_setting || '',
    dose: initialData?.dose?.toString() || '',
    yield: initialData?.yield?.toString() || '',
    time: initialData?.time?.toString() || '',
    rating: initialData?.rating || 'Good',
    notes: initialData?.notes || '',
    machine: initialData?.machine || '',
    grinder: initialData?.grinder || '',
    brew_method: initialData?.brew_method || 'Espresso Machine',
    photo_url: initialData?.photo_url || ''
  });

  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(initialData?.time || 0);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => {
        setSeconds(s => {
          const next = s + 1;
          setFormData(prev => ({ ...prev, time: next.toString() }));
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleToggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setSeconds(0);
    setFormData(prev => ({ ...prev, time: '0' }));
  };

  const ratings = ['Bad', 'Off', 'Okay', 'Good', 'Great'];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="p-6 space-y-6 min-h-screen"
    >
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-1.5 hover:bg-notion-hover rounded-md transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">{initialData ? 'Edit Shot' : 'New Shot'}</h1>
      </header>

      <div className="space-y-6">
        {/* Timer Section */}
        <div className="bg-gray-100 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden">
          <button 
            onClick={handleResetTimer}
            disabled={seconds === 0 && !timerActive}
            className="absolute top-6 right-6 w-10 h-10 bg-gray-50/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200/50 z-20"
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>

          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-bold tracking-widest uppercase mb-6">
            <Timer size={14} />
            <span>Extraction Timer</span>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            {/* Analog Dial SVG */}
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              {/* Tick Marks */}
              {[...Array(60)].map((_, i) => (
                <line
                  key={i}
                  x1="100"
                  y1="12"
                  x2="100"
                  y2={i % 5 === 0 ? "24" : "20"}
                  stroke={i % 5 === 0 ? "#9ca3af" : "#d1d5db"}
                  strokeWidth={i % 5 === 0 ? "2" : "1"}
                  transform={`rotate(${i * 6}, 100, 100)`}
                />
              ))}
              
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              
              {/* Progress Sweep */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#ef4444"
                strokeWidth="8"
                strokeDasharray={502.65}
                strokeDashoffset={502.65 - ((seconds % 60) / 60) * 502.65}
                strokeLinecap="round"
                className="transition-all duration-1000 linear"
                style={{ 
                  transitionProperty: 'stroke-dashoffset',
                  transitionTimingFunction: 'linear'
                }}
              />
            </svg>

            {/* Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-gray-600 tabular-nums tracking-tighter">
                {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
              </div>
              {seconds > 60 && (
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Lap {Math.floor(seconds / 60) + 1}
                </div>
              )}
            </div>
          </div>

          <div className="w-full">
            <button 
              onClick={handleToggleTimer}
              className="w-full bg-[#36322d] text-white py-4 rounded-xl flex justify-center items-center gap-2 font-semibold text-lg active:scale-[0.98] transition-transform ring-2 ring-blue-500"
            >
              {timerActive ? (
                <>
                  <Pause size={20} fill="white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={20} fill="white" />
                  <span>{seconds > 0 ? 'Resume' : 'Start Extraction'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-notion-secondary ml-1">Bean Details</label>
            <input 
              placeholder="Bean Name (e.g. Mt Apo)" 
              className="notion-input"
              value={formData.bean_name}
              onChange={e => setFormData({...formData, bean_name: e.target.value})}
            />
            <input 
              placeholder="Roaster" 
              className="notion-input"
              value={formData.roaster}
              onChange={e => setFormData({...formData, roaster: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                placeholder="Type (e.g. Arabica)" 
                className="notion-input"
                value={formData.bean_type}
                onChange={e => setFormData({...formData, bean_type: e.target.value})}
              />
              <input 
                placeholder="Roast (e.g. Medium)" 
                className="notion-input"
                value={formData.roast_level}
                onChange={e => setFormData({...formData, roast_level: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-notion-secondary ml-1">Dose (g)</label>
              <input 
                type="number" 
                placeholder="18.0" 
                className="notion-input"
                value={formData.dose}
                onChange={e => setFormData({...formData, dose: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-notion-secondary ml-1">Yield (g/ml)</label>
              <input 
                type="number" 
                placeholder="36.0" 
                className="notion-input"
                value={formData.yield}
                onChange={e => setFormData({...formData, yield: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-notion-secondary ml-1">Time (s)</label>
              <input 
                type="number" 
                placeholder="30" 
                className="notion-input"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-notion-secondary ml-1">Grind Setting</label>
              <input 
                placeholder="8.5" 
                className="notion-input"
                value={formData.grind_setting}
                onChange={e => setFormData({...formData, grind_setting: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-notion-secondary ml-1">Brew Method</label>
            <select 
              className="notion-input w-full bg-white dark:bg-[#1f1f1f] cursor-pointer"
              value={formData.brew_method}
              onChange={e => setFormData({...formData, brew_method: e.target.value})}
            >
              <option value="Espresso Machine">Espresso Machine</option>
              <option value="Pour Over">Pour Over</option>
              <option value="Aeropress">Aeropress</option>
              <option value="French Press">French Press</option>
              <option value="Moka Pot">Moka Pot</option>
              <option value="Cold Brew">Cold Brew</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-notion-secondary ml-1">Equipment</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-secondary" size={14} />
                <input 
                  placeholder="Machine" 
                  className="notion-input pl-9"
                  value={formData.machine}
                  onChange={e => setFormData({...formData, machine: e.target.value})}
                />
              </div>
              <div className="relative">
                <Settings className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-secondary" size={14} />
                <input 
                  placeholder="Grinder" 
                  className="notion-input pl-9"
                  value={formData.grinder}
                  onChange={e => setFormData({...formData, grinder: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-notion-secondary ml-1">Rating</label>
            <div className="flex flex-wrap gap-1.5">
              {ratings.map((r) => (
                <button
                  key={r}
                  onClick={() => setFormData({...formData, rating: r})}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    formData.rating === r 
                      ? 'bg-notion-text text-white' 
                      : 'bg-notion-hover text-notion-secondary hover:bg-notion-border hover:text-notion-text'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-notion-secondary ml-1">Photo</label>
            <div className="flex items-center gap-4">
              {formData.photo_url ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-notion-border shrink-0">
                  <img src={formData.photo_url} alt="Shot" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                  >
                    <Plus size={12} className="rotate-45" />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border border-dashed border-notion-border flex flex-col items-center justify-center text-notion-secondary hover:bg-notion-hover hover:text-notion-text transition-colors cursor-pointer shrink-0">
                  <Camera size={20} className="mb-1" />
                  <span className="text-[10px] font-medium">Add Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
              <div className="flex-1 text-xs text-notion-secondary">
                Upload a photo of your extraction, latte art, or beans.
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-notion-secondary ml-1">Notes</label>
            <textarea 
              placeholder="Tasting notes..." 
              className="notion-input min-h-[80px] resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button 
            onClick={() => onSubmit(formData)}
            className="notion-btn-primary w-full py-2.5 mt-2"
          >
            Save Shot
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InlineInput({ 
  value, 
  onSave, 
  type = "text",
  className = "",
  placeholder = ""
}: { 
  value: string | number | undefined, 
  onSave: (val: string) => void,
  type?: string,
  className?: string,
  placeholder?: string
}) {
  const [val, setVal] = useState(value?.toString() || '');
  
  useEffect(() => {
    setVal(value?.toString() || '');
  }, [value]);

  return (
    <input
      type={type}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== value?.toString()) {
          onSave(val);
        }
      }}
      placeholder={placeholder}
      className={`bg-transparent border-none focus:ring-1 focus:ring-notion-border focus:bg-white dark:focus:bg-[#2f2f2f] rounded px-1 w-full outline-none transition-colors ${className}`}
    />
  );
}

function ShotDetailScreen({ shot, onBack, onEdit, onDelete, onUpdate }: { shot: Shot; onBack: () => void; onEdit: () => void; onDelete: () => void; onUpdate: (data: Partial<Shot>) => void; key?: string }) {
  const [notes, setNotes] = useState(shot.notes || '');

  const handleShare = async () => {
    const shareText = `☕ Coffee Brew Details:
Bean: ${shot.bean_name} ${shot.roaster ? `by ${shot.roaster}` : ''}
Method: ${shot.brew_method || 'Espresso Machine'}
Dose: ${shot.dose}g | Yield: ${shot.yield}g | Time: ${shot.time}s
Grind: ${shot.grind_setting}
Rating: ${shot.rating}
${shot.machine ? `Machine: ${shot.machine}\n` : ''}${shot.grinder ? `Grinder: ${shot.grinder}\n` : ''}Notes: ${shot.notes || 'None'}

Shared from Lota Espresso Tracker`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Coffee Brew Details',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Brew details copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6 pb-32"
    >
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-1.5 hover:bg-notion-hover rounded-md transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-1.5 hover:bg-notion-hover rounded-md transition-colors text-notion-secondary hover:text-notion-text" title="Share Shot">
            <Share2 size={18} />
          </button>
          <button onClick={onEdit} className="p-1.5 hover:bg-notion-hover rounded-md transition-colors text-notion-secondary hover:text-notion-text">
            <Pencil size={18} />
          </button>
        </div>
      </header>

      <div className="w-full aspect-square rounded-xl overflow-hidden border border-notion-border shadow-sm relative group">
        <img 
          src={shot.photo_url || "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=600&h=600&auto=format&fit=crop"} 
          alt="Espresso Shot" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Camera size={24} className="mb-2" />
          <span className="text-xs font-medium">Change Photo</span>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  onUpdate({ photo_url: reader.result as string });
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-notion-hover rounded-md p-2 text-center">
          <p className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Date</p>
          <p className="text-xs font-medium">{new Date(shot.created_at).toLocaleDateString()}</p>
        </div>
        <div className="bg-notion-hover rounded-md p-2 text-center">
          <p className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Bean</p>
          <InlineInput 
            value={shot.bean_name} 
            onSave={(val) => onUpdate({ bean_name: val })} 
            className="text-xs font-medium text-center"
            placeholder="Bean Name"
          />
          <InlineInput 
            value={shot.roaster} 
            onSave={(val) => onUpdate({ roaster: val })} 
            className="text-[10px] text-notion-secondary text-center mt-0.5"
            placeholder="Roaster"
          />
        </div>
        <div className="bg-notion-hover rounded-md p-2 text-center">
          <p className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Type</p>
          <InlineInput 
            value={shot.bean_type || 'Arabica'} 
            onSave={(val) => onUpdate({ bean_type: val })} 
            className="text-xs font-medium text-center"
          />
        </div>
        <div className="bg-notion-hover rounded-md p-2 text-center">
          <p className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Roast</p>
          <InlineInput 
            value={shot.roast_level || 'Medium'} 
            onSave={(val) => onUpdate({ roast_level: val })} 
            className="text-xs font-medium text-center"
          />
        </div>
      </div>

      <div className="border border-notion-border rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-notion-secondary uppercase tracking-widest">Extraction Details</h2>
          <select 
            value={shot.brew_method || 'Espresso Machine'}
            onChange={(e) => onUpdate({ brew_method: e.target.value })}
            className="bg-notion-hover rounded-md px-2 py-1 text-[10px] font-bold text-notion-text border border-notion-border focus:outline-none focus:ring-1 focus:ring-notion-text uppercase tracking-wider cursor-pointer"
          >
            <option value="Espresso Machine">Espresso Machine</option>
            <option value="Pour Over">Pour Over</option>
            <option value="Aeropress">Aeropress</option>
            <option value="French Press">French Press</option>
            <option value="Moka Pot">Moka Pot</option>
            <option value="Cold Brew">Cold Brew</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Grind</span>
            <div className="bg-notion-hover rounded px-2 py-1 flex items-center">
              <InlineInput 
                value={shot.grind_setting} 
                onSave={(val) => onUpdate({ grind_setting: val })} 
                className="text-xs font-medium"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Dose</span>
            <div className="bg-notion-hover rounded px-2 py-1 flex items-center">
              <InlineInput 
                type="number"
                value={shot.dose} 
                onSave={(val) => onUpdate({ dose: parseFloat(val) || 0 })} 
                className="text-xs font-medium"
              />
              <span className="text-xs font-medium text-notion-secondary ml-1">g</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Yield</span>
            <div className="bg-notion-hover rounded px-2 py-1 flex items-center">
              <InlineInput 
                type="number"
                value={shot.yield} 
                onSave={(val) => onUpdate({ yield: parseFloat(val) || 0 })} 
                className="text-xs font-medium"
              />
              <span className="text-xs font-medium text-notion-secondary ml-1">g</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Time</span>
            <div className="bg-notion-hover rounded px-2 py-1 flex items-center">
              <InlineInput 
                type="number"
                value={shot.time} 
                onSave={(val) => onUpdate({ time: parseFloat(val) || 0 })} 
                className="text-xs font-medium"
              />
              <span className="text-xs font-medium text-notion-secondary ml-1">s</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-notion-border grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Machine</span>
            <div className="bg-notion-hover rounded px-2 py-1 flex items-center">
              <InlineInput 
                value={shot.machine} 
                onSave={(val) => onUpdate({ machine: val })} 
                className="text-xs font-medium"
                placeholder="Add machine..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Grinder</span>
            <div className="bg-notion-hover rounded px-2 py-1 flex items-center">
              <InlineInput 
                value={shot.grinder} 
                onSave={(val) => onUpdate({ grinder: val })} 
                className="text-xs font-medium"
                placeholder="Add grinder..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Rating</span>
          <div className="bg-notion-hover rounded-lg p-3 flex justify-between items-center">
            <span className="text-xs font-semibold uppercase">{shot.rating}</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => {
                const ratingMap: Record<string, number> = { 'Great': 5, 'Good': 4, 'Okay': 3, 'Off': 2, 'Bad': 1 };
                const val = ratingMap[shot.rating] || 0;
                return (
                  <Star key={i} size={14} fill={i < val ? "currentColor" : "none"} className={i < val ? "text-notion-text" : "text-notion-border"} />
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Notes</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== shot.notes) {
                onUpdate({ notes });
              }
            }}
            className="w-full bg-notion-hover rounded-lg p-3 text-xs leading-relaxed text-notion-text border border-notion-border focus:outline-none focus:ring-1 focus:ring-notion-text min-h-[80px] resize-none transition-colors hover:bg-notion-border/50"
            placeholder="Add your notes here..."
          />
        </div>
      </div>

      <button 
        onClick={onDelete}
        className="notion-btn-secondary w-full py-2.5 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 flex items-center justify-center gap-2"
      >
        <Trash2 size={16} />
        Delete Shot
      </button>
    </motion.div>
  );
}

function StatsScreen({ weekly, stats, ratings, onBack }: { weekly: WeeklyData[]; stats: Stats; ratings: RatingDistribution[]; onBack: () => void; key?: string }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Prepare weekly data for line chart
  const weeklyChartData = days.map((day, i) => {
    const data = weekly.find(w => parseInt(w.day) === i);
    return {
      name: day,
      shots: data?.count || 0,
      avgTime: data?.avg_time ? Math.round(data.avg_time) : 0
    };
  });

  // Prepare rating distribution data
  const ratingOrder = ['Great', 'Good', 'Okay', 'Off', 'Bad'];
  const ratingColors: Record<string, string> = {
    'Great': '#10b981',
    'Good': '#3b82f6',
    'Okay': '#f59e0b',
    'Off': '#f97316',
    'Bad': '#ef4444',
  };

  const ratingChartData = ratingOrder.map(r => {
    const data = ratings.find(item => item.rating === r);
    return {
      name: r,
      count: data?.count || 0,
      color: ratingColors[r]
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-8 pb-32"
    >
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-1.5 hover:bg-notion-hover rounded-md transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Brew Analytics</h1>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="notion-stat-box p-4">
          <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Overall Rating</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{(stats.avg_rating || 0).toFixed(1)}</span>
            <span className="text-xs text-notion-secondary">/ 5.0</span>
          </div>
        </div>
        <div className="notion-stat-box p-4">
          <span className="text-[10px] font-bold text-notion-secondary uppercase tracking-wider">Total Brews</span>
          <span className="text-2xl font-bold">{stats.total_shots}</span>
        </div>
      </div>

      {/* Rating Distribution Bar Chart */}
      <div className="border border-notion-border rounded-xl p-5 space-y-6">
        <div className="flex items-center gap-2 text-notion-secondary">
          <BarChart3 size={18} />
          <h3 className="text-xs font-semibold uppercase tracking-widest">Rating Distribution</h3>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--notion-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--notion-secondary)' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--notion-secondary)' }} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  backgroundColor: 'var(--notion-bg)', 
                  borderColor: 'var(--notion-border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ratingChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shot Time Line Chart */}
      <div className="border border-notion-border rounded-xl p-5 space-y-6">
        <div className="flex items-center gap-2 text-notion-secondary">
          <Timer size={18} />
          <h3 className="text-xs font-semibold uppercase tracking-widest">Avg Shot Time (Last 7 Days)</h3>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--notion-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--notion-secondary)' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--notion-secondary)' }} 
                unit="s"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--notion-bg)', 
                  borderColor: 'var(--notion-border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                stroke="var(--notion-text)" 
                strokeWidth={2} 
                dot={{ r: 4, fill: 'var(--notion-bg)', stroke: 'var(--notion-text)', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Frequency */}
      <div className="border border-notion-border rounded-xl p-5 space-y-6">
        <div className="flex items-center gap-2 text-notion-secondary">
          <Calendar size={18} />
          <h3 className="text-xs font-semibold uppercase tracking-widest">Brew Frequency</h3>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--notion-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--notion-secondary)' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--notion-secondary)' }} 
              />
              <Tooltip 
                cursor={{ fill: 'var(--notion-hover)' }}
                contentStyle={{ 
                  backgroundColor: 'var(--notion-bg)', 
                  borderColor: 'var(--notion-border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="shots" fill="var(--notion-text)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryScreen({ shots, onSelectShot, onEditShot, onBack }: { shots: Shot[]; onSelectShot: (shot: Shot) => void; onEditShot: (shot: Shot) => void; onBack: () => void; key?: string }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShots = shots.filter(shot => {
    const query = searchQuery.toLowerCase();
    return (
      shot.bean_name?.toLowerCase().includes(query) ||
      shot.roaster?.toLowerCase().includes(query) ||
      shot.notes?.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-1.5 hover:bg-notion-hover rounded-md transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Brew History</h1>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-secondary" size={16} />
        <input
          type="text"
          placeholder="Search by bean, roaster, or notes..."
          className="notion-input pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        {filteredShots.length > 0 ? (
          filteredShots.map((shot) => (
            <ShotListItem 
              key={shot.id} 
              shot={shot} 
              onClick={() => onSelectShot(shot)} 
              onEdit={(e) => {
                e.stopPropagation();
                onEditShot(shot);
              }}
            />
          ))
        ) : (
          <div className="text-center py-12 text-notion-secondary">
            <p className="text-sm">No shots found matching your search.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SettingsScreen({ onBack, darkMode, setDarkMode, shots, onRefresh }: { onBack: () => void; darkMode: boolean; setDarkMode: (v: boolean) => void; shots: Shot[]; onRefresh: () => void; key?: string }) {
  const handleExportCSV = () => {
    if (shots.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = ['bean_name', 'roaster', 'bean_type', 'roast_level', 'grind_setting', 'dose', 'yield', 'time', 'rating', 'notes', 'machine', 'grinder', 'created_at'];
    const csvRows = [
      headers.join(','),
      ...shots.map(shot => headers.map(header => {
        const val = (shot as any)[header] || '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lota-espresso-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const data = lines.slice(1).map(line => {
        // Simple CSV parser that handles quotes
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const obj: any = {};
        headers.forEach((header, index) => {
          let val = values[index]?.replace(/^"|"$/g, '').replace(/""/g, '"');
          if (['dose', 'yield', 'time'].includes(header)) {
            obj[header] = parseFloat(val) || 0;
          } else {
            obj[header] = val || '';
          }
        });
        return obj;
      });

      try {
        const storedShots = localStorage.getItem('lota_shots');
        const currentShots: Shot[] = storedShots ? JSON.parse(storedShots) : [];
        
        const newShots = data.map((shot: any) => ({
          ...shot,
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          created_at: shot.created_at || new Date().toISOString()
        }));

        const updatedShots = [...newShots, ...currentShots];
        localStorage.setItem('lota_shots', JSON.stringify(updatedShots));

        alert(`Successfully imported ${data.length} shots!`);
        onRefresh();
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Please check your CSV format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-1.5 hover:bg-notion-hover rounded-md transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="border border-notion-border rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Dark Mode</span>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-notion-hover rounded-md transition-colors text-notion-secondary hover:text-notion-text"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div className="h-px bg-notion-border" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">App Version</span>
          <span className="text-xs text-notion-secondary">1.0.0</span>
        </div>
        <div className="h-px bg-notion-border" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Units</span>
          <span className="text-xs bg-notion-hover px-2 py-1 rounded border border-notion-border">Metric (g/ml)</span>
        </div>
        <div className="h-px bg-notion-border" />
        
        <div className="space-y-2 pt-2">
          <h3 className="text-[10px] font-bold text-notion-secondary uppercase tracking-widest px-1">Data Management</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleExportCSV}
              className="notion-btn-secondary py-2 text-xs flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Export CSV
            </button>
            <label className="notion-btn-secondary py-2 text-xs flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={14} />
              Import CSV
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleImportCSV}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] font-semibold uppercase tracking-widest text-notion-secondary mt-12">
        Made with ❤️ for Coffee Lovers
      </div>
    </motion.div>
  );
}
