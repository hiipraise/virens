import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import { lazy, Suspense, useEffect } from 'react'
import PageLoader from '@/components/ui/PageLoader'

const FeedPage = lazy(() => import('@/pages/FeedPage'))
const PinDetailPage = lazy(() => import('@/pages/PinDetailPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const UploadPage = lazy(() => import('@/pages/UploadPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage'))
const CollectionDetailPage = lazy(() => import('@/pages/CollectionDetailPage'))
const ExplorePage = lazy(() => import('@/pages/ExplorePage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const SubscribePage = lazy(() => import('@/pages/commerce/SubscribePage'))
const AdsPage = lazy(() => import('@/pages/ads/AdsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminContent = lazy(() => import('@/pages/admin/AdminContent'))
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'))
const AdminAds = lazy(() => import('@/pages/admin/AdminAds'))
const AdminRevenue = lazy(() => import('@/pages/admin/AdminRevenue'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const isAdmin = user?.role && ['superadmin', 'admin', 'staff'].includes(user.role)
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, []) // runs once on mount — restores session from httpOnly cookie

  // Hold rendering until we know auth state, prevents flash-redirect to /login
  if (!isInitialized) return <PageLoader />

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/ads" element={<AdminAds />} />
            <Route path="/admin/revenue" element={<AdminRevenue />} />
          </Route>

          <Route element={<MainLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/pin/:pinId" element={<PinDetailPage />} />
            <Route path="/:username" element={<ProfilePage />} />
            <Route path="/:username/collections" element={<CollectionsPage />} />
            <Route path="/:username/collections/:collectionId" element={<CollectionDetailPage />} />

            <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
            <Route path="/subscribe" element={<PrivateRoute><SubscribePage /></PrivateRoute>} />
            <Route path="/ads" element={<PrivateRoute><AdsPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}