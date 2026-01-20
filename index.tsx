import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  PlusCircle, 
  Target, 
  Briefcase, 
  History, 
  FilePieChart, 
  Plus, 
  Search,
  ChevronRight,
  User,
  LayoutDashboard,
  Tag,
  Clock,
  Bell,
  Settings,
  ArrowUpRight,
  LogOut,
  X,
  TrendingUp,
  DollarSign,
  Zap,
  BarChart3,
  Users,
  ShieldCheck,
  Package,
  Wrench,
  Dribbble,
  Archive,
  Layers,
  Sparkles
} from 'lucide-react';

// Inicialização Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAZ6Zp-XRhmJaqyrA806YxGAYo3TyFttpQ",
    authDomain: "b-dados-sistema.firebaseapp.com",
    projectId: "b-dados-sistema",
    storageBucket: "b-dados-sistema.firebasestorage.app",
    messagingSenderId: "725143488446",
    appId: "1:725143488446:web:ab7178929e9c9b8dcf9bef"
};

// @ts-ignore
if (!firebase.apps.length) {
    // @ts-ignore
    firebase.initializeApp(firebaseConfig);
}
// @ts-ignore
const db = firebase.firestore();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Adicionar Pedido');
  const [sales, setSales] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});
  const [storeData, setStoreData] = useState<any>({});
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginMsg, setLoginMsg] = useState('');

  // Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // New Order Form
  const [orderForm, setOrderForm] = useState({
    order: '',
    v_p: '',
    v_a: '',
    v_i: '',
    q_lav: '',
    q_imp: '',
    q_mon: '',
    q_alm: '',
    q_pes: ''
  });

  const menuItems = useMemo(() => {
    const base = [
      { name: 'Adicionar Pedido', icon: PlusCircle, id: 'home' },
      { name: 'Meta', icon: Target, id: 'metas' },
      { name: 'Serviços', icon: Briefcase, id: 'news' },
      { name: 'Histórico de Pedidos', icon: History, id: 'ranking' },
      { name: 'Relatório Detalhado', icon: FilePieChart, id: 'admin' },
    ];
    
    if (user?.r === 'manager') base.push({ name: 'Equipe', icon: Users, id: 'team' });
    if (user?.r === 'admin') base.push({ name: 'Configurações', icon: Settings, id: 'config' });
    
    return base;
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const loadData = async (currentUser: any) => {
    try {
      const confDoc = await db.collection('settings').doc('global').get();
      setConfig(confDoc.exists ? confDoc.data() : { n1:{p:70000,a:720,i:720}, n2:{p:80000,a:2200,i:2160}, n3:{p:96000,a:3000,i:3000} });
      
      let query = db.collection('sales');
      if(currentUser.r === 'seller') query = query.where('seller', '==', currentUser.id);
      if(currentUser.r === 'manager') query = query.where('store', '==', currentUser.store);
      
      const snap = await query.get();
      const loadedSales = snap.docs.map((d: any) => ({id:d.id, ...d.data()})).sort((a:any, b:any) => b.date.localeCompare(a.date));
      setSales(loadedSales);

      if(currentUser.store) {
          const sDoc = await db.collection('stores').doc(currentUser.store).get();
          setStoreData(sDoc.exists ? sDoc.data() : { goal:0, valLav:0, valImp:0, valMon:0, valAlm:0, valPes:0 });
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleLogin = async () => {
    const u = loginUser.toLowerCase().trim();
    const p = loginPass.trim();
    if(!u || !p) return;
    
    setLoading(true);
    try {
      const uDoc = await db.collection('users').doc(u).get();
      if(!uDoc.exists || uDoc.data().p !== p) throw new Error("Acesso negado.");
      const data = uDoc.data();
      if(data.b) throw new Error("Usuário Bloqueado.");
      if(data.r !== 'admin' && Date.now() > data.exp) throw new Error("Acesso Expirado.");
      
      const userData = { id: u, ...data };
      setUser(userData);
      await db.collection('users').doc(u).update({ lastSeen: Date.now() });
      await loadData(userData);
      setLoading(false);
    } catch(e: any) { 
      setLoginMsg(e.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSales([]);
    setActiveTab('Adicionar Pedido');
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const calculateTotals = () => {
    const mes = new Date().toISOString().slice(0, 7);
    const filtradosMeus = sales.filter(s => s.date.startsWith(mes) && s.seller === user?.id);
    const filtradosLoja = sales.filter(s => s.date.startsWith(mes));

    let t = { 
      p: 0, a: 0, i: 0, 
      lav: 0, mon: 0, pes: 0, alm: 0, impBonus: 0,
      commission: 0,
      totalAssist: 0
    };

    filtradosMeus.forEach(s => {
      t.p += (s.v?.p || 0);
      t.a += (s.v?.a || 0);
      t.i += (s.v?.i || 0);
      t.lav += (s.q?.lav || 0) * 40;
      t.mon += (s.q?.mon || 0) * 10;
      t.pes += (s.q?.pes || 0) * 7;
      t.alm += (s.q?.alm || 0) * 10;
      t.impBonus += (s.q?.imp || 0) * 40;
      t.totalAssist += (s.v?.a || 0) * 0.05;
    });

    const extras = t.lav + t.mon + t.pes + t.alm + t.impBonus;
    t.commission = (t.p * 0.022) + t.totalAssist + extras;

    const storeVendido = filtradosLoja.reduce((acc, curr) => acc + (curr.v?.p || 0), 0);
    const storeGoalPct = storeData.goal > 0 ? Math.min((storeVendido / storeData.goal) * 100, 100).toFixed(0) : '0';

    return { t, storeVendido, storeGoalPct, filtradosMeus, filtradosLoja };
  };

  const { t, storeVendido, storeGoalPct, filtradosMeus } = calculateTotals();

  const handleSaveOrder = async () => {
    if(!orderForm.order) { alert("Nº do pedido obrigatório!"); return; }
    
    setLoading(true);
    try {
      const p = parseFloat(orderForm.v_p) || 0;
      const a = parseFloat(orderForm.v_a) || 0;
      const iVal = parseFloat(orderForm.v_i) || 0;
      const extras = (parseInt(orderForm.q_lav)||0)*40 + (parseInt(orderForm.q_imp)||0)*40 + (parseInt(orderForm.q_mon)||0)*10 + (parseInt(orderForm.q_alm)||0)*10 + (parseInt(orderForm.q_pes)||0)*7;
      const totalPreview = (p * 0.022) + (a * 0.05) + extras;

      await db.collection('sales').add({
        seller: user.id,
        store: user.store,
        order: orderForm.order,
        v: { p, a, i: iVal },
        preview: totalPreview,
        date: new Date().toISOString(),
        q: {
          lav: parseInt(orderForm.q_lav) || 0,
          imp: parseInt(orderForm.q_imp) || 0,
          mon: parseInt(orderForm.q_mon) || 0,
          alm: parseInt(orderForm.q_alm) || 0,
          pes: parseInt(orderForm.q_pes) || 0
        }
      });

      await db.collection('users').doc(user.id).update({ lastSeen: Date.now() });
      setOrderForm({ order: '', v_p: '', v_a: '', v_i: '', q_lav: '', q_imp: '', q_mon: '', q_alm: '', q_pes: '' });
      setIsOrderModalOpen(false);
      await loadData(user);
      alert("Pedido salvo com sucesso!");
    } catch (e) {
      alert("Erro ao salvar pedido.");
    }
    setLoading(false);
  };

  const handleDeleteOrder = async (id: string) => {
    if(confirm("Deseja realmente excluir este pedido?")) {
      setLoading(true);
      try {
        await db.collection('sales').doc(id).delete();
        await loadData(user);
        setSelectedSale(null);
      } catch (e) {
        alert("Erro ao deletar.");
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#1A103D] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-orange-400 font-bold uppercase tracking-widest text-xs animate-pulse text-center px-4">Sincronizando com a Nuvem...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 lg:p-10 shadow-2xl border border-gray-700/50 flex flex-col items-center">
          <img src="https://i.postimg.cc/MTGzyVGF/file-0000000092c471f5b7a5391ae5ba35f5-1.png" className="w-32 lg:w-40 h-32 lg:h-40 object-contain mb-8 hover:scale-110 transition-transform" />
          <h2 className="text-white text-xl lg:text-2xl font-black uppercase tracking-tighter mb-8 text-center">Platinum Cloud V39</h2>
          <div className="w-full space-y-4">
            <input 
              type="text" 
              placeholder="USUÁRIO" 
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-2xl py-3.5 lg:py-4 px-6 text-white text-center font-bold tracking-widest focus:border-orange-500 outline-none transition-all uppercase"
            />
            <input 
              type="password" 
              placeholder="SENHA" 
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full bg-black/40 border border-gray-600 rounded-2xl py-3.5 lg:py-4 px-6 text-white text-center font-bold focus:border-orange-500 outline-none transition-all"
            />
            <button 
              onClick={handleLogin}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 lg:py-5 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
            >
              Entrar no Sistema
            </button>
            {loginMsg && <p className="text-red-400 text-[10px] text-center font-black uppercase tracking-widest mt-4 leading-tight">{loginMsg}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 lg:w-80 bg-[#1A103D] text-white flex flex-col shadow-2xl z-20 relative shrink-0">
        <div className="p-6 lg:p-10 flex items-center space-x-3 lg:space-x-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-tr from-orange-500 to-yellow-400 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] shrink-0">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="text-xl lg:text-3xl font-black tracking-tighter text-white truncate">Platinum</span>
        </div>

        <nav className="flex-1 px-4 lg:px-6 space-y-2 lg:space-y-4 mt-6 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center space-x-3 lg:space-x-4 px-4 lg:px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all duration-300 group relative active:scale-95 ${
                  isActive 
                  ? 'sidebar-active-btn text-white translate-x-1' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10 hover:translate-x-1'
                }`}
              >
                <div className={`p-1.5 lg:p-2 rounded-xl transition-colors shrink-0 ${isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-orange-500/10'}`}>
                  <Icon size={20} className={`${isActive ? 'text-white' : 'group-hover:text-orange-400'} transition-all duration-300`} />
                </div>
                <span className={`text-xs lg:text-[16px] tracking-tight truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
                {isActive && <ArrowUpRight size={16} className="ml-auto opacity-70 shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 lg:p-8 border-t border-white/5 bg-[#140C30] shrink-0">
          <div className="flex items-center space-x-3 lg:space-x-4 mb-6 p-2 lg:p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="relative shrink-0">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-[2px] shadow-lg">
                <div className="w-full h-full rounded-full bg-[#1A103D] flex items-center justify-center overflow-hidden">
                   <User size={20} className="text-orange-400" />
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#140C30] rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs lg:text-sm font-bold truncate uppercase">{user.id}</p>
              <p className="text-[9px] lg:text-[10px] text-orange-400 font-black uppercase tracking-widest truncate">{user.r}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl transition-all active:scale-95 border border-red-500/20"
          >
            <LogOut size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest truncate">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Header */}
        <header className="h-20 lg:h-24 glass-header border-b border-gray-200/50 flex items-center justify-between px-6 lg:px-12 z-10 sticky top-0 shadow-sm shrink-0">
          <div className="flex items-center space-x-4 lg:space-x-8 min-w-0 flex-1">
            <div className="relative group flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="w-full pl-11 pr-4 py-2.5 bg-gray-100/50 border-2 border-transparent rounded-xl text-sm focus:border-orange-500/20 focus:bg-white transition-all outline-none font-medium truncate"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 lg:space-x-6 shrink-0 ml-4">
            <div className="hidden sm:flex items-center space-x-3 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
               <TrendingUp className="text-orange-500" size={16} />
               <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest truncate">Loja: {user.store}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 custom-scrollbar">
          <div className="max-w-5xl mx-auto min-w-0">
            
            <div className="w-full animate-fade-in">
              {activeTab === 'Adicionar Pedido' && (
                <div className="space-y-8 lg:space-y-12 pb-20">
                  <div className="flex flex-col gap-2">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] lg:text-[10px] font-black rounded uppercase tracking-widest w-fit">Dashboard</span>
                    <h2 className="text-3xl lg:text-5xl font-black text-[#1A103D] tracking-tighter truncate leading-tight">Gestão de Vendas</h2>
                    <p className="text-gray-500 font-semibold text-sm lg:text-lg truncate">{filtradosMeus.length} pedidos realizados este mês</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <button 
                      onClick={() => setIsOrderModalOpen(true)}
                      className="lg:col-span-1 bg-gradient-to-br from-[#1A103D] to-[#2A1B5E] p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] shadow-2xl flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 border border-white/5 h-full"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-[40px] -mr-16 -mt-16"></div>
                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:rotate-90 transition-transform duration-500">
                           <Plus size={28} />
                        </div>
                        <h3 className="text-white text-xl font-black uppercase tracking-widest mb-1 leading-tight">Novo Pedido</h3>
                        <p className="text-orange-400/80 text-[9px] font-bold uppercase tracking-[0.2em] leading-tight">Clique para Iniciar</p>
                      </div>
                    </button>

                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                      <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-lg shadow-blue-500/5 border-l-8 border-orange-500 relative overflow-hidden group min-w-0">
                        <p className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Vendido no Mês</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-[#1A103D] truncate">{fmt(t.p)}</h3>
                        <DollarSign className="absolute -right-2 -bottom-2 text-orange-500/5 group-hover:text-orange-500/10 transition-colors pointer-events-none" size={80} />
                      </div>
                      <div className="bg-white p-6 lg:p-8 rounded-[32px] shadow-lg shadow-green-500/5 border-l-8 border-green-500 relative overflow-hidden group min-w-0">
                        <p className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Sua Comissão Total</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-green-600 truncate">{fmt(t.commission)}</h3>
                        <TrendingUp className="absolute -right-2 -bottom-2 text-green-500/5 group-hover:text-green-500/10 transition-colors pointer-events-none" size={80} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 min-w-0 pb-10">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Últimos Lançamentos</h4>
                       <button onClick={() => setActiveTab('Histórico de Pedidos')} className="text-orange-500 font-bold text-[10px] uppercase hover:underline">Ver Todos</button>
                    </div>
                    {filtradosMeus.slice(0, 5).map((sale) => (
                      <div 
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className="card-elegant bg-white p-4 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-transparent shadow-sm flex items-center justify-between group cursor-pointer min-w-0"
                      >
                        <div className="flex items-center space-x-4 lg:space-x-6 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#F8FAFC] text-[#1A103D] transition-all duration-300 group-hover:bg-[#1A103D] group-hover:text-white shrink-0">
                            <User size={24} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-extrabold text-[#1A103D] mb-1 uppercase truncate">Pedido #{sale.order}</h3>
                            <span className="text-[9px] font-black text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 whitespace-nowrap">Comissão: {fmt(sale.preview || 0)}</span>
                          </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-orange-500" size={18} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Serviços' && (
                <div className="space-y-8 lg:space-y-12 pb-20">
                  <div className="flex flex-col gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-widest w-fit inline-flex items-center gap-2 shadow-sm">
                      <Sparkles size={12} />
                      Prestação de Serviços
                    </span>
                    <h2 className="text-3xl lg:text-5xl font-black text-[#1A103D] tracking-tighter truncate leading-tight">Meus Serviços</h2>
                    <p className="text-gray-500 font-semibold text-sm lg:text-lg">Relatório exclusivo de ganhos por serviços prestados.</p>
                  </div>

                  {/* Card de Destaque para Total de Serviços */}
                  <div className="bg-[#1A103D] p-8 lg:p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em] mb-2">Total Acumulado em Serviços</p>
                        <h3 className="text-4xl lg:text-6xl font-black text-white">
                          {fmt(t.totalAssist + t.lav + t.mon + t.pes + t.alm + t.impBonus)}
                        </h3>
                      </div>
                      <div className="w-16 h-16 lg:w-24 lg:h-24 bg-green-500/20 border border-green-500/30 rounded-3xl flex items-center justify-center text-green-400 shrink-0">
                         <Briefcase size={40} className="hidden lg:block" />
                         <Briefcase size={28} className="lg:hidden" />
                      </div>
                    </div>
                  </div>

                  {/* GRADE DE CARDS - EXCLUSIVAMENTE SERVIÇOS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[32px] shadow-md border-b-8 border-green-500 group hover:translate-y-[-5px] transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-green-50 rounded-xl"><Zap size={18} className="text-green-500" /></div>
                         <span className="text-[10px] text-green-600 font-black block uppercase tracking-widest">Assistência (5%)</span>
                      </div>
                      <span className="text-3xl font-black text-[#1A103D]">{fmt(t.totalAssist)}</span>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-md border-b-8 border-purple-500 group hover:translate-y-[-5px] transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-purple-50 rounded-xl"><ShieldCheck size={18} className="text-purple-500" /></div>
                         <span className="text-[10px] text-purple-600 font-black block uppercase tracking-widest">Bônus Imper</span>
                      </div>
                      <span className="text-3xl font-black text-[#1A103D]">{fmt(t.impBonus)}</span>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-md border-b-8 border-orange-500 group hover:translate-y-[-5px] transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-orange-50 rounded-xl"><Layers size={18} className="text-orange-500" /></div>
                         <span className="text-[10px] text-orange-600 font-black block uppercase tracking-widest">Lavagem</span>
                      </div>
                      <span className="text-3xl font-black text-[#1A103D]">{fmt(t.lav)}</span>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-md border-b-8 border-cyan-500 group hover:translate-y-[-5px] transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-cyan-50 rounded-xl"><Wrench size={18} className="text-cyan-500" /></div>
                         <span className="text-[10px] text-cyan-600 font-black block uppercase tracking-widest">Montagem</span>
                      </div>
                      <span className="text-3xl font-black text-[#1A103D]">{fmt(t.mon)}</span>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-md border-b-8 border-pink-500 group hover:translate-y-[-5px] transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-pink-50 rounded-xl"><Dribbble size={18} className="text-pink-500" /></div>
                         <span className="text-[10px] text-pink-600 font-black block uppercase tracking-widest">Almofada</span>
                      </div>
                      <span className="text-3xl font-black text-[#1A103D]">{fmt(t.alm)}</span>
                    </div>

                    <div className="bg-white p-8 rounded-[32px] shadow-md border-b-8 border-yellow-500 group hover:translate-y-[-5px] transition-all">
                      <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-yellow-50 rounded-xl"><Archive size={18} className="text-yellow-500" /></div>
                         <span className="text-[10px] text-yellow-600 font-black block uppercase tracking-widest">Pés G-Roupa</span>
                      </div>
                      <span className="text-3xl font-black text-[#1A103D]">{fmt(t.pes)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Relatório Detalhado' && (
                <div className="space-y-8 pb-20">
                  <div className="flex flex-col gap-2">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-black rounded uppercase tracking-widest w-fit">Extrato Financeiro</span>
                    <h2 className="text-3xl lg:text-5xl font-black text-[#1A103D] tracking-tighter truncate leading-tight">Relatório Geral</h2>
                  </div>

                  <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-[#1A103D] text-white text-[10px] font-black uppercase tracking-widest">
                            <th className="px-6 py-5">Pedido</th>
                            <th className="px-6 py-5">Venda Prod</th>
                            <th className="px-6 py-5">Assis (5%)</th>
                            <th className="px-6 py-5">Imper (Bônus)</th>
                            <th className="px-6 py-5">Extras (L/M/A/P)</th>
                            <th className="px-6 py-5">Comissão Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filtradosMeus.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="block font-black text-[#1A103D] text-sm">#{s.order}</span>
                                <span className="text-[9px] text-gray-400 font-bold">{new Date(s.date).toLocaleDateString()}</span>
                              </td>
                              <td className="px-6 py-4 font-bold text-gray-600 text-xs">{fmt(s.v?.p || 0)}</td>
                              <td className="px-6 py-4 font-bold text-green-600 text-xs">{fmt((s.v?.a || 0) * 0.05)}</td>
                              <td className="px-6 py-4 font-bold text-purple-600 text-xs">{fmt((s.q?.imp || 0) * 40)}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {s.q?.lav > 0 && <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-lg text-[8px] font-black">L:{s.q.lav}</span>}
                                  {s.q?.mon > 0 && <span className="px-2 py-1 bg-cyan-100 text-cyan-600 rounded-lg text-[8px] font-black">M:{s.q.mon}</span>}
                                  {s.q?.alm > 0 && <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded-lg text-[8px] font-black">A:{s.q.alm}</span>}
                                  {s.q?.pes > 0 && <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-lg text-[8px] font-black">P:{s.q.pes}</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-black text-green-600 text-sm">{fmt(s.preview || 0)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Meta' && (
                <div className="space-y-8 lg:space-y-12">
                  <div className="text-center max-w-2xl mx-auto px-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-widest inline-block mb-3">Performance Unidade</span>
                    <h2 className="text-3xl lg:text-5xl font-black text-[#1A103D] tracking-tighter mb-4 truncate leading-tight">Meta da Loja</h2>
                  </div>

                  <div className="p-8 lg:p-14 rounded-[40px] lg:rounded-[60px] bg-[#1A103D] text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute top-0 right-0 w-64 lg:w-96 h-64 lg:h-96 bg-orange-500/10 rounded-full blur-[80px] lg:blur-[120px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-16">
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-4 mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 shrink-0">
                            <Target size={32} />
                          </div>
                          <h4 className="text-2xl lg:text-4xl font-black tracking-tight uppercase">Progresso Bruto</h4>
                        </div>
                        <p className="text-gray-400 text-sm lg:text-lg font-medium max-w-lg mb-8">
                          Loja atingiu <span className="text-white font-black underline decoration-orange-500 decoration-4 underline-offset-4">{storeGoalPct}%</span> do objetivo.
                        </p>
                      </div>
                      
                      <div className="relative shrink-0 w-48 flex items-center justify-center">
                        <div className="text-[80px] lg:text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-200">
                          {storeGoalPct}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 lg:mt-16 relative">
                      <div className="h-5 bg-white/5 rounded-full overflow-hidden p-1.5 border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 via-yellow-400 to-green-400 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${storeGoalPct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-5 text-[9px] font-black text-gray-500 tracking-[0.2em] uppercase">
                        <span>Lançamento Inicial</span>
                        <span>Objetivo: {fmt(storeData.goal || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Abas Placeholder */}
              {['Histórico de Pedidos', 'Equipe', 'Configurações'].includes(activeTab) && (
                <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                   <div className="max-w-lg w-full bg-white rounded-[40px] p-10 lg:p-16 shadow-2xl border border-gray-100/50">
                      <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                         <Settings className="text-orange-500" size={40} />
                      </div>
                      <h3 className="text-2xl lg:text-4xl font-black text-[#1A103D] uppercase tracking-tighter mb-4 leading-tight">Módulo em Otimização</h3>
                      <button 
                        onClick={() => setActiveTab('Adicionar Pedido')}
                        className="bg-[#1A103D] text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs lg:text-sm shadow-xl"
                      >
                         Voltar ao Início
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Novo Pedido */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A103D]/90 backdrop-blur-xl transition-all duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-6 lg:p-12 shadow-2xl modal-enter overflow-y-auto max-h-[95vh] relative custom-scrollbar">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-300 hover:text-orange-500 transition-colors p-2">
                <X size={32} />
              </button>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest inline-block mb-3">Novo Lançamento</span>
              <h2 className="text-3xl lg:text-5xl font-black text-[#1A103D] tracking-tighter uppercase mb-2 leading-tight">Novo Pedido</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">ID Pedido</label>
                  <input 
                    type="text" 
                    placeholder="Nº DO PEDIDO" 
                    className="w-full bg-[#F8FAFC] border-2 border-transparent focus:border-orange-500/20 focus:bg-white p-4 lg:p-5 rounded-2xl text-xl font-black outline-none transition-all text-center shadow-sm"
                    value={orderForm.order}
                    onChange={(e) => setOrderForm({...orderForm, order: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Venda Produto (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0,00" 
                    className="w-full bg-[#F8FAFC] border-2 border-transparent focus:border-orange-500/20 focus:bg-white p-4 lg:p-5 rounded-2xl text-xl font-black outline-none transition-all text-center shadow-sm"
                    value={orderForm.v_p}
                    onChange={(e) => setOrderForm({...orderForm, v_p: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Assis (R$)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#F8FAFC] p-3 lg:p-4 rounded-2xl font-black text-center"
                    value={orderForm.v_a}
                    onChange={(e) => setOrderForm({...orderForm, v_a: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">Imper (R$)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#F8FAFC] p-3 lg:p-4 rounded-2xl font-black text-center"
                    value={orderForm.v_i}
                    onChange={(e) => setOrderForm({...orderForm, v_i: e.target.value})}
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest block ml-2">Qtd Lavagem</label>
                  <input 
                    type="number" 
                    className="w-full bg-orange-500 text-white p-3 lg:p-4 rounded-2xl font-black text-center shadow-lg shadow-orange-500/20"
                    value={orderForm.q_lav}
                    onChange={(e) => setOrderForm({...orderForm, q_lav: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-3xl">
                <div className="text-center">
                  <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Montagem</label>
                  <input type="number" className="w-full bg-white rounded-lg p-2 font-black text-center border" value={orderForm.q_mon} onChange={(e) => setOrderForm({...orderForm, q_mon: e.target.value})} />
                </div>
                <div className="text-center">
                  <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Imper Extra</label>
                  <input type="number" className="w-full bg-white rounded-lg p-2 font-black text-center border" value={orderForm.q_imp} onChange={(e) => setOrderForm({...orderForm, q_imp: e.target.value})} />
                </div>
                <div className="text-center">
                  <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Almofada</label>
                  <input type="number" className="w-full bg-white rounded-lg p-2 font-black text-center border" value={orderForm.q_alm} onChange={(e) => setOrderForm({...orderForm, q_alm: e.target.value})} />
                </div>
                <div className="text-center">
                  <label className="text-[8px] font-black text-gray-400 uppercase block mb-1">Pés G-R</label>
                  <input type="number" className="w-full bg-white rounded-lg p-2 font-black text-center border" value={orderForm.q_pes} onChange={(e) => setOrderForm({...orderForm, q_pes: e.target.value})} />
                </div>
              </div>

              <div className="p-8 lg:p-10 bg-[#1A103D] rounded-[40px] text-white border border-white/5 shadow-2xl mt-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] mb-2">Comissão Prevista</p>
                    <h5 className="text-3xl lg:text-5xl font-black text-white">
                      {fmt(
                        (parseFloat(orderForm.v_p)||0)*0.022 + 
                        (parseFloat(orderForm.v_a)||0)*0.05 + 
                        (parseInt(orderForm.q_lav)||0)*40 +
                        (parseInt(orderForm.q_imp)||0)*40 +
                        (parseInt(orderForm.q_mon)||0)*10 +
                        (parseInt(orderForm.q_alm)||0)*10 +
                        (parseInt(orderForm.q_pes)||0)*7
                      )}
                    </h5>
                  </div>
                  <button 
                    onClick={handleSaveOrder}
                    className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-500/30 transition-all active:scale-95"
                  >
                    Salvar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhe Pedido */}
      {selectedSale && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md transition-all duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 lg:p-12 shadow-2xl modal-enter text-center border border-gray-100">
             <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shrink-0">
                <Package size={40} />
             </div>
             <h3 className="text-3xl font-black text-[#1A103D] uppercase tracking-tighter mb-2 leading-tight">Pedido #{selectedSale.order}</h3>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 block">{new Date(selectedSale.date).toLocaleDateString()}</p>
             
             <div className="space-y-4 text-left border-y border-gray-100 py-8 mb-10 font-bold text-sm lg:text-base text-gray-600">
                <div className="flex justify-between items-center px-4 py-4 bg-green-50 rounded-2xl text-green-700 text-xl font-black mt-6">
                   <span>Comissão</span>
                   <span>{fmt(selectedSale.preview || 0)}</span>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => handleDeleteOrder(selectedSale.id)}
                  className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100"
                >
                  Excluir
                </button>
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Fechar
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
