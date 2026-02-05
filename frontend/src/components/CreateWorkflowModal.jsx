// src/components/CreateWorkflowModal.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../theme";
import client from "../api/client";
import { X, Zap, Mail, Users, Clock, Tag, Calendar, ShoppingCart, Plus } from "lucide-react";

export default function CreateWorkflowModal({ workflow, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "",
    triggerConfig: {},
    actions: [],
    status: "draft"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Info, 2: Trigger, 3: Actions

  const triggerTypes = [
    { 
      id: "list_subscribe", 
      name: "Inscription à une liste", 
      icon: Users,
      color: T.primary,
      description: "Quand un contact rejoint une liste"
    },
    { 
      id: "tag_added", 
      name: "Tag ajouté", 
      icon: Tag,
      color: T.success,
      description: "Quand un tag est ajouté à un contact"
    },
    { 
      id: "email_opened", 
      name: "Email ouvert", 
      icon: Mail,
      color: T.info,
      description: "Quand un contact ouvre un email"
    },
    { 
      id: "inactivity", 
      name: "Inactivité", 
      icon: Clock,
      color: T.warning,
      description: "Après X jours sans activité"
    },
    { 
      id: "birthday", 
      name: "Anniversaire", 
      icon: Calendar,
      color: "#ec4899",
      description: "Le jour de l'anniversaire du contact"
    },
    { 
      id: "cart_abandoned", 
      name: "Panier abandonné", 
      icon: ShoppingCart,
      color: T.danger,
      description: "Quand un panier est abandonné"
    }
  ];

  const actionTypes = [
    { id: "send_email", name: "Envoyer un email", icon: Mail },
    { id: "add_tag", name: "Ajouter un tag", icon: Tag },
    { id: "wait", name: "Attendre X jours", icon: Clock },
    { id: "remove_from_list", name: "Retirer d'une liste", icon: Users }
  ];

  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name || "",
        description: workflow.description || "",
        triggerType: workflow.trigger?.type || "",
        triggerConfig: workflow.trigger?.config || {},
        actions: workflow.actions || [],
        status: workflow.status || "draft"
      });
    }
  }, [workflow]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddAction = (type) => {
    const newAction = {
      id: Date.now().toString(),
      type,
      config: {}
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const handleRemoveAction = (actionId) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== actionId)
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    }
    if (!formData.triggerType) {
      newErrors.triggerType = "Sélectionnez un déclencheur";
    }
    if (formData.actions.length === 0) {
      newErrors.actions = "Ajoutez au moins une action";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        trigger: {
          type: formData.triggerType,
          config: formData.triggerConfig
        },
        actions: formData.actions,
        status: formData.status
      };

      if (workflow) {
        await client.put(`/automations/workflows/${workflow.id}`, payload);
      } else {
        await client.post("/automations/workflows", payload);
      }
      onSave();
    } catch (err) {
      console.error("Error saving workflow:", err);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      padding: 20,
      animation: "fadeIn 0.3s ease-out"
    },
    modal: {
      backgroundColor: "#fff",
      borderRadius: 16,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      width: "100%",
      maxWidth: 900,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
    },
    header: {
      padding: "24px 28px",
      borderBottom: `2px solid ${T.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff",
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16
    },
    content: {
      padding: 28,
      overflowY: "auto",
      flex: 1
    },
    footer: {
      padding: "20px 28px",
      borderTop: `2px solid ${T.border}`,
      display: "flex",
      gap: 12,
      backgroundColor: "#fafafa",
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16
    },
    stepIndicator: {
      display: "flex",
      gap: 8,
      marginBottom: 28
    },
    stepBar: (isActive, isCompleted) => ({
      flex: 1,
      height: 6,
      background: isCompleted || isActive 
        ? `linear-gradient(90deg, ${T.primary} 0%, #5558e3 100%)` 
        : T.border,
      borderRadius: 3,
      transition: "all 0.3s",
      boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none"
    }),
    input: (hasError = false) => ({
      width: "100%",
      padding: "12px 16px",
      border: `2px solid ${hasError ? T.danger : T.border}`,
      borderRadius: 10,
      fontSize: 15,
      boxSizing: "border-box",
      transition: "all 0.2s",
      outline: "none"
    }),
    label: {
      display: "block",
      marginBottom: 10,
      fontSize: 14,
      fontWeight: 600,
      color: T.text
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>
            {workflow ? "✏️ Modifier le workflow" : "✨ Nouveau workflow"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 10,
              borderRadius: 8,
              display: "flex",
              color: T.textSub,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f3f4f6";
              e.target.style.color = T.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = T.textSub;
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={modalStyles.content}>
          
          {/* Step Indicator */}
          <div style={modalStyles.stepIndicator}>
            {[1, 2, 3].map(num => (
              <div 
                key={num} 
                style={modalStyles.stepBar(step === num, step > num)} 
              />
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            
            {/* STEP 1: Informations de base */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                    📝 Informations de base
                  </h3>
                  <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
                    Donnez un nom et une description à votre workflow
                  </p>
                </div>

                {/* Nom */}
                <div style={{ marginBottom: 20 }}>
                  <label style={modalStyles.label}>
                    Nom du workflow
                    <span style={{ color: T.danger, marginLeft: 4 }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Ex: Bienvenue nouveaux inscrits"
                    disabled={loading}
                    style={modalStyles.input(!!errors.name)}
                    onFocus={(e) => {
                      e.target.style.borderColor = T.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.name ? T.danger : T.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  {errors.name && (
                    <p style={{ color: T.danger, fontSize: 13, margin: "8px 0 0" }}>
                      ⚠️ {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div style={{ marginBottom: 20 }}>
                  <label style={modalStyles.label}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Décrivez l'objectif de ce workflow..."
                    disabled={loading}
                    rows={4}
                    style={{
                      ...modalStyles.input(),
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = T.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = T.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Déclencheur */}
            {step === 2 && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                    ⚡ Déclencheur
                  </h3>
                  <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
                    Qu'est-ce qui va déclencher ce workflow ?
                  </p>
                </div>

                {errors.triggerType && (
                  <div style={{
                    padding: 12,
                    background: T.danger + "15",
                    border: `2px solid ${T.danger}`,
                    borderRadius: 10,
                    color: T.danger,
                    fontSize: 14,
                    marginBottom: 20
                  }}>
                    ⚠️ {errors.triggerType}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                  {triggerTypes.map(trigger => {
                    const Icon = trigger.icon;
                    const isSelected = formData.triggerType === trigger.id;
                    
                    return (
                      <div
                        key={trigger.id}
                        onClick={() => handleChange("triggerType", trigger.id)}
                        style={{
                          padding: 20,
                          background: isSelected ? T.primaryLight : "#fff",
                          border: `2px solid ${isSelected ? T.primary : T.border}`,
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = trigger.color;
                            e.currentTarget.style.boxShadow = `0 4px 12px ${trigger.color}30`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = T.border;
                            e.currentTarget.style.boxShadow = "none";
                          }
                        }}
                      >
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: `${trigger.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12
                        }}>
                          <Icon size={24} color={trigger.color} />
                        </div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
                          {trigger.name}
                        </h4>
                        <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>
                          {trigger.description}
                        </p>
                        {isSelected && (
                          <div style={{
                            marginTop: 12,
                            padding: "6px 12px",
                            background: T.primary,
                            color: "#fff",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            textAlign: "center"
                          }}>
                            ✓ Sélectionné
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Actions */}
            {step === 3 && (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                    🎬 Actions
                  </h3>
                  <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
                    Que va faire ce workflow ?
                  </p>
                </div>

                {errors.actions && (
                  <div style={{
                    padding: 12,
                    background: T.danger + "15",
                    border: `2px solid ${T.danger}`,
                    borderRadius: 10,
                    color: T.danger,
                    fontSize: 14,
                    marginBottom: 20
                  }}>
                    ⚠️ {errors.actions}
                  </div>
                )}

                {/* Liste des actions */}
                {formData.actions.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: "0 0 12px" }}>
                      Actions configurées ({formData.actions.length})
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {formData.actions.map((action, index) => {
                        const actionType = actionTypes.find(a => a.id === action.type);
                        const ActionIcon = actionType?.icon || Mail;
                        
                        return (
                          <div
                            key={action.id}
                            style={{
                              padding: 16,
                              background: T.bg,
                              border: `2px solid ${T.border}`,
                              borderRadius: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: T.primary,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 700
                              }}>
                                {index + 1}
                              </div>
                              <ActionIcon size={20} color={T.primary} />
                              <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                                {actionType?.name || action.type}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAction(action.id)}
                              style={{
                                padding: 8,
                                background: "transparent",
                                border: `1px solid ${T.danger}`,
                                borderRadius: 8,
                                cursor: "pointer",
                                color: T.danger,
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = T.danger;
                                e.target.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = T.danger;
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ajouter une action */}
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: "0 0 12px" }}>
                    Ajouter une action
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {actionTypes.map(actionType => {
                      const ActionIcon = actionType.icon;
                      
                      return (
                        <button
                          key={actionType.id}
                          type="button"
                          onClick={() => handleAddAction(actionType.id)}
                          style={{
                            padding: 16,
                            background: "#fff",
                            border: `2px solid ${T.border}`,
                            borderRadius: 10,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            color: T.text
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = T.primary;
                            e.currentTarget.style.background = T.primaryLight;
                            e.currentTarget.style.color = T.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.border;
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.color = T.text;
                          }}
                        >
                          <ActionIcon size={18} />
                          {actionType.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div style={modalStyles.footer}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 28px",
                background: "#fff",
                color: T.text,
                border: `2px solid ${T.border}`,
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 600,
                transition: "all 0.2s",
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.target.style.background = "#fff")}
            >
              ← Précédent
            </button>
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !formData.name.trim()) {
                  setErrors({ name: "Le nom est requis" });
                  return;
                }
                if (step === 2 && !formData.triggerType) {
                  setErrors({ triggerType: "Sélectionnez un déclencheur" });
                  return;
                }
                setStep(step + 1);
              }}
              style={{
                flex: 1,
                padding: "12px 28px",
                background: `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              Suivant →
            </button>
          ) : (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 28px",
                background: loading ? T.textSub : `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 600,
                boxShadow: loading ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
            >
              {loading ? "⏳ Enregistrement..." : workflow ? "💾 Mettre à jour" : "✨ Créer le workflow"}
            </button>
          )}
        </div>

      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}