import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://siomzsnbxetqhksfxtip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb216c25ieGV0cWhrc2Z4dGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQ2OTUsImV4cCI6MjA4NTYyMDY5NX0.LkpdMc9-VKAuQiZ8MG4mgENGVvi7w3EDuQsIaqEWRuY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'order-pdfs';

/**
 * Faz upload de um PDF para o Supabase Storage
 * @param pdfBlob - Blob do PDF gerado
 * @param fileName - Nome do arquivo (ex: "PEDIDO_PED-123.pdf")
 * @returns URL pública do PDF ou null se falhar
 */
export const uploadPDF = async (pdfBlob: Blob, fileName: string): Promise<string | null> => {
    try {
        // Remove caracteres especiais do nome do arquivo
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${safeName}`;

        // Faz upload
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true // Sobrescreve se já existir
            });

        if (error) {
            console.error('Erro ao fazer upload do PDF:', error);
            return null;
        }

        // Gera URL pública
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    } catch (error) {
        console.error('Erro no upload:', error);
        return null;
    }
};

/**
 * Deleta um PDF do Storage
 * @param fileName - Nome do arquivo a deletar
 */
export const deletePDF = async (fileName: string): Promise<boolean> => {
    try {
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([safeName]);

        if (error) {
            console.error('Erro ao deletar PDF:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro ao deletar:', error);
        return false;
    }
};

/**
 * Atualiza a URL do PDF na tabela orders
 * @param orderId - ID do pedido
 * @param pdfUrl - URL pública do PDF
 */
export const updateOrderPDFUrl = async (orderId: string, pdfUrl: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('orders')
            .update({
                pdf_url: pdfUrl,
                pdf_generated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) {
            console.error('Erro ao atualizar URL do PDF:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro:', error);
        return false;
    }
};

/**
 * Salva log de PDF de aceite
 * @param orderId - ID do pedido
 * @param pdfUrl - URL do PDF de aceite
 * @param signerName - Nome do assinante
 * @param signerEmail - Email do assinante
 */
export const saveAcceptancePDF = async (
    orderId: string,
    pdfUrl: string,
    signerName: string,
    signerEmail: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('acceptance_pdfs')
            .insert({
                order_id: orderId,
                pdf_url: pdfUrl,
                signer_name: signerName,
                signer_email: signerEmail
            });

        if (error) {
            console.error('Erro ao salvar PDF de aceite:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Erro:', error);
        return false;
    }
};

export const storageService = {
    uploadPDF,
    deletePDF,
    updateOrderPDFUrl,
    saveAcceptancePDF
};
