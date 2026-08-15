import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Radio, Map, Megaphone, CheckSquare, Bell, User } from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Emissoras (Broadcasters)", path: "/broadcaster", icon: Radio },
    { name: "Mapa de Audiência", path: "/map", icon: Map },
    { name: "Anunciantes", path: "/advertiser", icon: Megaphone },
    { name: "Marketplace Beep", path: "/reward-manager", icon: Megaphone },
    { name: "Painel Político", path: "/poll-manager", icon: CheckSquare },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">BeepApp SaaS</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/20 flex items-center justify-between px-6">
          <div>
            {/* Breadcrumbs or Title could go here */}
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive"></span>
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User size={16} />
              </div>
              <div className="text-sm">
                <p className="font-medium leading-none">Admin</p>
                <p className="text-muted-foreground text-xs">Beep Corp</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
