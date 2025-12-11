
export type CardSet = 'LOF' | 'SEC';

export type CardType = 'leader' | 'base' | 'unit' | 'upgrade' | 'event' | 'token';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'special';

export type CardAspect = 'vigilance' | 'command' | 'aggression' | 'cunning' | 'villainy' | 'heroism';

export interface Card {
    id: string;
    set: CardSet;
    number: number;
    type: CardType;
    rarity: CardRarity;
    aspects: CardAspect[];
    name: string;
    title?: string;
    art: string;
    cost?: number;
}

/**
 * Fetches the card data for a given set.
 * @param setId The set ID (e.g., 'LOF', 'SEC').
 * @returns A promise that resolves to the list of cards in the set.
 */
export async function fetchSetCards(setId: string): Promise<Card[]> {
    try {
        const response = await fetch(`/sets/${setId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch cards for set ${setId}`);
        }
        const nodes = await response.json();
        return nodes as Card[];
    } catch (error) {
        console.error(`Error fetching set ${setId}:`, error);
        return [];
    }
}

/**
 * Generates a booster pack ensuring distribution rules.
 * Rules:
 * - 16 cards total
 * - 1 Leader
 * - 1 Base
 * - 9 Commons (Standard pool)
 * - 3 Uncommons (Standard pool)
 * - 1 Rare or Legendary (Standard pool)
 * - 1 Any rarity (Standard pool)
 * 
 * "Standard pool" excludes Leaders, Bases, Tokens, and "Special" rarity cards.
 * @param allCards The full list of cards from which to generate the booster.
 * @returns An array of 16 Card objects.
 */
export function generateBoosterPack(allCards: Card[]): Card[] {
    const setId = allCards.length > 0 ? allCards[0]?.set : '';

    // Define excluded leaders (Starter Deck leaders)
    const excludedLeaderIds = new Set([
        'LOF-009', 'LOF-016',
        'SEC-001', 'SEC-016'
    ]);

    // Filter out cards that should never appear in packs
    // 1. Tokens
    // 2. Excluded Leaders
    const availableCards = allCards.filter(c =>
        c.type !== 'token' &&
        !excludedLeaderIds.has(c.id)
    );

    const leaders = availableCards.filter(c => c.type === 'leader');
    const bases = availableCards.filter(c => c.type === 'base');

    // Standard pool for main slots: Non-Leader, Non-Base, Non-Special
    const standardPool = availableCards.filter(c =>
        c.type !== 'leader' &&
        c.type !== 'base' &&
        c.rarity !== 'special'
    );

    const commons = standardPool.filter(c => c.rarity === 'common');
    const uncommons = standardPool.filter(c => c.rarity === 'uncommon');

    // Default Rare/Legendary pool (Standard cards only)
    let raresAndLegendaries = standardPool.filter(c => c.rarity === 'rare' || c.rarity === 'legendary');

    // Special Rule for LOF: Rare Bases can appear in the Rare/Legendary slot
    if (setId === 'LOF') {
        const rareBases = bases.filter(c => c.rarity === 'rare' || c.rarity === 'legendary');
        raresAndLegendaries = [...raresAndLegendaries, ...rareBases];
    }

    // The "foil" slot is any rarity (including Special), except you will not find a base in this slot.
    // It can include Leaders (non-excluded ones), but not Bases.
    const anyRarityPool = availableCards.filter(c => c.type !== 'base');

    const pack: Card[] = [];

    // 1. Leader
    if (leaders.length > 0) {
        pack.push(getRandomItem(leaders));
    }

    // 2. Base
    let basePool = bases;
    // Special Rule for LOF: Base slot only contains Common Bases
    if (setId === 'LOF') {
        basePool = bases.filter(c => c.rarity === 'common');
    }

    if (basePool.length > 0) {
        pack.push(getRandomItem(basePool));
    }

    // 3. 9 Commons
    for (let i = 0; i < 9; i++) {
        if (commons.length > 0) pack.push(getRandomItem(commons));
    }

    // 4. 3 Uncommons
    for (let i = 0; i < 3; i++) {
        if (uncommons.length > 0) pack.push(getRandomItem(uncommons));
    }

    // 5. 1 Rare or Legendary (potentially including Rare Bases in LOF)
    if (raresAndLegendaries.length > 0) {
        pack.push(getRandomItem(raresAndLegendaries));
    }

    // 6. 1 Any Rarity (Standard pool + Special, no bases. Includes leaders.)
    if (anyRarityPool.length > 0) {
        pack.push(getRandomItem(anyRarityPool));
    }

    return pack;
}

/**
 * Generates a sealed pool from 6 booster packs.
 * @param setId The set ID (e.g., 'LOF').
 * @returns A promise that resolves to a flat list of cards from 6 boosters.
 */
export async function generateSealedPool(setId: string): Promise<Card[]> {
    const allCards = await fetchSetCards(setId);

    if (allCards.length === 0) {
        console.warn(`No cards found for set ${setId}, returning empty pool.`);
        return [];
    }

    const rawPool: Card[] = [];
    for (let i = 0; i < 6; i++) {
        const booster = generateBoosterPack(allCards);
        rawPool.push(...booster);
    }

    // Filter out common bases from the initial pool to handle them separately
    // We keep Rare/Legendary bases as they are unique cards
    const poolWithoutCommonBases = rawPool.filter(c => !(c.type === 'base' && c.rarity === 'common'));
    const openedCommonBases = rawPool.filter(c => c.type === 'base' && c.rarity === 'common');

    // Get all available common bases from the set
    const allSetCommonBases = allCards.filter(c => c.type === 'base' && c.rarity === 'common');

    // Combine opened + set bases. Order ensures we process them, but since we dedup by aspect it mostly matters which art we pick first.
    // We prioritize opened ones simply by order (though functionally identical usually).
    const baseCandidates = [...openedCommonBases, ...allSetCommonBases];

    const uniqueCommonBases: Card[] = [];
    const seenAspects = new Set<string>();

    const getAspectIds = (c: Card) => [...c.aspects].sort().join(',');

    for (const base of baseCandidates) {
        const aspects = getAspectIds(base);
        // Only add if we haven't seen this aspect combination for a COMMON base yet
        if (!seenAspects.has(aspects)) {
            uniqueCommonBases.push(base);
            seenAspects.add(aspects);
        }
    }

    return [...poolWithoutCommonBases, ...uniqueCommonBases];
}

function getRandomItem<T>(items: T[]): T {
    if (items.length === 0) {
        throw new Error('Cannot pick random item from empty list');
    }
    const index = Math.floor(Math.random() * items.length);
    return items[index]!;
}
