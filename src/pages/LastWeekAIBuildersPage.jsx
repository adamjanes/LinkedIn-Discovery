import React from "react"
import NetworkPage from "@/components/NetworkPage"

function LastWeekAIBuildersPage() {
  // Test date range: 2025-10-20T00:00:00Z to 2025-10-21T00:00:00Z
  // Later this will be a full week range
  const fromDateTime = "2025-10-20T00:00:00Z"
  const toDateTime = "2025-10-21T00:00:00Z"

  return (
    <NetworkPage
      networkId="15"
      title="Last Week AI Builders"
      subtitle="Discover the network of AI builders based on the last week of posts and comments. This data reflects recent activity and engagement patterns."
      fromDateTime={fromDateTime}
      toDateTime={toDateTime}
    />
  )
}

export default LastWeekAIBuildersPage

