import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn utility function", () => {
  it("should join multiple class names with spaces", () => {
    const result = cn("class1", "class2", "class3")
    expect(result).toBe("class1 class2 class3")
  })

  it("should filter out falsy values", () => {
    const result = cn("class1", false, "class2", null, "class3", undefined)
    expect(result).toBe("class1 class2 class3")
  })

  it("should return empty string when all values are falsy", () => {
    const result = cn(false, null, undefined)
    expect(result).toBe("")
  })

  it("should return empty string when called with no arguments", () => {
    const result = cn()
    expect(result).toBe("")
  })

  it("should handle single class name", () => {
    const result = cn("single-class")
    expect(result).toBe("single-class")
  })

  it("should handle conditional class names", () => {
    const isActive = true
    const isDisabled = false
    const result = cn("base", isActive && "active", isDisabled && "disabled")
    expect(result).toBe("base active")
  })

  it("should handle empty strings as falsy", () => {
    const result = cn("class1", "", "class2")
    expect(result).toBe("class1 class2")
  })
})
