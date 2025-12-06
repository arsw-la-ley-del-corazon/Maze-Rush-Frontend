import { render, screen } from "@testing-library/react"
import { BrowserRouter, MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import HomePage from "./HomePage"

// Mock MUI components to avoid complex rendering issues
vi.mock("@mui/material", async () => {
  const actual = await vi.importActual("@mui/material")
  return {
    ...actual,
  }
})

// Mock CSS modules
vi.mock("./HomePage.module.css", () => ({
  default: {
    root: "root",
    vignette: "vignette",
    panel: "panel",
    titleGradient: "titleGradient",
    ctaPrimary: "ctaPrimary",
    ctaSecondary: "ctaSecondary",
  },
}))

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders the main title RUSH", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    expect(screen.getByText("RUSH")).toBeInTheDocument()
  })

  it("renders the subtitle/slogan", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    expect(
      screen.getByText("Corre contra el tiempo. Resuelve el laberinto. Vence a tus rivales.")
    ).toBeInTheDocument()
  })

  it("renders the Jugar ahora button with link to login", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const playButton = screen.getByRole("link", { name: /jugar ahora/i })
    expect(playButton).toBeInTheDocument()
    expect(playButton).toHaveAttribute("href", "/login")
  })

  it("renders the Crear cuenta button with link to signup", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const signupButton = screen.getByRole("link", { name: /crear cuenta/i })
    expect(signupButton).toBeInTheDocument()
    expect(signupButton).toHaveAttribute("href", "/signup")
  })

  it("renders the player stats section", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    // Check for stats values
    expect(screen.getByText("2-4")).toBeInTheDocument()
    expect(screen.getByText("<200ms")).toBeInTheDocument()
    expect(screen.getByText("∞")).toBeInTheDocument()
  })

  it("renders the stat labels", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    expect(screen.getByText("Jugadores")).toBeInTheDocument()
    expect(screen.getByText("Latencia")).toBeInTheDocument()
    expect(screen.getByText("Laberintos")).toBeInTheDocument()
  })

  it("renders the logo image", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const logo = screen.getByAltText("Logo Maze Rush")
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute("src", "/img/icono.png")
  })

  it("has proper navigation structure", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <HomePage />
      </MemoryRouter>
    )

    // Both navigation buttons should be present
    const links = screen.getAllByRole("link")
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it("renders with correct CSS classes", () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    // Check that root element has the correct class
    expect(container.querySelector(".root")).toBeInTheDocument()
  })
})
