import type getGeneData from "./info_retrieval";


const GeneDiagram = ({data, currentIndex}: {data: Awaited<ReturnType<typeof getGeneData>> | null, currentIndex: number | null}) => {
    if (!data || !data.features) return null;
    const [chr, pos] = data.coordinates.split(':');
    const [start, end] = pos.split('-').map(val => Number(val));
    const range = end - start;
    const width = 1000;
    const height = 150;
    const padding = 40;

    const scale = (pos: number) => ((pos - start) / range) * (width - 2 * padding) + padding;

    // Filter for exons and introns/CDS
    const exons = data.features.filter(f => f.type === 'exon');
    const cds = data.features.filter(f => f.type === 'cds');

    return (
        <div className="mt-4 p-4 border rounded bg-dark shadow-lg overflow-auto">
            <h6 className="text-light mb-3 opacity-75">Gene Structure: <span className="text-info">{data.symbol}</span> <small className="ms-2">({chr}:{start.toLocaleString()}-{end.toLocaleString()})</small></h6>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                {/* Genomic Axis */}
                <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#444" strokeWidth="2" strokeDasharray="4,4" />
                
                {/* Ticks */}
                <text x={padding} y={height / 2 + 35} fontSize="10" textAnchor="middle" fill="#888" fontFamily="monospace">{start}</text>
                <text x={width - padding} y={height / 2 + 35} fontSize="10" textAnchor="middle" fill="#888" fontFamily="monospace">{end}</text>

                {/* Exons (Thin) */}
                {exons.map((exon, i) => (
                    <rect
                        key={`exon-${i}`}
                        x={scale(exon.start)}
                        y={height / 2 - 10}
                        width={Math.max(1, scale(exon.end) - scale(exon.start))}
                        height={20}
                        fill="#4a4a4a"
                        stroke="#666"
                        rx="2"
                    />
                ))}

                {/* CDS (Thick/Colored) */}
                {cds.map((c, i) => (
                    <rect
                        key={`cds-${i}`}
                        x={scale(c.start)}
                        y={height / 2 - 15}
                        width={Math.max(1, scale(c.end) - scale(c.start))}
                        height={30}
                        fill="#3399ff"
                        fillOpacity="0.9"
                        stroke="#55aaff"
                        rx="2"
                    >
                        <title>CDS: {c.start}-{c.end}</title>
                    </rect>
                ))}

                {/* Current Position Indicator */}
                {currentIndex !== null && (
                    <g>
                        <line 
                            x1={scale(start + currentIndex)} 
                            y1={height / 2 - 40} 
                            x2={scale(start + currentIndex)} 
                            y2={height / 2 + 40} 
                            stroke="#ffc107" 
                            strokeWidth="2"
                        />
                        <circle cx={scale(start + currentIndex)} cy={height / 2} r="4" fill="#ffc107" />
                    </g>
                )}

                {/* Legend */}
                <g transform={`translate(${padding}, ${height - 20})`}>
                    <rect width="12" height="12" fill="#4a4a4a" stroke="#666" rx="2" />
                    <text x="18" y="10" fontSize="11" fill="#aaa">UTR/Exon</text>
                    <rect x="100" width="12" height="12" fill="#3399ff" rx="2" />
                    <text x="118" y="10" fontSize="11" fill="#aaa">CDS</text>
                </g>
            </svg>
        </div>
    );

}

export default GeneDiagram;