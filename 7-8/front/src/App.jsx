import React from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
    return(
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/users" element={<ProtectedRoute roles={["admin"]}><UsersPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductsPage/></ProtectedRoute>}/>
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}