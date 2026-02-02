
import * as XLSX from 'xlsx';
import { Order, OrderItem } from '../types';

/**
 * Importa dados de um arquivo Excel e converte para o formato Order
 */
export const importFromExcel = (file: File): Promise<Partial<Order>> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Converte para JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Extrai dados do cabeçalho
                const orderData: Partial<Order> = {
                    items: [],
                    customer: {
                        name: '',
                        document: '',
                        phone: '',
                        email: '',
                        birthday: '',
                        rg: '',
                        stateRegistration: '',
                        municipalRegistration: '',
                        billingAddress: {
                            street: '',
                            number: '',
                            complement: '',
                            neighborhood: '',
                            city: '',
                            state: '',
                            zipCode: ''
                        },
                        collectionAddress: {
                            street: '',
                            number: '',
                            complement: '',
                            neighborhood: '',
                            city: '',
                            state: '',
                            zipCode: ''
                        },
                        deliveryAddress: {
                            street: '',
                            number: '',
                            complement: '',
                            neighborhood: '',
                            city: '',
                            state: '',
                            zipCode: ''
                        }
                    },
                    paymentTerms: '',
                    deliveryTime: '',
                    validity: '',
                    notes: '',
                    totalWeight: 0,
                    totalAmount: 0,
                    shippingCost: 0,
                    validUntil: ''
                };

                // Processa linha por linha
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];

                    // Dados do Cliente
                    if (row[0] === 'Razão Social:' && row[1]) {
                        orderData.customer!.name = row[1];
                    }
                    if (row[0] === 'CNPJ/CPF:' && row[1]) {
                        orderData.customer!.document = row[1];
                    }
                    if (row[0] === 'E-mail:' && row[1]) {
                        orderData.customer!.email = row[1];
                    }
                    if (row[0] === 'Telefone:' && row[1]) {
                        orderData.customer!.phone = row[1];
                    }
                    if (row[0] === 'I.E:' && row[1]) {
                        orderData.customer!.stateRegistration = row[1];
                    }

                    // Endereço
                    if (row[0] === 'Logradouro:' && row[1]) {
                        const parts = row[1].split(',');
                        if (parts.length >= 2) {
                            orderData.customer!.billingAddress.street = parts[0].trim();
                            const numberParts = parts[1].trim().split(' ');
                            orderData.customer!.billingAddress.number = numberParts[0];
                            orderData.customer!.billingAddress.complement = numberParts.slice(1).join(' ');
                        }
                    }
                    if (row[0] === 'Bairro:' && row[1]) {
                        orderData.customer!.billingAddress.neighborhood = row[1];
                    }
                    if (row[0] === 'Cidade:' && row[1]) {
                        const cityState = row[1].split(' - ');
                        if (cityState.length === 2) {
                            orderData.customer!.billingAddress.city = cityState[0];
                            orderData.customer!.billingAddress.state = cityState[1];
                        }
                    }
                    if (row[0] === 'CEP:' && row[1]) {
                        orderData.customer!.billingAddress.zipCode = row[1];
                    }

                    // Condições Comerciais
                    if (row[0] === 'Forma de Pagamento:' && row[1]) {
                        orderData.paymentTerms = row[1];
                    }
                    if (row[0] === 'Prazo de Entrega:' && row[1]) {
                        orderData.deliveryTime = row[1];
                    }
                    if (row[0] === 'Validade da Proposta:' && row[1]) {
                        orderData.validity = row[1];
                    }
                    if (row[0] === 'Observações:' && row[1]) {
                        orderData.notes = row[1];
                    }

                    // Itens (procura pela linha de cabeçalho)
                    if (row[0] === 'ITEM' && row[1] === 'REF') {
                        // Próximas linhas são itens até encontrar linha vazia
                        for (let j = i + 1; j < jsonData.length; j++) {
                            const itemRow = jsonData[j];
                            if (!itemRow[0] || itemRow[0] === '') break;

                            const item: OrderItem = {
                                id: `item-${Date.now()}-${j}`,
                                code: itemRow[1] || '',
                                ncm: '',
                                description: itemRow[2] || '',
                                unit: itemRow[3] || 'UN',
                                weight: 0,
                                quantity: parseFloat(itemRow[4]) || 0,
                                unitPrice: parseFloat(itemRow[5]) || 0,
                                discount: 0,
                                total: parseFloat(itemRow[6]) || 0
                            };

                            orderData.items!.push(item);
                        }
                    }

                    // Valores financeiros
                    if (row[0] === 'Subtotal:' && row[6]) {
                        orderData.globalValue1 = parseFloat(row[6]) || 0;
                    }
                    if (row[0] === 'Desconto:' && row[6]) {
                        orderData.discountTotal = parseFloat(row[6]) || 0;
                    }
                    if (row[0] === 'Frete:' && row[6]) {
                        orderData.freightValue = parseFloat(row[6]) || 0;
                    }
                    if (row[0] === 'TOTAL LÍQUIDO:' && row[6]) {
                        orderData.globalValue2 = parseFloat(row[6]) || 0;
                    }
                }

                // Copia endereço de faturamento para coleta e entrega se não especificado
                orderData.customer!.collectionAddress = { ...orderData.customer!.billingAddress };
                orderData.customer!.deliveryAddress = { ...orderData.customer!.billingAddress };

                resolve(orderData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsBinaryString(file);
    });
};
