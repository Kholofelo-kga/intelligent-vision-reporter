import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-500 text-white text-center p-6">
      <h1 className="text-3xl font-bold mb-2">Polokwane Service Reporter</h1>
      <p className="text-white/90 mb-6 max-w-md">
        Report potholes, sewer blockages, garbage, leaks, and other issues directly to Polokwane Municipality.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate("/register")}
          className="bg-white text-primary-600 py-3 rounded-xl font-semibold hover:opacity-90"
        >
          Register
        </button>

        <button
          onClick={() => navigate("/report")}
          className="bg-primary-700 text-white py-3 rounded-xl font-semibold hover:bg-primary-800"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
