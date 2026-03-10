const ENSEMBL_REST = "https://rest.ensembl.org";
const GNOMAD_API = "https://gnomad.broadinstitute.org/api";

interface GeneMetadata {
  id: string;
  display_name: string;
  seq_region_name: string;
  start: number;
  end: number;
  strand: number;
}

interface GeneFeature {
  feature_type: string;
  id?: string;
  start: number;
  end: number;
  Parent?: string;
}

/**
 * Main function to orchestrate the gene data retrieval
 */async function getGeneData(symbol: string) {
  try {
    console.log(`--- Fetching data for: ${symbol} ---`);

    // 1. Get Gene Name & Coordinates from Ensembl
    // Use the lookup endpoint to resolve symbol to ID and region
    const lookupRes = await fetch(`${ENSEMBL_REST}/lookup/symbol/homo_sapiens/${symbol}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!lookupRes.ok) throw new Error(`Ensembl lookup failed: ${lookupRes.statusText}`);
    const gene: GeneMetadata = await lookupRes.json();
    
    console.log(`ID: ${gene.id} | Region: ${gene.seq_region_name}:${gene.start}-${gene.end}`);

    // 2. Get FASTA Sequence from Ensembl
    // Use the /sequence/id endpoint
    const sequenceRes = await fetch(`${ENSEMBL_REST}/sequence/id/${gene.id}`, {
      headers: { 'Content-Type': 'text/x-fasta' }
    });
    if (!sequenceRes.ok) throw new Error(`Ensembl sequence failed: ${sequenceRes.statusText}`);
    const fastaData = await sequenceRes.text();
    console.log(fastaData)
    console.log(`FASTA sequence retrieved (Length: ${fastaData.length} chars)`);
    const fasta_seq = fastaData.split('\n').slice(1, undefined).join('\n').replaceAll('\n', '')
    console.log(fasta_seq.length)

    // 2.5 Get Gene Features (Exons, UTRs, etc.) from Ensembl
    const overlapRes = await fetch(`${ENSEMBL_REST}/overlap/region/homo_sapiens/${gene.seq_region_name}:${gene.start}-${gene.end}?feature=exon;feature=transcript;feature=cds;feature=gene`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!overlapRes.ok) throw new Error(`Ensembl overlap failed: ${overlapRes.statusText}`);
    const features: GeneFeature[] = await overlapRes.json();
    
    console.log(`Found ${features.length} gene features.`);
    const geneFeatures = features.map(f => ({ type: f.feature_type, id: f.id, start: f.start, end: f.end, parent: f.Parent }));


    // 3. Get gnomAD Variants via GraphQL
    // Querying the gene object to get associated variants
    const gnomadQuery = `
      query GetVariants($geneId: String!, $dataset: DatasetId!) {
        gene(gene_id: $geneId, reference_genome: GRCh38) {
          variants(dataset: $dataset) {
            variant_id
            pos
            ref
            alt
            genome {
              ac
              an
            }
          }
        }
      }
    `;

    const gnomadRes = await fetch(GNOMAD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: gnomadQuery,
        variables: {
          geneId: gene.id,
          dataset: "gnomad_r4" // Current gnomAD dataset
        }
      })
    });

    if (!gnomadRes.ok) throw new Error(`gnomAD request failed: ${gnomadRes.statusText}`);
    const gnomadData = await gnomadRes.json();
    const variants: variant[] = gnomadData.data.gene.variants;
    console.log(`Found ${variants.length} gnomAD variants.`);
    
    // Sample Output
    return {
      symbol: gene.display_name,
      coordinates: `${gene.seq_region_name}:${gene.start}-${gene.end}`,
      fasta: fasta_seq,
      variantSample: variants,
      features: geneFeatures
    };

  } catch (error: any) {
    console.error("Error fetching gene data:", error.message);
  }
}

export default getGeneData;


type variant = {
  variant_id: string;
  pos: number;
  ref: string;
  alt: string;
  genome: {
    ac: number;
    an: number;
  };
}
