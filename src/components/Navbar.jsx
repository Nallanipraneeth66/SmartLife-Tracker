import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiSun, FiMoon, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import logo from '../assets/Smartlife-logo.png'; 

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tasks", label: "Tasks" },
  { to: "/expenses", label: "Expenses" },
  { to: "/health", label: "Health" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar({ dark, setDark }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getNavLinkClasses = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition duration-200
    ${isActive ? "bg-white/20 shadow-md text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`;

  return (
    <header className="sticky top-0 z-50">
      <div className="glass-nav flex items-center justify-between px-6 py-3 shadow-xl border-b border-white/20">
        {/* LEFT: LOGO */}
        <NavLink to={user ? "/dashboard" : "/login"} className="flex items-center gap-3">
          <div className="w-11 h-11 overflow-hidden rounded-full border border-white/40 bg-white/10 shadow-lg flex items-center justify-center">
            <img 
              src={logo} 
              alt="SmartLife Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image doesn't load
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-400">SL</div>';
              }}
            />
          </div>
          <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-400">
            SmartLife
          </span>
        </NavLink>
        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7">
          {user &&
            NAV_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} className={getNavLinkClasses}>
                {item.label}
              </NavLink>
            ))}
        </nav>
        {/* THEME + PROFILE or AUTH BUTTONS */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          
          {/* If NOT logged in → show Login + Signup */}
          {!user && (
            <div className="hidden md:flex gap-3">
              <NavLink
                to="/login"
                className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white shadow"
              >
                Signup
              </NavLink>
            </div>
          )}
          {/* If logged-in → Show profile dropdown */}
          {user && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileMenu(!profileMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <FiUser />
                <span>{user.name}</span>
              </button>
              {profileMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-black/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/10 p-2">
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left rounded-lg hover:bg-white/10"
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white bg-white/15 rounded-md hover:bg-white/25"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>
      {/* MOBILE MENU */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden 
        ${mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}
        bg-black/40 backdrop-blur-xl border-b border-white/10`}
      >
        <nav className="flex flex-col gap-2 p-4">
          {/* If NOT logged in → show login/signup */}
          {!user && (
            <>
              <NavLink to="/login" onClick={() => setMobileOpen(false)} className={getNavLinkClasses}>
                Login
              </NavLink>
              <NavLink to="/signup" onClick={() => setMobileOpen(false)} className={getNavLinkClasses}>
                Signup
              </NavLink>
            </>
          )}
          {/* If logged in → show full menu */}
          {user &&
            NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={getNavLinkClasses}
              >
                {item.label}
              </NavLink>
            ))}
          {/* Logout in mobile */}
          {user && (
            <button
              onClick={() => {
                logout();
                setMobileOpen(false);
                navigate("/login");
              }}
              className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
            >
              <FiLogOut /> Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
