export default function About() {
    return (
        <div>
            <h1>О нас</h1>
            <p>Эта страница загружается только при первом переходе на маршрут /about</p>
            <p>в бандле она вынесена в отдельный чанк благодаря react lazy</p>
        </div>
    );
}