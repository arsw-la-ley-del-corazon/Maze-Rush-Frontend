import { render } from "@testing-library/react"
// src/components/Loader.test.tsx
import { describe, expect, it } from "vitest"
import Loader from "./Loader"

describe("Loader component", () => {
  it("renderiza sin errores y genera la estructura de cajas correcta", () => {
    // 1. Renderizamos el componente
    const { container } = render(<Loader />)

    // 2. Obtenemos el elemento contenedor principal (wrapper)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toBeInTheDocument()

    // 3. Obtenemos el div interno 'loader' (hijo directo del wrapper)
    const loader = wrapper.firstChild as HTMLElement
    expect(loader).toBeInTheDocument()

    // 4. Verificamos que dentro del loader existan exactamente 9 divs hijos
    // (box0, box1, box2, box3, box4, box5, box6, box7 y ground = 9 elementos)
    expect(loader.children).toHaveLength(9)
  })
})
