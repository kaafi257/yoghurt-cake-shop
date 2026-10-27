export type Role = 'owner' | 'manager' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  active: boolean;
  email: string;
  password?: string;
}

export interface Sale {
  id: string;
  category: 'yoghurt' | 'cake';
  item: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: 'cash' | 'mobile' | 'card';
  created_by?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: 'ingredients' | 'packaging' | 'rent' | 'utilities' | 'wages' | 'other';
  description: string;
  amount: number;
  payment_method: 'cash' | 'mobile' | 'card';
  created_by?: string;
  created_at: string;
}

const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'usr-owner-1',
    full_name: 'Shop Owner (Kaafie)',
    email: 'kaafiebirr95@gmail.com',
    role: 'owner',
    active: true,
    password: 'password123',
  },
];

const DUMMY_EMAILS = new Set([
  'manager@sweetcraft.com',
  'employee@sweetcraft.com',
  'owner@sweetcraft.com',
]);
const DUMMY_IDS = new Set(['usr-owner-2', 'usr-manager-1', 'usr-emp-1']);

class LocalShopStore {
  private profilesKey = 'ycs_profiles_v1';
  private salesKey = 'ycs_sales_v1';
  private expensesKey = 'ycs_expenses_v1';

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(this.profilesKey);
      if (!stored) {
        localStorage.setItem(this.profilesKey, JSON.stringify(DEFAULT_PROFILES));
      } else {
        const list: Profile[] = JSON.parse(stored);
        // Actively filter out legacy dummy mock profiles
        const cleaned = list.filter(
          p => !DUMMY_IDS.has(p.id) && !DUMMY_EMAILS.has((p.email || '').toLowerCase().trim())
        );

        // Ensure at least the shop owner exists
        const hasOwner = cleaned.some(
          p => p.role === 'owner' || (p.email && p.email.toLowerCase() === 'kaafiebirr95@gmail.com')
        );
        if (!hasOwner) {
          cleaned.unshift(DEFAULT_PROFILES[0]);
        }

        localStorage.setItem(this.profilesKey, JSON.stringify(cleaned));
      }

      // Initialize empty arrays for real shop transactions and purge any previously seeded dummy samples
      const existingSales = localStorage.getItem(this.salesKey);
      if (!existingSales) {
        localStorage.setItem(this.salesKey, JSON.stringify([]));
      } else {
        const parsed: Sale[] = JSON.parse(existingSales);
        const realSalesOnly = parsed.filter(s => !/^sale-\d+-\d+$/.test(s.id));
        if (realSalesOnly.length !== parsed.length) {
          localStorage.setItem(this.salesKey, JSON.stringify(realSalesOnly));
        }
      }

      const existingExpenses = localStorage.getItem(this.expensesKey);
      if (!existingExpenses) {
        localStorage.setItem(this.expensesKey, JSON.stringify([]));
      } else {
        const parsed: Expense[] = JSON.parse(existingExpenses);
        const realExpensesOnly = parsed.filter(e => !/^exp-\d+$/.test(e.id));
        if (realExpensesOnly.length !== parsed.length) {
          localStorage.setItem(this.expensesKey, JSON.stringify(realExpensesOnly));
        }
      }
    } catch {
      // ignore
    }
  }

  getProfiles(): Profile[] {
    try {
      const data = localStorage.getItem(this.profilesKey);
      const list: Profile[] = data ? JSON.parse(data) : DEFAULT_PROFILES;
      return list.filter(
        p => !DUMMY_IDS.has(p.id) && !DUMMY_EMAILS.has((p.email || '').toLowerCase().trim())
      );
    } catch {
      return DEFAULT_PROFILES;
    }
  }

  saveProfile(profile: Profile): void {
    const list = this.getProfiles();
    const idx = list.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.push(profile);
    }
    localStorage.setItem(this.profilesKey, JSON.stringify(list));
  }

  saveOrUpdateStaffMember(member: {
    id?: string;
    email: string;
    full_name: string;
    role: Role;
    password?: string;
    active?: boolean;
  }): { id: string } {
    const list = this.getProfiles();
    const cleanEmail = member.email.trim().toLowerCase();
    const idx = list.findIndex(
      p => (cleanEmail && p.email.toLowerCase() === cleanEmail) || (member.id && p.id === member.id)
    );

    if (idx >= 0) {
      const existing = list[idx];
      list[idx] = {
        ...existing,
        id: member.id || existing.id,
        full_name: member.full_name || existing.full_name,
        role: member.role || existing.role,
        active: member.active !== undefined ? member.active : existing.active,
        email: cleanEmail || existing.email,
        password: member.password || existing.password || 'password123',
      };
      localStorage.setItem(this.profilesKey, JSON.stringify(list));
      return { id: list[idx].id };
    }

    const newId = member.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`);
    const newProfile: Profile = {
      id: newId,
      full_name: member.full_name,
      email: cleanEmail,
      role: member.role,
      active: member.active !== undefined ? member.active : true,
      password: member.password || 'password123',
    };
    list.push(newProfile);
    localStorage.setItem(this.profilesKey, JSON.stringify(list));
    return { id: newId };
  }

  createStaffMember(member: {
    id?: string;
    email: string;
    full_name: string;
    role: Role;
    password?: string;
    active?: boolean;
  }): { id: string } {
    return this.saveOrUpdateStaffMember(member);
  }

  toggleStaffStatus(idOrEmail: string, active: boolean): void {
    const list = this.getProfiles();
    const clean = idOrEmail.trim().toLowerCase();
    const target = list.find(p => p.id === idOrEmail || p.email.toLowerCase() === clean);
    if (target) {
      target.active = active;
      localStorage.setItem(this.profilesKey, JSON.stringify(list));
    }
  }

  resetStaffPassword(idOrEmail: string, newPass: string): void {
    const list = this.getProfiles();
    const clean = idOrEmail.trim().toLowerCase();
    const target = list.find(p => p.id === idOrEmail || p.email.toLowerCase() === clean);
    if (target) {
      target.password = newPass;
      localStorage.setItem(this.profilesKey, JSON.stringify(list));
    }
  }

  deleteProfile(idOrEmail: string): void {
    const list = this.getProfiles();
    const clean = idOrEmail.trim().toLowerCase();
    const filtered = list.filter(p => p.id !== idOrEmail && (!p.email || p.email.toLowerCase() !== clean));
    localStorage.setItem(this.profilesKey, JSON.stringify(filtered));
  }

  getSales(): Sale[] {
    try {
      const data = localStorage.getItem(this.salesKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addSale(sale: Omit<Sale, 'id' | 'total' | 'created_at'> & { created_at?: string }): Sale {
    const list = this.getSales();
    const newSale: Sale = {
      ...sale,
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      total: sale.quantity * sale.unit_price,
      created_at: sale.created_at || new Date().toISOString(),
    };
    list.unshift(newSale);
    localStorage.setItem(this.salesKey, JSON.stringify(list));
    return newSale;
  }

  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(this.expensesKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addExpense(expense: Omit<Expense, 'id' | 'created_at'> & { created_at?: string }): Expense {
    const list = this.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: expense.created_at || new Date().toISOString(),
    };
    list.unshift(newExpense);
    localStorage.setItem(this.expensesKey, JSON.stringify(list));
    return newExpense;
  }

  updateSale(id: string, updates: Partial<Omit<Sale, 'id' | 'created_at'>>): Sale | null {
    const list = this.getSales();
    const idx = list.findIndex(s => s.id === id);
    if (idx < 0) return null;
    const existing = list[idx];
    const quantity = updates.quantity !== undefined ? updates.quantity : existing.quantity;
    const unit_price = updates.unit_price !== undefined ? updates.unit_price : existing.unit_price;
    const updated: Sale = {
      ...existing,
      ...updates,
      quantity,
      unit_price,
      total: quantity * unit_price,
    };
    list[idx] = updated;
    localStorage.setItem(this.salesKey, JSON.stringify(list));
    return updated;
  }

  deleteSale(id: string): boolean {
    const list = this.getSales();
    const filtered = list.filter(s => s.id !== id);
    if (filtered.length === list.length) return false;
    localStorage.setItem(this.salesKey, JSON.stringify(filtered));
    return true;
  }

  updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'created_at'>>): Expense | null {
    const list = this.getExpenses();
    const idx = list.findIndex(e => e.id === id);
    if (idx < 0) return null;
    const updated: Expense = {
      ...list[idx],
      ...updates,
    };
    list[idx] = updated;
    localStorage.setItem(this.expensesKey, JSON.stringify(list));
    return updated;
  }

  deleteExpense(id: string): boolean {
    const list = this.getExpenses();
    const filtered = list.filter(e => e.id !== id);
    if (filtered.length === list.length) return false;
    localStorage.setItem(this.expensesKey, JSON.stringify(filtered));
    return true;
  }

  resetToDefault() {
    localStorage.removeItem(this.profilesKey);
    localStorage.removeItem(this.salesKey);
    localStorage.removeItem(this.expensesKey);
    this.init();
  }
}

export const localStore = new LocalShopStore();
