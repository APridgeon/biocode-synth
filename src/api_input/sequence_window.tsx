import { useState, useEffect } from 'react';

const FastaWindow = ({ g_positions, currentIndex }: { g_positions: any[] | null, currentIndex: number | null }) => {
    const [windowSize, setWindowSize] = useState(50);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 576) setWindowSize(15);
            else if (width < 768) setWindowSize(25);
            else if (width < 992) setWindowSize(35);
            else setWindowSize(50);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!g_positions || g_positions.length === 0) return null;
    
    const halfWindow = Math.floor(windowSize / 2);
    
    const center = currentIndex ?? 0;
    const sequenceLength = g_positions.length;
    let start = Math.max(0, center - halfWindow);
    let end = Math.min(sequenceLength, start + windowSize);
    
    // Adjust start if we are near the end of the sequence
    if (end - start < windowSize) {
        start = Math.max(0, end - windowSize);
    }

    const windowSlice = g_positions.slice(start, end);
    
    const getBaseColor = (base: string) => {
        switch (base) {
            case 'A': return '#ff4d4d'; // Vivid Red
            case 'T': return '#33ff33'; // Vivid Green
            case 'C': return '#3399ff'; // Vivid Blue
            case 'G': return '#ffff00'; // Vivid Yellow
            default: return 'inherit';
        }
    };

    return (
        <div className="mt-3 p-3 bg-dark text-white font-monospace shadow-lg" style={{ borderRadius: '8px', border: '1px solid #444' }}>
            <div className="d-flex flex-column gap-1">
                {/* Alts Row */}
                <div className="d-flex align-items-center">
                    <span className="text-info small fw-bold me-2" style={{ minWidth: '45px' }}>ALT</span>
                    <div className="d-flex overflow-hidden">
                        {windowSlice.map((p: any, i: number) => {
                            const isCurrent = (start + i) === currentIndex;
                            let alts = Array.isArray(p.alts) ? [...p.alts] : (p.alts ? [p.alts] : []);
                            alts.sort((a, b) => b.length - a.length);
                            return (
                                <div key={i} className="d-flex flex-column align-items-center" style={{ width: '2.5ch' }}>
                                    <div className="d-flex flex-column align-items-center" style={{ minHeight: '3rem', justifyContent: 'end' }}>
                                        {alts.length > 0 ? alts.map((alt: string, ai: number) => (
                                            <span key={ai} className={`${isCurrent ? "text-warning fw-bold" : "text-info"}`} style={{ fontSize: '0.7rem', lineHeight: '1' }}>{alt}</span>
                                        )) : <span className="text-muted" style={{ fontSize: '0.7rem' }}>·</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Ref Row */}
                <div className="d-flex align-items-center">
                    <span className="text-secondary small fw-bold me-2" style={{ minWidth: '45px' }}>REF</span>
                    <div className="d-flex overflow-hidden">
                        {windowSlice.map((p: any, i: number) => {
                            const isCurrent = (start + i) === currentIndex;
                            return (
                                <div key={i} className="d-flex flex-column align-items-center" style={{ width: '2.5ch' }}>
                                    <span 
                                        className={`d-flex align-items-center justify-content-center ${isCurrent ? "bg-warning text-dark fw-bold rounded-circle" : ""}`}
                                        style={{ width: '2ch', height: '2ch', color: isCurrent ? undefined : getBaseColor(p.ref) }}
                                    >
                                        {p.ref}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FastaWindow;