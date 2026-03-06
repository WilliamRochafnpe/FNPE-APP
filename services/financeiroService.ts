
import { Cobranca, Despesa, CobrancaStatus, PagamentoMetodo, DB } from '../types';
import { supabase, SUPABASE_ENABLED } from '../lib/supabase';

/**
 * SERVIÇO FINANCEIRO FNPE
 * Este módulo gerencia a lógica de faturamento e despesas.
 * No futuro, as funções de 'createCobranca' devem chamar endpoints
 * de APIs como Asaas ou Gerencianet via Supabase Edge Functions.
 */

export const financeiroService = {
  /**
   * Simula a criação de uma cobrança externa.
   * Quando o CNPJ for aprovado, integre aqui a chamada à API de pagamentos.
   */
  async gerarCobrancaSimulada(userId: string, valorCentavos: number, tipo: string): Promise<Partial<Cobranca>> {
    const idExterno = `BILL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Simulação de links que viriam da API
    return {
      id: idExterno,
      user_id: userId,
      valor: valorCentavos,
      status: 'pendente',
      data_criacao: new Date().toISOString(),
      link_pagamento: `https://sandbox.fnpe.com.br/checkout/${idExterno}`,
      pdf_boleto: `https://sandbox.fnpe.com.br/boletos/${idExterno}.pdf`,
      metodo: 'pix'
    };
  },

  async confirmarPagamento(cobrancaId: string, db: DB, setDb: any) {
    const timestamp = new Date().toISOString();
    
    if (SUPABASE_ENABLED) {
      await supabase.from('cobrancas').update({ 
        status: 'pago', 
        data_pagamento: timestamp 
      }).eq('id', cobrancaId);
    }

    setDb((prev: DB) => ({
      ...prev,
      cobrancas: prev.cobrancas.map(c => 
        c.id === cobrancaId ? { ...c, status: 'pago', data_pagamento: timestamp } : c
      )
    }));
  },

  async marcarComoEspecial(cobrancaId: string, novoStatus: 'cortesia' | 'parceria', db: DB, setDb: any) {
    if (SUPABASE_ENABLED) {
      await supabase.from('cobrancas').update({ status: novoStatus }).eq('id', cobrancaId);
    }

    setDb((prev: DB) => ({
      ...prev,
      cobrancas: prev.cobrancas.map(c => 
        c.id === cobrancaId ? { ...c, status: novoStatus } : c
      )
    }));
  }
};
