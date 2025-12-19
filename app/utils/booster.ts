import seedrandom from 'seedrandom';

export type CardSet = 'LOF' | 'SEC';

export type CardType = 'leader' | 'base' | 'unit' | 'upgrade' | 'event' | 'token';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'special';

export type CardAspect = 'vigilance' | 'command' | 'aggression' | 'cunning' | 'villainy' | 'heroism';

export type UnitArena = 'ground' | 'space';

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
    arena?: UnitArena;
    traits?: string[];
    hp?: number;
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

const EXCLUDED_LEADER_IDS = new Set([
    'LOF-009', 'LOF-016',
    'SEC-001', 'SEC-016'
]);

/**
 * Generates a booster pack ensuring distribution rules.
 * Rules:
 * - 16 cards total
 * - 1 Leader
 * - 1 Base
 * - 9 Commons (Standard pool)
 * - 3 Uncommons (Standard pool)
 * - 1 Rare or Legendary (Standard pool)
 * - 1 Any rarity (Standard pool + Special, no Bases)
 * 
 * Ensures no duplicate cards (by ID) within a single pack.
 * 
 * @param allCards The full list of cards from which to generate the booster.
 * @param rng The random number generator to use.
 * @returns An array of 16 Card objects.
 */
export function generateBoosterPack(allCards: Card[], rng: seedrandom.PRNG): Card[] {
    const setId = allCards.length > 0 ? allCards[0]?.set : '';

    // Global availability filter
    // 1. Exclude tokens
    // 2. Exclude starter leaders
    const availableCards = allCards.filter(c =>
        c.type !== 'token' &&
        !EXCLUDED_LEADER_IDS.has(c.id)
    );

    const pack: Card[] = [];
    const packCardIds = new Set<string>();

    // Helper to add cards to pack and track IDs
    const addCardsToPack = (cards: Card[]) => {
        cards.forEach(c => {
            pack.push(c);
            packCardIds.add(c.id);
        });
    };

    // 1. Leader Slot (1 card)
    const leaders = availableCards.filter(c => c.type === 'leader');

    const isRare = rng() < 0.15;
    const leaderPool = leaders.filter(c => isRare ? c.rarity === 'rare' : c.rarity !== 'rare');

    addCardsToPack(getUniqueRandomCards(leaderPool.length > 0 ? leaderPool : leaders, 1, packCardIds, rng));

    // 2. Base Slot (1 card)
    let basePool = availableCards.filter(c => c.type === 'base');
    // Special Rule for LOF: Base slot only contains Common Bases
    if (setId === 'LOF') {
        basePool = basePool.filter(c => c.rarity === 'common');
    }
    addCardsToPack(getUniqueRandomCards(basePool, 1, packCardIds, rng));

    // Define Standard Pool for main slots
    // Excludes: Leaders, Bases, and Special rarity
    const standardPool = availableCards.filter(c =>
        c.type !== 'leader' &&
        c.type !== 'base' &&
        c.rarity !== 'special'
    );

    // 3. Common Slots (9 cards)
    const commons = standardPool.filter(c => c.rarity === 'common');
    addCardsToPack(getUniqueRandomCards(commons, 9, packCardIds, rng));

    // 4. Uncommon Slots (3 cards)
    const uncommons = standardPool.filter(c => c.rarity === 'uncommon');
    addCardsToPack(getUniqueRandomCards(uncommons, 3, packCardIds, rng));

    // 5. Rare/Legendary Slot (1 card)
    let rareLegPool = standardPool.filter(c => c.rarity === 'rare' || c.rarity === 'legendary');

    // Special Rule for LOF: Rare Bases can appear in the Rare/Legendary slot
    if (setId === 'LOF') {
        const rareBases = availableCards.filter(c =>
            c.type === 'base' &&
            (c.rarity === 'rare' || c.rarity === 'legendary')
        );
        rareLegPool = [...rareLegPool, ...rareBases];
    }
    addCardsToPack(getUniqueRandomCards(rareLegPool, 1, packCardIds, rng));

    // 6. Foil / Wildcard Slot (1 card)
    // Can be any rarity (including Special).
    // Rule: "Except you will not find a base or leader in this slot"
    // Also implicit: no excluded leaders (handled by availableCards), no tokens.
    const foilPool = availableCards.filter(c => c.type !== 'base' && c.type !== 'leader');
    addCardsToPack(getUniqueRandomCards(foilPool, 1, packCardIds, rng));

    return pack;
}

/**
 * Parses a pack configuration string into a map of Set ID to number of packs.
 * Formats:
 * - "LOF" -> { LOF: 6 }
 * - "LOF-6" -> { LOF: 6 }
 * - "LOF-3_SEC-3" -> { LOF: 3, SEC: 3 }
 */
export function parsePackConfig(configStr: string): Record<string, number> {
    const result: Record<string, number> = {};
    const parts = configStr.split('_');

    // Legacy/Simple format: "LOF" -> 6 packs
    const firstPart = parts[0];
    if (parts.length === 1 && firstPart && !firstPart.includes('-')) {
        result[firstPart] = 6;
        return result;
    }

    for (const part of parts) {
        const split = part.split('-');
        if (split.length < 2) continue;

        const set = split[0];
        const countStr = split[1];

        if (set && countStr) {
            const count = parseInt(countStr, 10);
            if (!isNaN(count)) {
                result[set] = count;
            }
        }
    }
    return result;
}

/**
 * Generates a sealed pool based on a configuration string.
 * @param configStr The pack configuration (e.g., 'LOF', 'LOF-3_SEC-3', 'LOF-6_SL').
 * @param seed Optional seed for reproducible generation.
 * @returns A promise that resolves to a flat list of cards.
 */
export async function generateSealedPool(configStr: string, seed?: string): Promise<Card[]> {
    const includeSpotlightLeaders = configStr.split('_').includes('SL');
    const config = parsePackConfig(configStr);
    const setIds = Object.keys(config);

    // Fetch all required sets
    const setsCards = new Map<string, Card[]>();
    for (const setId of setIds) {
        const cards = await fetchSetCards(setId);
        if (cards.length > 0) {
            setsCards.set(setId, cards);
        } else {
            console.warn(`No cards found for set ${setId}`);
        }
    }

    // If no valid sets found, return empty
    if (setsCards.size === 0) {
        return [];
    }

    // If no seed is provided, use a random one
    const rngSeed = seed || Math.random().toString(36).substring(7);
    const rng = seedrandom(rngSeed);

    const rawPool: Card[] = [];

    // Generate boosters for each set in config
    for (const [setId, count] of Object.entries(config)) {
        const setCards = setsCards.get(setId);
        if (!setCards) continue;

        for (let i = 0; i < count; i++) {
            const booster = generateBoosterPack(setCards, rng);
            rawPool.push(...booster);
        }
    }

    // If spotlight leaders are included, add them to the pool
    if (includeSpotlightLeaders) {
        for (const [setId, cards] of setsCards) {
            const spotlightLeaders = cards.filter(c => EXCLUDED_LEADER_IDS.has(c.id));
            rawPool.push(...spotlightLeaders);
        }
    }

    // Post-process to remove duplicate leaders (keep only one instance of each leader)
    // We already have a mix of generated boosters and potentially manually added leaders
    const uniqueLeaderIds = new Set<string>();
    const uniqueLeadersAndOthers: Card[] = [];
    const openedBases: Card[] = [];

    // Split pool into Bases and Others (with deduplicated leaders)
    for (const c of rawPool) {
        if (c.type === 'leader') {
            uniqueLeadersAndOthers.push(c);
        } else if (c.type === 'base') {
            openedBases.push(c);
        } else {
            uniqueLeadersAndOthers.push(c);
        }
    }

    // Base handling logic:
    // 1. Gather all bases from generation
    // 2. Gather all common bases from selected sets
    // 3. Filter final list by signature (Aspects + HP) to remove duplicates and ensure coverage

    // Get all available common bases from used sets
    let allSetCommonBases: Card[] = [];
    for (const [setId, cards] of setsCards) {
        const setBases = cards.filter(c => c.type === 'base' && c.rarity === 'common');
        allSetCommonBases = [...allSetCommonBases, ...setBases];
    }

    const finalBases: Card[] = [];
    const coveredBaseSignatures = new Set<string>();

    // Helper to get base signature (aspects + hp)
    // Aspects are sorted to ensure consistency (e.g. "A,B" == "B,A")
    const getBaseSignature = (c: Card) => {
        const aspects = [...(c.aspects || [])].sort().join(',');
        const hp = c.hp || 0;
        return `${aspects}|${hp}`;
    };

    // 1. Process opened bases first (prioritize drawn cards)
    for (const base of openedBases) {
        const signature = getBaseSignature(base);
        if (!coveredBaseSignatures.has(signature)) {
            finalBases.push(base);
            coveredBaseSignatures.add(signature);
        }
    }

    // 2. Verify and add missing common bases
    for (const base of allSetCommonBases) {
        const signature = getBaseSignature(base);
        if (!coveredBaseSignatures.has(signature)) {
            finalBases.push(base);
            coveredBaseSignatures.add(signature);
        }
    }

    return [...uniqueLeadersAndOthers, ...finalBases];
}

/**
 * Selects 'count' random unique cards from 'pool', excluding any IDs in 'excludeIds'.
 */
function getUniqueRandomCards(pool: Card[], count: number, excludeIds: Set<string>, rng: seedrandom.PRNG): Card[] {
    // 1. Filter candidates that are not already in the pack
    const candidates = pool.filter(c => !excludeIds.has(c.id));

    if (candidates.length === 0) return [];

    // 2. Fisher-Yates Shuffle
    // We clone the candidates array to avoid modifying the filtered list reference (though filter creates new one)
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = shuffled[i]!;
        shuffled[i] = shuffled[j]!;
        shuffled[j] = temp;
    }

    // 3. Take the top 'count' items
    return shuffled.slice(0, count);
}
