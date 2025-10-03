import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import "./SettingsPage.css"

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
    <div className="settings-page">
      <header className="header">
        <div className="header-content">
          <div className="header-nav">
            <button className="back-btn" onClick={() => navigate(`/${userId}`)}>
              ← Back
            </button>
          </div>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="settings-content">
        <div className="settings-card">
          <h2>Apify API Key</h2>
          <p className="description">
            You need an Apify API key to scrape LinkedIn profiles. Get your key
            from{" "}
            <a
              href="https://apify.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              apify.com
            </a>
          </p>

          <form onSubmit={handleSubmit} className="apify-form">
            <div className="form-group">
              <label htmlFor="apify-key">API Key:</label>
              <input
                id="apify-key"
                type="password"
                value={apifyKey}
                onChange={(e) => setApifyKey(e.target.value)}
                placeholder="Enter your Apify API key"
                required
              />
            </div>

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save API Key"}
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

export default SettingsPage
