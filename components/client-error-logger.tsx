"use client"

import React, { useEffect, useState } from "react"

type ClientError = {
  message: string
  stack?: string | null
}

export default function ClientErrorLogger() {
  const [error, setError] = useState<ClientError | null>(null)

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      try {
        const message = event.message || String(event.error || "Unknown error")
        const stack = (event.error && event.error.stack) || null
        console.error("Captured window error:", event.error || event)
        setError({ message, stack })
      } catch (e) {
        // ignore
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        const reason = event.reason
        const message = (reason && reason.message) || String(reason) || "Unhandled promise rejection"
        const stack = (reason && reason.stack) || null
        console.error("Captured unhandledrejection:", reason)
        setError({ message, stack })
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener("error", handleWindowError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleWindowError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  if (!error) return null

  return (
    <div style={{
      position: "fixed",
      left: 12,
      right: 12,
      bottom: 12,
      maxHeight: "40%",
      overflow: "auto",
      zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      padding: 12,
      borderRadius: 8,
      fontSize: 12,
      fontFamily: "monospace"
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Client error captured — paste this in the issue:</div>
      <div style={{ whiteSpace: "pre-wrap" }}>{error.message}</div>
      {error.stack && (
        <details style={{ marginTop: 8, color: "#ddd" }}>
          <summary style={{ cursor: "pointer" }}>Stack (expand)</summary>
          <pre style={{ color: "#ddd", marginTop: 8 }}>{error.stack}</pre>
        </details>
      )}
    </div>
  )
}
