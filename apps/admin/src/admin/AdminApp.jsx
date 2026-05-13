import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./Pages/Login";
import AdminLayout from "./components/AdminLayout";

import Dashboard from "./Pages/Dashboard";
import TeamAdmin from "./Pages/TeamAdmin";
import ArticlesAdmin from "./Pages/ArticlesAdmin";
import CareersAdmin from "./Pages/CareersAdmin";
import EventsAdmin from "./Pages/EventsAdmin";

function AdminRoutes() {
  const { token } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (token && !location.startsWith("/admin")) {
      navigate("/admin");
    }
  }, [location, navigate, token]);

  if (!token) {
    return <Login />;
  }

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/team" component={TeamAdmin} />
        <Route path="/admin/articles" component={ArticlesAdmin} />
        <Route path="/admin/careers" component={CareersAdmin} />
        <Route path="/admin/events" component={EventsAdmin} />
        <Route>
          {() => {
            navigate("/admin");
            return null;
          }}
        </Route>
      </Switch>
    </AdminLayout>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminRoutes />
    </AuthProvider>
  );
}
