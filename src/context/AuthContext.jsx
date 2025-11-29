import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("smartlife_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure user has id property
        if (parsed && parsed.id) {
          setUser(parsed);
        }
      } catch (err) {
        console.error("Failed to parse saved user", err);
        localStorage.removeItem("smartlife_user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Ensure user object has id property
    if (!userData || !userData.id) {
      console.error("User data must have an id property");
      return;
    }
    const userObj = {
      id: userData.id,
      name: userData.name || "",
      email: userData.email || "",
      age: userData.age || null,
      token: userData.token || null
    };
    setUser(userObj);
    localStorage.setItem("smartlife_user", JSON.stringify(userObj));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("smartlife_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
