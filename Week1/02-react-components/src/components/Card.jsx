import Button from "./Button";

// Card - shows one product. It has no state of its own, it only
// displays the props it is given and calls the two functions from App.
// Props: id, name, description, category, price, unit, stock,
//        onAddToCart, onRemove.

function Card({ id, name, description, category, price, unit, stock, onAddToCart, onRemove }) {
  // work out the stock message from the stock number
  let stockText = "In stock: " + stock;
  let stockClass = "stock-ok";

  if (stock === 0) {
    stockText = "Out of stock";
    stockClass = "stock-out";
  } else if (stock <= 5) {
    stockText = "Only " + stock + " left";
    stockClass = "stock-low";
  }

  return (
    <div className="card">
      <h3>{name}</h3>
      <p>{description}</p>
      <p className="price">Rs. {price} / {unit}</p>
      <p>Category: {category}</p>
      <p className={stockClass}>{stockText}</p>

      {/* arrow function so the click calls the function, not the render */}
      <Button color="btn-primary" onClick={() => onAddToCart(id)} disabled={stock === 0}>
        Add to cart
      </Button>

      <Button color="btn-danger" onClick={() => onRemove(id)}>
        Remove
      </Button>
    </div>
  );
}

export default Card;
