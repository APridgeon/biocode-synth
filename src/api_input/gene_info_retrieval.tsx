import { useState } from "react";
import getGeneData from "./info_retrieval";
import { process_gene_data } from "./process_gene_data";
import ToneInstanceGenerator from "./api_synth";
import GeneInfoCard from "./gene_info_card";
import { getClinVarData, type ClinVarMap } from "./clinvar_retrieval";

const EXAMPLE_GENES = ['BRCA2', 'TP53', 'CFTR', 'EGFR', 'HTT', 'APOE'];

const GeneInfoRetrieval = () => {
    const [geneSymbol, setGeneSymbol] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeGene, setActiveGene] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [g_positions, setGPositions] = useState<any>(null);
    const [geneData, setGeneData] = useState<any>(null);
    const [clinvarMap, setClinvarMap] = useState<ClinVarMap | null>(null);
    const [clinvarLoading, setClinvarLoading] = useState(false);
    const [clinvarError, setClinvarError] = useState(false);

    const fetchClinVar = async (coordinates: string) => {
        setClinvarLoading(true);
        setClinvarError(false);
        try {
            const cv = await getClinVarData(coordinates);
            setClinvarMap(cv);
        } catch (e) {
            console.error('[ClinVar] fetch failed:', e);
            setClinvarError(true);
        } finally {
            setClinvarLoading(false);
        }
    };

    const handleSearch = async (symbol?: string) => {
        const target = (symbol ?? geneSymbol).trim().toUpperCase();
        if (!target) return;
        setIsLoading(true);
        setError(null);
        setClinvarMap(null);
        setClinvarError(false);
        try {
            const gene_data = await getGeneData(target);
            if (!gene_data) throw new Error("Gene not found");
            setGeneData(gene_data);
            setActiveGene(gene_data.symbol);
            setGPositions(process_gene_data(gene_data));
            // Fire ClinVar fetch after gene data is ready — doesn't block the UI
            fetchClinVar(gene_data.coordinates);
        } catch {
            setError(`Could not find gene "${target}". Try a gene symbol like BRCA2 or TP53.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mt-4 pb-5">
            <div className="text-center mb-4">
                <h1 className="display-5 fw-bold">Gene Music</h1>
                <p className="lead text-muted">
                    Search for a human gene and listen to its DNA sequence as music.<br />
                    Each base (A, T, C, G) plays a different note — variants in the population add a second melody.
                </p>
            </div>

            <div className="row justify-content-center mb-3">
                <div className="col-md-6">
                    <div className="input-group input-group-lg">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Gene symbol, e.g. BRCA2"
                            value={geneSymbol}
                            onChange={(e) => setGeneSymbol(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className="btn btn-primary px-4" type="button" onClick={() => handleSearch()} disabled={isLoading}>
                            {isLoading
                                ? <span className="spinner-border spinner-border-sm" role="status" />
                                : "Search"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="row justify-content-center mb-4">
                <div className="col-md-6 text-center">
                    <small className="text-muted me-2">Try:</small>
                    {EXAMPLE_GENES.map(g => (
                        <button
                            key={g}
                            className="btn btn-sm btn-outline-secondary me-1 mb-1"
                            onClick={() => { setGeneSymbol(g); handleSearch(g); }}
                            disabled={isLoading}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="row justify-content-center mb-3">
                    <div className="col-md-6">
                        <div className="alert alert-warning">{error}</div>
                    </div>
                </div>
            )}

            {activeGene && !isLoading && (
                <GeneInfoCard
                    symbol={activeGene}
                    clinvarMap={clinvarMap}
                    clinvarLoading={clinvarLoading}
                    clinvarError={clinvarError}
                />
            )}

            <ToneInstanceGenerator g_positions={g_positions} gene_data={geneData} clinvarMap={clinvarMap} />
        </div>
    );
}
export default GeneInfoRetrieval;