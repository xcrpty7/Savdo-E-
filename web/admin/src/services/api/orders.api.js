import { http } from "../http";

export const ordersApi = {
  /** GET /api/admin/orders?page=1&limit=20 */
  getAll: (params = {}) =>
    http.get("/admin/orders", { params }),

  /** PATCH /api/admin/orders/:id/status */
  updateStatus: (id, payload) =>
    http.patch(`/admin/orders/${id}/status`, typeof payload === "string" ? { orderStatus: payload } : payload),
};
