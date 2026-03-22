import React, {useState, useEffect} from "react";
import {usersApi, tokenStorage} from "../api/client.js";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getAll();
            setUsers(data);
        } catch (error) {
            console.error(error);
            alert("Ошибка при загрузке пользователей");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить пользователя?")) return;
        try {
            await usersApi.remove(id);
            setUsers((prev) => prev.filter(u => u.id !== id));
        } catch (err){
            console.error(err);
            alert("Ошибка удаления")
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            const response = await usersApi.update(id, {role: newRole});
            if (!response || response.error){
                throw new Error(response?.error || "Сервер вернул ошибку");
            }
            setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch (err){
            console.error(err);
            alert("Ошибка обновления роли: " + err.message)
        }
    }
    return (
        <div className="page users-page">
            <h1>Управление пользователями</h1>
            {loading ? <div>Загрузка</div> :
            <table className="users-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Имя</th>
                        <th>Фамилия</th>
                        <th>Роль</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>{u.first_name}</td>
                        <td>{u.last_name}</td>
                        <td>
                            <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                                <option value="user">Пользователь</option>
                                <option value="seller">Продавец</option>
                                <option value="admin">Админ</option>
                            </select>
                        </td>
                        <td>
                            <button onClick={() => handleDelete(u.id)}>Удалить</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
            }
        </div>
    )
}