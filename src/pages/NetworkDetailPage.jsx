import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import ApifyUsageFooter from "../components/ApifyUsageFooter"
import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Checkbox } from "../components/ui/checkbox"
import { Badge } from "../components/ui/badge"
import {
  ArrowLeft,
  RefreshCw,
  Users,
  UserCheck,
  ExternalLink,
  MessageSquare,
  MessageCircle,
} from "lucide-react"

function NetworkDetailPage() {
  const { userId, networkId } = useParams()
  const navigate = useNavigate()
  const [network, setNetwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanding, setExpanding] = useState(false)
  const [selectedProfiles, setSelectedProfiles] = useState(new Set())
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadNetworkData()
  }, [userId, networkId])

  const loadNetworkData = async () => {
    try {
      const networkData = await api.getNetworkProfiles(userId, networkId)
      console.log("Network data:", networkData)
      console.log("Seed creators:", networkData.seed_creators)
      setNetwork(networkData)
    } catch (err) {
      console.error("Failed to load network data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSelect = (profileId) => {
    const newSelected = new Set(selectedProfiles)
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId)
    } else {
      newSelected.add(profileId)
    }
    setSelectedProfiles(newSelected)
  }

  const handleExpandSelected = async () => {
    if (selectedProfiles.size === 0) {
      setMessage("Please select at least one profile to expand")
      return
    }

    try {
      setExpanding(true)
      setMessage("")
      const result = await api.expandNetwork(
        userId,
        networkId,
        Array.from(selectedProfiles)
      )
      setMessage(result.message)
      setSelectedProfiles(new Set())
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setExpanding(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "?"
    const names = name.trim().split(" ")
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase()
    }
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase()
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K"
    }
    return num.toString()
  }

  const handleSelectAll = () => {
    if (selectedProfiles.size === network.profiles.length) {
      setSelectedProfiles(new Set())
    } else {
      setSelectedProfiles(new Set(network.profiles.map((p) => p.profile_id)))
    }
  }

  const handleReload = () => {
    loadNetworkData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading network...</p>
        </div>
      </div>
    )
  }

  if (!network) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Network Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The requested network could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/${userId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold">{network.title}</h1>
            </div>
            <Button
              variant="outline"
              onClick={handleReload}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Reload"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800">
              {network.profiles.length} profiles discovered
            </span>
          </div>
          <p className="text-sm text-blue-700">
            Seed creators available:{" "}
            {network.seed_creators ? network.seed_creators.length : "No"}
          </p>
        </div>

        {network.seed_creators && network.seed_creators.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-6 w-6" />
              Seed Creators ({network.seed_creators.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {network.seed_creators.map((creator) => (
                <Card key={creator.profile_id} className="p-4 h-full">
                  <div className="flex flex-col items-center text-center space-y-3 h-full">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      {creator.picture_url ? (
                        <img
                          src={creator.picture_url}
                          alt={creator.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {getInitials(creator.name)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="font-semibold text-sm truncate w-full">
                        {creator.name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {creator.headline}
                      </p>
                      {creator.followers && (
                        <div className="text-xs text-blue-600 font-medium">
                          {formatNumber(creator.followers)} followers
                        </div>
                      )}
                    </div>

                    {/* Comments To and From - Side by Side */}
                    {(creator.seed_comments &&
                      creator.seed_comments.length > 0) ||
                    (creator.seed_commenters &&
                      creator.seed_commenters.length > 0) ? (
                      <div className="mb-2">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Comments To */}
                          {creator.seed_comments &&
                            creator.seed_comments.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Most Comments To:
                                </div>
                                <div className="space-y-1">
                                  {creator.seed_comments.map((comment) => (
                                    <div
                                      key={comment.profile_id}
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0">
                                        {comment.picture_url ? (
                                          <img
                                            src={comment.picture_url}
                                            alt={comment.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                            {getInitials(comment.name)}
                                          </div>
                                        )}
                                      </div>
                                      <span className="truncate flex-1 text-xs">
                                        {comment.name} (
                                        {comment.commentsFromSeed})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Comments From */}
                          {creator.seed_commenters &&
                            creator.seed_commenters.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  Most Comments From:
                                </div>
                                <div className="space-y-1">
                                  {creator.seed_commenters.map((commenter) => (
                                    <div
                                      key={commenter.profile_id}
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0">
                                        {commenter.picture_url ? (
                                          <img
                                            src={commenter.picture_url}
                                            alt={commenter.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                            {getInitials(commenter.name)}
                                          </div>
                                        )}
                                      </div>
                                      <span className="truncate flex-1 text-xs">
                                        {commenter.name} (
                                        {commenter.commentsToSeed})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ) : null}

                    <a
                      href={creator.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Profile
                    </a>

                    <div className="flex gap-2 w-full mt-auto">
                      <div className="flex-1 text-center p-2 bg-gray-100 rounded">
                        <div className="text-xs text-gray-600">Made</div>
                        <div className="font-semibold text-sm">
                          {creator.CommentsMade}
                        </div>
                      </div>
                      <div className="flex-1 text-center p-2 bg-gray-100 rounded">
                        <div className="text-xs text-gray-600">Received</div>
                        <div className="font-semibold text-sm">
                          {creator.CommentsReceived}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Network Profiles
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedProfiles.size === network.profiles.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button
                onClick={handleExpandSelected}
                disabled={expanding || selectedProfiles.size === 0}
                className="flex items-center gap-2"
              >
                {expanding
                  ? "Expanding..."
                  : `Expand Selected (${selectedProfiles.size})`}
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md flex items-center gap-2 ${
                message.includes("Error")
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message.includes("Error") ? (
                <MessageCircle className="h-4 w-4" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {message}
            </div>
          )}

          <div className="space-y-4">
            {network.profiles.map((profile, index) => (
              <Card
                key={profile.profile_id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedProfiles.has(profile.profile_id)
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => handleProfileSelect(profile.profile_id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedProfiles.has(profile.profile_id)}
                      onChange={() => handleProfileSelect(profile.profile_id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {profile.picture_url ? (
                        <img
                          src={profile.picture_url}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {getInitials(profile.name)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {profile.headline}
                      </p>
                      {profile.followers && (
                        <div className="text-sm text-blue-600 font-medium mb-2">
                          {formatNumber(profile.followers)} followers
                        </div>
                      )}

                      {/* Comments To and From - Side by Side */}
                      {(profile.profile_comments &&
                        profile.profile_comments.length > 0) ||
                      (profile.profile_commenters &&
                        profile.profile_commenters.length > 0) ? (
                        <div className="mb-3">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Comments To */}
                            {profile.profile_commenters &&
                              profile.profile_commenters.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-gray-700 mb-2">
                                    Most Comments To:
                                  </div>
                                  <div className="space-y-1">
                                    {profile.profile_commenters.map(
                                      (commenter) => (
                                        <div
                                          key={commenter.profile_id}
                                          className="flex items-center gap-1 text-xs"
                                        >
                                          <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0">
                                            {commenter.picture_url ? (
                                              <img
                                                src={commenter.picture_url}
                                                alt={commenter.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                                {getInitials(commenter.name)}
                                              </div>
                                            )}
                                          </div>
                                          <span className="truncate flex-1 text-xs">
                                            {commenter.name} (
                                            {commenter.commentsToProfile})
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Comments From */}
                            {profile.profile_comments &&
                              profile.profile_comments.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-gray-700 mb-2">
                                    Most Comments From:
                                  </div>
                                  <div className="space-y-1">
                                    {profile.profile_comments.map((comment) => (
                                      <div
                                        key={comment.profile_id}
                                        className="flex items-center gap-1 text-xs"
                                      >
                                        <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0">
                                          {comment.picture_url ? (
                                            <img
                                              src={comment.picture_url}
                                              alt={comment.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                              {getInitials(comment.name)}
                                            </div>
                                          )}
                                        </div>
                                        <span className="truncate flex-1 text-xs">
                                          {comment.name} (
                                          {comment.commentsFromProfile})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      ) : null}

                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        View LinkedIn Profile
                      </a>
                    </div>

                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {profile.commentsTo}
                        </div>
                        <div className="text-xs text-gray-600">Comments To</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {profile.commentsFrom}
                        </div>
                        <div className="text-xs text-gray-600">
                          Comments From
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <ApifyUsageFooter />
    </div>
  )
}

export default NetworkDetailPage
