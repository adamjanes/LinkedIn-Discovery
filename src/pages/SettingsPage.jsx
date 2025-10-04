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
import { Label } from "../components/ui/label"
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"

function SettingsPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [apifyKey, setApifyKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      const userData = await api.getUser(userId)
      if (userData.apify_api_key) {
        setApifyKey(userData.apify_api_key)
      }
    } catch (err) {
      console.error("Failed to load user data:", err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!apifyKey.trim()) {
      setMessage("Please enter your Apify API key")
      return
    }

    try {
      setLoading(true)
      setMessage("")
      await api.updateApifyKey(userId, apifyKey.trim())
      setMessage("Apify API key updated successfully!")
      setTimeout(() => {
        navigate(`/${userId}`)
      }, 1500)
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-2xl font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Apify API Key</CardTitle>
            <CardDescription>
              You need an Apify API key to scrape LinkedIn profiles. Get your
              key from{" "}
              <a
                href="https://apify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                apify.com
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apify-key">API Key</Label>
                <Input
                  id="apify-key"
                  type="password"
                  value={apifyKey}
                  onChange={(e) => setApifyKey(e.target.value)}
                  placeholder="Enter your Apify API key"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save API Key"}
              </Button>
            </form>

            {message && (
              <div
                className={`mt-4 p-4 rounded-md flex items-center gap-2 ${
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

export default SettingsPage
