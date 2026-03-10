import type getGeneData from "./info_retrieval";
import { useState } from 'react';

const GeneDiagram = ({data, currentIndex}: {data: Awaited<ReturnType<typeof getGeneData>> | null, currentIndex: number | null}) => {
    const [zoomWindow, setZoomWindow] = useState<number | null>(null); // base pairs

    if (!data || !data.features) return null;
    const [chr, pos] = data.coordinates.split(':');
    const [start, end] = pos.split('-').map(val => Number(val));
    const range = end - start;
    const width = 1000;
    const padding = 40;

    // Zoom logic: if currentIndex exists, focus on a window around it
    const isZoomed = currentIndex !== null && zoomWindow !== null;
    const currentPos = start + (currentIndex ?? 0);
    const viewStart = isZoomed ? Math.max(start, currentPos - (zoomWindow as number) / 2) : start;
    const viewEnd = isZoomed ? Math.min(end, viewStart + (zoomWindow as number)) : end;
    const viewRange = viewEnd - viewStart;

    const scale = (pos: number) => ((pos - viewStart) / viewRange) * (width - 2 * padding) + padding;

    // Group features by transcript (Parent)
    const transcripts = data.features.filter(f => f.type === 'mRNA' || f.type === 'transcript' || f.type === 'primary_transcript');
    const featuresByParent = data.features.reduce((acc: any, feature) => {
        if (feature.parent) {
            if (!acc[feature.parent]) acc[feature.parent] = [];
            acc[feature.parent].push(feature);
        }
        return acc;
    }, {});

    const rowHeight = 60;
    const chartHeight = Math.max(150, (transcripts.length * rowHeight) + 80);

    return (
        <div className="mt-4 p-4 border rounded bg-dark shadow-lg overflow-auto" style={{ maxHeight: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-light m-0 opacity-75">Gene Structure: <span className="text-info">{data.symbol}</span> <small className="ms-2">({chr}:{viewStart.toLocaleString()}-{viewEnd.toLocaleString()})</small></h6>
                <div className="d-flex align-items-center gap-2">
                    {currentIndex !== null && (
                        <div className="btn-group btn-group-sm me-2">
                            {isZoomed && (
                                <button className="btn btn-outline-danger" onClick={() => setZoomWindow(null)} title="Reset Zoom">Reset</button>
                            )}
                            <button className="btn btn-outline-light" onClick={() => setZoomWindow(prev => prev ? prev * 2 : 1000)} title="Zoom Out">
                                <i className="bi bi-zoom-out">−</i>
                            </button>
                            <button className="btn btn-outline-light" onClick={() => setZoomWindow(prev => prev ? Math.max(50, prev / 2) : 5000)} title="Zoom In">
                                <i className="bi bi-zoom-in">+</i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`} preserveAspectRatio="xMidYMin meet">
                {transcripts.map((transcript, idx) => {
                    const yBase = 30 + (idx * rowHeight);
                    const children = featuresByParent[transcript.id] || [];
                    const exons = children.filter((f: any) => f.type === 'exon');
                    const cds = children.filter((f: any) => f.type === 'cds');

                    return (
                        <g key={transcript.id}>
                            <text x={padding} y={yBase - 15} fontSize="10" fill="#666" fontFamily="monospace">{transcript.id}</text>
                            {/* Intron Line */}
                            <line x1={scale(transcript.start)} y1={yBase} x2={scale(transcript.end)} y2={yBase} stroke="#444" strokeWidth="1" />
                            
                            {/* Exons */}
                            {exons.map((exon: any, i: number) => (
                                <rect
                                    key={`exon-${idx}-${i}`}
                                    x={scale(exon.start)}
                                    y={yBase - 8}
                                    width={Math.max(1, scale(exon.end) - scale(exon.start))}
                                    height={16}
                                    fill="#4a4a4a"
                                    stroke="#666"
                                    rx="1"
                                />
                            ))}

                            {/* CDS */}
                            {cds.map((c: any, i: number) => (
                                <rect
                                    key={`cds-${idx}-${i}`}
                                    x={scale(c.start)}
                                    y={yBase - 12}
                                    width={Math.max(1, scale(c.end) - scale(c.start))}
                                    height={24}
                                    fill="#3399ff"
                                    fillOpacity="0.9"
                                    stroke="#55aaff"
                                    rx="1"
                                />
                            ))}
                        </g>
                    );
                })}

                {/* Current Position Indicator */}
                {currentIndex !== null && (
                    <g>
                        <line 
                            x1={scale(start + currentIndex)} 
                            y1={20} 
                            x2={scale(start + currentIndex)} 
                            y2={chartHeight - 25} 
                            stroke="#ffc107" 
                            strokeWidth="2"
                            strokeDasharray="4,2"
                        />
                    </g>
                )}

                <g transform={`translate(${padding}, ${chartHeight - 15})`}>
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