import { Product, ProductFilterOptions, ProductVariant } from '../types';
import { config, getIntegrationState } from './config';

/**
 * Authentic DRAYEN Atelier Vault Catalogue
 * Genuine handcrafted gothic talismans, necklaces, and chains.
 */
export const AUTHENTIC_DRAYEN_CATALOGUE: Product[] = [
  {
    id: 'prod-noctis-cross',
    sku: 'DRY-PT-0925',
    name: 'Noctis Cross',
    slug: 'noctis-cross',
    short_description: 'Antique Silver / 316L Stainless Steel',
    full_description: 'A sculpted gothic cross forged from solid 316L surgical stainless steel with antique oxidised silver plating. Featuring a center onyx-toned stone and carved dagger tips engineered to evoke nocturnal sanctuary and unyielding poise.',
    category: 'Pendants',
    selling_price_paise: 69900,
    original_price_paise: 99900,
    material: '316L Surgical Grade Steel',
    finish: 'Antique Silver (.925 Look)',
    chain_length: '20 INCH (50CM)',
    chain_thickness: '3mm Rounded Box Chain',
    pendant_height: '42mm',
    pendant_width: '26mm',
    pendant_thickness: '3.5mm Solid Core',
    pendant_weight: '18 Grams',
    clasp_type: 'Heavy-duty Lobster Clasp',
    is_detachable: true,
    care_instructions: 'Rinse with lukewarm water and mild soap, then wipe dry with microfiber cloth. Avoid harsh chemical dips.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6w9gOeyG27cQOZhDmzgc4ODnlRYUYP9iDfZXcr30vxRrfhuoEhqalXoAVQHXb1zAEGJCHrqH-DGcsTvsNLieUQ7vS6mjkDd2zMZFTZcmViakL6coICC6DwuX9erR2-4QmZ70Yx78DscyKzAq0BAtFbIBSTvYkipTUeRqFxpx8ApXqUVQ_yA0PCcqKBxxiMbQGxDad-tAI3LveI1HCCvCAG1dFi_bVQO7kqxhWIUFC9qxGuz5I8ZUm',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApYnUOnOu8Uq4xeFgwqe9EPoFs1n8GCsMmGuDN9ho5-BgxTQ3DmVGqstFTtoJCs9evn4wZByYIhqhziHKO3qrQ2SXeBOH5rsjua1TUG-ZYXMVkzGqu8x1_0oTEV3P6TfPrzMLaiAJYgl47TqvpuZ8i1tIX822bm2EMURSPN19jFp2sFuGAprzySjAW3mkCtRjN8N_sq7lcb8YwgxlDO6iDQw3hqVRC_gdUkMihgUpfL1N9CM6efKff',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4I9ON45vMzPCMiG08DCX1Mv5CGE1zqecAgEVaMN6TLrxFcZtzIUCjNAiz2ftK3xIzBxZFZJWPMPCQXLm_YIn2eM4hAwdpChnqN_z-GANKgjoSZ4SHDxT4QEkA78sxWZPDxUowLZZdCJvSY5FR-rB5zWmzaGgLMAM0IdBwgywF2NOZpIu-aI3_5f9qbLz1oz3B_7rHmQKWKyUxCQYEYxFUCFao1HenQfl6iX6zDo5MdwEnbmbiKP-z',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJHAljTTxn9uLCzVkvBjBcqTqy_xL7U9auKsF6RAWp3vVyodkzEX3qalu_gpHmYljFDtnXfRcBYdfTlv9zyhdvwzBikozQer243PjDH3Z7YzexHKhzAlGBQ6fBgcImdxRY42dm5Pr6IrnyL_ZxI1gNv4-dPTW3qBMK7i0XRfKLtrT7WysCyf68rn0Jcav2SDlUOVaeHwiCc775q6K3j_mIcsZcrIFAUlUCcPKDZ_AT6d-cMfwfAZOg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApBfidCjyKlnNc-XwhQk4jS4Chm0gQb4XbrB1tVP2lypIXBbbRYtvCy3FyTtypaMpBX70_jS4XVoqGV6kQ-DypMpMXMy-MzLz_HygPndxVKkvHFfoSI18LxqG_YIjm-yqwHJPryjJ0RNXdXDsgQhHj7JIBCupEX8j4jvefZpZpYYogsqQ0K5zmKjMqlMJhvgyZhxfayznVBkBw1BYUbSefkj3rXKM2_2f2GwEQbgtaJE6YoeMPMb9g',
    ],
    variants: [
      { type: 'finish', options: ['Antique Silver', 'Obsidian Black'] },
      { type: 'length', options: ['18 INCH (45CM)', '20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ],
    stock_quantity: 24,
    is_published: 1,
  },
  {
    id: 'prod-deaths-grasp',
    sku: 'DRY-PT-0418',
    name: "Death's Grasp",
    slug: 'deaths-grasp',
    short_description: 'Oxidized Pewter / Steel Sculptural Talisman',
    full_description: 'Intricate skeletal hand gripping a black onyx sphere pendant in aged oxidized silver on heavy rolo chain. Stark studio noir aesthetic designed for alternative expression.',
    category: 'Pendants',
    selling_price_paise: 59900,
    original_price_paise: 79900,
    material: 'Oxidized Pewter & 316L Steel',
    finish: 'Dual Finish Oxidized',
    chain_length: '22 INCH (55CM)',
    chain_thickness: '3.5mm Heavy Rolo',
    pendant_height: '38mm',
    pendant_width: '22mm',
    pendant_thickness: '12mm Orb Depth',
    pendant_weight: '21 Grams',
    clasp_type: 'Reinforced Lobster Clasp',
    is_detachable: true,
    care_instructions: 'Clean with dry microfiber cloth. Avoid saltwater immersion.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCa2c9_wt2xbZE0zCFiYvcGvhzp_er3eNVW2DLcAJnJWGpvBs_R-bp8KcIxT8X6_HrJrIMDWXLJlBT4dgCgFaM4Kp9H56-1Flg9Yog41fB0jHEtWOnyBjVmDqEx6wYQcbBhkTGvuXA2Aw9lxzWV3M1EX_We8ImlFLI-FjgRzQLrWYACKm3A5VcCyN87BNnE9S0_mB0q6_mESQeHKbjgu88k_qzspfjBlquwzXhh3G_bHiigv9AqPIvr',
    ],
    variants: [
      { type: 'finish', options: ['Aged Silver / Black Orb'] },
      { type: 'length', options: ['20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ],
    stock_quantity: 15,
    is_published: 1,
  },
  {
    id: 'prod-obsidian-fang',
    sku: 'DRY-PT-0294',
    name: 'Obsidian Fang',
    slug: 'obsidian-fang',
    short_description: 'Obsidian Gem / .925 Cap Geometric Tooth',
    full_description: 'Carved genuine black obsidian fang capped with an ornate gothic silver serpent fitting, suspended on dark curb chain against nocturnal shadows.',
    category: 'Pendants',
    selling_price_paise: 49900,
    original_price_paise: 64900,
    material: 'Natural Obsidian Gem & .925 Cap',
    finish: 'Obsidian Black PVD / Antique Silver',
    chain_length: '20 INCH (50CM)',
    chain_thickness: '2.5mm Gunmetal Box Chain',
    pendant_height: '45mm',
    pendant_width: '14mm',
    pendant_thickness: '10mm',
    pendant_weight: '14 Grams',
    clasp_type: 'Spring Ring Clasp',
    is_detachable: true,
    care_instructions: 'Handle with care; genuine stone can chip if dropped against granite.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBItirQNpQc_qEkU6499wR0Mki-qKDZigzw0y4-yiZybOsSRJ5Wju0aZVrH45eJdlym1mZLNROjYOT92nCc-H98FVLsiRvQaFPaE_voiwi_syTu-PxSlChC_Sc3FeRPyjvz9LYlNeEPKfSaRgOanalfI2VBGTVGlZIGJrveYdzcgO2gWYivFHiPVOBgroMygm3SMajA6eAR3On3Tac_itSbsML28V_I9rsyieFwlyvQ9fPwGaFvfGA6',
    ],
    variants: [
      { type: 'finish', options: ['Matte Black PVD'] },
      { type: 'length', options: ['18 INCH (45CM)', '20 INCH (50CM)', '22 INCH (55CM)'] },
    ],
    stock_quantity: 18,
    is_published: 1,
  },
  {
    id: 'prod-shadow-relic',
    sku: 'DRY-PT-0112',
    name: 'Shadow Relic',
    slug: 'shadow-relic',
    short_description: 'Heavy Cast Stainless Alloy Occult Medallion',
    full_description: 'Micro gothic medallion with embossed baroque skull motif framed in antiqued braided silver wire, centered on black fabric.',
    category: 'Pendants',
    selling_price_paise: 39900,
    original_price_paise: 54900,
    material: '316L Stainless Steel',
    finish: 'Aged Steel Antique Patina',
    chain_length: '20 INCH (50CM)',
    chain_thickness: '3mm Steel Wheat Chain',
    pendant_height: '30mm',
    pendant_width: '30mm Diameter',
    pendant_thickness: '3mm',
    pendant_weight: '16 Grams',
    clasp_type: 'Lobster Clasp',
    is_detachable: true,
    care_instructions: '100% waterproof and sweat-resistant.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBo9M1dW_lJiNmkMimlv7Ehd0nmvhXqWvBQty9v5_MVknm9jessA0_sGsCeK1YXgeGswTQGW79eTudocr5sG8pqXp5cEGx0zF9E7VENEvubnLXFUXphfeFuSpNfV5qe34vnf2mSmvVjgrjPDa17aspFA8QD1en12AtB1ksQ0VMQfoAeRIxrVUPHYy8lyTFxLSD8B3kpg1UnybKcC-iWJb9F1UrbhNmN8Ntm9B7zyJGHV4xcxAgeJdZN',
    ],
    variants: [
      { type: 'finish', options: ['Aged Steel'] },
      { type: 'length', options: ['18 INCH (45CM)', '20 INCH (50CM)', '24 INCH (60CM)'] },
    ],
    stock_quantity: 30,
    is_published: 1,
  },
  {
    id: 'prod-vampiric-thorn-choker',
    sku: 'DRY-NK-0831',
    name: 'Vampiric Thorn Choker',
    slug: 'vampiric-thorn-choker',
    short_description: 'Heavy Choker Collar Statement Piece',
    full_description: 'Intricate sharp thorn wire gothic choker collar in antique polished silver worn close against black collarbone, dark moody backdrop.',
    category: 'Gothic Necklaces',
    selling_price_paise: 89900,
    original_price_paise: 129900,
    material: 'Solid 316L Marine Stainless Steel',
    finish: 'Polished Chrome with Blackened Crevices',
    chain_length: '16-18 INCH Adjustable Choker',
    chain_thickness: '6mm Thorn Cluster',
    pendant_height: 'Collar Choker Form',
    pendant_width: 'N/A',
    pendant_thickness: '4mm',
    pendant_weight: '42 Grams Heavy Cast',
    clasp_type: 'Dual Tension Hook Clasp',
    is_detachable: false,
    care_instructions: 'Wipe with soft cloth. Avoid crushing under heavy loads.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRVrqAYSujc3CsfGPFnzETR0sqOVj83aPVnffq9Js3nfaIAsW905xPetstOVolmYB4NJZJQRECtwt_lbZ5l3FQYtNNA7V1KavvJtnaaT4HBm0iCf7sOvIEMbrury-N3DrWZGJ9olCPFwUZcP38UwVqB2Kw3PMd4AflcSDlWXH8YPKMUNSlr5GyEKbTXyOPWInAQH9VKJlOtzxoLgD_2g86bwENqkZ4qjaLFalFffi63qoU-7tRG2we',
    ],
    variants: [
      { type: 'length', options: ['16 INCH (40CM)', '18 INCH (45CM)'] },
    ],
    stock_quantity: 10,
    is_published: 1,
  },
  {
    id: 'prod-ankh-of-ruin',
    sku: 'DRY-PT-0552',
    name: 'Ankh of Ruin',
    slug: 'ankh-of-ruin',
    short_description: 'Pendant & 24" Chain Artifact Talisman',
    full_description: 'Distressed gothic Egyptian Ankh key talisman pendant with blackened engravings on heavy curb chain, dramatic chiaroscuro side lighting.',
    category: 'Pendants',
    selling_price_paise: 54900,
    original_price_paise: 74900,
    material: '316L Surgical Grade Steel',
    finish: 'Antique Silver (.925 Look)',
    chain_length: '24 INCH (60CM)',
    chain_thickness: '3.5mm Heavy Curb',
    pendant_height: '52mm',
    pendant_width: '28mm',
    pendant_thickness: '3mm',
    pendant_weight: '19 Grams',
    clasp_type: 'Lobster Clasp',
    is_detachable: true,
    care_instructions: 'Rinse with clean water; resistant to corrosion.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCgNwYashlTRlrttK9FKU9E6e9VT47FGiJimvjlxMtNNJb5rFRr1xlOWhZnTflTCpmECK9QWrTUyJlfi-s8Fn5DTY59mHtNR6DEdk-rnFzJmNu7AP_RsvupzCTOTtpqIlg-4owNWYtjHyv4HoffOcovREDzUzAk8tqApiIsSAXlwutW93HLShz8Xcqv97Zse12hpPMtILBc2GHWusxxLte_tkGhq5hV3q_FlST8XccwRbC-benF5zSh',
    ],
    variants: [
      { type: 'finish', options: ['Antique Silver'] },
      { type: 'length', options: ['20 INCH (50CM)', '24 INCH (60CM)'] },
    ],
    stock_quantity: 14,
    is_published: 1,
  },
  {
    id: 'prod-serpent-ribs-chain',
    sku: 'DRY-NK-0720',
    name: 'Serpent Ribs Chain',
    slug: 'serpent-ribs-chain',
    short_description: 'Articulated Rib Links Vertebrae Chain',
    full_description: 'Sculptural serpentine backbone rib segment chain links in antiqued silver laid over black stone background, reflective silver sheen.',
    category: 'Gothic Necklaces',
    selling_price_paise: 74900,
    original_price_paise: 94900,
    material: 'Solid 316L Stainless Steel',
    finish: 'Gunmetal / Silver Dual Patina',
    chain_length: '22 INCH (55CM)',
    chain_thickness: '5mm Articulated Vertebrae',
    pendant_height: 'Chain Link Form',
    pendant_width: 'N/A',
    pendant_thickness: '5mm',
    pendant_weight: '36 Grams',
    clasp_type: 'Custom O-Ring Skull Clasp',
    is_detachable: false,
    care_instructions: 'Safe in sea water, sweat, and showers.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCnS0D37PNRCzU4I3bYVkdmcbj755Ep-fm621DdOsBAfiHS-fGVLw_iZRGqviE5XV6wYCr6NjyXGSZMnrvNNSkMikJl5dGZk-zjf8gdj7gO6DfAK8AXfCZ0io5wcK9zmFHdwa5Jwt23ltSVJLH-brY4h-Hu5W2I83YxgcqZOA5w6TyO8FgVeGIhNMcvL8LiLcJ9b9UjUvpGizqLoU4HbwDDDPHTYA-gCyqS1x72w9akHyDq4yVIFWJG',
    ],
    variants: [
      { type: 'length', options: ['20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ],
    stock_quantity: 20,
    is_published: 1,
  },
  {
    id: 'prod-abyssal-dagger-pendant',
    sku: 'DRY-PT-0629',
    name: 'Abyssal Dagger Pendant',
    slug: 'abyssal-dagger-pendant',
    short_description: 'Blade Amulet Oxidized Silver Stiletto',
    full_description: 'Stunning gothic dagger stiletto pendant with ornate hilt and razor sharp blade resting on coarse black volcanic rock, silver and dark steel reflections.',
    category: 'Pendants',
    selling_price_paise: 62900,
    original_price_paise: 85000,
    material: '316L Surgical Stainless Steel',
    finish: 'Oxidized Silver & Brushed Steel',
    chain_length: '22 INCH (55CM)',
    chain_thickness: '3mm Wheat Chain',
    pendant_height: '56mm',
    pendant_width: '18mm Hilt',
    pendant_thickness: '4mm',
    pendant_weight: '20 Grams',
    clasp_type: 'Lobster Clasp',
    is_detachable: true,
    care_instructions: 'Wipe dry after exposure to elements.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD3LUOuIFiAhMrpJ7mBhvQnXW8urF6seBlYbWVvGo1LRJRBAWPaCeghOKleYaFulFHJIo_eyzvv5H02eQgLfs9UqzkL2VqGzoXcyOiFRwPUCE8k4kHnu7f2gzpNBzcEhd9oFHzoVwd14Vh2zDqqNMxNRgdjzH5XrzEKuzLsItHwrnocC_vgueqIkhIre_plhaUU65GQNpy7QsRjNZYN-3E6JvXLyaI33nwL2sgGxAgL6SvNaFQnjjOH',
    ],
    variants: [
      { type: 'finish', options: ['Oxidized Silver'] },
      { type: 'length', options: ['20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ],
    stock_quantity: 12,
    is_published: 1,
  },
];

export interface CatalogueService {
  getProducts(filters?: ProductFilterOptions): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  getCategories(): Promise<string[]>;
  searchProducts(query: string, filters?: ProductFilterOptions): Promise<Product[]>;
  getAvailableVariants(productId: string): Promise<ProductVariant[]>;
}

export const catalogueService: CatalogueService = {
  async getProducts(filters?: ProductFilterOptions): Promise<Product[]> {
    // If backend is configured, attempt backend retrieval
    if (config.isBackendConnected) {
      try {
        const queryParams = new URLSearchParams();
        if (filters?.category && filters.category !== 'All') queryParams.set('category', filters.category);
        if (filters?.search) queryParams.set('search', filters.search);
        if (filters?.minPricePaise) queryParams.set('minPrice', String(filters.minPricePaise));
        if (filters?.maxPricePaise) queryParams.set('maxPrice', String(filters.maxPricePaise));
        if (filters?.sortBy) queryParams.set('sort', filters.sortBy);

        const res = await fetch(`${config.apiBaseUrl}/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          return json;
        }
      } catch (err) {
        console.warn('[CatalogueService] Backend fetch failed, falling back to local store repository:', err);
      }
    }

    // Default authoritative store repository
    let results = [...AUTHENTIC_DRAYEN_CATALOGUE];

    if (filters?.category && filters.category !== 'All') {
      const target = filters.category.toLowerCase().trim();
      results = results.filter((p) => {
        const cat = p.category.toLowerCase().trim();
        if (target === 'necklaces') return cat.includes('necklace') || cat.includes('choker') || cat.includes('chain');
        if (target === 'pendants') return cat.includes('pendant');
        if (target === 'chains') return cat.includes('chain') || cat.includes('necklace');
        if (target === 'chokers') return cat.includes('choker');
        if (target === 'statement pieces') return cat.includes('statement') || p.name.includes('Thorn') || p.name.includes('Serpent');
        return cat === target;
      });
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q) ||
          p.finish.toLowerCase().includes(q) ||
          (p.short_description && p.short_description.toLowerCase().includes(q))
      );
    }

    if (filters?.minPricePaise != null) {
      results = results.filter((p) => p.selling_price_paise >= filters.minPricePaise!);
    }

    if (filters?.maxPricePaise != null) {
      results = results.filter((p) => p.selling_price_paise <= filters.maxPricePaise!);
    }

    if (filters?.inStockOnly) {
      results = results.filter((p) => p.stock_quantity > 0);
    }

    if (filters?.material) {
      results = results.filter((p) => p.material.toLowerCase().includes(filters.material!.toLowerCase()));
    }

    if (filters?.finish) {
      results = results.filter((p) => p.finish.toLowerCase().includes(filters.finish!.toLowerCase()));
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          results.sort((a, b) => a.selling_price_paise - b.selling_price_paise);
          break;
        case 'price-desc':
          results.sort((a, b) => b.selling_price_paise - a.selling_price_paise);
          break;
        case 'name-asc':
          results.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'newest':
        default:
          break;
      }
    }

    return results;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (config.isBackendConnected) {
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/products/${encodeURIComponent(slug)}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[CatalogueService] Backend fetch failed for slug:', slug, err);
      }
    }

    return AUTHENTIC_DRAYEN_CATALOGUE.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) || null;
  },

  async getProductById(id: string): Promise<Product | null> {
    return AUTHENTIC_DRAYEN_CATALOGUE.find((p) => p.id === id) || null;
  },

  async getCategories(): Promise<string[]> {
    return ['All', 'Necklaces', 'Pendants', 'Chains', 'Chokers', 'Statement Pieces'];
  },

  async searchProducts(query: string, filters?: ProductFilterOptions): Promise<Product[]> {
    return this.getProducts({ ...filters, search: query });
  },

  async getAvailableVariants(productId: string): Promise<ProductVariant[]> {
    const product = await this.getProductById(productId);
    return product?.variants || [];
  },
};
