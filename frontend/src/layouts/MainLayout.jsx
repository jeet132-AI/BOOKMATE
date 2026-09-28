import Navbar from "../components/Navbar";
import CartNotice from "../components/CartNotice";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />

      <main className="main-content">
        {children}
      </main>

      <CartNotice />
    </>
  );
}

export default MainLayout;