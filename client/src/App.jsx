
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Places from "./pages/Places";
import Planner from "./pages/Planner";
import Itinerary from "./pages/Itinerary";

import "./styles/main.css";
import "./styles/components.css";
import "./styles/animations.css";

function PlaceholderPage({ title }) {
  return (
    <main className="container section">
      <h1>{title}</h1>
      <p className="muted">
        This page will be connected in the next development step.
      </p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/places" element={<Places />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Travel Dashboard" />} />
        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Routes>
    </BrowserRouter>
  );
}
