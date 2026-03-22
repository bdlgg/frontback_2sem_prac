import React from "react";
import {Navigate} from "react-router-dom";
import {tokenStorage} from "../api/client.js";

export default function ProtectedRoute({children, roles=[]}) {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    if (!accessToken && !refreshToken) {
        return <Navigate to="/login" replace />;
    }
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    if (roles.length > 0 && !roles.includes(payload.role)) {
        alert("У вас нет доступа к этому разделу");
        return <Navigate to="/products" replace />;
    }
    return children;
}