import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { WinDialog } from "./WinDialog"

describe("WinDialog", () => {
  const mockOnRestart = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("when player is the winner", () => {
    it("renders the victory title when open", () => {
      render(
        <WinDialog
          isOpen={true}
          time={120}
          onRestart={mockOnRestart}
          isWinner={true}
          playerName="TestPlayer"
        />
      )

      expect(screen.getByText("¡Escapaste!")).toBeInTheDocument()
    })

    it("displays congratulations message with player name", () => {
      render(
        <WinDialog
          isOpen={true}
          time={120}
          onRestart={mockOnRestart}
          isWinner={true}
          playerName="TestPlayer"
        />
      )

      expect(screen.getByText(/Felicidades, TestPlayer/i)).toBeInTheDocument()
    })

    it("shows the correct formatted time", () => {
      render(
        <WinDialog
          isOpen={true}
          time={125} // 2 minutes 5 seconds
          onRestart={mockOnRestart}
          isWinner={true}
        />
      )

      expect(screen.getByText("02:05")).toBeInTheDocument()
    })

    it("displays message about finding the exit", () => {
      render(<WinDialog isOpen={true} time={60} onRestart={mockOnRestart} isWinner={true} />)

      expect(screen.getByText("Encontraste la salida del laberinto.")).toBeInTheDocument()
    })
  })

  describe("when player loses", () => {
    it("renders Game Over title", () => {
      render(
        <WinDialog
          isOpen={true}
          time={90}
          onRestart={mockOnRestart}
          isWinner={false}
          playerName="WinnerPlayer"
        />
      )

      // Multiple elements may have "Game Over" text - use getAllByText
      expect(screen.getAllByText("¡Game Over!").length).toBeGreaterThan(0)
    })

    it("displays who found the exit", () => {
      render(
        <WinDialog
          isOpen={true}
          time={90}
          onRestart={mockOnRestart}
          isWinner={false}
          playerName="WinnerPlayer"
        />
      )

      expect(screen.getByText(/WinnerPlayer/)).toBeInTheDocument()
      expect(screen.getByText(/encontró la salida/i)).toBeInTheDocument()
    })
  })

  describe("interaction", () => {
    it("calls onRestart when play again button is clicked", () => {
      render(<WinDialog isOpen={true} time={60} onRestart={mockOnRestart} isWinner={true} />)

      const restartButton = screen.getByRole("button", { name: /jugar de nuevo/i })
      fireEvent.click(restartButton)

      expect(mockOnRestart).toHaveBeenCalledTimes(1)
    })

    it("does not render when closed", () => {
      render(<WinDialog isOpen={false} time={60} onRestart={mockOnRestart} isWinner={true} />)

      expect(screen.queryByText("¡Escapaste!")).not.toBeInTheDocument()
    })
  })

  describe("time formatting", () => {
    it("formats time correctly for zero seconds", () => {
      render(<WinDialog isOpen={true} time={0} onRestart={mockOnRestart} isWinner={true} />)

      expect(screen.getByText("00:00")).toBeInTheDocument()
    })

    it("formats time correctly for exactly one minute", () => {
      render(<WinDialog isOpen={true} time={60} onRestart={mockOnRestart} isWinner={true} />)

      expect(screen.getByText("01:00")).toBeInTheDocument()
    })

    it("formats time correctly for more than an hour", () => {
      render(
        <WinDialog
          isOpen={true}
          time={3661} // 61 minutes 1 second
          onRestart={mockOnRestart}
          isWinner={true}
        />
      )

      expect(screen.getByText("61:01")).toBeInTheDocument()
    })

    it("pads single digit seconds correctly", () => {
      render(
        <WinDialog
          isOpen={true}
          time={65} // 1 minute 5 seconds
          onRestart={mockOnRestart}
          isWinner={true}
        />
      )

      expect(screen.getByText("01:05")).toBeInTheDocument()
    })
  })

  describe("fallback behavior", () => {
    it("uses localPlayerName when playerName is not provided for winner", () => {
      render(
        <WinDialog
          isOpen={true}
          time={60}
          onRestart={mockOnRestart}
          isWinner={true}
          localPlayerName="LocalPlayer"
        />
      )

      expect(screen.getByText(/LocalPlayer/)).toBeInTheDocument()
    })

    it("uses default text when no names are provided", () => {
      render(<WinDialog isOpen={true} time={60} onRestart={mockOnRestart} isWinner={true} />)

      expect(screen.getByText(/el jugador/)).toBeInTheDocument()
    })
  })
})
