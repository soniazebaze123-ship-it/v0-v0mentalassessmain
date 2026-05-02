"use client"

import { useEffect } from "react"

export function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)

          // Check for updates immediately on every page load
          registration.update()

          // When a new SW is found, tell it to skip waiting and take over
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (!newWorker) return
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "activated" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker activated — reload to get the latest version
                window.location.reload()
              }
            })
          })
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    }
  }, [])
}
