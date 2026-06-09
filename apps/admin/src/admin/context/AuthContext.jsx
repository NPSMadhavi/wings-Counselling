import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    sessionStorage.getItem("wings_admin_token")
  );

  useEffect(() => {
    function handleSessionExpired() {
      sessionStorage.removeItem("wings_admin_token");
      setToken(null);
    }

    window.addEventListener("wings-admin-session-expired", handleSessionExpired);
    return () => window.removeEventListener("wings-admin-session-expired", handleSessionExpired);
  }, []);

  const login = (t) => {
    sessionStorage.setItem("wings_admin_token", t);
    setToken(t);
  };

  const logout = () => {
    sessionStorage.removeItem("wings_admin_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
