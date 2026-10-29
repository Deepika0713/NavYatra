
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Places from "./pages/Places";
import Planner from "./pages/Planner";
import Itinerary from "./pages/Itinerary";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

import "./styles/main.css";
import "./styles/components.css";
import "./styles/animations.css";

function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="container section">Loading...</main>;
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}

function AuthenticatedLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function NotFound() {
  return (
    <main className="container section">
      <h1>Page not found</h1>
      <p className="muted">The page you're looking for doesn't exist.</p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/places" element={<Places />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/itinerary" element={<Itinerary />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
