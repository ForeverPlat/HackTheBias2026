import { BrowserRouter, Route, Routes, Link, useLocation } from "react-router-dom";
import { TenantBasicForm } from "./components/TenantBasicForm";
import { TenantScore } from "./components/TenantScore";

function Hero() {
  const location = useLocation();
  const isScore = location.pathname === "/score";

  const handleJump = () => {
    // only relevant on home page
    const el = document.querySelector("[data-first-field]") as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // focus if it's an input
      (el as HTMLInputElement).focus?.();
    }
  };

  return (
    <section className="hero">
      <div className="hero-inner hero-center">
        <h1 className="hero-title">
          Fair<span className="accent">Tentant</span>
        </h1>

        <p className="hero-subtitle">Fair screening. Clear decisions.</p>

        {isScore ? (
          <Link className="hero-cta" to="/">
            New assessment
          </Link>
        ) : (
          <button className="hero-cta" type="button" onClick={handleJump}>
            Jump to form
          </button>
        )}
      </div>
    </section>
  );
}

<section className="intro">
  <div className="intro-inner">
    <div className="intro-grid">
      <div className="intro-card">
        <h3>Capability signals</h3>
        <p>Scores are driven by affordability and stability—inputs you can control.</p>
      </div>
      <div className="intro-card">
        <h3>No identity proxies</h3>
        <p>No names, race, postal codes, or “vibes.” Just the numbers that matter.</p>
      </div>
      <div className="intro-card">
        <h3>Actionable output</h3>
        <p>Get a score plus suggested mitigations (e.g., savings buffer, guarantor).</p>
      </div>
    </div>
  </div>
</section>


function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="app-header-inner">
            <Link to="/" className="logo">
              Fair<span className="accent">Tentant</span>
            </Link>
          </div>
        </header>

        <Hero />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<TenantBasicForm />} />
            <Route path="/score" element={<TenantScore />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
