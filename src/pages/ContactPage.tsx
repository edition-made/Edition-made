import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendContactConfirmation, sendContactNotificationToAdmin } from '../lib/emailService';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('contact_submissions').insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      subject: form.subject || null,
      message: form.message,
      status: 'new',
    });
    const emailData = { name: form.name, email: form.email, phone: form.phone, subject: form.subject, message: form.message };
    await Promise.allSettled([
      sendContactConfirmation(emailData),
      sendContactNotificationToAdmin(emailData),
    ]);
    setSent(true);
  };

  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-4xl text-white mb-3">Contactez-nous</h1>
          <p className="text-gray-400">Notre équipe est disponible pour répondre à toutes vos questions</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-3 gap-12">
          <div>
            <h2 className="font-display font-bold text-xl mb-6">Nos coordonnées</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-black" />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">Adresse showroom</p>
                  <p className="text-sm text-gray-600">14 avenue des Canadiens<br />94410 Saint-Maurice<br />Val-de-Marne (94)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-black" />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">Téléphone</p>
                  <a href="tel:+33660222525" className="text-sm text-gray-600 hover:text-black transition-colors">06 60 22 25 25</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-black" />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">WhatsApp</p>
                  <a href="https://wa.me/33660222525" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-black transition-colors">
                    Nous écrire sur WhatsApp
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-black" />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">Email</p>
                  <a href="mailto:contact@editionmade.com" className="text-sm text-gray-600 hover:text-black transition-colors">contact@editionmade.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-black" />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">Horaires</p>
                  <p className="text-sm text-gray-600">
                    Lun–Sam : 10h00 – 19h00<br />
                    Dimanche : 10h00 – 17h00
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-display font-bold text-xl mb-6">Envoyer un message</h2>
            {sent ? (
              <div className="bg-green-50 border border-green-200 p-8 text-center">
                <div className="w-14 h-14 bg-[#fff500] mx-auto flex items-center justify-center mb-4">
                  <Check size={24} className="text-black" />
                </div>
                <h3 className="font-bold text-lg mb-2">Message envoyé !</h3>
                <p className="text-gray-600 text-sm">Nous reviendrons vers vous dans les plus brefs délais.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Nom complet *</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Téléphone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Sujet *</label>
                    <select name="subject" value={form.subject} onChange={handleChange} required className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black bg-white">
                      <option value="">Choisir un sujet</option>
                      <option>Renseignement produit</option>
                      <option>Commande en ligne</option>
                      <option>Livraison</option>
                      <option>Retrait en magasin</option>
                      <option>SAV / Retour</option>
                      <option>Autre</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows={5} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black resize-none" placeholder="Votre message..." />
                </div>
                <button type="submit" className="btn-primary">
                  <Send size={16} /> Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
