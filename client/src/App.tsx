import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { Layout } from "./components/Layout"
import { Dashboard } from "./pages/Dashboard"
import { ProcessCards } from "./pages/ProcessCards"
import { CardDatabase } from "./pages/CardDatabase"
import { Settings } from "./pages/Settings"
import { CardDetail } from "./pages/CardDetail"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="process" element={<ProcessCards />} />
            <Route path="database" element={<CardDatabase />} />
            <Route path="settings" element={<Settings />} />
            <Route path="card/:id" element={<CardDetail />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App