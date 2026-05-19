import { CreditCard, CheckCircle } from 'lucide-react';

export default function PaymentSection() {
  return (
    <section className="py-10 bg-[#fff500]">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center flex-shrink-0">
              <CreditCard size={24} className="text-[#fff500]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-black">Payez en plusieurs fois avec Alma</h3>
              <p className="text-sm text-black/70 mt-0.5">Étalez votre achat sur 3 ou 4 mensualités sans frais dès 100€</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Paiement sécurisé', sub: 'CB, Mastercard, Visa' },
              { label: '3x sans frais', sub: 'Dès 100€ d\'achat' },
              { label: '4x sans frais', sub: 'Dès 300€ d\'achat' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/10 px-4 py-3">
                <CheckCircle size={16} className="text-black flex-shrink-0" />
                <div>
                  <p className="font-black text-sm text-black">{item.label}</p>
                  <p className="text-xs text-black/60">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
