import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CircularProgress } from "@mui/material"
import { createLobby } from "./services/lobbyService"
import type { LobbyRequest } from "../../types/api"
import styles from "./CreateLobbyPage.module.css"

const MAZE_SIZES = [
  { value: "Pequeño", label: "Pequeño", description: "10x10 - Rápido" },
  { value: "Mediano", label: "Mediano", description: "20x20 - Equilibrado" },
  { value: "Grande", label: "Grande", description: "30x30 - Desafío" },
]

export default function CreateLobbyPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LobbyRequest>({
    mazeSize: "Mediano",
    maxPlayers: 4,
    isPublic: true,
    status: "EN_ESPERA",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log("🎯 CREANDO LOBBY CON DATOS:")
    console.log("   - mazeSize:", formData.mazeSize)
    console.log("   - maxPlayers:", formData.maxPlayers)
    console.log("   - isPublic:", formData.isPublic, typeof formData.isPublic)
    console.log("   - status:", formData.status)
    console.log("📦 FormData completo:", JSON.stringify(formData, null, 2))

    const result = await createLobby(formData)

    console.log("📡 Respuesta del servidor:", result)

    if (result.ok) {
      console.log("✅ Lobby creado exitosamente!")
      console.log("   - Código:", result.data.code)
      console.log("   - isPublic del resultado:", result.data.isPublic)
      navigate(`/app/lobby/${result.data.code}`)
    } else {
      console.error("❌ Error al crear lobby:", result.error)
      setError(result.error.message)
      setLoading(false)
    }
  }

  const renderPlayerDots = () => {
    return (
      <div className={styles.playerCounter}>
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className={`${styles.playerDot} ${index < formData.maxPlayers ? styles.active : ""}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Patrón de laberinto animado */}
      <div className={styles.mazePattern} />

      {/* Partículas decorativas */}
      <div className={styles.particle} />
      <div className={styles.particle} />
      <div className={styles.particle} />
      <div className={styles.particle} />

      <div className={styles.card}>
        <h1 className={styles.title}>Crear Lobby</h1>
        <p className={styles.subtitle}>Configura tu sala y desafía a tus amigos en el laberinto</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Tamaño del Laberinto */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              🎯 Tamaño del Laberinto
            </label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.inputField}
                value={formData.mazeSize}
                onChange={(e) => setFormData({ ...formData, mazeSize: e.target.value })}
                required
              >
                {MAZE_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label} - {size.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Máximo de Jugadores */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              👥 Máximo de Jugadores
            </label>
            <input
              type="number"
              className={styles.inputField}
              value={formData.maxPlayers}
              onChange={(e) =>
                setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || 2 })
              }
              min={2}
              max={4}
              required
            />
            {renderPlayerDots()}
          </div>

          {/* Lobby Público/Privado */}
          <div className={styles.switchContainer}>
            <label className={styles.switchLabel}>
              {formData.isPublic ? "🌐 Lobby Público" : "🔒 Lobby Privado"}
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <span className="slider" />
            </label>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={styles.alert}>
              ⚠️ {error}
            </div>
          )}

          {/* Botones de Acción */}
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonCancel}`}
              onClick={() => navigate("/app")}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonSubmit}`}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loader}>
                  <CircularProgress size={20} sx={{ color: "#0a0e27" }} />
                  Creando...
                </span>
              ) : (
                "Crear Lobby"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* CSS para el switch toggle */}
      <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: 0.3s;
          border-radius: 26px;
          border: 1.5px solid rgba(76, 255, 179, 0.2);
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: rgba(255, 255, 255, 0.5);
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background: linear-gradient(135deg, #4cffb3 0%, #3ecf94 100%);
          border-color: #4cffb3;
        }

        input:checked + .slider:before {
          transform: translateX(24px);
          background-color: #0a0e27;
        }

        input:checked + .slider {
          box-shadow: 0 0 20px rgba(76, 255, 179, 0.4);
        }
      `}</style>
    </div>
  )
}

