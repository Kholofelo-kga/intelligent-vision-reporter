import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-600 text-white text-center p-6">
      <h1 className="text-3xl font-bold mb-3">
        Polokwane Service Reporter
      </h1>

      <p className="text-white/90 mb-6 max-w-md text-sm leading-relaxed">
        Help Polokwane Municipality respond faster. Report potholes, sewer leaks, 
        uncollected waste, and broken streetlights. You can register for full access 
        or continue as a guest.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate("/register")}
          className="bg-white text-primary-700 py-3 rounded-xl font-semibold text-sm shadow-md hover:opacity-90 active:scale-[.98] transition"
        >
          Register for App
        </button>

        <button
          onClick={() => navigate("/report")}
          className="bg-primary-800 text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:bg-primary-700 active:scale-[.98] transition"
        >
          Continue as Guest
        </button>
      </div>

      <footer className="mt-8 text-xs text-white/70">
        Limpopo Smart Municipality Project – Powered by AI & Cloud
      </footer>
    </div>
  );
}
