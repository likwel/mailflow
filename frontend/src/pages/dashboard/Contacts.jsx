// src/pages/dashboard/Contacts.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { Users, List, ListChecks, Settings2 } from "lucide-react";
import ContactsTab  from "../../components/contacts/ContactsTab";
import ListsTab     from "../../components/contacts/ListsTab";


function Tab({ label, icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"10px 14px", borderRadius:6, border:"none", cursor:"pointer",
      fontSize:14, fontWeight:700,
      background: active ? "#fff" : "transparent",
      color: active ? T.primary : T.textSub,
      boxShadow: active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
      transition:"all .15s"
    }}>
      <Icon size={15}/> {label}
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
      <div style={{ border: `1px solid ${T.border}`, display: "flex" , background:"#fff", padding:8, borderRadius : 6}}>
        <div style={{ borderBottom: `1px solid ${T.border}`, display: "flex" , gap : 10, background:"#f1f5f9", padding :3 , borderRadius : 6}}>
          <Tab label="Contacts" icon={Users} active={activeTab === "contacts"} onClick={() => setActiveTab("contacts")}/>
          <Tab label="Listes"   icon={ListChecks}  active={activeTab === "lists"}    onClick={() => setActiveTab("lists")} />
          <Tab label="Options"   icon={Settings2}  active={activeTab === "options"}    onClick={() => setActiveTab("options")} />
        </div>
      </div>
      {activeTab === "contacts" && <ContactsTab />}
      {activeTab === "lists"    && <ListsTab />}
      {activeTab === "options"  && (
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:10, padding:"40px 20px", color:T.textSub,
        }}>
          <Settings2 size={36} color={T.border}/>
          <p style={{ margin:0, fontSize:14, fontWeight:500 }}>Aucune option pour le moment</p>
          <p style={{ margin:0, fontSize:12 }}>Les options seront disponibles prochainement</p>
        </div>
      )}
    </div>
  );
}