
import { supabase, SUPABASE_ENABLED, SUPABASE_BUCKET } from '../lib/supabase';

export const uploadFile = async (file: File, folder: string): Promise<string> => {
  if (!SUPABASE_ENABLED) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Sanitização agressiva do nome do arquivo
  const fileExt = file.name.split('.').pop();
  const cleanFolderName = folder.replace(/[^a-z0-9/]/gi, '');
  
  // Gera um nome único e limpo: timestamp_random.ext
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${cleanFolderName}/${fileName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      if (uploadError.message.includes('row-level security') || (uploadError as any).status === 403) {
        throw new Error("⚠️ Erro de Permissão (RLS): O bucket 'midia' no Supabase precisa de políticas de INSERT/SELECT públicas habilitadas.");
      }
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err: any) {
    console.error("Erro no Storage FNPE:", err);
    throw new Error(err.message || "Falha técnica no upload dos arquivos.");
  }
};
