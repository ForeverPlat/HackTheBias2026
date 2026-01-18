import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import EvaluateTenant from "./pages/EvaluateTenant";
import Results from "./pages/Results";
import Footer from "./components/Footer";

function Hero() {
  const { pathname } = useLocation();
  const isResults = pathname === "/score";

  return (
    <section className="hero">
      <div className="hero-inner hero-center">
        <h1 className="hero-title">
          Fair<span className="accent">Tenant</span>
        </h1>
        <p className="hero-subtitle">Fair screening. Clear decisions.</p>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="app-header-inner">
            <Link to="/" className="logo">
              Fair<span className="accent">Tenant</span>
            </Link>
          </div>
        </header>

        <Hero />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<EvaluateTenant />} />
            <Route path="/score" element={<Results />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
