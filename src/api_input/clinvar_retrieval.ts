const ENSEMBL_REST = 'https://rest.ensembl.org';

export type ClinicalSignificance =
    | 'pathogenic'
    | 'likely_pathogenic'
    | 'benign'
    | 'likely_benign'
    | 'vus'
    | 'conflicting'
    | 'other';

export interface ClinVarVariant {
    variantId: string;
    pos: number;
    significance: ClinicalSignificance;
    condition: string;
    title: string;
}

export type ClinVarMap = Map<number, ClinVarVariant[]>;

function normalizeSig(labels: string[]): ClinicalSignificance {
    const joined = labels.join(' ').toLowerCase();
    if (joined.includes('conflict')) return 'conflicting';
    if (joined.includes('likely pathogenic') || joined.includes('likely_pathogenic')) return 'likely_pathogenic';
    if (joined.includes('pathogenic')) return 'pathogenic';
    if (joined.includes('likely benign') || joined.includes('likely_benign')) return 'likely_benign';
    if (joined.includes('benign')) return 'benign';
    if (joined.includes('uncertain') || joined.includes('vus')) return 'vus';
    return 'other';
}

// coordinates: "13:32315086-32400268" as returned by Ensembl lookup
export async function getClinVarData(coordinates: string): Promise<ClinVarMap> {
    const [chr, range] = coordinates.split(':');

    const res = await fetch(
        `${ENSEMBL_REST}/overlap/region/homo_sapiens/${chr}:${range}?feature=variation&content-type=application/json`
    );
    if (!res.ok) throw new Error(`Ensembl variation overlap HTTP ${res.status}`);

    const variants: any[] = await res.json();
    console.log(`[ClinVar] raw variants in region: ${variants.length}`);

    const result: ClinVarMap = new Map();

    for (const v of variants) {
        const sigArr: string[] = Array.isArray(v.clinical_significance) ? v.clinical_significance : [];
        if (sigArr.length === 0) continue;

        const sig = normalizeSig(sigArr);
        const pos: number = v.start;

        const variant: ClinVarVariant = {
            variantId: v.id ?? '',
            pos,
            significance: sig,
            condition: '',
            title: v.id ?? '',
        };
        if (!result.has(pos)) result.set(pos, []);
        result.get(pos)!.push(variant);
    }

    console.log(`[ClinVar] positions with clinical significance: ${result.size}`);
    return result;
}

export function topSignificance(variants: ClinVarVariant[]): ClinicalSignificance {
    const order: ClinicalSignificance[] = [
        'pathogenic', 'likely_pathogenic', 'conflicting', 'vus', 'likely_benign', 'benign', 'other'
    ];
    for (const sig of order) {
        if (variants.some(v => v.significance === sig)) return sig;
    }
    return 'other';
}
