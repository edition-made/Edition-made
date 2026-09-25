import { useEffect } from 'react';
import { categories } from '../../data/categories';
import { supabase } from '../../lib/supabase';
import { useSubcategories } from '../../hooks/useSubcategories';

const READ_ONLY = {
  readOnlyHint: true,
  untrustedContentHint: false,
  consequentialHint: false,
};

function normalizeInput(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export default function WebMCPTools() {
  const { subcategories } = useSubcategories();

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return;

    const modelContext = document.modelContext || navigator.modelContext;
    if (!modelContext) return;

    const controller = new AbortController();
    const registrationOptions = { signal: controller.signal };

    const tools: WebMCPTool[] = [
      {
        name: 'editionmade.search_catalog',
        title: 'Rechercher le catalogue Edition Made',
        description: 'Recherche des meubles disponibles dans le catalogue Edition Made par nom ou description. Retourne uniquement des produits actuellement en stock avec leur prix et leur URL canonique.',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string', minLength: 1, maxLength: 100, description: 'Meuble ou caractéristique recherchée, par exemple canapé beige ou table ronde.' } },
          required: ['query'],
          additionalProperties: false,
        },
        annotations: READ_ONLY,
        async execute(input) {
          const query = normalizeInput(input.query, 100).replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim();
          if (!query) return JSON.stringify({ error: 'Une recherche est requise.' });

          const { data, error } = await supabase
            .from('products')
            .select('name, slug, category, price, original_price, discount, short_description, stock_count')
            .eq('in_stock', true)
            .gt('stock_count', 0)
            .or(`name.ilike.%${query}%,short_description.ilike.%${query}%,category.ilike.%${query}%`)
            .limit(10);

          if (error) return JSON.stringify({ error: 'Recherche momentanément indisponible.' });
          return JSON.stringify({
            query,
            results: (data || []).map(product => ({ ...product, url: `https://editionmade.com/produit/${product.slug}` })),
          });
        },
      },
      {
        name: 'editionmade.get_product',
        title: 'Consulter un produit Edition Made',
        description: 'Retourne les informations publiques à jour d’un produit à partir de son slug : prix, remise, description, dimensions, matière, couleurs et stock.',
        inputSchema: {
          type: 'object',
          properties: { slug: { type: 'string', minLength: 1, maxLength: 120, pattern: '^[a-z0-9-]+$' } },
          required: ['slug'],
          additionalProperties: false,
        },
        annotations: READ_ONLY,
        async execute(input) {
          const slug = normalizeInput(input.slug, 120).toLowerCase();
          if (!/^[a-z0-9-]+$/.test(slug)) return JSON.stringify({ error: 'Slug produit invalide.' });

          const { data, error } = await supabase
            .from('products')
            .select('name, slug, category, price, original_price, discount, short_description, description, dimensions, material, colors, in_stock, stock_count, brand')
            .eq('slug', slug)
            .maybeSingle();

          if (error) return JSON.stringify({ error: 'Consultation momentanément indisponible.' });
          if (!data) return JSON.stringify({ error: 'Produit introuvable.' });
          return JSON.stringify({ ...data, available: data.in_stock && (data.stock_count ?? 0) > 0, url: `https://editionmade.com/produit/${data.slug}` });
        },
      },
      {
        name: 'editionmade.list_categories',
        title: 'Lister les univers Edition Made',
        description: 'Liste les catégories et sous-catégories publiques du catalogue Edition Made avec leurs URL canoniques.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: READ_ONLY,
        execute() {
          return JSON.stringify(categories.map(category => ({
            name: category.name,
            description: category.description,
            url: `https://editionmade.com/categorie/${category.slug}`,
            subcategories: subcategories
              .filter(subcategory => subcategory.parentSlug === category.slug)
              .map(subcategory => ({
              name: subcategory.name,
              url: `https://editionmade.com/categorie/${category.slug}/${subcategory.slug}`,
              })),
          })));
        },
      },
      {
        name: 'editionmade.calculate_delivery',
        title: 'Calculer les frais de livraison Edition Made',
        description: 'Calcule les frais de livraison et le total à payer à partir du montant des produits. Le retrait en magasin est gratuit.',
        inputSchema: {
          type: 'object',
          properties: {
            subtotal: { type: 'number', minimum: 0, description: 'Montant total des produits en euros.' },
            deliveryMode: { type: 'string', enum: ['delivery', 'pickup'], description: 'Livraison à domicile ou retrait gratuit en magasin.' },
          },
          required: ['subtotal', 'deliveryMode'],
          additionalProperties: false,
        },
        annotations: READ_ONLY,
        execute(input) {
          const subtotal = typeof input.subtotal === 'number' && Number.isFinite(input.subtotal)
            ? Math.max(0, input.subtotal)
            : 0;
          const pickup = input.deliveryMode === 'pickup';
          const deliveryCost = pickup ? 0
            : subtotal < 50 ? 6.9
              : subtotal < 300 ? 29
                : subtotal < 1000 ? 99
                  : subtotal < 2000 ? 129
                    : 0;
          return JSON.stringify({
            subtotal,
            deliveryMode: pickup ? 'pickup' : 'delivery',
            deliveryCost,
            total: subtotal + deliveryCost,
            currency: 'EUR',
          });
        },
      },
      {
        name: 'editionmade.get_store_information',
        title: 'Informations du showroom Edition Made',
        description: 'Retourne l’adresse, les horaires, les coordonnées et les services du showroom Edition Made à Saint-Maurice.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: READ_ONLY,
        execute() {
          return JSON.stringify({
            name: 'Edition Made',
            address: '14 avenue des Canadiens, 94410 Saint-Maurice, France',
            openingHours: { mondayToSaturday: '10:00–18:30', sunday: '14:00–18:30' },
            phone: '+33 6 60 22 25 25',
            email: 'contact@editionmade.com',
            showroomSize: '500 m²',
            services: ['Conseils personnalisés', 'Retrait gratuit', 'Parking gratuit', 'Essai des meubles exposés'],
            url: 'https://editionmade.com/magasin',
          });
        },
      },
    ];

    for (const tool of tools) {
      void modelContext.registerTool(tool, registrationOptions).catch(() => undefined);
    }

    return () => controller.abort();
  }, [subcategories]);

  return null;
}
