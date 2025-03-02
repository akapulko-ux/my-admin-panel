import React from "react";
import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requiredRoles }) {
  const { currentUser, role } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  if (!requiredRoles.includes(role)) {
    return <div style={{ padding: 20 }}>Доступ запрещён. Ваша роль: {role}</div>;
  }
  return children;
}

export default ProtectedRoute;