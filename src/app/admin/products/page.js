import { getProducts, getProductCategories } from "../ecommerce-actions";
import ProductsClient from "./ProductsClient";
import { getSiteConfig } from "../core-actions";
import AdminPageTabs from "../components/AdminPageTabs";

export const metadata = {
  title: "Ürünler - E-Ticaret"
};

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = await getProductCategories();
  const config = await getSiteConfig();
  
  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>Mağaza</h1>
      </div>

      <AdminPageTabs tabs={[
        { label: "Ürünler", href: "/admin/products" },
        { label: "Siparişler", href: "/admin/orders" }
      ]} />
      
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Fiziksel veya dijital ürünlerinizi yönetin, kategoriler oluşturun.</p>
      </div>
      
      <ProductsClient initialProducts={products} initialCategories={categories} config={config} />
    </div>
  );
}
