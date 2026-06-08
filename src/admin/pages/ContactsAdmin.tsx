import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone, Check, Archive, Eye, Trash2 } from 'lucide-react';
import { supabase, DbContactSubmission } from '../../lib/supabase';

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Nouveau', color: 'bg-[#fff500]/20 text-[#fff500] border border-[#fff500]/30' },
  read: { label: 'Lu', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  replied: { label: 'Répondu', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  archived: { label: 'Archivé', color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState<DbContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DbContactSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    let q = supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    if (filterStatus) q = q.eq('status', filterStatus);
    const { data } = await q;
    setContacts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('contact_submissions').update({ status }).eq('id', id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status: status as any } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: status as any } : null);
  };

  const openContact = async (contact: DbContactSubmission) => {
    setSelected(contact);
    if (contact.status === 'new') await updateStatus(contact.id, 'read');
  };

  const deleteContact = async (id: string) => {
    await supabase.from('contact_submissions').delete().eq('id', id);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const newCount = contacts.filter(c => c.status === 'new').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Contacts</h1>
          <p className="text-gray-500 text-sm">
            {contacts.length} message{contacts.length !== 1 ? 's' : ''}
            {newCount > 0 && <span className="ml-2 bg-[#fff500] text-black text-xs font-black px-1.5 py-0.5">{newCount} nouveau{newCount > 1 ? 'x' : ''}</span>}
          </p>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/15 text-gray-300 text-sm px-3 py-2 focus:outline-none focus:border-[#fff500]">
          <option value="">Tous</option>
          {Object.entries(statusConfig).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">Aucun message</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
            {contacts.map(contact => (
              <div
                key={contact.id}
                onClick={() => openContact(contact)}
                className={`p-4 cursor-pointer transition-all border ${selected?.id === contact.id ? 'border-[#fff500] bg-[#fff500]/5' : 'border-white/10 bg-black/40 hover:border-white/20'} ${contact.status === 'new' ? 'border-l-2 border-l-[#fff500]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 flex items-center justify-center text-xs font-black flex-shrink-0 ${contact.status === 'new' ? 'bg-[#fff500] text-black' : 'bg-white/10 text-white'}`}>
                      {contact.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${contact.status === 'new' ? 'text-white' : 'text-gray-300'}`}>{contact.name}</p>
                      <p className="text-gray-600 text-[10px]">{contact.email}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 flex-shrink-0 ${statusConfig[contact.status]?.color}`}>
                    {statusConfig[contact.status]?.label}
                  </span>
                </div>
                {contact.subject && <p className="text-gray-400 text-xs font-medium mb-1">{contact.subject}</p>}
                <p className="text-gray-600 text-[10px] line-clamp-2">{contact.message}</p>
                <p className="text-gray-700 text-[10px] mt-1">{new Date(contact.created_at).toLocaleString('fr-FR')}</p>
              </div>
            ))}
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            {selected ? (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-lg text-white">{selected.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Mail size={11} />{selected.email}</span>
                      {selected.phone && <span className="flex items-center gap-1"><Phone size={11} />{selected.phone}</span>}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 ${statusConfig[selected.status]?.color}`}>
                    {statusConfig[selected.status]?.label}
                  </span>
                </div>
                {selected.subject && (
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Sujet</p>
                    <p className="text-sm text-white font-semibold">{selected.subject}</p>
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Message</p>
                  <div className="bg-white/5 p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>
                <p className="text-gray-600 text-xs mb-5">
                  Reçu le {new Date(selected.created_at).toLocaleString('fr-FR')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Votre message Edition Made'}`}
                    className="flex items-center gap-1.5 bg-[#fff500] text-black px-3 py-2 text-xs font-bold hover:bg-[#e6dc00] transition-colors">
                    <Mail size={12} /> Répondre par email
                  </a>
                  <button onClick={() => updateStatus(selected.id, 'replied')}
                    className="flex items-center gap-1.5 bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-2 text-xs font-bold hover:bg-green-500/30 transition-colors">
                    <Check size={12} /> Marquer répondu
                  </button>
                  <button onClick={() => updateStatus(selected.id, 'archived')}
                    className="flex items-center gap-1.5 bg-white/10 text-gray-400 px-3 py-2 text-xs font-bold hover:bg-white/20 transition-colors">
                    <Archive size={12} /> Archiver
                  </button>
                  {confirmDeleteId === selected.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-400">Confirmer ?</span>
                      <button onClick={() => { deleteContact(selected.id); setConfirmDeleteId(null); }}
                        className="bg-red-500 text-white px-2 py-2 text-xs font-bold hover:bg-red-600 transition-colors">
                        Oui
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="bg-white/10 text-gray-400 px-2 py-2 text-xs font-bold hover:bg-white/20 transition-colors">
                        Non
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(selected.id)}
                      className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-2 text-xs font-bold hover:bg-red-500/20 transition-colors ml-auto">
                      <Trash2 size={12} /> Supprimer
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Eye size={32} className="text-gray-700 mb-2" />
                <p className="text-gray-500 text-sm">Sélectionnez un message</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
