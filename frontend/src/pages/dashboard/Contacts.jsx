// src/pages/dashboard/Contacts.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { Users, List } from "lucide-react";
import ContactsTab  from "../../components/contacts/ContactsTab";
import ListsTab     from "../../components/contacts/ListsTab";

function Tab({ label, icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
      borderBottom: active ? `2px solid ${T.primary}` : "2px solid transparent",
      color: active ? T.primary : T.textSub,
      fontWeight: active ? 600 : 400, fontSize: 15, transition: "all .15s"
    }}>
      <Icon size={16} /> {label}
    </button>
  );
}

export default function Contacts() {
  const [activeTab, setActiveTab] = useState("contacts");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ color: T.text, fontSize: 28, fontWeight: 700, margin: 0 }}>Contacts</h1>
        <p style={{ color: T.textSub, fontSize: 14, margin: "4px 0 0" }}>
          Gérez vos contacts et vos listes de diffusion
        </p>
      </div>
      <div style={{ borderBottom: `1px solid ${T.border}`, display: "flex" }}>
        <Tab label="Contacts" icon={Users} active={activeTab === "contacts"} onClick={() => setActiveTab("contacts")} />
        <Tab label="Listes"   icon={List}  active={activeTab === "lists"}    onClick={() => setActiveTab("lists")} />
      </div>
      {activeTab === "contacts" ? <ContactsTab /> : <ListsTab />}
    </div>
  );
}