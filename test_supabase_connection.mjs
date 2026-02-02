import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://siomzsnbxetqhksfxtip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb216c25ieGV0cWhrc2Z4dGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDQ2OTUsImV4cCI6MjA4NTYyMDY5NX0.LkpdMc9-VKAuQiZ8MG4mgENGVvi7w3EDuQsIaqEWRuY';

console.log('🔍 Testando conexão com Supabase...\n');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseAnonKey.substring(0, 50) + '...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        console.log('⏳ Tentando buscar tabelas...\n');

        // Tentar buscar da tabela orders
        const { data, error, count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ ERRO:', error.message);
            console.error('\n📝 Código:', error.code);
            console.error('📝 Detalhes:', error.details);

            if (error.message.includes('relation') || error.message.includes('does not exist') || error.code === '42P01') {
                console.log('\n⚠️  A tabela "orders" NÃO EXISTE no banco de dados.');
                console.log('\n💡 Você precisa:');
                console.log('   1. Acessar: https://supabase.com/dashboard/project/siomzanxeteltkskftp');
                console.log('   2. Ir em SQL Editor');
                console.log('   3. Executar os scripts de schema:');
                console.log('      - db_schema_orders.sql');
                console.log('      - db_schema_users.sql');
                console.log('      - db_schema_pdf_storage.sql');
                console.log('   4. Depois executar os scripts de otimização');
            } else {
                console.log('\n⚠️  Erro desconhecido. Verifique as credenciais.');
            }
        } else {
            console.log('✅ CONEXÃO ESTABELECIDA!');
            console.log(`📊 Banco de dados está funcionando! (${count || 0} pedidos)`);
            console.log('\n🎯 Próximos passos:');
            console.log('   1. Executar scripts de otimização (db_optimization.sql)');
            console.log('   2. Executar scripts de auditoria (db_audit.sql)');
            console.log('   3. Executar scripts de soft delete (db_soft_delete.sql)');
            console.log('   4. Executar scripts de segurança (db_security.sql)');
        }
    } catch (err) {
        console.error('❌ ERRO DE CONEXÃO:', err.message);
        console.log('\n💡 Possíveis causas:');
        console.log('   1. Projeto Supabase não existe');
        console.log('   2. Credenciais inválidas');
        console.log('   3. Sem conexão com internet');
    }
}

testConnection();
