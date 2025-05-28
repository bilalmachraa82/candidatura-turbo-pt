
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useSectionSave() {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const saveSection = async (sectionId: string, content: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sections')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId);

      if (error) throw error;

      toast({
        title: "Secção guardada",
        description: "O conteúdo foi guardado com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao guardar secção:', error);
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: error.message || "Não foi possível guardar a secção."
      });
    } finally {
      setSaving(false);
    }
  };

  return { saveSection, saving };
}
