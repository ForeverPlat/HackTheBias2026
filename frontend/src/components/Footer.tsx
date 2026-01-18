import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-left">
          <Link to="/" className="footer-logo" aria-label="Go to home">
            Fair<span className="accent">Tenant</span>
          </Link>

          <div className="footer-meta">
            <span>Cash-flow signals only</span>
            <span className="dot">•</span>
            <span>No proxy inputs</span>
            <span className="dot">•</span>
            <span>Explainable scoring</span>
          </div>
        </div>

        <div className="footer-right">
          <span className="footer-disclaimer">
            Prototype for capability-based screening.
          </span>
          <span className="footer-copy">© {new Date().getFullYear()} FairTenant</span>
        </div>
      </div>
    </footer>
  );
}
