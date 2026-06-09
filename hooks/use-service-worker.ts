"use client"

import { useEffect } from "react"

export function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Make sure we pick up an updated service worker as soon as possible.
        registration.update()

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            // A new service worker has activated and taken control while an old
            // one was already controlling the page. Reload once so the user is
            // served the fresh app shell + chunks (prevents stale-chunk crashes).
            if (
              newWorker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              window.location.reload()
            }
          })
        })
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError)
      })

    // When the active service worker changes, reload once to avoid a mismatch
    // between a cached document and newly deployed assets.
    let hasReloaded = false
    const onControllerChange = () => {
      if (hasReloaded) return
      hasReloaded = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])
}
