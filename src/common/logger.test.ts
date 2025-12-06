import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock globas config before importing logger
vi.mock("../common/globas", () => ({
  APP_CONFIG: {
    DEBUG: true,
    LOG_LEVEL: "debug",
    NAME: "Maze-Rush",
  },
}))

import { logger } from "./logger"

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    vi.spyOn(console, "debug").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("error", () => {
    it("should log error messages", () => {
      logger.error("Test error message")
      expect(console.error).toHaveBeenCalled()
    })

    it("should include app name prefix in error messages", () => {
      logger.error("Test error")
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("ERROR"), "Test error")
    })

    it("should pass additional arguments to console.error", () => {
      const extraData = { code: 500 }
      logger.error("Test error", extraData)
      expect(console.error).toHaveBeenCalledWith(expect.anything(), "Test error", extraData)
    })
  })

  describe("warn", () => {
    it("should log warning messages", () => {
      logger.warn("Test warning message")
      expect(console.warn).toHaveBeenCalled()
    })

    it("should include app name prefix in warning messages", () => {
      logger.warn("Test warning")
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("WARN"), "Test warning")
    })
  })

  describe("info", () => {
    it("should log info messages", () => {
      logger.info("Test info message")
      expect(console.info).toHaveBeenCalled()
    })

    it("should include app name prefix in info messages", () => {
      logger.info("Test info")
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining("INFO"), "Test info")
    })
  })

  describe("debug", () => {
    it("should log debug messages when DEBUG is enabled", () => {
      logger.debug("Test debug message")
      expect(console.debug).toHaveBeenCalled()
    })

    it("should include app name prefix in debug messages", () => {
      logger.debug("Test debug")
      expect(console.debug).toHaveBeenCalledWith(expect.stringContaining("DEBUG"), "Test debug")
    })
  })

  describe("authError", () => {
    it("should log authentication errors", () => {
      logger.authError("Login failed")
      expect(console.error).toHaveBeenCalled()
    })

    it("should include error object if provided", () => {
      const error = new Error("Token expired")
      logger.authError("Auth failed", error)
      expect(console.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("Auth Error"),
        error
      )
    })
  })

  describe("authInfo", () => {
    it("should log authentication info", () => {
      logger.authInfo("User logged in")
      expect(console.info).toHaveBeenCalled()
    })

    it("should include additional arguments", () => {
      logger.authInfo("Session started", { userId: "123" })
      expect(console.info).toHaveBeenCalled()
    })
  })

  describe("apiError", () => {
    it("should log API errors", () => {
      logger.apiError("Request failed")
      expect(console.error).toHaveBeenCalled()
    })

    it("should include error details if provided", () => {
      const apiError = { status: 404, message: "Not found" }
      logger.apiError("API error", apiError)
      expect(console.error).toHaveBeenCalled()
    })
  })
})
