import { useEffect, useState } from "react";
import { productsCollection } from "@/db";
import { Product } from "@/db/models/Product";
import { Q } from "@nozbe/watermelondb";

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Barcha aktiv tovarlar (real-time observable) */
export function useProducts(search?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const debouncedSearch = useDebounce(search ?? "", 300);

  useEffect(() => {
    const query = debouncedSearch
      ? productsCollection.query(
          Q.where("archived_at", null),
          Q.where("name", Q.like(`%${Q.sanitizeLikeString(debouncedSearch)}%`))
        )
      : productsCollection.query(Q.where("archived_at", null));

    const sub = query.observe().subscribe(setProducts);
    return () => sub.unsubscribe();
  }, [debouncedSearch]);

  return products;
}

/** Bitta tovar (ID bo'yicha) */
export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!id) return;
    const sub = productsCollection.query(Q.where("id", id)).observe().subscribe((rows) => {
      setProduct(rows[0] ?? null);
    });
    return () => sub.unsubscribe();
  }, [id]);

  return product;
}

/** Kam qolgan tovarlar soni (real-time) — tab badge uchun */
export function useLowStockCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sub = productsCollection
      .query(Q.where("archived_at", null), Q.where("stock_qty", Q.lte(5)))
      .observeCount()
      .subscribe(setCount);
    return () => sub.unsubscribe();
  }, []);

  return count;
}

/** Jami aktiv tovarlar soni (tarif limiti uchun) */
export function useProductCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sub = productsCollection
      .query(Q.where("archived_at", null))
      .observeCount()
      .subscribe(setCount);
    return () => sub.unsubscribe();
  }, []);

  return count;
}
