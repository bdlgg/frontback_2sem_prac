import React from "react";
import {tokenStorage} from "../api/client.js";

export default function ProductItem({item, onEdit, onDelete, onView}) {
    const accessToken = tokenStorage.getAccessToken();
    const currentUser = accessToken ? JSON.parse(atob(accessToken.split(".")[1])) : null;
    return (
        <div className="card">
            <div className="card__main">
                <div className="card__id">ID: {item.id}</div>
                <div className="card__title">{item.title}</div>
                <div className="card__meta">
                    {item.category ? `Категория: ${item.category}` : "Категория не указана"}
                </div>
                <div className="card__meta">Цена: {item.price} ₽</div>
                <div className="card__desc">
                    {item.description ? item.description : "Описание отсутствует"}
                </div>
            </div>
            <div className="card__actions">
                <button className="btn" onClick={() => onView(item.id)}>
                    По ID
                </button>
                {currentUser && (currentUser.role === "seller" || currentUser.role === "admin") && (
                    <button className="btn" onClick={() => onEdit(item)}>
                        Редактировать
                    </button>
                )}
                {currentUser?.role === "admin" && (
                    <button className="btn" onClick={() => onDelete(item.id)}>
                        Удалить
                    </button>
                )}
            </div>
        </div>
    );
}