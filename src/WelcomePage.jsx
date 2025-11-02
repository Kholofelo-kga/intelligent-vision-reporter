import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-500 text-white text-center p-6">
      {/* App title */}
      <h1 className="text-3xl font-bold mb-2">
        Polokwane Service Reporter
      </h1>

      {/* Short explainer */}
      <p className="text-white/90 mb-6 max-w-md text-sm leading-relaxed">
        Help Polokwane Municipality respond faster.
        Report potholes, sewer overflows, water leaks,
        uncollected waste and broken streetlights.
        We capture photo, location and send it to officials.
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {/* Register path */}
        <button
          onClick={() => navigate("/register")}
          className="bg-white text-primary-600 py-3 rounded-xl font-semibold text-sm shadow-md hover:opacity-90 active:scale-[.98] transition"
        >
          Register
        </button>

        {/* Guest path */}
        <button
          onClick={() => navigate("/report")}
          className="bg-primary-700 text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:bg-primary-800 active:scale-[.98] transition"
        >
          Continue as Guest
        </button>
      </div>

      {/* Footer/small note */}
      <div className="text-[10px] text-white/70 leading-relaxed mt-8 max-w-xs">
        Your location will be captured automatically to help
        service teams find the exact spot of the problem.
      </div>
    </div>
  );
}
