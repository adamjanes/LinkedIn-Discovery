import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MessageSquare, UserCheck, ExternalLink } from "lucide-react"
import api from "@/services/api"
import NetworkGraph from "@/components/NetworkGraph"
import { trackNetworkPageView, trackEvent } from "@/utils/analytics"

function NetworkPage({
  networkId,
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  fromDateTime = null,
  toDateTime = null,
}) {
  const [network, setNetwork] = useState(null)
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return "??"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  useEffect(() => {
    loadNetworkData()
    // Track page view
    trackNetworkPageView(title)
  }, [networkId, title, fromDateTime, toDateTime])

  const loadNetworkData = async () => {
    try {
      setLoading(true)
      setError("")

      // Use a fixed user ID and the provided network ID
      const userId = "8c7fa7a0-3360-48c7-9f59-92868e60f55d"

      // Fetch network and graph data in parallel
      const [networkData, graphDataResponse] = await Promise.all([
        api.getNetworkProfiles(userId, networkId, fromDateTime, toDateTime),
        api.getNetworkGraph(networkId, fromDateTime, toDateTime),
      ])
      setNetwork(networkData)
      setGraphData(graphDataResponse)
    } catch (err) {
      console.error("Error loading network data:", err)
      setError("Failed to load network data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading network data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Users className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Network
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadNetworkData} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!network) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-600">No network data available</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="text-center">
            {showBackButton && onBackClick && (
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackClick}
                  className="flex items-center gap-2"
                >
                  ← Back to Networks
                </Button>
              </div>
            )}
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
            <div className="mt-6 flex justify-center">
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Follow Us Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Stay Updated
            </h3>
            <p className="text-gray-600">
              Follow us to keep up with the latest network discoveries and
              insights
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Adam Janes */}
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src="https://media.licdn.com/dms/image/v2/C4D03AQEvfQrYbO6p7w/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1548688028932?e=1762992000&v=beta&t=tNGjdVq63ucV9seuUScylAGT1Fjdr3goixc6HQjoCgI"
                  alt="Adam Janes"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none"
                    e.target.nextSibling.style.display = "flex"
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm hidden">
                  AJ
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">Adam Janes</div>
                <div className="text-sm text-gray-600 mb-1">
                  Fractional CTO | Building with AI workflows and automations
                </div>
                <div className="text-xs text-gray-500">Sydney, Australia</div>
                <a
                  href="https://www.linkedin.com/in/adamjanes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                  onClick={() =>
                    trackEvent("click", "social_link", "adam_linkedin")
                  }
                >
                  <ExternalLink className="h-3 w-3" />
                  Follow on LinkedIn
                </a>
              </div>
            </div>

            {/* Jacob Zangel */}
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src="https://media.licdn.com/dms/image/v2/D4D03AQG_XJFuTnVn8Q/profile-displayphoto-shrink_400_400/B4DZfeTRymHMAo-/0/1751781286339?e=1762992000&v=beta&t=X36tO95eU6xKUESZXpq46pjSfFtwt1weznNxu-xJmCA"
                  alt="Jacob Zangel"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none"
                    e.target.nextSibling.style.display = "flex"
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm hidden">
                  JZ
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">Jacob Zangel</div>
                <div className="text-sm text-gray-600 mb-1">
                  Humans + AI &gt; Just Humans or just AI | Ex-Growth Marketing
                  Consultant
                </div>
                <div className="text-xs text-gray-500">
                  Berlin Metropolitan Area
                </div>
                <a
                  href="https://www.linkedin.com/in/jacobzangel/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                  onClick={() =>
                    trackEvent("click", "social_link", "jacob_linkedin")
                  }
                >
                  <ExternalLink className="h-3 w-3" />
                  Follow on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Network Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {network.profiles?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Total Profiles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {network.seed_creators?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Seed Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {graphData?.graph_data?.edges?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Graph Visualization */}
        {graphData && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Network Visualization
            </h2>
            <NetworkGraph data={graphData} />
          </div>
        )}

        {/* Seed Creators */}
        {network.seed_creators && network.seed_creators.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-6 w-6" />
              Seed Creators ({network.seed_creators.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {network.seed_creators.map((creator) => (
                <Card
                  key={creator.profile_id}
                  className="relative flex flex-col min-h-[300px]"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {creator.picture_url ? (
                          <img
                            src={creator.picture_url}
                            alt={creator.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm ${
                            creator.picture_url ? "hidden" : "flex"
                          }`}
                        >
                          {getInitials(creator.name)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight">
                          {creator.name}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-2">
                          {creator.headline}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatNumber(creator.followers)} followers
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Seed Creator
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col flex-1">
                    {/* Comment Interactions */}
                    {(creator.seed_comments &&
                      creator.seed_comments.length > 0) ||
                    (creator.seed_commenters &&
                      creator.seed_commenters.length > 0) ? (
                      <div className="mb-3">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Left Column - Most Comments To */}
                          <div>
                            {creator.seed_comments &&
                            creator.seed_comments.length > 0 ? (
                              <>
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Most Comments To:
                                </div>
                                <div className="space-y-1">
                                  {creator.seed_comments.map((comment) => (
                                    <div
                                      key={comment.profile_id}
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <div className="relative">
                                        {comment.picture_url ? (
                                          <img
                                            src={comment.picture_url}
                                            alt={comment.name}
                                            className="w-4 h-4 rounded-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = "none"
                                              e.target.nextSibling.style.display =
                                                "flex"
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className={`w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs ${
                                            comment.picture_url
                                              ? "hidden"
                                              : "flex"
                                          }`}
                                        >
                                          {getInitials(comment.name)}
                                        </div>
                                      </div>
                                      <span className="truncate flex-1 text-xs">
                                        {comment.name} (
                                        {comment.commentsFromSeed})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">
                                No comments made
                              </div>
                            )}
                          </div>
                          {/* Right Column - Most Comments From */}
                          <div>
                            {creator.seed_commenters &&
                            creator.seed_commenters.length > 0 ? (
                              <>
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Most Comments From:
                                </div>
                                <div className="space-y-1">
                                  {creator.seed_commenters.map((commenter) => (
                                    <div
                                      key={commenter.profile_id}
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <div className="relative">
                                        {commenter.picture_url ? (
                                          <img
                                            src={commenter.picture_url}
                                            alt={commenter.name}
                                            className="w-4 h-4 rounded-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = "none"
                                              e.target.nextSibling.style.display =
                                                "flex"
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className={`w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs ${
                                            commenter.picture_url
                                              ? "hidden"
                                              : "flex"
                                          }`}
                                        >
                                          {getInitials(commenter.name)}
                                        </div>
                                      </div>
                                      <span className="truncate flex-1 text-xs">
                                        {commenter.name} (
                                        {commenter.commentsToSeed})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">
                                No comments received
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Total Comments Summary */}
                    <div className="flex gap-2 w-full mt-auto">
                      <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {creator.CommentsMade || 0}
                        </div>
                        <div className="text-xs text-blue-600">Made</div>
                      </div>
                      <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-green-600">
                          {creator.CommentsReceived || 0}
                        </div>
                        <div className="text-xs text-green-600">Received</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Network Profiles */}
        {network.profiles && network.profiles.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Network Members ({network.profiles.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {network.profiles.map((profile) => (
                <Card
                  key={profile.profile_id}
                  className="relative flex flex-col min-h-[200px]"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {profile.picture_url ? (
                          <img
                            src={profile.picture_url}
                            alt={profile.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm ${
                            profile.picture_url ? "hidden" : "flex"
                          }`}
                        >
                          {getInitials(profile.name)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight">
                          {profile.name}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-2">
                          {profile.headline}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatNumber(profile.followers)} followers
                          </Badge>
                          {profile.linkedin_url && (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col flex-1">
                    {/* Comment Interactions */}
                    {(profile.profile_comments &&
                      profile.profile_comments.length > 0) ||
                    (profile.profile_commenters &&
                      profile.profile_commenters.length > 0) ? (
                      <div className="mb-3">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left Column - Most Comments To */}
                          <div>
                            {profile.profile_comments &&
                            profile.profile_comments.length > 0 ? (
                              <>
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Most Comments To:
                                </div>
                                <div className="space-y-1">
                                  {profile.profile_comments.map((comment) => (
                                    <div
                                      key={comment.profile_id}
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <div className="relative">
                                        {comment.picture_url ? (
                                          <img
                                            src={comment.picture_url}
                                            alt={comment.name}
                                            className="w-4 h-4 rounded-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = "none"
                                              e.target.nextSibling.style.display =
                                                "flex"
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className={`w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs ${
                                            comment.picture_url
                                              ? "hidden"
                                              : "flex"
                                          }`}
                                        >
                                          {getInitials(comment.name)}
                                        </div>
                                      </div>
                                      <span className="truncate flex-1 text-xs">
                                        {comment.name} (
                                        {comment.commentsFromProfile})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">
                                No comments made
                              </div>
                            )}
                          </div>
                          {/* Right Column - Most Comments From */}
                          <div>
                            {profile.profile_commenters &&
                            profile.profile_commenters.length > 0 ? (
                              <>
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Most Comments From:
                                </div>
                                <div className="space-y-1">
                                  {profile.profile_commenters.map(
                                    (commenter) => (
                                      <div
                                        key={commenter.profile_id}
                                        className="flex items-center gap-1 text-xs"
                                      >
                                        <div className="relative">
                                          {commenter.picture_url ? (
                                            <img
                                              src={commenter.picture_url}
                                              alt={commenter.name}
                                              className="w-4 h-4 rounded-full object-cover"
                                              onError={(e) => {
                                                e.target.style.display = "none"
                                                e.target.nextSibling.style.display =
                                                  "flex"
                                              }}
                                            />
                                          ) : null}
                                          <div
                                            className={`w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs ${
                                              commenter.picture_url
                                                ? "hidden"
                                                : "flex"
                                            }`}
                                          >
                                            {getInitials(commenter.name)}
                                          </div>
                                        </div>
                                        <span className="truncate flex-1 text-xs">
                                          {commenter.name} (
                                          {commenter.commentsToProfile})
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">
                                No comments received
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Total Comments Summary */}
                    <div className="flex gap-2 w-full mb-3 mt-auto">
                      <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {profile.commentsFrom || 0}
                        </div>
                        <div className="text-xs text-blue-600">Made</div>
                      </div>
                      <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-green-600">
                          {profile.commentsTo || 0}
                        </div>
                        <div className="text-xs text-green-600">Received</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkPage
