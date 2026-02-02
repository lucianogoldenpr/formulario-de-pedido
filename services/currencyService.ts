
interface ExchangeRateResponse {
    [key: string]: {
        code: string;
        codein: string;
        name: string;
        high: string;
        low: string;
        varBid: string;
        pctChange: string;
        bid: string;
        ask: string;
        timestamp: string;
        create_date: string;
    };
}

export const currencyService = {
    /**
     * Obtém a cotação atual para a moeda especificada em relação ao Real (BRL).
     * @param currency 'US$' | 'Euro'
     * @returns O valor da cotação (bid) ou null em caso de erro.
     */
    async getExchangeRate(currency: 'US$' | 'Euro'): Promise<number | null> {
        try {
            const pair = currency === 'US$' ? 'USD-BRL' : 'EUR-BRL';
            const key = currency === 'US$' ? 'USDBRL' : 'EURBRL';

            const response = await fetch(`https://economia.awesomeapi.com.br/last/${pair}`);
            if (!response.ok) {
                throw new Error('Falha na resposta da API');
            }

            const data: ExchangeRateResponse = await response.json();
            const rate = data[key];

            if (rate && rate.bid) {
                return parseFloat(rate.bid);
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar cotação:', error);
            return null;
        }
    }
};
