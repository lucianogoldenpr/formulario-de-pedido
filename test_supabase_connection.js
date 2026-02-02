// Script para testar conexão com Supabase
// Executar: node test_supabase_connection.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zoqofjswsotykjfwqucp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcW9manN3c290eWtqZndxdWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTg3MjEsImV4cCI6MjA4MzQ3NDcyMX0.b9XD-F4r3IWvMBKq6cfbHeJ3uLnFAUlpbQGIGZAkBXQ';

console.log('🔍 Testando conexão com Supabase...\n');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseAnonKey.substring(0, 50) + '...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        console.log('⏳ Tentando buscar tabelas...\n');

        // Tentar buscar da tabela orders
        const { data, error } = await supabase
            .from('orders')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ ERRO:', error.message);
            console.error('\n📝 Detalhes:', error);

            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                console.log('\n⚠️  A tabela "orders" não existe no banco de dados.');
                console.log('💡 Você precisa:');
                console.log('   1. Criar um novo projeto Supabase');
                console.log('   2. Executar os scripts SQL de schema');
                console.log('   3. Atualizar as credenciais no código');
            }
        } else {
            console.log('✅ CONEXÃO ESTABELECIDA!');
            console.log('📊 Banco de dados está funcionando!');
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
