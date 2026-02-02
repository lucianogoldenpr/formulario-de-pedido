
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types';

/**
 * Configuração da conexão com o Supabase.
 */
const getSupabaseClient = (): SupabaseClient | null => {
  const supabaseUrl = 'https://siomzsnbxetqhksfxtip.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb216c25ieGV0cWhrc2Z4dGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQ2OTUsImV4cCI6MjA4NTYyMDY5NX0.LkpdMc9-VKAuQiZ8MG4mgENGVvi7w3EDuQsIaqEWRuY';

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

export const supabase = getSupabaseClient();

export interface AppUser {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export const supabaseService = {
  // --- SECURITY: REAL AUTHENTICATION ---

  // Login Real
  async signIn(email: string) {
    if (!supabase) return { error: 'Supabase não inicializado' };

    // Para simplificar, vamos usar Magic Link primeiro (mais seguro, sem senha)
    // OU se preferir senha, usamos signInWithPassword.
    // Vamos tentar senha primeiro, se falhar, avisamos.

    // PRIMEIRO: Verifica se o usuário existe na tabela pública de perfis
    // Isso é útil para verificar roles antes mesmo do Auth
    const { data: profile } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    return { profile };
  },

  // Auth Real (Login com Senha)
  async signInWithPassword(email: string, password: string) {
    if (!supabase) return { user: null, error: 'Supabase off' };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, session: data.session, error };
  },

  // Logout Real
  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  // Pega usuário atual da sessão
  async getCurrentSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // Cadastro de Novo Usuário (Apenas Admin pode criar ou via convite)
  async signUp(email: string, password: string, name: string) {
    if (!supabase) return { error: 'Supabase off' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name } // Salva nome no metadata
      }
    });

    return { user: data.user, error };
  },

  async updateLastLogin(email: string) {
    if (!supabase) return;
    await supabase.from('app_users').update({ last_login: new Date() }).eq('email', email);
  },
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
          notes: order.notes,
          created_by: order.created_by || null
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
          email: contact.email
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

  async fetchOrders(currentUserEmail?: string, isAdmin: boolean = false) {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          order_contacts (*)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && currentUserEmail) {
        query = query.eq('created_by', currentUserEmail);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((dbOrder: any) => ({
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
          email: c.email
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
        notes: dbOrder.notes,
        shippingCost: dbOrder.freight_value,
        pdf_url: dbOrder.pdf_url,
        pdf_generated_at: dbOrder.pdf_generated_at,
        created_by: dbOrder.created_by,
        created_at: dbOrder.created_at
      })) as Order[];

    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
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
  },

  async uploadOrderPDF(orderId: string, pdfBlob: Blob) {
    if (!supabase) return { success: false, error: 'Sem conexão Supabase' };

    try {
      const fileName = `${orderId}_${Date.now()}.pdf`;

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('order-pdfs')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Get URL
      const { data: { publicUrl } } = supabase.storage
        .from('order-pdfs')
        .getPublicUrl(fileName);

      // 3. Update Order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          pdf_url: publicUrl,
          pdf_generated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error("Erro upload PDF:", error);
      return { success: false, error: error.message };
    }
  },

  async saveAcceptanceLog(data: {
    order_id: string;
    customer_name: string;
    customer_document: string;
    signer_name: string;
    signer_email: string;
    signature_hash: string;
    user_agent: string;
    ip_address?: string;
  }) {
    if (!supabase) return null;

    try {
      const { data: inserted, error } = await supabase
        .from('acceptance_logs')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error("Erro Supabase Aceite:", error);
        return null;
      }
      return inserted;
    } catch (e) {
      console.error("Erro ao salvar aceite:", e);
      return null;
    }
  },

  // --- GESTÃO DE USUÁRIOS ---

  async fetchUsers() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  async createUser(user: { email: string; name: string; role: 'admin' | 'user' }) {
    if (!supabase) return { success: false, error: 'Sem conexão' };
    try {
      const { error } = await supabase
        .from('app_users')
        .insert([user]);

      if (error) {
        if (error.code === '23505') return { success: false, error: 'E-mail já cadastrado.' };
        throw error;
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async deleteUser(email: string) {
    if (!supabase) return { success: false, error: 'Sem conexão' };
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('email', email);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async updateUser(originalEmail: string, updates: { name: string; role: 'admin' | 'user'; email?: string }) {
    if (!supabase) return { success: false, error: 'Sem conexão' };
    try {
      // Se houver troca de email, é complexo pois envolve Auth. Vamos permitir apenas trocar Nome e Role por enquanto na tabela app_users.
      // Se trocar o email aqui, perde o link com o Auth se não atualizar lá também.
      // Por segurança, vamos bloquear alteração de email por enquanto ou assumir que o email é a chave.

      const { error } = await supabase
        .from('app_users')
        .update({ name: updates.name, role: updates.role })
        .eq('email', originalEmail);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async createAuthUser(email: string, password: string) {
    const supabaseUrl = 'https://siomzsnbxetqhksfxtip.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb216c25ieGV0cWhrc2Z4dGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQ2OTUsImV4cCI6MjA4NTYyMDY5NX0.LkpdMc9-VKAuQiZ8MG4mgENGVvi7w3EDuQsIaqEWRuY';

    if (!supabaseUrl || !supabaseAnonKey) return { success: false, error: 'Credenciais ausentes' };

    // Cria um cliente temporário para não afetar a sessão atual do Admin
    const tempClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await tempClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0], // Fallback name
        }
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user };
  }
};
