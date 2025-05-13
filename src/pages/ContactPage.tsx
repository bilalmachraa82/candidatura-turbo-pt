
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Mensagem enviada",
        description: "A sua mensagem foi enviada com sucesso. Entraremos em contacto brevemente."
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Erro no envio",
        description: "Não foi possível enviar a sua mensagem. Por favor tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="pt-container pt-section">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-pt-blue mb-2">Contactos</h1>
          <p className="text-gray-600 mb-8">
            Tem dúvidas sobre os programas de apoio PT2030? Entre em contacto connosco.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-pt-blue mb-1">Endereço</h3>
                <p className="text-gray-600">
                  Rua Ivone Silva, Lote 6<br />
                  1050-124 Lisboa<br />
                  Portugal
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-pt-blue mb-1">Telefone</h3>
                <p className="text-gray-600">+351 211 140 200</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-pt-blue mb-1">Email</h3>
                <p className="text-gray-600">apoio@turismo-portugal.pt</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-pt-blue mb-1">Horário de Atendimento</h3>
                <p className="text-gray-600">Segunda a Sexta: 9h00 - 18h00</p>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h2 className="text-xl font-semibold text-pt-blue mb-4">Envie-nos uma mensagem</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input 
                      id="subject" 
                      name="subject" 
                      value={formData.subject}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-pt-blue hover:bg-pt-blue/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "A enviar..." : "Enviar Mensagem"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-6">
            <iframe
              title="Mapa"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.007284289744!2d-9.151139!3d38.735933!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd1932ff2f8c7f91%3A0x5a625e97a69d5ca9!2sTurismo%20de%20Portugal!5e0!3m2!1sen!2spt!4v1620383200000!5m2!1sen!2spt"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
