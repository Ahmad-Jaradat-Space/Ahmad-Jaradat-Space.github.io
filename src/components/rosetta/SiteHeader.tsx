import type { Face } from "@/lib/types";

export function SiteHeader({ face }: { face: Face }) {
  return (
    <header className="r-header">
      <div className="r-facepill">
        <span className="tick" aria-hidden />
        {face.title}
      </div>

      <div className="r-wordmark">
        <b>Ahmad Jaradat</b>
        <span>Extracting Signal from Noise</span>
      </div>

      <nav className="r-nav" aria-label="Primary">
        <a href="https://github.com/Ahmad-Jaradat-Space" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=jaradat08@gmail.com"
          target="_blank"
          rel="noreferrer"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
