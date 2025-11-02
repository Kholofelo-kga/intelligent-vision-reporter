import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    navigate("/report");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-100 text-textc-100 p-6">
      <h1 className="text-2xl font-bold mb-2 text-primary-600">Register</h1>

      <p className="text-sm mb-6 text-center text-textc-100/70 leading-relaxed max-w-xs">
        Enter your details so the municipality can contact you for follow-up.
        You can also continue as a guest from the first screen.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-xs bg-white rounded-xl shadow p-4 border border-primary-500/10"
      >
        <div className="flex flex-col text-left">
          <label className="text-xs font-medium text-textc-100 mb-1">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Example: K J Kgatla"
            className="border border-primary-500/30 rounded-lg p-2 text-sm bg-background-100 text-textc-100"
          />
        </div>

        <div className="flex flex-col text-left">
          <label className="text-xs font-medium text-textc-100 mb-1">
            Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="border border-primary-500/30 rounded-lg p-2 text-sm bg-background-100 text-textc-100"
          />
        </div>

        <button
          type="submit"
          className="bg-primary-500 text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:bg-primary-600 active:scale-[.98] transition"
        >
          Continue
        </button>
      </form>

      <button
        onClick={() => navigate("/")}
        className="text-[11px] text-primary-600 font-medium mt-4 hover:underline active:scale-[.98] transition"
      >
        ← Go Back
      </button>

      <div className="text-[10px] text-textc-100/60 leading-relaxed mt-6 max-w-xs text-center">
        Your details will be attached to the report for accountability.
      </div>
    </div>
  );
}
