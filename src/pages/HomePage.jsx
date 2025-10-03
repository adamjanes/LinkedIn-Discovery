import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import "./HomePage.css"

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

  if (loading) {
    return (
      <div className="homepage">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="homepage">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="homepage">
      <header className="header">
        <div className="header-content">
          <h1>LinkedIn Network Explorer</h1>
          <p>Discover and expand your professional network</p>
        </div>
      </header>

      <div className="networks-section">
        <div className="section-header">
          <h2>Your Networks</h2>
          <button className="create-network-btn" onClick={handleCreateNetwork}>
            Create New Network
          </button>
        </div>

        {user?.networks?.length > 0 ? (
          <div className="networks-list">
            {user.networks.map((network) => (
              <div
                key={network.id}
                className="network-card"
                onClick={() => navigate(`/${userId}/networks/${network.id}`)}
              >
                <h3>{network.title}</h3>
                <p className="network-date">
                  Created: {new Date(network.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No networks yet. Create your first network to get started!</p>
          </div>
        )}
      </div>

      {!user?.apify_api_key && (
        <div className="setup-notice">
          <p>⚠️ You need to set up your Apify API key to create networks.</p>
          <button
            className="setup-btn"
            onClick={() => navigate(`/${userId}/settings`)}
          >
            Go to Settings
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage
