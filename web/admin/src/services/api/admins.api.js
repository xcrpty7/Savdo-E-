import { http } from "../http";

/**
 * Admins API — GET/PATCH /api/admins
 * Only primary admin can call these endpoints
 */

export const adminsApi = {
  /** GET /api/v1/admin/admins */
  getAll: () =>
    http.get("/admin/admins"),

  /** POST /api/v1/admin/register-admin */
  create: (data) =>
    http.post("/admin/register-admin", data),

  /** PATCH /api/v1/admin/admins/:id/status */
  toggleStatus: (id) =>
    http.patch(`/admin/admins/${id}/status`)
};
