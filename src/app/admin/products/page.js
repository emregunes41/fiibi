import { getProducts, getProductCategories } from "../ecommerce-actions";
import ProductsClient from "./ProductsClient";
import { getSiteConfig } from "../core-actions";

export const metadata = {
  title: "Ürünler - E-Ticaret"
};

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = await getProductCategories();
  const config = await getSiteConfig();
  
  return (
    <div style={{ padding: "0" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "4px" }}>Mağaza & Ürünler</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Fiziksel veya dijital ürünlerinizi yönetin, kategoriler oluşturun.</p>
      </div>
      
      <ProductsClient initialProducts={products} initialCategories={categories} config={config} />
    </div>
  );
}
