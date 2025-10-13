import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"
import HomePage from "./pages/HomePage"
import SettingsPage from "./pages/SettingsPage"
import NetworkCreationPage from "./pages/NetworkCreationPage"
import NetworkDetailPage from "./pages/NetworkDetailPage"
import TopNonTechnicalBuildersPage from "./pages/TopNonTechnicalBuildersPage"
import TopTechnicalBuildersPage from "./pages/TopTechnicalBuildersPage"

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/top-technical-builders" replace />}
          />
          <Route path="/:userId" element={<HomePage />} />
          <Route path="/:userId/settings" element={<SettingsPage />} />
          <Route
            path="/:userId/networks/new"
            element={<NetworkCreationPage />}
          />
          <Route
            path="/:userId/networks/:networkId"
            element={<NetworkDetailPage />}
          />
          <Route
            path="/top-non-technical-builders"
            element={<TopNonTechnicalBuildersPage />}
          />
          <Route
            path="/top-technical-builders"
            element={<TopTechnicalBuildersPage />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
