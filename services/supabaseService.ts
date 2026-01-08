
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types';

/**
 * Configuração da conexão com o Supabase.
 */
const getSupabaseClient = (): SupabaseClient | null => {
  const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://zoqofjswsotykjfwqucp.supabase.co';
  const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'sb_publishable_MyOrm7en402Ox-5VgvEFZA_yLkvQ8jI';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing.');
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

const supabase = getSupabaseClient();

export const supabaseService = {
  async saveOrder(order: Order) {
    if (!supabase) {
      return { success: false, error: 'Conexão com o banco não inicializada.' };
    }

    try {
      // 1. Upsert do Cabeçalho do Pedido
      const { error: orderError } = await supabase
        .from('orders')
        .upsert({
          id: order.id,
          date: order.date,
          salesperson: order.salesperson,
          classification: order.classification,
          classification_other: order.classificationOther,
          status: order.status,
          customer_name: order.customer.name,
          customer_document: order.customer.document,
          customer_phone: order.customer.phone,
          customer_email: order.customer.email,
          customer_birthday: order.customer.birthday || null,
          billing_address: order.customer.billingAddress,
          collection_address: order.customer.collectionAddress,
          delivery_address: order.customer.deliveryAddress,
          global_value_1: order.globalValue1 || 0,
          discount_total: order.discountTotal || 0,
          freight_value: order.freightValue || 0,
          global_value_2: order.globalValue2 || 0,
          total_amount: order.totalAmount || 0,
          total_weight: order.totalWeight || 0,
          currency_conversion: order.currencyConversion || 'Real',
          exchange_rate: order.exchangeRate || 1,
          total_in_brl: order.totalInBRL || 0,
          min_billing: order.minBilling || false,
          min_billing_value: order.minBillingValue || 0,
          final_customer: order.finalCustomer || false,
          payment_terms: order.paymentTerms,
          delivery_time: order.deliveryTime,
          validity: order.validity,
          valid_until: order.validUntil || null,
          bidding_number: order.biddingNumber,
          bidding_date: order.biddingDate || null,
          commitment_number: order.commitmentNumber,
          commitment_date: order.commitmentDate || null,
          notes: order.notes
        });

      if (orderError) throw orderError;

      // 2. Limpar itens e contatos anteriores
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('order_contacts').delete().eq('order_id', order.id);

      // 3. Inserir Itens do Pedido
      if (order.items && order.items.length > 0) {
        const itemsToInsert = order.items.map(item => ({
          order_id: order.id,
          code: item.code,
          ncm: item.ncm,
          description: item.description,
          unit: item.unit,
          weight: parseFloat(item.weight.toString()) || 0,
          quantity: parseFloat(item.quantity.toString()) || 0,
          unit_price: parseFloat(item.unitPrice.toString()) || 0,
          total: parseFloat(item.total.toString()) || 0
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      // 4. Inserir Contatos Relacionados
      if (order.contacts && order.contacts.length > 0) {
        const contactsToInsert = order.contacts.map(contact => ({
          order_id: order.id,
          name: contact.name,
          job_title: contact.jobTitle,
          department: contact.department,
          phone: contact.phone,
          email: contact.email,
          birthday: contact.birthday || null
        }));
        const { error: contactsError } = await supabase.from('order_contacts').insert(contactsToInsert);
        if (contactsError) throw contactsError;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro detalhado ao salvar no Supabase:', error);
      const errorMessage = error.message || error.error_description || (typeof error === 'string' ? error : JSON.stringify(error));
      return { success: false, error: errorMessage };
    }
  },

  async fetchOrders() {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_contacts (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((dbOrder: any) => ({
        id: dbOrder.id,
        date: dbOrder.date,
        salesperson: dbOrder.salesperson,
        classification: dbOrder.classification,
        classificationOther: dbOrder.classification_other,
        status: dbOrder.status,
        customer: {
          name: dbOrder.customer_name,
          document: dbOrder.customer_document,
          phone: dbOrder.customer_phone,
          email: dbOrder.customer_email,
          birthday: dbOrder.customer_birthday,
          billingAddress: dbOrder.billing_address,
          collectionAddress: dbOrder.collection_address,
          deliveryAddress: dbOrder.delivery_address
        },
        items: (dbOrder.order_items || []).map((i: any) => ({
          id: i.id,
          code: i.code,
          ncm: i.ncm,
          description: i.description,
          unit: i.unit,
          weight: i.weight,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          total: i.total
        })),
        contacts: (dbOrder.order_contacts || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          jobTitle: c.job_title,
          department: c.department,
          phone: c.phone,
          email: c.email,
          birthday: c.birthday
        })),
        globalValue1: dbOrder.global_value_1,
        discountTotal: dbOrder.discount_total,
        freightValue: dbOrder.freight_value,
        globalValue2: dbOrder.global_value_2,
        totalAmount: dbOrder.total_amount,
        totalWeight: dbOrder.total_weight,
        currencyConversion: dbOrder.currency_conversion,
        exchangeRate: dbOrder.exchange_rate,
        totalInBRL: dbOrder.total_in_brl,
        minBilling: dbOrder.min_billing,
        minBillingValue: dbOrder.min_billing_value,
        finalCustomer: dbOrder.final_customer,
        paymentTerms: dbOrder.payment_terms,
        deliveryTime: dbOrder.delivery_time,
        validity: dbOrder.validity,
        validUntil: dbOrder.valid_until,
        biddingNumber: dbOrder.bidding_number,
        biddingDate: dbOrder.bidding_date,
        commitmentNumber: dbOrder.commitment_number,
        commitmentDate: dbOrder.commitment_date,
        notes: dbOrder.notes
      })) as Order[];
    } catch (error) {
      console.error('Erro ao buscar do Supabase:', error);
      return [];
    }
  },

  async deleteOrder(id: string) {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir do Supabase:', error);
      return false;
    }
  }
};
