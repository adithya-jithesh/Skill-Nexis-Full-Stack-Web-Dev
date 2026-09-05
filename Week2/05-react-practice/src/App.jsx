import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import About from "./pages/About";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Todos from "./pages/Todos";

// App only decides which page belongs to which URL. The pages themselves
// hold their own content, and Layout draws the frame around all of them.
function App() {
  return (
    <Routes>
      {/* Layout is the parent route, so its <Outlet /> is where each
          child page below gets rendered. The nav bar is written once. */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="todos" element={<Todos />} />
        <Route path="about" element={<About />} />

        {/* "*" matches anything the routes above did not */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
