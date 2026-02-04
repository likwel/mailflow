// =====================================================
// src/pages/dashboard/Dashboard.jsx
// =====================================================
import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  const Page = PAGES[page] || Overview;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter',-apple-system,sans-serif", display: "flex" }}>
      <Sidebar active={page} onNavigate={setPage} user={user} />
      <div style={{ 
        flex: 1, 
        marginLeft: isMobile ? 0 : 220,
        display: "flex",
        flexDirection: "column",
      }}>
        <Header activePage={page} />
        <main style={{ 
          flex: 1,
          padding: isMobile ? "20px 16px 32px" : "20px 40px",
          maxWidth: "100%",
          marginTop: 64, // hauteur du header fixe
        }}>
          <Page />
        </main>
      </div>
    </div>
  );
}