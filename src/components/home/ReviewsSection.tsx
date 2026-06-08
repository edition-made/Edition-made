import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    id: 1,
    author: 'Marie L.',
    location: 'Paris 15ème',
    rating: 5,
    date: 'Mars 2024',
    comment: 'Canapé magnifique reçu en parfait état. La qualité est vraiment au rendez-vous pour ce prix. Je recommande Edition Made les yeux fermés !',
    product: 'Canapé Oslo 3 places',
  },
  {
    id: 2,
    author: 'Thomas B.',
    location: 'Saint-Maurice (94)',
    rating: 5,
    date: 'Février 2024',
    comment: "Showroom impressionnant, très bien achalandé. J'ai trouvé ma table en chêne massif à -45%, c'est une vraie bonne affaire. Équipe très professionnelle.",
    product: 'Table Stockholm 180cm',
  },
  {
    id: 3,
    author: 'Sophie M.',
    location: 'Créteil (94)',
    rating: 5,
    date: 'Janvier 2024',
    comment: "Livraison rapide, matelas exceptionnel. Après 3 mois d'utilisation je confirme que le rapport qualité/prix est imbattable. Bravo Edition Made.",
    product: 'Matelas Prestige Memory Foam',
  },
  {
    id: 4,
    author: 'Pierre D.',
    location: 'Vincennes (94)',
    rating: 4,
    date: 'Mars 2024',
    comment: 'Très bons produits, prix vraiment attractifs. Le salon de jardin est superbe, costaud et bien fait. Retrait en magasin très pratique.',
    product: 'Salon Jardin Ibiza',
  },
];

export default function ReviewsSection() {
  const averageRating = 4.8;
  const totalReviews = 847;

  return (
    <section className="py-16 bg-black">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl text-white mb-2">
            Ce que disent nos clients
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={20} className="text-[#fff500] fill-[#fff500]" />
              ))}
            </div>
            <span className="font-black text-2xl text-white">{averageRating}/5</span>
            <span className="text-gray-400 text-sm">basé sur {totalReviews} avis vérifiés</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map(review => (
            <div
              key={review.id}
              className="bg-white/5 border border-white/10 p-5 relative hover:border-[#fff500]/50 transition-colors"
            >
              <Quote size={24} className="text-[#fff500] mb-3" />
              <div className="flex mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= review.rating ? 'text-[#fff500] fill-[#fff500]' : 'text-gray-600 fill-gray-600'}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">"{review.comment}"</p>
              <div className="border-t border-white/10 pt-3">
                <p className="font-bold text-sm text-white">{review.author}</p>
                <p className="text-xs text-gray-500">{review.location} — {review.date}</p>
                <p className="text-xs text-[#fff500]/60 mt-1 italic">{review.product}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Avis vérifiés par nos clients.{' '}
            <span className="font-semibold text-white">+{totalReviews} avis</span>{' '}
            sur l'ensemble de nos produits.
          </p>
        </div>
      </div>
    </section>
  );
}
