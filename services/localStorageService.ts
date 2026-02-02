
import { Order } from '../types';

/**
 * Serviço de armazenamento local (fallback quando Supabase não está disponível)
 */
export const localStorageService = {
    STORAGE_KEY: 'golden_orders',

    async saveOrder(order: Order) {
        try {
            const orders = this.getAllOrders();
            const existingIndex = orders.findIndex(o => o.id === order.id);

            if (existingIndex >= 0) {
                orders[existingIndex] = order;
            } else {
                orders.push(order);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
            return { success: true };
        } catch (error: any) {
            console.error('Erro ao salvar no localStorage:', error);
            return { success: false, error: error.message };
        }
    },

    async fetchOrders(): Promise<Order[]> {
        try {
            return this.getAllOrders();
        } catch (error) {
            console.error('Erro ao buscar do localStorage:', error);
            return [];
        }
    },

    async deleteOrder(id: string): Promise<boolean> {
        try {
            const orders = this.getAllOrders();
            const filtered = orders.filter(o => o.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Erro ao excluir do localStorage:', error);
            return false;
        }
    },

    getAllOrders(): Order[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }
};
