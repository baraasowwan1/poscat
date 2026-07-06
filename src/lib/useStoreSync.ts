/**
 * useStoreSync.ts
 * Hook that loads all store data from MongoDB on mount.
 * Falls back to localStorage if API is unreachable.
 */
import { useEffect, useRef } from "react";
import {
  productsDb, customersDb, suppliersDb, salesDb, purchasesDb, expensesDb,
  mapProduct, mapCustomer, mapSupplier, mapSale, mapPurchase, mapExpense,
} from "./dbSync";

interface SyncCallbacks {
  setProducts:   (d: any[]) => void;
  setCustomers:  (d: any[]) => void;
  setSuppliers:  (d: any[]) => void;
  setSales:      (d: any[]) => void;
  setPurchases:  (d: any[]) => void;
  setExpenses:   (d: any[]) => void;
  storeSlug:     string;
  enabled:       boolean; // only sync when a store user is logged in
}

export function useStoreSync({
  setProducts, setCustomers, setSuppliers,
  setSales, setPurchases, setExpenses,
  storeSlug, enabled,
}: SyncCallbacks) {
  const synced = useRef(false);

  useEffect(() => {
    if (!enabled || !storeSlug || storeSlug === "__platform__" || storeSlug === "__default__") return;
    if (synced.current) return;
    synced.current = true;

    const token = localStorage.getItem("pos_token");
    if (!token) return; // offline mode — keep localStorage data

    async function loadAll() {
      // Load all in parallel
      const [products, customers, suppliers, sales, purchases, expenses] = await Promise.all([
        productsDb.list(),
        customersDb.list(),
        suppliersDb.list(),
        salesDb.list(),
        purchasesDb.list(),
        expensesDb.list(),
      ]);

      if (products.ok && Array.isArray(products.data) && products.data.length >= 0)
        setProducts(products.data.map(mapProduct));

      if (customers.ok && Array.isArray(customers.data) && customers.data.length >= 0)
        setCustomers(customers.data.map(mapCustomer));

      if (suppliers.ok && Array.isArray(suppliers.data) && suppliers.data.length >= 0)
        setSuppliers(suppliers.data.map(mapSupplier));

      if (sales.ok && Array.isArray(sales.data) && sales.data.length >= 0)
        setSales(sales.data.map(mapSale));

      if (purchases.ok && Array.isArray(purchases.data) && purchases.data.length >= 0)
        setPurchases(purchases.data.map(mapPurchase));

      if (expenses.ok && Array.isArray(expenses.data) && expenses.data.length >= 0)
        setExpenses(expenses.data.map(mapExpense));
    }

    loadAll().catch(() => {/* stay offline */});
  }, [enabled, storeSlug]); // eslint-disable-line
}
