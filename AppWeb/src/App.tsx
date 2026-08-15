import { HashRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import MapDashboard from "./pages/broadcaster/MapDashboard";
import CampaignPlanner from "./pages/advertiser/CampaignPlanner";
import RewardManager from "./pages/advertiser/RewardManager";
import PollManager from "./pages/politician/PollManager";
import TVClient from './pages/tv/TVClient';

// Temporary placeholder components
const Overview = () => <div className="text-2xl font-bold">Bem-vindo ao Beep SaaS Dashboard</div>;
const Broadcaster = () => <div className="text-2xl font-bold">Painel das Emissoras</div>;
const Politician = () => <div className="text-2xl font-bold">Painel Político</div>;

function App() {
  // Detect if running on LG webOS TV
  const isWebOS = typeof window !== 'undefined' && !!(window as any).PalmSystem;

  if (isWebOS) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/*" element={<TVClient />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* WebOS TV Client */}
        <Route path="/tv" element={<TVClient />} />

        {/* Dashboard Layout */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="broadcaster" element={<Broadcaster />} />
          <Route path="map" element={<MapDashboard />} />
          <Route path="advertiser" element={<CampaignPlanner />} />
          <Route path="reward-manager" element={<RewardManager />} />
          <Route path="politician" element={<Politician />} />
          <Route path="poll-manager" element={<PollManager />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
