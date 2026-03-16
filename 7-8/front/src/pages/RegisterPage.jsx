import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {authApi} from "../api/client.js";
export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(
            !form.email.trim() ||
            !form.first_name.trim() ||
            !form.last_name.trim() ||
            !form.password.trim()
        ) {
            alert("Заполните все поля");
            return;
        }
        try {
            setLoading(true);
            await authApi.register({
                email: form.email.trim(),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                password: form.password,
            });
            alert("Регистрация прошла успешно. Теперь войдите в систему");
            navigate("/login");
        } catch (error) {
            console.error(error);
            alert(error?.response?.data?.error || "Ошибка регистрации");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="authPage">
            <div className="authCard">
                <h1 className="authTitle">Регистрация</h1>
                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Email
                        <input
                            className="input"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="user@example.com"
                        />
                    </label>
                    <label className="label">
                        Имя
                        <input
                            className="input"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            placeholder="Саня"
                        />
                    </label>
                    <label className="label">
                        Фамилия
                        <input
                            className="input"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                            placeholder="Серегин"
                        />
                    </label>
                    <label className="label">
                        Пароль
                        <input
                            className="input"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Введите пароль"
                        />
                    </label>
                    <button className="btn btn--primary btn--full" disabled={loading}>
                        {loading ? "Регистрируем..." : "Зарегистрироваться"}
                    </button>
                </form>
                <p className="authText">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    );
}