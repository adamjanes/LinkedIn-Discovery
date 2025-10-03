import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import "./NetworkDetailPage.css"

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
    // Set up polling for network updates
    const interval = setInterval(loadNetworkData, 5000)
    return () => clearInterval(interval)
  }, [userId, networkId])

  const loadNetworkData = async () => {
    try {
      const networkData = await api.getNetworkProfiles(userId, networkId)
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

  const handleSelectAll = () => {
    if (selectedProfiles.size === network.profiles.length) {
      setSelectedProfiles(new Set())
    } else {
      setSelectedProfiles(new Set(network.profiles.map((p) => p.profile_id)))
    }
  }

  if (loading) {
    return (
      <div className="network-detail-page">
        <div className="loading">Loading network...</div>
      </div>
    )
  }

  if (!network) {
    return (
      <div className="network-detail-page">
        <div className="error">Network not found</div>
      </div>
    )
  }

  return (
    <div className="network-detail-page">
      <header className="header">
        <div className="header-content">
          <div className="header-nav">
            <button className="back-btn" onClick={() => navigate(`/${userId}`)}>
              ← Back
            </button>
          </div>
          <h1>{network.title}</h1>
        </div>
      </header>

      <div className="network-content">
        <div className="network-stats">
          <p>{network.profiles.length} profiles discovered</p>
        </div>

        <div className="profiles-section">
          <div className="profiles-header">
            <h2>Network Profiles</h2>
            <div className="profile-actions">
              <button className="select-all-btn" onClick={handleSelectAll}>
                {selectedProfiles.size === network.profiles.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                className="expand-btn"
                onClick={handleExpandSelected}
                disabled={expanding || selectedProfiles.size === 0}
              >
                {expanding
                  ? "Expanding..."
                  : `Expand Selected (${selectedProfiles.size})`}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`message ${
                message.includes("Error") ? "error" : "success"
              }`}
            >
              {message}
            </div>
          )}

          <div className="profiles-list">
            {network.profiles.map((profile, index) => (
              <div
                key={profile.profile_id}
                className={`profile-card ${
                  selectedProfiles.has(profile.profile_id) ? "selected" : ""
                }`}
                onClick={() => handleProfileSelect(profile.profile_id)}
              >
                <div className="profile-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedProfiles.has(profile.profile_id)}
                    onChange={() => handleProfileSelect(profile.profile_id)}
                  />
                </div>

                <div className="profile-avatar">
                  {profile.picture_url ? (
                    <img src={profile.picture_url} alt={profile.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="profile-info">
                  <h3 className="profile-name">{profile.name}</h3>
                  <p className="profile-headline">{profile.headline}</p>
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View LinkedIn Profile
                  </a>
                </div>

                <div className="profile-stats">
                  <div className="stat">
                    <span className="stat-label">Comments To:</span>
                    <span className="stat-value">{profile.commentsTo}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Comments From:</span>
                    <span className="stat-value">{profile.commentsFrom}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NetworkDetailPage
