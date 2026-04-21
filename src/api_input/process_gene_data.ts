import type getGeneData from "./info_retrieval"


export const process_gene_data = (gene_data: Awaited<ReturnType<typeof getGeneData>>) => {

    if (!gene_data) throw Error('No gene data found')

    const [_chr, pos_range] = gene_data.coordinates.split(':')
    const [start, _end] = pos_range.split('-').map(val => Number(val))
    const sequence = gene_data.fasta.split('')

    const seq_data = sequence.map((base, index) => {
        const gloc = index + start
        const voi = gene_data.variantSample.filter(variant => variant.pos === gloc)
        const ref = base
        const alts = voi.map((variant) => {return variant.alt})
        return {gloc, ref, alts}
    })
    return seq_data
}