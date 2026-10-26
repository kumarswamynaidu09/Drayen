import { db } from './db';
import crypto from 'node:crypto';

export interface SeedProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  short_description: string;
  full_description: string;
  category: string;
  selling_price_paise: number;
  original_price_paise?: number;
  material: string;
  finish: string;
  chain_length?: string;
  chain_thickness?: string;
  pendant_height?: string;
  pendant_width?: string;
  pendant_thickness?: string;
  pendant_weight?: string;
  clasp_type?: string;
  is_detachable?: number;
  care_instructions?: string;
  images_json: string;
  variants_json: string;
  stock_quantity: number;
  is_published: number;
}

export const ATELIER_CATALOGUE_PIECES: SeedProduct[] = [
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
    is_detachable: 1,
    care_instructions: 'Rinse with lukewarm water and mild soap, then wipe dry with microfiber cloth. Avoid harsh chemical dips.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6w9gOeyG27cQOZhDmzgc4ODnlRYUYP9iDfZXcr30vxRrfhuoEhqalXoAVQHXb1zAEGJCHrqH-DGcsTvsNLieUQ7vS6mjkDd2zMZFTZcmViakL6coICC6DwuX9erR2-4QmZ70Yx78DscyKzAq0BAtFbIBSTvYkipTUeRqFxpx8ApXqUVQ_yA0PCcqKBxxiMbQGxDad-tAI3LveI1HCCvCAG1dFi_bVQO7kqxhWIUFC9qxGuz5I8ZUm',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApYnUOnOu8Uq4xeFgwqe9EPoFs1n8GCsMmGuDN9ho5-BgxTQ3DmVGqstFTtoJCs9evn4wZByYIhqhziHKO3qrQ2SXeBOH5rsjua1TUG-ZYXMVkzGqu8x1_0oTEV3P6TfPrzMLaiAJYgl47TqvpuZ8i1tIX822bm2EMURSPN19jFp2sFuGAprzySjAW3mkCtRjN8N_sq7lcb8YwgxlDO6iDQw3hqVRC_gdUkMihgUpfL1N9CM6efKff',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4I9ON45vMzPCMiG08DCX1Mv5CGE1zqecAgEVaMN6TLrxFcZtzIUCjNAiz2ftK3xIzBxZFZJWPMPCQXLm_YIn2eM4hAwdpChnqN_z-GANKgjoSZ4SHDxT4QEkA78sxWZPDxUowLZZdCJvSY5FR-rB5zWmzaGgLMAM0IdBwgywF2NOZpIu-aI3_5f9qbLz1oz3B_7rHmQKWKyUxCQYEYxFUCFao1HenQfl6iX6zDo5MdwEnbmbiKP-z',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJHAljTTxn9uLCzVkvBjBcqTqy_xL7U9auKsF6RAWp3vVyodkzEX3qalu_gpHmYljFDtnXfRcBYdfTlv9zyhdvwzBikozQer243PjDH3Z7YzexHKhzAlGBQ6fBgcImdxRY42dm5Pr6IrnyL_ZxI1gNv4-dPTW3qBMK7i0XRfKLtrT7WysCyf68rn0Jcav2SDlUOVaeHwiCc775q6K3j_mIcsZcrIFAUlUCcPKDZ_AT6d-cMfwfAZOg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApBfidCjyKlnNc-XwhQk4jS4Chm0gQb4XbrB1tVP2lypIXBbbRYtvCy3FyTtypaMpBX70_jS4XVoqGV6kQ-DypMpMXMy-MzLz_HygPndxVKkvHFfoSI18LxqG_YIjm-yqwHJPryjJ0RNXdXDsgQhHj7JIBCupEX8j4jvefZpZpYYogsqQ0K5zmKjMqlMJhvgyZhxfayznVBkBw1BYUbSefkj3rXKM2_2f2GwEQbgtaJE6YoeMPMb9g',
    ]),
    variants_json: JSON.stringify([
      { type: 'finish', options: ['Antique Silver', 'Obsidian Black'] },
      { type: 'length', options: ['18 INCH (45CM)', '20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ]),
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
    is_detachable: 1,
    care_instructions: 'Clean with dry microfiber cloth. Avoid saltwater immersion.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCa2c9_wt2xbZE0zCFiYvcGvhzp_er3eNVW2DLcAJnJWGpvBs_R-bp8KcIxT8X6_HrJrIMDWXLJlBT4dgCgFaM4Kp9H56-1Flg9Yog41fB0jHEtWOnyBjVmDqEx6wYQcbBhkTGvuXA2Aw9lxzWV3M1EX_We8ImlFLI-FjgRzQLrWYACKm3A5VcCyN87BNnE9S0_mB0q6_mESQeHKbjgu88k_qzspfjBlquwzXhh3G_bHiigv9AqPIvr',
    ]),
    variants_json: JSON.stringify([
      { type: 'finish', options: ['Aged Silver / Black Orb'] },
      { type: 'length', options: ['20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ]),
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
    is_detachable: 1,
    care_instructions: 'Handle with care; genuine stone can chip if dropped against granite.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBItirQNpQc_qEkU6499wR0Mki-qKDZigzw0y4-yiZybOsSRJ5Wju0aZVrH45eJdlym1mZLNROjYOT92nCc-H98FVLsiRvQaFPaE_voiwi_syTu-PxSlChC_Sc3FeRPyjvz9LYlNeEPKfSaRgOanalfI2VBGTVGlZIGJrveYdzcgO2gWYivFHiPVOBgroMygm3SMajA6eAR3On3Tac_itSbsML28V_I9rsyieFwlyvQ9fPwGaFvfGA6',
    ]),
    variants_json: JSON.stringify([
      { type: 'finish', options: ['Matte Black PVD'] },
      { type: 'length', options: ['18 INCH (45CM)', '20 INCH (50CM)', '22 INCH (55CM)'] },
    ]),
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
    is_detachable: 1,
    care_instructions: '100% waterproof and sweat-resistant.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBo9M1dW_lJiNmkMimlv7Ehd0nmvhXqWvBQty9v5_MVknm9jessA0_sGsCeK1YXgeGswTQGW79eTudocr5sG8pqXp5cEGx0zF9E7VENEvubnLXFUXphfeFuSpNfV5qe34vnf2mSmvVjgrjPDa17aspFA8QD1en12AtB1ksQ0VMQfoAeRIxrVUPHYy8lyTFxLSD8B3kpg1UnybKcC-iWJb9F1UrbhNmN8Ntm9B7zyJGHV4xcxAgeJdZN',
    ]),
    variants_json: JSON.stringify([
      { type: 'finish', options: ['Aged Steel'] },
      { type: 'length', options: ['18 INCH (45CM)', '20 INCH (50CM)', '24 INCH (60CM)'] },
    ]),
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
    pendant_height: 'N/A Collar',
    pendant_width: 'N/A',
    pendant_thickness: '4mm',
    pendant_weight: '42 Grams Heavy Cast',
    clasp_type: 'Dual Tension Hook Clasp',
    is_detachable: 0,
    care_instructions: 'Wipe with soft cloth. Avoid crushing under heavy loads.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRVrqAYSujc3CsfGPFnzETR0sqOVj83aPVnffq9Js3nfaIAsW905xPetstOVolmYB4NJZJQRECtwt_lbZ5l3FQYtNNA7V1KavvJtnaaT4HBm0iCf7sOvIEMbrury-N3DrWZGJ9olCPFwUZcP38UwVqB2Kw3PMd4AflcSDlWXH8YPKMUNSlr5GyEKbTXyOPWInAQH9VKJlOtzxoLgD_2g86bwENqkZ4qjaLFalFffi63qoU-7tRG2we',
    ]),
    variants_json: JSON.stringify([
      { type: 'length', options: ['16 INCH (40CM)', '18 INCH (45CM)'] },
    ]),
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
    is_detachable: 1,
    care_instructions: 'Rinse with clean water; resistant to corrosion.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCgNwYashlTRlrttK9FKU9E6e9VT47FGiJimvjlxMtNNJb5rFRr1xlOWhZnTflTCpmECK9QWrTUyJlfi-s8Fn5DTY59mHtNR6DEdk-rnFzJmNu7AP_RsvupzCTOTtpqIlg-4owNWYtjHyv4HoffOcovREDzUzAk8tqApiIsSAXlwutW93HLShz8Xcqv97Zse12hpPMtILBc2GHWusxxLte_tkGhq5hV3q_FlST8XccwRbC-benF5zSh',
    ]),
    variants_json: JSON.stringify([
      { type: 'finish', options: ['Antique Silver'] },
      { type: 'length', options: ['20 INCH (50CM)', '24 INCH (60CM)'] },
    ]),
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
    pendant_height: 'N/A',
    pendant_width: 'N/A',
    pendant_thickness: '5mm',
    pendant_weight: '36 Grams',
    clasp_type: 'Custom O-Ring Skull Clasp',
    is_detachable: 0,
    care_instructions: 'Safe in sea water, sweat, and showers.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCnS0D37PNRCzU4I3bYVkdmcbj755Ep-fm621DdOsBAfiHS-fGVLw_iZRGqviE5XV6wYCr6NjyXGSZMnrvNNSkMikJl5dGZk-zjf8gdj7gO6DfAK8AXfCZ0io5wcK9zmFHdwa5Jwt23ltSVJLH-brY4h-Hu5W2I83YxgcqZOA5w6TyO8FgVeGIhNMcvL8LiLcJ9b9UjUvpGizqLoU4HbwDDDPHTYA-gCyqS1x72w9akHyDq4yVIFWJG',
    ]),
    variants_json: JSON.stringify([
      { type: 'length', options: ['20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ]),
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
    is_detachable: 1,
    care_instructions: 'Wipe dry after exposure to elements.',
    images_json: JSON.stringify([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD3LUOuIFiAhMrpJ7mBhvQnXW8urF6seBlYbWVvGo1LRJRBAWPaCeghOKleYaFulFHJIo_eyzvv5H02eQgLfs9UqzkL2VqGzoXcyOiFRwPUCE8k4kHnu7f2gzpNBzcEhd9oFHzoVwd14Vh2zDqqNMxNRgdjzH5XrzEKuzLsItHwrnocC_vgueqIkhIre_plhaUU65GQNpy7QsRjNZYN-3E6JvXLyaI33nwL2sgGxAgL6SvNaFQnjjOH',
    ]),
    variants_json: JSON.stringify([
      { type: 'finish', options: ['Oxidized Silver'] },
      { type: 'length', options: ['20 INCH (50CM)', '22 INCH (55CM)', '24 INCH (60CM)'] },
    ]),
    stock_quantity: 12,
    is_published: 1,
  },
];

export function seedAtelierCatalogue(): { inserted: number } {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, sku, name, slug, short_description, full_description, category,
      selling_price_paise, original_price_paise, material, finish, chain_length,
      chain_thickness, pendant_height, pendant_width, pendant_thickness, pendant_weight,
      clasp_type, is_detachable, care_instructions, images_json, variants_json,
      stock_quantity, is_published, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const now = new Date().toISOString();
  let count = 0;

  for (const item of ATELIER_CATALOGUE_PIECES) {
    insertStmt.run(
      item.id,
      item.sku,
      item.name,
      item.slug,
      item.short_description,
      item.full_description,
      item.category,
      item.selling_price_paise,
      item.original_price_paise || null,
      item.material,
      item.finish,
      item.chain_length || null,
      item.chain_thickness || null,
      item.pendant_height || null,
      item.pendant_width || null,
      item.pendant_thickness || null,
      item.pendant_weight || null,
      item.clasp_type || null,
      item.is_detachable ?? 1,
      item.care_instructions || null,
      item.images_json,
      item.variants_json,
      item.stock_quantity,
      item.is_published,
      now,
      now
    );
    count++;
  }

  return { inserted: count };
}
