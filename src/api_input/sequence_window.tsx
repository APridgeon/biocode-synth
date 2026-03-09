const FastaWindow = ({ g_positions, currentIndex }: { g_positions: any[] | null, currentIndex: number | null }) => {
    if (!g_positions || g_positions.length === 0) return null;
    
    const windowSize = 50;
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

    const renderRow = (type: 'ref' | 'alts') => (
        <div className="d-flex align-items-center">
            <span className="text-muted me-2" style={{ minWidth: '40px' }}>{type.toUpperCase()}:</span>
            <span className="text-muted">...</span>
            <div className="d-flex">
                {windowSlice.map((p: any, i: number) => {
                const isCurrent = (start + i) === currentIndex;
                const val = type === 'ref' ? p.ref : (p.alts || '-');
                const color = type === 'ref' ? getBaseColor(val) : 'inherit';
                
                return (
                    <span key={i} className={isCurrent ? "bg-warning text-dark fw-bold" : ""} style={{ width: '1.5ch', textAlign: 'center', display: 'inline-block', color: isCurrent ? undefined : color }}>
                        {val}
                    </span>
                );
                })}
            </div>
            <span className="text-muted">...</span>
        </div>
    );

    return (
        <div className="mt-3 p-2 bg-dark text-white font-monospace" style={{ wordBreak: 'break-all', fontSize: '1rem', borderRadius: '4px' }}>
            {renderRow('alts')}
            {renderRow('ref')}
        </div>
    );
};

export default FastaWindow;