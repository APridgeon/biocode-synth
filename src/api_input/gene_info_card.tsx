import { useEffect, useState } from 'react';
import type { ClinVarMap, ClinicalSignificance } from './clinvar_retrieval';

interface GeneInfo {
    name: string;
    summary: string;
    omimIds: string[];
}

export const SIG_CONFIG: Record<ClinicalSignificance, { color: string; label: string; bootstrapBg: string }> = {
    pathogenic:       { color: '#dc3545', label: 'Pathogenic',          bootstrapBg: 'danger'   },
    likely_pathogenic:{ color: '#fd7e14', label: 'Likely Pathogenic',   bootstrapBg: 'warning'  },
    conflicting:      { color: '#6f42c1', label: 'Conflicting',         bootstrapBg: 'purple'   },
    vus:              { color: '#ffc107', label: 'Uncertain (VUS)',      bootstrapBg: 'secondary'},
    likely_benign:    { color: '#20c997', label: 'Likely Benign',       bootstrapBg: 'info'     },
    benign:           { color: '#198754', label: 'Benign',              bootstrapBg: 'success'  },
    other:            { color: '#6c757d', label: 'Other',               bootstrapBg: 'light'    },
};

const GeneInfoCard = ({ symbol, clinvarMap, clinvarLoading, clinvarError }: {
    symbol: string;
    clinvarMap: ClinVarMap | null;
    clinvarLoading: boolean;
    clinvarError?: boolean;
}) => {
    const [info, setInfo] = useState<GeneInfo | null>(null);
    const [infoLoading, setInfoLoading] = useState(false);

    useEffect(() => {
        if (!symbol) return;
        setInfo(null);
        setInfoLoading(true);
        fetch(`https://mygene.info/v3/query?q=symbol:${symbol}&species=human&fields=name,summary,MIM`)
            .then(r => r.json())
            .then(data => {
                const hit = data.hits?.[0];
                if (hit) {
                    setInfo({
                        name: hit.name ?? symbol,
                        summary: hit.summary ?? '',
                        omimIds: hit.MIM ? (Array.isArray(hit.MIM) ? hit.MIM : [hit.MIM]) : [],
                    });
                }
            })
            .catch(() => {})
            .finally(() => setInfoLoading(false));
    }, [symbol]);

    // Tally ClinVar counts by significance
    const sigCounts: Partial<Record<ClinicalSignificance, number>> = {};
    if (clinvarMap) {
        for (const variants of clinvarMap.values()) {
            for (const v of variants) {
                sigCounts[v.significance] = (sigCounts[v.significance] ?? 0) + 1;
            }
        }
    }
    const totalClinvar = Object.values(sigCounts).reduce((a, b) => a + b, 0);
    const pathogenicCount = (sigCounts['pathogenic'] ?? 0) + (sigCounts['likely_pathogenic'] ?? 0);

    return (
        <div className="card shadow-sm mb-3">
            <div className="card-body">
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                    <div>
                        <h5 className="mb-0 fw-bold">
                            {symbol}
                            {info && <span className="text-muted fw-normal fs-6 ms-2">— {info.name}</span>}
                        </h5>
                        {info?.omimIds.length ? (
                            <small className="text-muted">
                                OMIM: {info.omimIds.map(id => (
                                    <a key={id} href={`https://omim.org/entry/${id}`} target="_blank" rel="noopener" className="me-1">
                                        {id}
                                    </a>
                                ))}
                            </small>
                        ) : null}
                    </div>

                    {/* ClinVar summary badges */}
                    <div className="d-flex flex-wrap gap-1 align-items-center">
                        {clinvarLoading && (
                            <span className="badge bg-secondary">
                                <span className="spinner-border spinner-border-sm me-1" />
                                Loading ClinVar…
                            </span>
                        )}
                        {!clinvarLoading && clinvarMap && totalClinvar > 0 && (
                            <>
                                {(Object.entries(SIG_CONFIG) as [ClinicalSignificance, typeof SIG_CONFIG[ClinicalSignificance]][])
                                    .filter(([sig]) => sigCounts[sig])
                                    .map(([sig, cfg]) => (
                                        <span
                                            key={sig}
                                            className="badge"
                                            style={{ backgroundColor: cfg.color, color: '#fff' }}
                                            title={cfg.label}
                                        >
                                            {sigCounts[sig]} {cfg.label}
                                        </span>
                                    ))
                                }
                            </>
                        )}
                        {!clinvarLoading && clinvarError && (
                            <span className="badge bg-warning text-dark" title="ClinVar could not be reached — check console for details">
                                ClinVar unavailable
                            </span>
                        )}
                        {!clinvarLoading && !clinvarError && clinvarMap && totalClinvar === 0 && (
                            <span className="badge bg-secondary">No ClinVar data</span>
                        )}
                    </div>
                </div>

                {infoLoading && <p className="text-muted small mb-0">Loading gene summary…</p>}

                {info?.summary && (
                    <p className="mb-2 small text-muted" style={{ lineHeight: 1.5 }}>
                        {info.summary.length > 400 ? info.summary.slice(0, 400) + '…' : info.summary}
                    </p>
                )}

                {pathogenicCount > 0 && (
                    <div className="alert alert-danger py-1 px-2 mb-0 small">
                        <strong>{pathogenicCount}</strong> pathogenic/likely-pathogenic variant{pathogenicCount > 1 ? 's' : ''} in ClinVar —
                        listen for the <strong>accent note</strong> when these positions play.
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneInfoCard;
