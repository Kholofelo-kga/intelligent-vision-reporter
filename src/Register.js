export default function Register() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-4">Create an account</h2>
        {/* TODO: your real form */}
        <form className="space-y-3">
          <input className="w-full border rounded-lg p-2" placeholder="Full name" />
          <input className="w-full border rounded-lg p-2" placeholder="Email" />
          <input className="w-full border rounded-lg p-2" placeholder="Password" type="password" />
          <button className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
