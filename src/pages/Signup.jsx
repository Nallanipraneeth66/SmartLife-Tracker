import { useState } from "react";
import { signupUser, getUserByEmail } from "../api/authApi";
import { createProfile } from "../api/profileApi";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "" });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password || !form.age) {
      return alert("All fields are required");
    }

    const ageNum = Number(form.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      return alert("Please enter a valid age (1-150)");
    }

    setLoading(true);
    try {
      // Check if email already exists
      const exists = await getUserByEmail(form.email);
      if (exists.data.length > 0) {
        alert("Email already exists");
        setLoading(false);
        return;
      }

      // Create user
      const userRes = await signupUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        age: ageNum
      });

      // Get the created user (JSON-server returns the created object)
      const newUser = userRes.data;
      const userId = newUser.id;

      // Create profile for the user
      await createProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        age: ageNum
      }, userId);

      alert("Signup successful! Please login.");
      nav("/login");
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="glass p-6 sm:p-8 rounded-2xl w-full max-w-md space-y-5 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Create Account</h1>

        <input
          type="text"
          placeholder="Full Name"
          className="p-3 rounded-lg text-black w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          disabled={loading}
        />

        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded-lg text-black w-full"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          disabled={loading}
        />

        <input
          type="number"
          placeholder="Age"
          min="1"
          max="150"
          className="p-3 rounded-lg text-black w-full"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded-lg text-black w-full"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          disabled={loading}
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="btn-shine bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="text-center text-white/70">
          Already have an account?{" "}
          <span className="text-blue-400 cursor-pointer" onClick={() => nav("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
}
