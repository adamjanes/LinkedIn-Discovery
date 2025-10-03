import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import "./NetworkCreationPage.css"

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
      <div className="network-creation-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="network-creation-page">
      <header className="header">
        <button className="back-btn" onClick={() => navigate(`/${userId}`)}>
          ← Back
        </button>
        <h1>Create New Network</h1>
      </header>

      <div className="creation-content">
        <div className="creation-card">
          <h2>Network Details</h2>
          <p className="description">
            Enter a title and LinkedIn profile URLs to seed your network. The
            system will discover related active creators in the same niche.
          </p>

          <form onSubmit={handleSubmit} className="creation-form">
            <div className="form-group">
              <label htmlFor="title">Network Title:</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., AI Influencers, Fractional Leaders"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profiles">LinkedIn Profile URLs:</label>
              <textarea
                id="profiles"
                value={profileUrls}
                onChange={(e) => setProfileUrls(e.target.value)}
                placeholder="https://linkedin.com/in/alice&#10;https://linkedin.com/in/bob&#10;https://linkedin.com/in/charlie"
                rows={6}
                required
              />
              <small className="help-text">
                Enter one LinkedIn profile URL per line. The system will analyze
                these profiles and discover related active creators.
              </small>
            </div>

            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? "Creating Network..." : "Create Network"}
            </button>
          </form>

          {message && (
            <div
              className={`message ${
                message.includes("Error") ? "error" : "success"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NetworkCreationPage
