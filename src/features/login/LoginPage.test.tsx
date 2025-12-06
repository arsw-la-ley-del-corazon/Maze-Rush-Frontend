import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LoginPage from "./LoginPage" // Ajusta la ruta si es necesario
import { BrowserRouter } from "react-router-dom"

// ----------------------------------------------------------------------
// 1. MOCKS (Simulaciones)
// ----------------------------------------------------------------------

// Mock de react-router-dom para vigilar 'useNavigate'
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock de useAuth
const mockLoginWithGoogle = vi.fn()
vi.mock("../../context/useAuth", () => ({
  useAuth: () => ({
    loginWithGoogle: mockLoginWithGoogle,
    loading: false, // Por defecto no carga
  }),
}))

// Mock de GOOGLE_CONFIG
vi.mock("../../common/globas", () => ({
  GOOGLE_CONFIG: {
    CLIENT_ID: "test-client-id-123",
  },
}))

// Mock de estilos CSS Modules (para evitar errores si usas identity-obj-proxy o similar no es necesario, pero por si acaso)
vi.mock("./LoginPage.module.css", () => ({
  default: {
    root: "root",
    card: "card",
    googleBtn: "googleBtn",
  },
}))

// ----------------------------------------------------------------------
// 2. UTILIDADES PARA GOOGLE
// ----------------------------------------------------------------------

/**
 * Ayuda a simular el objeto global de Google que el script inyectaría.
 * Es crucial porque JSDOM no carga scripts externos reales.
 */
const setupGoogleMock = () => {
  const googleMock = {
    accounts: {
      id: {
        initialize: vi.fn(),
        renderButton: vi.fn((element: HTMLElement) => {
          // IMPORTANTE: Tu código busca un div[role="button"] dentro del ref.
          // El mock debe inyectar este elemento para que el click manual funcione.
          const fakeBtn = document.createElement("div")
          fakeBtn.setAttribute("role", "button")
          fakeBtn.className = "fake-google-button"
          // Simulamos que al hacer click en el botón oculto de google, no pasa nada visual,
          // pero el evento existe.
          element.appendChild(fakeBtn)
        }),
        prompt: vi.fn(),
      },
    },
  }
  
  // Asignamos al objeto global window
  window.google = googleMock as any
  return googleMock
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = "" // Limpiar el DOM
    
    // Configuramos el mock de Google antes de renderizar
    setupGoogleMock()
  })

  afterEach(() => {
    // Limpieza post-test
    delete window.google
  })

  it("renderiza correctamente el título y botón de carga inicial", () => {
    // Simulamos que el script AÚN NO ha cargado (window.google existe pero forzamos el estado inicial del componente)
    // Nota: Como tenemos el useEffect que crea el script, necesitamos simular el evento onload
    // o pre-cargar window.google. En este setup, window.google ya existe, así que el componente
    // debería detectar 'googleLoaded' true rápidamente o inmediatamente.
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    expect(screen.getByText(/Bienvenido a Maze Rush/i)).toBeInTheDocument()
    // Verificamos que el botón de volver existe
    expect(screen.getByText(/Volver/i)).toBeInTheDocument()
  })

  it("inicializa Google Identity Services con el Client ID correcto", async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    // Esperamos a que el useEffect detecte window.google y llame a initialize
    await waitFor(() => {
      expect(window.google?.accounts.id.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "test-client-id-123",
          auto_select: false,
        })
      )
    })

    // Verificamos que se haya llamado a renderButton
    expect(window.google?.accounts.id.renderButton).toHaveBeenCalled()
  })

  it("navega a /app cuando el login es exitoso", async () => {
    // 1. Configuramos el mock de login para devolver éxito
    mockLoginWithGoogle.mockResolvedValue({ ok: true })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    // Esperamos inicialización
    await waitFor(() => {
      expect(window.google?.accounts.id.initialize).toHaveBeenCalled()
    })

    // 2. Capturamos el callback que el componente pasó a 'initialize'
    // calls[0][0] es el primer argumento de la primera llamada
    const initConfig = (window.google?.accounts.id.initialize as any).mock.calls[0][0]
    const callback = initConfig.callback

    // 3. Ejecutamos el callback manualmente (simulando que Google respondió)
    const fakeResponse = { credential: "fake-jwt-token" }
    await callback(fakeResponse)

    // 4. Verificaciones
    expect(mockLoginWithGoogle).toHaveBeenCalledWith("fake-jwt-token")
    expect(mockNavigate).toHaveBeenCalledWith("/app")
  })

  it("muestra un error si el login falla", async () => {
    // 1. Configuramos el mock para devolver error
    mockLoginWithGoogle.mockResolvedValue({ 
      ok: false, 
      error: "Credenciales inválidas" 
    })

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    // Esperar inicialización
    await waitFor(() => {
      expect(window.google?.accounts.id.initialize).toHaveBeenCalled()
    })

    // 2. Capturar callback y ejecutarlo
    const initConfig = (window.google?.accounts.id.initialize as any).mock.calls[0][0]
    await initConfig.callback({ credential: "bad-token" })

    // 3. Verificar que aparece la alerta de error
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Credenciales inválidas")).toBeInTheDocument()
    // No debe navegar
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("simula el click en el botón personalizado disparando el botón oculto de Google", async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )

    // Esperamos a que el botón diga "Continuar con Google" (significa googleLoaded = true)
    const customButton = await screen.findByText("Continuar con Google")

    // Espiamos el método click del elemento oculto que nuestro mock insertó
    // Necesitamos buscarlo en el DOM. Sabemos que renderButton inyectó .fake-google-button
    // Esperamos a que el renderButton haya ocurrido
    await waitFor(() => {
        expect(document.querySelector(".fake-google-button")).toBeInTheDocument()
    })
    
    const hiddenBtn = document.querySelector(".fake-google-button") as HTMLElement
    const clickSpy = vi.spyOn(hiddenBtn, "click")

    // Hacemos click en el botón visible de React
    fireEvent.click(customButton)

    // Verificamos que se propagó al botón oculto
    expect(clickSpy).toHaveBeenCalled()
  })
})