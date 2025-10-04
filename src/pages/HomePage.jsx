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
import { RefreshCw, Plus, Settings } from "lucide-react"

function HomePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const userData = await api.getUser(userId)
      setUser(userData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNetwork = () => {
    if (!user?.apify_api_key) {
      navigate(`/${userId}/settings`)
    } else {
      navigate(`/${userId}/networks/new`)
    }
  }

  const handleReload = () => {
    loadUserData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              LinkedIn Network Explorer
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Discover and expand your professional network
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Networks</h2>
          <div className="flex gap-2">
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
            <Button
              onClick={handleCreateNetwork}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Network
            </Button>
          </div>
        </div>

        {user?.networks?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {user.networks.map((network) => (
              <Card
                key={network.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/${userId}/networks/${network.id}`)}
              >
                <CardHeader>
                  <CardTitle className="truncate">{network.title}</CardTitle>
                  <CardDescription>
                    Created: {new Date(network.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-600 text-lg">
                No networks yet. Create your first network to get started!
              </p>
            </CardContent>
          </Card>
        )}

        {!user?.apify_api_key && (
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-amber-600" />
                  <p className="text-amber-800">
                    You need to set up your Apify API key to create networks.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${userId}/settings`)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Go to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <ApifyUsageFooter />
    </div>
  )
}

export default HomePage
