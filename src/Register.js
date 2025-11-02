import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    navigate("/report");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-100 text-textc-100 p-6">
      <h1 className="text-2xl font-bold mb-2 text-primary-600">Register</h1>
      <p className="text-sm mb-6 text-center text-textc-100/70">
        Enter your name and email before reporting issues.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          required
          className="border border-primary-500/30 rounded-lg p-2"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="border border-primary-500/30 rounded-lg p-2"
        />
        <button
          type="submit"
          className="bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
