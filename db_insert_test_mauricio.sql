-- INSERIR PEDIDO DE TESTE PARA MAURICIO
-- Execute este script no SQL Editor do Supabase

INSERT INTO public.orders (
    id,
    date,
    salesperson,
    status,
    customer_name,
    customer_document,
    customer_phone,
    customer_email,
    billing_address,
    collection_address,
    delivery_address,
    global_value_1,
    total_amount,
    currency_conversion,
    created_by, -- AQUI ESTÁ O SEGREDO
    created_at
) VALUES (
    'PED-MAURICIO-01',
    CURRENT_DATE,
    'Mauricio',
    'confirmed',
    'Hospital de Teste S.A.',
    '00.000.000/0001-00',
    '(11) 99999-9999',
    'compras@hospital.com',
    '{"address": "Rua Teste, 123", "number": "123", "district": "Centro", "city": "Curitiba", "state": "PR", "zipCode": "80000-000"}',
    '{"address": "Rua Teste, 123", "number": "123", "district": "Centro", "city": "Curitiba", "state": "PR", "zipCode": "80000-000"}',
    '{"address": "Rua Teste, 123", "number": "123", "district": "Centro", "city": "Curitiba", "state": "PR", "zipCode": "80000-000"}',
    15000.00,
    15000.00,
    'Real',
    'mauricio@goldenpr.com.br', -- DEFININDO O CRIADOR
    NOW()
);
