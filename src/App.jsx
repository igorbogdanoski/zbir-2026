import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- КОНФИГУРАЦИЈА ---
// Доколку користите Netlify, овие податоци можете да ги преземете од вашиот Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "ВАШИОТ_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ВАШИОТ_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ВАШИОТ_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ВАШИОТ_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "ВАШИОТ_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "ВАШИОТ_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = import.meta.env.VITE_ZBIR_APP_ID || 'regional-math-proben-zbir';

// Помошна компонента за икони
const Icon = ({ name, size = 20, className = "" }) => {
  const icons = {
    clock: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    user: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    book: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    upload: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>,
    alert: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    chevron: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>,
    award: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
    printer: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    close: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    lock: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  };
  return icons[name] || null;
};

// Logo Component со fallback доколку сликата не се вчита
const ZbirLogo = ({ className = "h-16 w-auto" }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-blue-50 rounded-2xl border-2 border-blue-100 px-4 py-2 ${className}`}>
        <span className="text-blue-600 font-black text-xl tracking-tighter">ЗБИР</span>
        <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest text-center leading-tight">Едукативен<br/>центар</span>
      </div>
    );
  }
  return <img src="/logo.jpg" alt="Збир" className={className} onError={() => setError(true)} />;
};

const PROBLEMS_BY_GRADE = {
  '4': [
    { id: 1, title: "Задача 1: Мечката Вини", text: "Мечката Вини во текот на секое лето добива 5 kg, а во текот на секоја зима губи 4 kg. Во есента 2021 имала 100 kg. Колкава маса имала во пролетта 2018?" },
    { id: 2, title: "Задача 2: Криптартиметика", text: "СИН + НОС = 353. Одреди ги сите можни цифри за буквите." },
    { id: 3, title: "Задача 3: Производ на цифри", text: "Одреди го збирот на сите трицифрени природни броеви чијшто производ на цифри е 16." },
    { id: 4, title: "Задача 4: Фигури и периметар", text: "Правоаголник со една страна подолга за 3 cm. Над пократките страни има по два рамнострани триаголници. Периметар на фигурата е 78 cm. Најди периметар на правоаголникот." },
    { id: 5, title: "Задача 5: Логика во зграда", text: "24 станови во зграда. Половина со 2 лица, еден со 1 лице, еден празен. Останатите се тричлени и четиричлени во еднаков број. Колку станари има вкупно?" }
  ],
  '5': [
    { id: 1, title: "Задача 1: Пиперки за ајвар", text: "Милева, Цвета и Марта собрале 3490 денари. Да дале уште пари, сумите би биле еднакви. Колку дале на почетокот?" },
    { id: 2, title: "Задача 2: Нумерирање страници", text: "Парни страници нумерирани со 364 цифри. Колку вкупно цифри има целата збирка?" },
    { id: 3, title: "Задача 3: Плоштина", text: "Точка M на AB кај правоаголник. AM е за 5 cm пократка од BC, MB е 3 пати подолга од AM. Периметар е 40 cm. Најди плоштина." },
    { id: 4, title: "Задача 4: Подмножества", text: "Тричлени подмножества од дропки каде збирот на најмалата и најголемата е 1." },
    { id: 5, title: "Задача 5: Чекорите на Маја", text: "Циклус 10 напред - 3 назад, 10-2, 10-1. Колку чекори до оддалеченост од 2038?" }
  ],
  '6': [
    { id: 1, title: "Задача 1: Прелевање вода", text: "80 литри вкупно. По прелевање 1/8 од вкупното, во вториот има 4 пати повеќе. Колку имало на почеток?" },
    { id: 2, title: "Задача 2: Агли", text: "Збир на α, β, γ е 180°. α и β се комплементни, 5β и γ се суплементни. Најди ги аглите." },
    { id: 3, title: "Задача 3: НЗД", text: "НЗД на три пара броеви се 12, 8 и 20. Кои се најмалите природни броеви?" },
    { id: 4, title: "Задача 4: Знаменца", text: "Четири бои знаменца со растечки кракови. Пресметај вкупна должина на лента за 200 знаменца." },
    { id: 5, title: "Задача 5: Кроасани", text: "24 лица поделиле 48 кроасани (8 за дете, 2 за жена, 1 за маж). Најди ги комбинациите." }
  ],
  '7': [
    { id: 1, title: "Задача 1: Избришани собироци", text: "Кои собироци од низата треба да се избришат за збирот да биде 1?" },
    { id: 2, title: "Задача 2: Рационални броеви", text: "Збир на два броја е 20/21. Едниот е 4 пати поголем по апсолутна вредност. Најди ги." },
    { id: 3, title: "Задача 3: НЗС и збир", text: "x + y = 108, НЗД(x,y)=12, НЗС(x,y)=240. Најди ги броевите." },
    { id: 4, title: "Задача 4: Триаголник", text: "Агол меѓу симетрали на надворешни агли. Спореди ги страните." },
    { id: 5, title: "Задача 5: Стрелец", text: "Погоди центар (9б), мета (5б), промаши (-3б). По 16 истрели има 0 бодови. Колку погодоци има?" }
  ],
  '8': [
    { id: 1, title: "Задача 1: Читање", text: "Брзина на читање и рок. Најди вкупен број страници." },
    { id: 2, title: "Задача 2: Геометрија", text: "Нормала на крак кај тапоаголен триаголник. Пресметај CD." },
    { id: 3, title: "Задача 3: Теорија на броеви", text: "Број со 5 прости фактори чиј збир е 40. Најди број на делители." },
    { id: 4, title: "Задача 4: Диофантова равенка", text: "a² - a = 4b² - 2b + 2024. Најди природни решенија." },
    { id: 5, title: "Задача 5: Комбинаторика", text: "4 промени на правец на 8x8 мрежа. Најди број на патеки." }
  ],
  '9': [
    { id: 1, title: "Задача 1: Корени", text: "Пресметај израз со корени без калкулатор." },
    { id: 2, title: "Задача 2: Дропки", text: "За кои цели n изразот (n²-2)/(n+3) е цел број?" },
    { id: 3, title: "Задача 3: Функција", text: "y = kx + n низ A(0,4) зафаќа плоштина 6 со оските. Најди ја функцијата." },
    { id: 4, title: "Задача 4: Пермутации", text: "6-цифрен број деллив со 5 каде 1 и 2 не се соседи." },
    { id: 5, title: "Задача 5: Рамнини", text: "n точки определуваат 2024 рамнини. Најди го n." }
  ]
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', grade: '4' });
  const [view, setView] = useState('auth'); 
  const [adminPassword, setAdminPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(120 * 60);
  const [activeProblem, setActiveProblem] = useState(0);
  const [submissions, setSubmissions] = useState({});
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showNotification, setShowNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { if (u) setUser(u); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view !== 'student' || isTimeUp) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setIsTimeUp(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, isTimeUp]);

  useEffect(() => {
    if (!user || view !== 'student') return;
    const q = doc(db, 'artifacts', appId, 'public', 'data', 'submissions', user.uid);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.exists()) setSubmissions(snapshot.data().tasks || {});
    });
    return () => unsubscribe();
  }, [user, view]);

  useEffect(() => {
    if (view !== 'admin' || !user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllSubmissions(data);
    });
    return () => unsubscribe();
  }, [view, user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (userInfo.name && userInfo.email) setView('student');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin2024') setView('admin');
    else {
      setShowNotification("Погрешна лозинка!");
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  const handleFileUpload = async (problemId, event) => {
    if (isTimeUp || !user) return;
    const file = event.target.files[0];
    if (!file) return;
    setIsSaving(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      const newSubmissions = { ...submissions, [problemId]: { image: base64String, timestamp: new Date().toISOString() } };
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'submissions', user.uid), {
          studentName: userInfo.name,
          studentEmail: userInfo.email,
          studentGrade: userInfo.grade,
          tasks: newSubmissions,
          lastUpdate: new Date().toISOString()
        }, { merge: true });
        setShowNotification("Зачувано!");
      } catch (err) { console.error(err); }
      finally { setIsSaving(false); setTimeout(() => setShowNotification(null), 2000); }
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' + sec : sec}`;
  };

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 border border-slate-100 flex flex-col items-center">
          <ZbirLogo className="h-32 mb-6" />
          <h2 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mb-2">Едукативен центар Збир</h2>
          <h1 className="text-2xl font-black text-slate-800 text-center uppercase mb-10 tracking-tight">Пробен регионален натпревар</h1>
          
          <form onSubmit={handleLogin} className="w-full space-y-6">
            <input required type="text" className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 font-medium" placeholder="Име и презиме" value={userInfo.name} onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} />
            <input required type="email" className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 font-medium" placeholder="Е-пошта" value={userInfo.email} onChange={(e) => setUserInfo({...userInfo, email: e.target.value})} />
            <div className="relative">
              <select className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 font-black cursor-pointer appearance-none" value={userInfo.grade} onChange={(e) => setUserInfo({...userInfo, grade: e.target.value})}>
                {[4, 5, 6, 7, 8, 9].map(g => <option key={g} value={g}>{g}-то одделение</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Icon name="chevron" /></div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-200 transition-all transform hover:scale-[1.02] uppercase tracking-widest text-sm">
              ЗАПОЧНИ <Icon name="chevron" size={20} />
            </button>
          </form>
          <button onClick={() => setView('admin-login')} className="mt-10 text-slate-300 text-[10px] font-black hover:text-blue-500 transition-colors uppercase tracking-[0.2em]">АДМИН ПАНЕЛ</button>
        </div>
      </div>
    );
  }

  if (view === 'admin-login') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-xs w-full bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center">
          <ZbirLogo className="h-20 mb-8" />
          <h2 className="text-lg font-black mb-10 flex items-center gap-3 uppercase text-slate-800"><Icon name="lock" /> Администрација</h2>
          <form onSubmit={handleAdminLogin} className="w-full space-y-4">
            <input autoFocus type="password" placeholder="Лозинка" className="w-full px-4 py-4 bg-slate-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-mono text-center" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
            <div className="flex flex-col gap-3 pt-4">
               <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs">ВЛЕЗИ</button>
               <button type="button" onClick={() => setView('auth')} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase">НАЗАД</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b px-10 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-6">
            <ZbirLogo className="h-14" />
            <div className="w-px h-10 bg-slate-100"></div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Teacher Dashboard</h1>
          </div>
          <button onClick={() => setView('auth')} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black hover:bg-red-600 transition-all text-xs tracking-widest">ИЗЛЕЗ</button>
        </header>
        <main className="max-w-7xl mx-auto w-full p-10 grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Пријавени ученици ({allSubmissions.length})</h3>
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 divide-y overflow-y-auto max-h-[75vh]">
              {allSubmissions.map(student => (
                <button key={student.id} onClick={() => setSelectedStudent(student)} className={`w-full text-left p-6 transition-all flex justify-between items-center ${selectedStudent?.id === student.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'}`}>
                  <div>
                    <p className={`font-black text-sm ${selectedStudent?.id === student.id ? 'text-white' : 'text-slate-900'}`}>{student.studentName}</p>
                    <div className="flex gap-2 mt-1.5">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase ${selectedStudent?.id === student.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>{student.studentGrade}-то</span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black ${selectedStudent?.id === student.id ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700'}`}>{Object.keys(student.tasks || {}).length}/5</span>
                    </div>
                  </div>
                  <Icon name="chevron" size={16} className={selectedStudent?.id === student.id ? "text-white" : "text-slate-200"} />
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            {selectedStudent ? (
              <div className="space-y-10 animate-fade-in">
                <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 leading-tight mb-2 tracking-tighter">{selectedStudent.studentName}</h2>
                    <p className="text-slate-400 font-bold mb-8 text-xl">{selectedStudent.studentEmail}</p>
                    <div className="inline-flex items-center gap-4 bg-blue-600 text-white px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-200">
                      <Icon name="book" size={18} /> {selectedStudent.studentGrade}-то одделение
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase font-black tracking-widest text-slate-200 mb-2">Последна измена</p>
                    <p className="text-xl font-mono font-black text-slate-800">{new Date(selectedStudent.lastUpdate).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {PROBLEMS_BY_GRADE[selectedStudent.studentGrade]?.map(prob => {
                    const sub = selectedStudent.tasks?.[prob.id];
                    return (
                      <div key={prob.id} className="bg-white rounded-[50px] border border-slate-100 overflow-hidden shadow-sm flex flex-col group transition-all hover:shadow-2xl hover:-translate-y-2">
                        <div className="bg-slate-50 p-5 font-black text-[11px] uppercase flex justify-between border-b items-center text-slate-400 tracking-widest">
                          <span className="truncate pr-6">{prob.title}</span>
                          {sub ? <Icon name="check" className="text-green-500" /> : <Icon name="close" className="text-red-200" />}
                        </div>
                        <div className="p-5 flex-1 min-h-[450px] bg-slate-50 flex items-center justify-center relative">
                          {sub ? (
                            <img src={sub.image} className="max-h-full max-w-full object-contain cursor-zoom-in rounded-[40px] shadow-2xl border-[12px] border-white transition-transform group-hover:scale-[1.05]" onClick={() => window.open(sub.image)} />
                          ) : (
                            <div className="flex flex-col items-center gap-3 opacity-20">
                               <Icon name="alert" size={48} />
                               <p className="text-[10px] font-black uppercase tracking-widest">Нема решение</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 bg-white rounded-[80px] border-8 border-dashed border-slate-100 p-24">
                <ZbirLogo className="h-32 opacity-10 mb-10 grayscale" />
                <p className="font-black uppercase tracking-[0.5em] text-sm text-slate-200">Изберете ученик за преглед</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (showCertificate) {
    return (
      <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-8 print:p-0 print:bg-white">
        <div className="border-[32px] border-double border-blue-900 p-24 text-center max-w-6xl w-full bg-white relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] print:shadow-none print:border-blue-900">
          <div className="flex justify-between items-start mb-16">
            <ZbirLogo className="h-28" />
            <div className="text-right">
              <p className="text-xs font-black text-blue-900 uppercase tracking-[0.3em] mb-1">Едукативен центар</p>
              <p className="text-5xl font-black text-blue-900 tracking-tighter">ЗБИР</p>
            </div>
          </div>
          
          <div className="relative mb-12">
            <Icon name="award" size={160} className="text-blue-900 mx-auto opacity-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            <Icon name="award" size={140} className="text-blue-900 mx-auto relative z-10" />
          </div>
          
          <h1 className="text-6xl font-serif font-black text-blue-900 uppercase mb-6 tracking-tighter">Сертификат за учество</h1>
          <p className="text-3xl italic text-slate-400 mb-16 font-serif">Со оваа потврда свечено се изјавува дека</p>
          
          <h2 className="text-8xl font-serif font-black border-b-[10px] border-blue-900/5 inline-block px-24 pb-6 mb-16 text-slate-800 uppercase tracking-tighter">{userInfo.name}</h2>
          
          <p className="text-2xl text-slate-600 max-w-4xl mx-auto mb-32 leading-relaxed font-serif italic">
            успешно учествуваше на <span className="font-black text-blue-900 uppercase">Пробниот регионален натпревар по математика 2024</span> организиран од Едукативен центар Збир, во категоријата за <span className="font-black text-blue-900">{userInfo.grade}-то одделение</span>.
          </p>
          
          <div className="flex justify-between items-end mt-24 px-24">
            <div className="text-center">
              <p className="font-black text-slate-800 mb-3 text-2xl tracking-tighter">{new Date().toLocaleDateString('mk-MK')}</p>
              <div className="w-64 border-b-4 border-slate-200 mb-4"></div>
              <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">ДАТУМ</p>
            </div>
            <div className="text-center relative">
               <div className="absolute -top-32 left-1/2 -translate-x-1/2 opacity-10 scale-150"><ZbirLogo className="h-32 grayscale" /></div>
               <p className="font-serif italic text-blue-900 font-bold mb-3 text-2xl">Комисија на ЕЦ Збир</p>
               <div className="w-80 border-b-4 border-slate-200 mb-4"></div>
               <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">ПОТПИС И ПЕЧАТ</p>
            </div>
          </div>
        </div>
        <div className="mt-20 flex gap-8 print:hidden">
          <button onClick={() => window.print()} className="bg-blue-900 text-white px-20 py-6 rounded-[40px] font-black flex gap-5 shadow-2xl hover:bg-blue-800 transition-all hover:scale-105 uppercase tracking-widest text-lg"><Icon name="printer" size={28} /> ПЕЧАТИ / PDF</button>
          <button onClick={() => setShowCertificate(false)} className="bg-white text-slate-400 border-4 border-slate-100 px-20 py-6 rounded-[40px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-lg">ЗАТВОРИ</button>
        </div>
      </div>
    );
  }

  const currentProblems = PROBLEMS_BY_GRADE[userInfo.grade] || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b px-12 py-6 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <ZbirLogo className="h-16" />
          <div className="w-px h-12 bg-slate-100"></div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 leading-none text-lg tracking-tight">{userInfo.name}</span>
            <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mt-2">{userInfo.grade}-то одделение</span>
          </div>
        </div>
        <div className={`flex items-center gap-6 px-12 py-4 rounded-[32px] border-[3px] transition-all shadow-md ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
          <Icon name="clock" size={32} className={timeLeft < 300 ? 'animate-spin' : ''} /><span className="font-mono text-4xl font-black tracking-tighter">{formatTime(timeLeft)}</span>
        </div>
        <div className="flex gap-3">
          {currentProblems.map((_, i) => <div key={i} className={`w-6 h-6 rounded-xl transition-all duration-700 border-2 ${submissions[i+1] ? 'bg-green-500 border-green-400 shadow-xl shadow-green-200 rotate-[135deg]' : 'bg-slate-100 border-white shadow-inner'}`} />)}
        </div>
      </header>
      
      <main className="max-w-[1440px] mx-auto w-full p-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] ml-8 mb-4">ИЗБОР НА ЗАДАЧА</h3>
          {currentProblems.map((p, idx) => (
            <button key={p.id} onClick={() => setActiveProblem(idx)} className={`w-full flex items-center justify-between p-8 rounded-[45px] border-4 transition-all duration-500 ${activeProblem === idx ? 'border-blue-600 bg-blue-600 text-white shadow-2xl shadow-blue-400 translate-x-6' : 'border-transparent bg-white text-slate-300 hover:border-slate-100 shadow-sm'}`}>
              <div className="flex items-center gap-8">
                <span className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-2xl ${activeProblem === idx ? 'bg-white text-blue-600 shadow-lg' : 'bg-slate-50 text-slate-200'}`}>{p.id}</span>
                <span className="font-black uppercase tracking-widest text-xl">Задача {p.id}</span>
              </div>
              {submissions[p.id] && <Icon name="check" size={32} className={activeProblem === idx ? "text-white" : "text-green-500"} />}
            </button>
          ))}
          <div className="mt-16 p-10 bg-slate-900 rounded-[50px] text-white shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
               <p className="text-xs font-black text-blue-400 uppercase mb-4 tracking-[0.3em]">Инструкции за работа</p>
               <p className="text-base leading-relaxed text-slate-400 font-medium italic">Сликајте го решението јасно под добро светло. Можете да ја замените фотографијата сѐ додека тајмерот не покаже 00:00.</p>
             </div>
             <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12"><ZbirLogo className="h-56" /></div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-white rounded-[70px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-14 py-10 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-4xl font-black text-blue-900 uppercase tracking-tighter italic">{currentProblems[activeProblem]?.title}</h2>
              <div className="bg-blue-600 text-white px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200">20 ПОЕНИ</div>
            </div>
            <div className="p-14 min-h-[350px] flex items-center">
              <p className="text-3xl leading-relaxed text-slate-700 whitespace-pre-wrap italic font-medium font-serif">{currentProblems[activeProblem]?.text}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[70px] shadow-sm border border-slate-100 p-14">
            <h3 className="text-3xl font-black flex items-center gap-6 mb-12 text-slate-900 uppercase tracking-tighter"><Icon name="upload" size={40} className="text-blue-600" /> Ваше решение</h3>
            {isTimeUp ? <div className="p-20 bg-red-50 text-red-700 rounded-[60px] font-black text-center border-[6px] border-dashed border-red-100 uppercase tracking-[0.3em] text-2xl">Времето за натпреварот заврши</div> : 
              <div className="space-y-12">
                {submissions[currentProblems[activeProblem]?.id] ? (
                  <div className="border-[6px] border-green-100 bg-green-50/20 p-14 rounded-[80px] animate-fade-in shadow-inner relative overflow-hidden">
                    <div className="flex justify-between items-center mb-12 relative z-10">
                      <span className="text-green-700 font-black flex items-center gap-6 bg-white px-10 py-4 rounded-full shadow-xl border border-green-100 uppercase text-sm tracking-[0.3em]"><Icon name="check" size={28} /> УСПЕШНО ПРИКАЧЕНО</span>
                      <label className="text-blue-600 font-black hover:text-blue-900 cursor-pointer underline transition-all uppercase text-xs tracking-widest">Промени фотографија <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(currentProblems[activeProblem].id, e)} /></label>
                    </div>
                    <div className="bg-white p-8 rounded-[60px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] border-8 border-white relative z-10">
                      <img src={submissions[currentProblems[activeProblem].id].image} className="max-h-[700px] w-full object-contain rounded-[40px]" />
                    </div>
                  </div>
                ) : (
                  <label className="border-[6px] border-dashed border-slate-100 rounded-[80px] p-40 flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-white hover:border-blue-300 hover:shadow-[0_60px_100px_-20px_rgba(37,99,235,0.15)] transition-all duration-700 group relative overflow-hidden">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(currentProblems[activeProblem]?.id, e)} disabled={isSaving} />
                    <div className="bg-white p-10 rounded-[45px] shadow-2xl group-hover:scale-125 transition-transform duration-700 mb-10 relative z-10 border-4 border-slate-50"><Icon name="upload" size={100} className="text-slate-100 group-hover:text-blue-600 transition-colors" /></div>
                    <span className="text-slate-400 font-black uppercase tracking-[0.5em] relative z-10 text-xl">Сликајте го решението</span>
                    <span className="text-slate-200 text-xs mt-4 relative z-10 font-black uppercase tracking-[0.3em]">Притиснете тука за да ја користите камерата</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </label>
                )}
              </div>
            }
          </div>
        </div>
      </main>
      
      {isTimeUp && (
        <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[100px] p-24 text-center max-w-3xl w-full shadow-[0_100px_150px_-30px_rgba(0,0,0,0.5)] border-[20px] border-white/10 animate-scale-up">
            <div className="mb-14"><ZbirLogo className="h-40 mx-auto" /></div>
            <div className="bg-blue-600 w-32 h-32 rounded-[48px] rotate-12 flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-blue-500/50">
              <Icon name="award" size={80} className="text-white -rotate-12" />
            </div>
            <h2 className="text-6xl font-black mb-8 tracking-tighter text-slate-900 uppercase italic">Времето истече!</h2>
            <p className="text-slate-400 mb-16 leading-relaxed font-bold text-2xl px-16">
              Одлична работа, <span className="text-blue-600 font-black">{userInfo.name}</span>! Твоите решенија се безбедно зачувани во системот на <span className="text-blue-900 font-black">ЗБИР</span>.
            </p>
            <button onClick={() => setShowCertificate(true)} className="w-full bg-blue-600 text-white font-black py-8 rounded-[50px] flex items-center justify-center gap-6 shadow-2xl shadow-blue-400 hover:bg-blue-700 hover:scale-[1.05] transition-all uppercase tracking-[0.3em] text-xl">
              <Icon name="award" size={40} /> ПРЕЗЕМИ СЕРТИФИКАТ
            </button>
          </div>
        </div>
      )}
      
      {showNotification && <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-16 py-6 rounded-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] text-lg font-black animate-bounce flex items-center gap-6 border-4 border-white/5 uppercase tracking-[0.2em]"><Icon name="check" size={32} className="text-green-400" /> {showNotification}</div>}
      {isSaving && <div className="fixed inset-0 bg-white/80 backdrop-blur-2xl z-[200] flex items-center justify-center"><div className="w-32 h-32 border-[14px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-2xl" /></div>}
    </div>
  );
}