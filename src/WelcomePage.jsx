import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-500 text-white text-center p-6">
      <h1 className="text-3xl font-bold mb-2">
        Polokwane Service Reporter
      </h1>

      <p className="text-white/90 mb-6 max-w-md text-sm leading-relaxed">
        Help Polokwane Municipality respond faster.
        Report potholes, sewer leaks, uncollected waste and broken streetlights.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate("/register")}
          className="bg-white text-primary-600 py-3 rounded-xl font-semibold text-sm shadow-md hover:opacity-90 active:scale-[.98] transition"
        >
          Register
        </button>

        <button
          onClick={() => navigate("/report")}
          className="bg-primary-700 text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:bg-primary-800 active:scale-[.98] transition"
        >
          Continue as Guest
        </button>
      </div>

      <div className="text-[10px] text-white/70 leading-relaxed mt-8 max-w-xs">
        Your GPS location is captured to help teams find the exact spot.
      </div>
    </div>
  );
}
