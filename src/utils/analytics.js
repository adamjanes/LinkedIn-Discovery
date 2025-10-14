// Initialize Google Analytics
export const initGA = () => {
  // Load the Google Analytics script
  const script = document.createElement("script")
  script.async = true
  script.src = "https://www.googletagmanager.com/gtag/js?id=G-F00DSMVJTP"
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag
  gtag("js", new Date())
  gtag("config", "G-F00DSMVJTP")
}

// Track page views
export const trackPageView = (pageName) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", "G-F00DSMVJTP", {
      page_title: pageName,
      page_location: window.location.href,
    })
  }
}

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track network page views specifically
export const trackNetworkPageView = (networkType) => {
  trackPageView(`${networkType} Network Page`)
  trackEvent("page_view", "network_page", networkType)
}
