import Button from "./Button";

// Header - shop name and the cart summary.
// Props: shopName, itemCount, cartTotal, onClearCart.
// itemCount and cartTotal are worked out in App and passed down as props,
// so this header updates on its own whenever the cart changes.

function Header({ shopName, itemCount, cartTotal, onClearCart }) {
  return (
    <header className="header">
      <h1>{shopName}</h1>
      <p>Week 1 - React components practice (Header, Footer, Card, Button, Form)</p>

      <div className="header__cart">
        Cart: {itemCount} items - Total Rs. {cartTotal}
        {/* the button only shows when there is something in the cart */}
        {itemCount > 0 && <Button onClick={onClearCart}>Empty cart</Button>}
      </div>
    </header>
  );
}

export default Header;
