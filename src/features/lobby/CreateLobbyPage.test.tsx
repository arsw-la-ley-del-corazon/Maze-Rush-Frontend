import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import CreateLobbyPage from "./CreateLobbyPage"

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock lobbyService
vi.mock("./services/lobbyService", () => ({
  createLobby: vi.fn(),
}))

// Mock CSS modules
vi.mock("./CreateLobbyPage.module.css", () => ({
  default: {
    container: "container",
    mazePattern: "mazePattern",
    particle: "particle",
    card: "card",
    title: "title",
    subtitle: "subtitle",
    form: "form",
    fieldGroup: "fieldGroup",
    fieldLabel: "fieldLabel",
    selectWrapper: "selectWrapper",
    inputField: "inputField",
    switchContainer: "switchContainer",
    switchLabel: "switchLabel",
    playerCounter: "playerCounter",
    playerDot: "playerDot",
    active: "active",
    actions: "actions",
    button: "button",
    buttonCancel: "buttonCancel",
    buttonSubmit: "buttonSubmit",
    loader: "loader",
    alert: "alert",
  },
}))

import { createLobby } from "./services/lobbyService"

describe("CreateLobbyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the page title", () => {
    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    // Use heading role to specifically get the title, not the button
    expect(screen.getByRole("heading", { name: "Crear Lobby" })).toBeInTheDocument()
  })

  it("renders the subtitle", () => {
    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    expect(
      screen.getByText("Configura tu sala y desafía a tus amigos en el laberinto")
    ).toBeInTheDocument()
  })

  it("renders maze size selector with default value", () => {
    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    const select = screen.getByRole("combobox")
    expect(select).toHaveValue("Mediano")
  })

  it("renders all maze size options", () => {
    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    expect(screen.getByText(/Pequeño - 10x10/)).toBeInTheDocument()
    expect(screen.getByText(/Mediano - 20x20/)).toBeInTheDocument()
    expect(screen.getByText(/Grande - 30x30/)).toBeInTheDocument()
  })

  it("renders player counter with 4 dots", () => {
    const { container } = render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    const dots = container.querySelectorAll(".playerDot")
    expect(dots.length).toBe(4)
  })

  it("renders submit button", () => {
    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    expect(screen.getByRole("button", { name: /crear/i })).toBeInTheDocument()
  })

  it("allows changing maze size", () => {
    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    const select = screen.getByRole("combobox")
    fireEvent.change(select, { target: { value: "Grande" } })

    expect(select).toHaveValue("Grande")
  })

  it("submits the form and navigates on success", async () => {
    const mockCreateLobby = vi.mocked(createLobby)
    mockCreateLobby.mockResolvedValue({
      ok: true,
      data: {
        id: "123",
        code: "ABC123",
        mazeSize: "Mediano",
        maxPlayers: 4,
        isPublic: true,
        status: "EN_ESPERA",
        creatorUsername: "testUser",
        createdAt: new Date().toISOString(),
        players: [],
      },
    })

    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    const submitButton = screen.getByRole("button", { name: /crear/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateLobby).toHaveBeenCalledWith({
        mazeSize: "Mediano",
        maxPlayers: 4,
        isPublic: true,
        status: "EN_ESPERA",
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/app/lobby/ABC123")
    })
  })

  it("displays error message on submit failure", async () => {
    const mockCreateLobby = vi.mocked(createLobby)
    mockCreateLobby.mockResolvedValue({
      ok: false,
      error: {
        status: 500,
        message: "Error al crear el lobby",
      },
    })

    render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    const submitButton = screen.getByRole("button", { name: /crear/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // The error message includes an emoji prefix
      expect(screen.getByText(/Error al crear el lobby/i)).toBeInTheDocument()
    })
  })

  it("renders decorative particles", () => {
    const { container } = render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    const particles = container.querySelectorAll(".particle")
    expect(particles.length).toBe(4)
  })

  it("renders the maze pattern background", () => {
    const { container } = render(
      <BrowserRouter>
        <CreateLobbyPage />
      </BrowserRouter>
    )

    expect(container.querySelector(".mazePattern")).toBeInTheDocument()
  })
})
