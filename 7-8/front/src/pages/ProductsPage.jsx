import React, {useState, useEffect} from "react";
import ProductList from "../components/ProductList.jsx";
import ProductModal from "../components/ProductModal.jsx";
import {authApi, productsApi, tokenStorage} from "../api/client.js";
import {Link, useNavigate} from "react-router-dom";

export default function ProductsPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editingItem, setEditingItem] = useState(null);
    const [searchId, setSearchId] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        initPage();
    }, []);

    const initPage = async () => {
        try {
            setLoading(true);
            const [products, me] = await Promise.all([
                productsApi.getAll(),
                authApi.me()
            ]);
            setItems(products);
            setCurrentUser(me);
        } catch (error) {
            console.error(error);
            tokenStorage.clear();
            alert(error?.response?.data?.error || "Сессия недействительная. Войдите заново")
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setModalMode("create");
        setEditingItem(null);
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setModalMode("edit");
        setEditingItem(item);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setEditingItem(null);
    };
    const handleSubmitModal = async (payload) => {
        try {
            if (modalMode === "create") {
                const newProduct = await productsApi.create(payload);
                setItems((prev) => [...prev, newProduct]);
            } else {
                const updatedProduct = await productsApi.update(payload.id, payload);
                setItems((prev) => prev.map((item) => (item.id === payload.id ? updatedProduct : item)));
                if (selectedProduct?.id === payload.id) {
                    setSelectedProduct(updatedProduct);
                }
            }
            closeModal();
        } catch (error) {
            console.error(error);
            alert(error?.response?.data?.error || "Ошибка Сохранения товара");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Удалить товар?");
        if (!confirmed) return;
        try {
            await productsApi.remove(id);
            setItems((prev) => prev.filter((item) => item.id !== id));
            if (selectedProduct?.id === id) {
                setSelectedProduct(null);
            }
        } catch (error) {
            console.error(error);
            alert(error?.response?.data?.error || "Ошибка удаления")
        }
    };

    const handleViewById = async (id) => {
        try {
            const product = await productsApi.getProductById(id);
            setSelectedProduct(product);
        } catch (error) {
            console.error(error);
            alert(error?.response?.data?.error || "ошибка получения Товара");
        }
    };

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchId.trim()) {
            alert("Введите ID товара");
            return;
        }
        await handleViewById(searchId.trim());
    };

    const handleLogout = () => {
        tokenStorage.clear();
        navigate("/login");
    };
    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div>
                        <div className="brand">Practice 10 Store</div>
                        <div className="header__sub">
                            {currentUser ? `${currentUser.first_name} ${currentUser.last_name} (${currentUser.email})` : "Пользователь не загружен"}
                        </div>
                    </div>
                    <button className="btn" onClick={handleLogout}>
                        Выйти
                    </button>
                    {currentUser?.role === "admin" && (
                        <Link to="/users" className="btn" style={{marginLeft: "16px"}}>
                            Управление пользователями
                        </Link>
                    )}
                </div>
            </header>
            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Управление товарами</h1>
                        {currentUser && (currentUser.role === "seller" || currentUser.role === "admin") && (
                            <button className="btn btn--primary" onClick={openCreate}>
                                + Создать товар
                            </button>
                        )}
                    </div>
                    <form className="searchForm" onSubmit={handleSearchSubmit}>
                        <input
                            className="input"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            placeholder="Введите ID товара"
                        />
                        <button className="btn" type="submit">
                            Найти по ID
                        </button>
                    </form>
                    {selectedProduct ? (
                        <div className="details">
                            <h2 className="details__title">Детальная информация</h2>
                            <div><b>ID:</b> {selectedProduct.id}</div>
                            <div><b>Название:</b> {selectedProduct.title}</div>
                            <div><b>Категория:</b> {selectedProduct.category || "—"}</div>
                            <div><b>Описание:</b> {selectedProduct.description || "—"}</div>
                            <div><b>Цена:</b> {selectedProduct.price} ₽</div>
                        </div>
                    ) : null}
                    {loading ? (
                        <div className="empty">Загрузка...</div>
                    ) : (
                        <ProductList
                            items={items}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onView={handleViewById}
                        />
                    )}
                </div>
            </main>
            <ProductModal
                open={modalOpen}
                mode={modalMode}
                initialItem={editingItem}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}