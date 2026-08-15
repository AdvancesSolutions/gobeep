import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import UserProfile from "./pages/UserProfile";
import RecognitionDetail from "./pages/RecognitionDetail";
import StationProfile from "./pages/StationProfile";
import RealTimeRecognition from "./pages/RealTimeRecognition";
import TvRecognition from "./pages/TvRecognition";
import RecognitionHistory from "./pages/RecognitionHistory";
import Wallet from "./pages/Wallet";
import Bets from "./pages/Bets";
import DirectorDashboard from "./pages/director/DirectorDashboard";
import PresenterDashboard from "./pages/presenter/PresenterDashboard";
import AdvertiserDashboard from "./pages/advertiser/AdvertiserDashboard";
import PoliticianDashboard from "./pages/politician/PoliticianDashboard";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "./components/BottomNav";
import { PointsProvider } from "./contexts/PointsContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { Megaphone } from "lucide-react";

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  }),
};

type Page = "home" | "detail" | "stationprofile" | "recognition" | "tv-recognition" | "history" | "wallet" | "bets" | "profile";
const pageOrder: Page[] = ["home", "detail", "stationprofile", "recognition", "tv-recognition", "history", "wallet", "bets", "profile"];

const pageToNav: Record<Page, string> = {
  home: "home",
  detail: "bookings",
  stationprofile: "home",
  recognition: "home",
  "tv-recognition": "home",
  history: "history",
  wallet: "wallet",
  bets: "bets",
  profile: "profile",
};

const App = () => {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [direction, setDirection] = useState(1);
  const [selectedStationId, setSelectedStationId] = useState<string>("cidade-fm");
  const [selectedSessionId, setSelectedSessionId] = useState<number>(1);
  const [showDirector, setShowDirector] = useState(false);
  const [showPresenter, setShowPresenter] = useState(false);
  const [showAdvertiser, setShowAdvertiser] = useState(false);
  const [showPolitician, setShowPolitician] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    localStorage.removeItem("beep_onboarded");
    return true;
  });

  const navigateTo = (page: Page, opts?: { stationId?: string; sessionId?: number }) => {
    if (opts?.stationId) setSelectedStationId(opts.stationId);
    if (opts?.sessionId) setSelectedSessionId(opts.sessionId);
    const currentIdx = pageOrder.indexOf(currentPage);
    const nextIdx = pageOrder.indexOf(page);
    setDirection(nextIdx >= currentIdx ? 1 : -1);
    setCurrentPage(page);
  };

  const handleNavigate = (page: string, stationId?: string, sessionId?: number) => {
    navigateTo(page as Page, { stationId, sessionId });
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={handleNavigate} />;
      case "detail":
        return <RecognitionDetail onNavigate={handleNavigate} stationId={selectedStationId} sessionId={selectedSessionId} />;
      case "stationprofile":
        return <StationProfile onNavigate={handleNavigate} stationId={selectedStationId} />;
      case "profile":
        return <UserProfile onNavigate={handleNavigate} onShowPolitician={() => setShowPolitician(true)} />;
      case "recognition":
        return <RealTimeRecognition onNavigate={handleNavigate} />;
      case "tv-recognition":
        return <TvRecognition onNavigate={handleNavigate} />;
      case "history":
        return <RecognitionHistory onNavigate={handleNavigate} />;
      case "wallet":
        return <Wallet onNavigate={handleNavigate} />;
      case "bets":
        return <Bets onNavigate={handleNavigate} />;
    }
  };

  return (
    <NotificationsProvider>
    <PointsProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="mx-auto max-w-md h-screen bg-background shadow-2xl relative overflow-hidden">
        {showDirector ? (
          <DirectorDashboard onBack={() => setShowDirector(false)} />
        ) : showPresenter ? (
          <PresenterDashboard onBack={() => setShowPresenter(false)} />
        ) : showAdvertiser ? (
          <AdvertiserDashboard onBack={() => setShowAdvertiser(false)} />
        ) : showPolitician ? (
          <PoliticianDashboard onBack={() => setShowPolitician(false)} />
        ) : showOnboarding ? (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        ) : (
          <>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full overflow-y-auto"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
            <BottomNav active={pageToNav[currentPage]} onNavigate={(p) => navigateTo(p as Page)} />
            <button
              onClick={() => setShowAdvertiser(true)}
              className="absolute bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.4)] flex items-center justify-center"
              title="Painel do Anunciante"
            >
              <Megaphone size={22} />
            </button>
            {/* Mode FABs */}
            <div className="absolute top-12 right-3 z-50 flex flex-col gap-2">
              <button
                onClick={() => setShowDirector(true)}
                className="w-8 h-8 rounded-lg bg-card-dark flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                title="Painel do Diretor"
              >
                <span className="text-xs">📺</span>
              </button>
              <button
                onClick={() => setShowPresenter(true)}
                className="w-8 h-8 rounded-lg bg-card-dark flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                title="Painel do Apresentador"
              >
                <span className="text-xs">🎤</span>
              </button>
              <button
                onClick={() => setShowAdvertiser(true)}
                className="w-8 h-8 rounded-lg bg-card-dark flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                title="Painel do Anunciante"
              >
                <span className="text-xs">📣</span>
              </button>
              <button
                onClick={() => setShowPolitician(true)}
                className="w-8 h-8 rounded-lg bg-card-dark flex items-center justify-center shadow-lg active:scale-95 transition-transform ring-1 ring-primary/30"
                title="Painel de Criação (Apostas/Pesquisas)"
              >
                <span className="text-xs">➕</span>
              </button>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
    </PointsProvider>
    </NotificationsProvider>
  );
};

export default App;
