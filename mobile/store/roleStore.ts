import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "admin" | "cashier";

interface RoleState {
  role: UserRole;
  load: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  isAdmin: () => boolean;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  role: "admin",

  load: async () => {
    const role = ((await AsyncStorage.getItem("user_role")) as UserRole) || "admin";
    set({ role });
  },

  setRole: async (role) => {
    await AsyncStorage.setItem("user_role", role);
    set({ role });
  },

  isAdmin: () => get().role === "admin",
}));
