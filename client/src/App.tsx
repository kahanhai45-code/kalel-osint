import { Route, Switch } from "wouter";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useI18n } from "./lib/i18n";
import Dashboard from "./pages/Dashboard";
import IntelMap from "./pages/IntelMap";
import AgentChat from "./pages/AgentChat";
import CodeForge from "./pages/CodeForge";
import EyeOfKalEl from "./pages/EyeOfKalEl";
import IntelCore from "./pages/IntelCore";
import MiddleEastAnalysis from "./pages/MiddleEastAnalysis";
import NotFound from "./pages/NotFound";

function App() {
  const { dir } = useI18n();

  return (
    <div className="dark h-screen w-screen overflow-hidden flex bg-[#050a14]" dir={dir()}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/map" component={IntelMap} />
            <Route path="/chat" component={AgentChat} />
            <Route path="/forge" component={CodeForge} />
            <Route path="/eye" component={EyeOfKalEl} />
            <Route path="/intel-core" component={IntelCore} />
            <Route path="/middle-east" component={MiddleEastAnalysis} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default App;
