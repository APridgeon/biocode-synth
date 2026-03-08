import { useState } from "react";
import getGeneData from "./info_retrieval";
import { process_gene_data } from "./process_gene_data";
import ToneInstanceGenerator from "./api_synth";

const GeneInfoRetrieval = () => {
    const [geneSymbol, setGeneSymbol] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeGene, setActiveGene] = useState("");
    const [fastaPreview, setFastaPreview] = useState<{prefix: string, highlight: string, suffix: string} | null>(null);
    const [g_positions, setGPositions] = useState<any>(null);
    const [geneData, setGeneData] = useState<any>(null);

    const query_api = async (gene_symbol: string) => {
        return await getGeneData(gene_symbol)
    }

    const load_gene_data = async (_gene_symbol: string) => {
        const response = await fetch('data/gene_data.json');
        return await response.json();
    }

    const handleSearch = async () => {
        setIsLoading(true);
        console.log("Searching for gene:", geneSymbol);
        const gene_data = await load_gene_data(geneSymbol);
        if(!gene_data) throw Error("Gene not found")
        setGeneData(gene_data);
        setActiveGene(gene_data.symbol);

        setIsLoading(false);
        const g_positions = process_gene_data(gene_data);
        setGPositions(g_positions);
    };


    const download_json = (gene_data: Awaited<ReturnType<typeof getGeneData>>) => {
        const blob = new Blob([JSON.stringify(gene_data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'gene_data.json';
        link.click();
    }

    return (
        <div className="container mt-4">
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Gene Symbol (e.g. BRCA2)"
                    value={geneSymbol}
                    onChange={(e) => setGeneSymbol(e.target.value.toUpperCase())}
                />
                <button className="btn btn-primary" type="button" onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                        "Go"
                    )}
                </button>
            </div>
            {activeGene && !isLoading && (
                <div className="mt-2">
                    <span className="badge rounded-pill bg-success text-white">Active Gene: {activeGene}</span>
                </div>
            )}
            <div className="mt-3">
                <ToneInstanceGenerator g_positions={g_positions} gene_data={geneData} />
            </div>
        </div>
    );
}
export default GeneInfoRetrieval;