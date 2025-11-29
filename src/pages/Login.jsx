import { useState } from "react";
import { getUserByEmail } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return alert("Enter email & password");

    const res = await getUserByEmail(email);
    const user = res.data[0];

    if (!user) return alert("User not found");

    if (user.password !== password) return alert("Incorrect password");

    login(user);
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="glass p-6 sm:p-8 rounded-2xl w-full max-w-md space-y-5 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded-lg text-black w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded-lg text-black w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="btn-shine bg-gradient-to-r from-blue-500 to-purple-500 py-3 rounded-xl w-full"
        >
          Login
        </button>

        <p className="text-center text-white/70">
          Don't have an account?{" "}
          <span className="text-pink-400 cursor-pointer" onClick={() => nav("/signup")}>Sign Up</span>
        </p>
      </div>
    </div>
  );
}
