
import { supabase } from '../lib/supabase';
import { EventCertified, EventResult, EventTeam, EventTeamMember } from '../types';

export const onlineRankingService = {
    async fetchEvents(): Promise<EventCertified[]> {
        const { data, error } = await supabase
            .from('online_events')
            .select('*')
            .order('data_evento', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async fetchEventById(id: string): Promise<EventCertified | null> {
        const { data, error } = await supabase
            .from('online_events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async fetchResultsByEvent(eventId: string): Promise<EventResult[]> {
        const { data, error } = await supabase
            .from('online_results')
            .select('*, atletas(nome_completo, id_norte_numero)')
            .eq('evento_id', eventId)
            .order('colocacao', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async fetchStateRanking(uf: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('online_results')
            .select('*, atletas!inner(*)')
            .eq('atletas.uf', uf);

        if (error) throw error;
        // Agregação de pontos por atleta
        const ranking: Record<string, any> = {};
        data?.forEach(res => {
            const atleta = res.atletas;
            if (!ranking[atleta.id]) {
                ranking[atleta.id] = {
                    atleta_id: atleta.id,
                    nome_completo: atleta.nome_completo,
                    id_norte_numero: atleta.id_norte_numero,
                    pontuacao_total: 0,
                    eventos_contados: 0
                };
            }
            ranking[atleta.id].pontuacao_total += Number(res.pontuacao);
            ranking[atleta.id].eventos_contados += 1;
        });

        return Object.values(ranking).sort((a, b) => b.pontuacao_total - a.pontuacao_total);
    },

    async saveEvent(event: Partial<EventCertified>): Promise<EventCertified> {
        const { id, ...data } = event;
        if (id) {
            const { data: updated, error } = await supabase
                .from('online_events')
                .update(data)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return updated;
        } else {
            const { data: created, error } = await supabase
                .from('online_events')
                .insert(data)
                .select()
                .single();
            if (error) throw error;
            return created;
        }
    },

    async deleteEvent(id: string): Promise<void> {
        const { error } = await supabase
            .from('online_events')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
