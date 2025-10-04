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
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { ArrowLeft, CheckCircle, AlertCircle, Users } from "lucide-react"

function NetworkCreationPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [profileUrls, setProfileUrls] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      const userData = await api.getUser(userId)
      setUser(userData)
      console.log("data", userData)
      if (!userData.apify_api_key) {
        navigate(`/${userId}/settings`)
      }
    } catch (err) {
      console.error("Failed to load user data:", err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !profileUrls.trim()) {
      setMessage("Please fill in all fields")
      return
    }

    const urls = profileUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)

    if (urls.length === 0) {
      setMessage("Please enter at least one LinkedIn profile URL")
      return
    }

    try {
      setLoading(true)
      setMessage("")
      const result = await api.createNetwork(userId, title.trim(), urls)
      setMessage(result.message)

      // Redirect to network detail page after a short delay
      setTimeout(() => {
        navigate(`/${userId}/networks/${result.network_id}`)
      }, 2000)
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
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
            <h1 className="text-2xl font-semibold">Create New Network</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Network Details
            </CardTitle>
            <CardDescription>
              Enter a title and LinkedIn profile URLs to seed your network. The
              system will discover related active creators in the same niche.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Network Title</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., AI Influencers, Fractional Leaders"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profiles">LinkedIn Profile URLs</Label>
                <Textarea
                  id="profiles"
                  value={profileUrls}
                  onChange={(e) => setProfileUrls(e.target.value)}
                  placeholder="https://linkedin.com/in/alice&#10;https://linkedin.com/in/bob&#10;https://linkedin.com/in/charlie"
                  rows={6}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter one LinkedIn profile URL per line. The system will
                  analyze these profiles and discover related active creators.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating Network..." : "Create Network"}
              </Button>
            </form>

            {message && (
              <div
                className={`mt-6 p-4 rounded-md flex items-center gap-2 ${
                  message.includes("Error")
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {message.includes("Error") ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <ApifyUsageFooter />
    </div>
  )
}

export default NetworkCreationPage
