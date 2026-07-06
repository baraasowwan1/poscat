/**
 * queries.ts — TanStack Query hooks
 * ALL data comes from MongoDB. No local state. No localStorage for data.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { platformApi, storeApi, authApi, ApiError } from "./apiClient";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const QK = {
  stores:    ["stores"],
  users:     ["users"],
  plans:     ["plans"],
  audit:     ["audit"],
  // Store-level (keyed by storeSlug for isolation)
  products:  (slug: string) => ["products", slug],
  customers: (slug: string) => ["customers", slug],
  suppliers: (slug: string) => ["suppliers", slug],
  sales:     (slug: string) => ["sales", slug],
  purchases: (slug: string) => ["purchases", slug],
  expenses:  (slug: string) => ["expenses", slug],
  settings:  (slug: string) => ["settings", slug],
};

const hasToken = () => !!localStorage.getItem("pos_token");

// ─── Platform hooks ────────────────────────────────────────────────────────────

export function useStores() {
  return useQuery({
    queryKey: QK.stores,
    queryFn: platformApi.getStores,
    enabled: hasToken(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePlatformUsers() {
  return useQuery({
    queryKey: QK.users,
    queryFn: platformApi.getUsers,
    enabled: hasToken(),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: QK.plans,
    queryFn: platformApi.getPlans,
    enabled: hasToken(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => platformApi.createStore(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.stores });
      qc.invalidateQueries({ queryKey: QK.users });
    },
  });
}

export function useDeleteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.deleteStore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.stores }),
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => platformApi.updateStore(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.stores }),
  });
}

export function useToggleStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => platformApi.toggleStore(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.stores }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => platformApi.createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.users }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.users }),
  });
}

// ─── Store-level hooks (isolated per storeSlug) ────────────────────────────────

export function useProducts(storeSlug: string) {
  return useQuery({
    queryKey: QK.products(storeSlug),
    queryFn: storeApi.getProducts,
    enabled: hasToken() && !!storeSlug,
    staleTime: 10_000,
  });
}

export function useCreateProduct(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeApi.createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.products(storeSlug) }),
  });
}

export function useUpdateProduct(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => storeApi.updateProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.products(storeSlug) }),
  });
}

export function useDeleteProduct(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeApi.deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.products(storeSlug) }),
  });
}

export function useCustomers(storeSlug: string) {
  return useQuery({
    queryKey: QK.customers(storeSlug),
    queryFn: storeApi.getCustomers,
    enabled: hasToken() && !!storeSlug,
    staleTime: 10_000,
  });
}

export function useCreateCustomer(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeApi.createCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.customers(storeSlug) }),
  });
}

export function useSales(storeSlug: string) {
  return useQuery({
    queryKey: QK.sales(storeSlug),
    queryFn: storeApi.getSales,
    enabled: hasToken() && !!storeSlug,
    staleTime: 5_000,
  });
}

export function useCreateSale(storeSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storeApi.createSale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.sales(storeSlug) });
      qc.invalidateQueries({ queryKey: QK.products(storeSlug) }); // stock updated
      qc.invalidateQueries({ queryKey: QK.customers(storeSlug) }); // loyalty updated
    },
  });
}

export function useSuppliers(storeSlug: string) {
  return useQuery({
    queryKey: QK.suppliers(storeSlug),
    queryFn: storeApi.getSuppliers,
    enabled: hasToken() && !!storeSlug,
    staleTime: 30_000,
  });
}

export function usePurchases(storeSlug: string) {
  return useQuery({
    queryKey: QK.purchases(storeSlug),
    queryFn: storeApi.getPurchases,
    enabled: hasToken() && !!storeSlug,
    staleTime: 10_000,
  });
}

export function useExpenses(storeSlug: string) {
  return useQuery({
    queryKey: QK.expenses(storeSlug),
    queryFn: storeApi.getExpenses,
    enabled: hasToken() && !!storeSlug,
    staleTime: 10_000,
  });
}
