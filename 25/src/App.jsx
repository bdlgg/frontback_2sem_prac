import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom";
import {Suspense, lazy} from "react";
import Home from "./pages/Home";

const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/about">О нас</Link>
      </nav>
        <main>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<Suspense fallback={<div>Загрузка страницы "О нас"...</div>}><About/></Suspense> }></Route>
            </Routes>
        </main>
    </Router>
  )
}

export default App
