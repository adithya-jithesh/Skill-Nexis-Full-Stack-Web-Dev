import { useState } from "react";
import Header from "./components/Header";
import Card from "./components/Card";
import Form from "./components/Form";
import Footer from "./components/Footer";

// The products the shop starts with.
const initialProducts = [
  {
    id: 1,
    name: "Amul Gold Milk",
    description: "Full cream milk, 6% fat.",
    category: "Dairy",
    price: 68,
    unit: "litre",
    stock: 24,
  },
  {
    id: 2,
    name: "Bananas",
    description: "Fresh bananas from the local market.",
    category: "Fruits",
    price: 49,
    unit: "dozen",
    stock: 12,
  },
  {
    id: 3,
    name: "Brown Bread",
    description: "Whole wheat bread, baked today.",
    category: "Bakery",
    price: 45,
    unit: "piece",
    stock: 4,
  },
  {
    id: 4,
    name: "Basmati Rice",
    description: "Long grain basmati rice.",
    category: "Grocery",
    price: 520,
    unit: "kg",
    stock: 15,
  },
  {
    id: 5,
    name: "Tomatoes",
    description: "Sold loose by weight.",
    category: "Vegetables",
    price: 32,
    unit: "kg",
    stock: 0,
  },
  {
    id: 6,
    name: "Potato Chips",
    description: "Salted chips, 52 g pack.",
    category: "Snacks",
    price: 20,
    unit: "pack",
    stock: 40,
  },
];

const categories = ["Dairy", "Fruits", "Vegetables", "Bakery", "Grocery", "Snacks"];

const footerLinks = [
  { label: "GitHub", href: "https://github.com/adithya-jithesh" },
  { label: "LinkedIn", href: "https://linkedin.com/in/adithyajithesh" },
];

function App() {
  // State. Each useState gives us a value and a function to change it.
  // cart looks like { 1: 2 } which means 2 units of product number 1.
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // These are calculated on every render, so they are not kept in state.
  const shownProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || product.category === filter;
    return matchesSearch && matchesFilter;
  });

  let itemCount = 0;
  let cartTotal = 0;

  products.forEach((product) => {
    const quantity = cart[product.id];
    if (quantity) {
      itemCount = itemCount + quantity;
      cartTotal = cartTotal + product.price * quantity;
    }
  });

  function handleAddProduct(newProduct) {
    // build a new array instead of changing the old one
    setProducts([{ ...newProduct, id: Date.now() }, ...products]);
  }

  function handleAddToCart(id) {
    // take one unit off the shelf
    setProducts(
      products.map((product) => {
        if (product.id === id) {
          return { ...product, stock: product.stock - 1 };
        }
        return product;
      })
    );

    // and put it in the cart
    const quantity = cart[id] || 0;
    setCart({ ...cart, [id]: quantity + 1 });
  }

  function handleRemoveProduct(id) {
    setProducts(products.filter((product) => product.id !== id));

    // also take it out of the cart
    const newCart = { ...cart };
    delete newCart[id];
    setCart(newCart);
  }

  function handleClearCart() {
    // put the units back on the shelf
    setProducts(
      products.map((product) => {
        if (cart[product.id]) {
          return { ...product, stock: product.stock + cart[product.id] };
        }
        return product;
      })
    );

    setCart({});
  }

  return (
    <div className="app">
      <Header
        shopName="Fresh Mart Supermarket"
        itemCount={itemCount}
        cartTotal={cartTotal}
        onClearCart={handleClearCart}
      />

      <Form categories={categories} onAddProduct={handleAddProduct} />

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search products"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="All">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="product-list">
        {/* if nothing matches, show a message instead of the list */}
        {shownProducts.length === 0 && <p>No products found.</p>}

        {shownProducts.map((product) => (
          <Card
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description}
            category={product.category}
            price={product.price}
            unit={product.unit}
            stock={product.stock}
            onAddToCart={handleAddToCart}
            onRemove={handleRemoveProduct}
          />
        ))}
      </div>

      <Footer name="Adithya Jithesh" links={footerLinks} />
    </div>
  );
}

export default App;
