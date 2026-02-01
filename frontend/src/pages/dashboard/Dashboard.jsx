// =====================================================
// src/pages/dashboard/Dashboard.jsx
// =====================================================
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { T } from "../../theme";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Overview  from "./Overview";
import Logs      from "./Logs";
import ApiKeys   from "./ApiKeys";
import Templates from "./Templates";
import BulkSend  from "./BulkSend";
import Settings  from "./Settings";

const PAGES = { overview: Overview, logs: Logs, apikeys: ApiKeys, templates: Templates, bulk: BulkSend, settings: Settings };

export default function Dashboard() {
  const { user } = useAuth();
  const [page, setPage] = useState("overview");
  const Page = PAGES[page] || Overview;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter',-apple-system,sans-serif", display: "flex" }}>
      <Sidebar active={page} onNavigate={setPage} user={user} />
      <Header activePage={page} />  {/* ← ajouter */}
      <main style={{ marginLeft: 220, flex: 1, padding: "32px 40px", maxWidth: 960, marginTop:50 }}>
        <Page />
      </main>
    </div>
  );
}