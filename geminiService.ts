
import { GoogleGenAI } from "@google/genai";

export interface AssistantResponse {
  text: string;
  sources?: { uri: string; title: string }[];
}

export async function askAssistant(prompt: string): Promise<AssistantResponse> {
  // OBTENDO CHAVE DO AMBIENTE VITE
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

  // DIAGNÓSTICO OBRIGATÓRIO: Verificar chave
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY" || apiKey === "SUA_CHAVE_REAL_AQUI") {
    console.warn("Assistente FNPE: Chave de API não configurada ou inválida.");
    return {
      text: "Assistente indisponível: chave de IA não configurada."
    };
  }

  try {
    console.log("DIAGNÓSTICO IA: Iniciando conexão com o serviço Gemini...");
    const ai = new GoogleGenAI({ apiKey });

    // Instrução oficial baseada no conhecimento da federação
    const systemInstruction = `
      Você é o Assistente Oficial da FNPE (Federação Norte de Pesca Esportiva).
      
      SUA BASE DE CONHECIMENTO PRINCIPAL (Site e Resoluções):
      1. MISSÃO E QUEM SOMOS:
         - A FNPE promove a pesca esportiva como vetor de desenvolvimento do turismo sustentável na Região Norte do Brasil.
         - Foco em: profissionalização do esporte, turismo sustentável, proteção às espécies, integração regional e impacto social.
         - Sede: Amapá. Presidente: William Rocha.
         - Atuação nos 7 estados do Norte: Acre, Amapá, Amazonas, Pará, Rondônia, Roraima e Tocantins.

      2. PILARES DE ATUAÇÃO:
         - Profissionalização: Certificação de torneios, campeonatos estaduais e Copa Norte.
         - Legislação: Apoio na criação e revisão de leis ligadas à pesca esportiva e proteção ambiental.
         - Atletas: Criação de rankings únicos e a ID Norte (Identidade do Atleta Federado).
         - Social: Projetos de educação ambiental, cidadania e geração de renda para comunidades ribeirinhas.
         - Formação: Cursos para condutores, guias e organizadores de eventos.

      3. ID NORTE (FILIAÇÃO):
         - O pescador é reconhecido como Atleta de Pesca Esportiva.
         - Habilita o atleta a participar dos Rankings Estaduais e Regionais oficiais da FNPE.
         - Benefícios incluem: Documento oficial, participação em sorteios exclusivos, descontos em parceiros e reconhecimento federativo.

      4. REGRAS PARA CERTIFICAÇÃO DE EVENTOS (RESOLUÇÃO 2026):
         - A organização deve solicitar via plataforma FNPE.
         - Registro de Organizador no Ministério da Pesca é obrigatório.
         - Apólice de Seguro ou Termo de Responsabilidade assinado.
         - Timing Crítico: A ID Norte do atleta deve ser emitida ANTES do evento para que os pontos valham para o ranking.
         - Taxa de Certificação: R$ 100,00.
         - Integridade: Organizadores não podem competir no próprio evento.
         - Sustentabilidade: Prática obrigatória do Pesque e Solte.

      RESTRIÇÃO CRÍTICA (IMPORTANTE):
      - A FNPE é INDEPENDENTE. NÃO é filiada à CBPE (Confederação Brasileira de Pesca Esportiva).
      - Incentive sempre o cadastro da ID Norte dentro deste aplicativo.
      
      DIRETRIZES DE RESPOSTA:
      - Seja profissional, prestativo e utilize termos da pesca (ex: "pescador", "atleta", "linhas esticadas").
      - Respostas curtas, objetivas e com formatação clara (use negrito para pontos importantes).
      - Sempre incentive a sustentabilidade e o turismo local.
    `;

    console.log("DIAGNÓSTICO IA: Enviando prompt para o modelo gemini-1.5-flash...");

    // Estrutura correta para o SDK @google/genai (Next Gen)
    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        temperature: 0.7,
        tools: [{ googleSearch: {} }] as any,
      },
    });

    console.log("DIAGNÓSTICO IA: Chamada concluída. Processando resposta...");

    if (!result || !result.candidates || result.candidates.length === 0) {
      console.error("DIAGNÓSTICO IA: Nenhum candidato de resposta retornado pela API.", result);
      return { text: "O assistente não conseguiu gerar uma resposta no momento. Tente novamente." };
    }

    // Extração de texto robusta
    let text = "";
    const candidate = result.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      text = candidate.content.parts[0].text || "";
    }

    if (!text) {
      console.error("DIAGNÓSTICO IA: Resposta veio com formato inesperado ou sem texto.", result);
      return { text: "Resposta vazia recebida do servidor de IA. Por favor, tente outra pergunta." };
    }

    // Processamento de Grounding (Fontes)
    const groundingMetadata = candidate.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ?.map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
      .filter(Boolean) as { uri: string; title: string }[] | undefined;

    return { text, sources };

  } catch (error: any) {
    console.error("DIAGNÓSTICO IA - ERRO TÉCNICO:", error);

    const status = error?.status;
    const message = error?.message || "";

    // Mapeamento de erros específicos conforme exigido
    if (status === 401 || message.includes("API_KEY_INVALID")) {
      return { text: "Erro de Autenticação: A chave da API é inválida ou expirou. Verifique as configurações de ambiente." };
    }

    if (status === 403) {
      return { text: "Acesso Negado: A chave da API não tem permissão para usar este modelo ou recurso (ex: Grounding)." };
    }

    if (status === 429) {
      return { text: "Limite Excedido: Muitas requisições em pouco tempo. Por favor, aguarde um minuto e tente novamente." };
    }

    if (message.includes("network") || message.includes("fetch")) {
      return { text: "Erro de Rede: Verifique sua conexão com a internet. Não foi possível conectar ao servidor de IA." };
    }

    return {
      text: "Assistente temporariamente indisponível. Tente novamente em instantes."
    };
  }
}
