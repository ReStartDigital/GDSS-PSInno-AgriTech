import { Routes, Route } from 'react-router-dom'
import { RequireAuth, RedirectIfAuth } from './components/RequireAuth'
import { Layout } from './components/layout/Layout'

import HomePage from './pages/HomePage'
import OverviewPage from './pages/OverviewPage'
import MarketplacePage from './pages/MarketplacePage'
import ListingsPage from './pages/ListingsPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import ClientsPage from './pages/ClientsPage'
import JobsPage from './pages/JobsPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyPage from './pages/auth/VerifyPage'
import SetPinPage from './pages/auth/SetPinPage'
import AboutPage from './pages/AboutPage'
import HowItWorksPage from './pages/HowItWorksPage'
import AdminPage from './pages/AdminPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<RedirectIfAuth />}>
        <Route path="/auth/login"    element={<Layout><LoginPage /></Layout>} />
        <Route path="/auth/register" element={<Layout><RegisterPage /></Layout>} />
        <Route path="/auth/verify"   element={<Layout><VerifyPage /></Layout>} />
        <Route path="/auth/set-pin"  element={<Layout><SetPinPage /></Layout>} />
      </Route>

      <Route path="/"           element={<Layout><HomePage /></Layout>} />
      <Route path="/marketplace" element={<Layout><MarketplacePage /></Layout>} />
      <Route path="/profile"    element={<Layout><ProfilePage /></Layout>} />
      <Route path="/about"      element={<Layout><AboutPage /></Layout>} />
      <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
      <Route path="/admin"      element={<Layout><AdminPage /></Layout>} />

      <Route element={<RequireAuth />}>
        <Route path="/overview" element={<Layout><OverviewPage /></Layout>} />
        <Route path="/listings" element={<Layout><ListingsPage /></Layout>} />
        <Route path="/clients"  element={<Layout><ClientsPage /></Layout>} />
        <Route path="/jobs"     element={<Layout><JobsPage /></Layout>} />
        <Route path="/orders"   element={<Layout><OrdersPage /></Layout>} />
      </Route>
    </Routes>
  )
}
