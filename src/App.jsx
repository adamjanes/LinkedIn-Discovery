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
import "./App.css"

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/demo-user" replace />} />
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
        </Routes>
      </div>
    </Router>
  )
}

export default App
