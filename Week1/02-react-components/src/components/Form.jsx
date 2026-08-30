import { useState } from "react";
import Button from "./Button";

// Form - adds a new product to the shop.
// Props: categories (array for the dropdown), onAddProduct (function from App).
// The form keeps the typed values in its own state and sends the finished
// product up to App, because App owns the product list.

function Form({ categories, onAddProduct }) {
  const [values, setValues] = useState({
    name: "",
    description: "",
    category: "Dairy",
    price: "",
    unit: "pack",
    stock: "",
  });

  const [errors, setErrors] = useState({});

  // one handler for every input - it uses the input's name attribute
  function handleChange(event) {
    const name = event.target.name;
    const value = event.target.value;

    setValues({ ...values, [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault(); // stop the page from reloading

    const newErrors = {};

    if (values.name.trim() === "") {
      newErrors.name = "Please enter a product name.";
    }

    if (values.price === "" || Number(values.price) <= 0) {
      newErrors.price = "Price must be more than 0.";
    }

    if (values.stock === "" || Number(values.stock) < 0) {
      newErrors.stock = "Stock cannot be empty or negative.";
    }

    setErrors(newErrors);

    // stop here if there is any error
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onAddProduct({
      name: values.name,
      description: values.description,
      category: values.category,
      unit: values.unit,
      price: Number(values.price),
      stock: Number(values.stock),
    });

    // clear the form
    setValues({
      name: "",
      description: "",
      category: values.category,
      price: "",
      unit: "pack",
      stock: "",
    });
    setErrors({});
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Add a new product</h2>

      <label htmlFor="name">Product name</label>
      {/* controlled input: the value comes from state and onChange updates it */}
      <input
        id="name"
        name="name"
        value={values.name}
        onChange={handleChange}
      />
      {errors.name && <p className="error">{errors.name}</p>}

      <label htmlFor="description">Description</label>
      <input
        id="description"
        name="description"
        value={values.description}
        onChange={handleChange}
      />

      <label htmlFor="category">Category</label>
      <select
        id="category"
        name="category"
        value={values.category}
        onChange={handleChange}
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <label htmlFor="price">Price (Rs.)</label>
      <input
        id="price"
        name="price"
        type="number"
        value={values.price}
        onChange={handleChange}
      />
      {errors.price && <p className="error">{errors.price}</p>}

      <label htmlFor="unit">Sold per</label>
      <select id="unit" name="unit" value={values.unit} onChange={handleChange}>
        <option value="kg">kg</option>
        <option value="litre">litre</option>
        <option value="pack">pack</option>
        <option value="dozen">dozen</option>
        <option value="piece">piece</option>
      </select>

      <label htmlFor="stock">Stock</label>
      <input
        id="stock"
        name="stock"
        type="number"
        value={values.stock}
        onChange={handleChange}
      />
      {errors.stock && <p className="error">{errors.stock}</p>}

      <Button type="submit" color="btn-primary">
        Add product
      </Button>
    </form>
  );
}

export default Form;
