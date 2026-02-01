// =====================================================
// src/pages/landing/Landing.jsx
// =====================================================
import { useState } from "react";
import Navbar from "../../components/Navbar";
import Home from "./Home";
import Docs from "./Docs";
import Pricing from "./Pricing";

export default function Landing({ initialPage = "Home" }) {
  const [page, setPage] = useState(initialPage);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#1e293b" }}>
      <Navbar active={page} setActive={setPage} />
      {page === "Home"    && <Home />}
      {page === "Docs"    && <Docs />}
      {page === "Pricing" && <Pricing />}
    </div>
  );
}