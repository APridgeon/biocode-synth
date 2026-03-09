
const SynthSettingsBar = ({ 
    synthSettings, 
    updateOscillator, 
    updateEnvelope, 
    updateDelayTime, 
    updateDelay 
}: { 
    synthSettings: any, 
    updateOscillator: (type: string) => void, 
    updateEnvelope: (field: string, value: number) => void, 
    updateDelayTime: (value: string) => void, 
    updateDelay: (value: number) => void 
}) => {
    return (
        <nav className="navbar fixed-bottom navbar-expand-lg navbar-dark bg-dark px-3">
            <div className="container-fluid">
                <span className="navbar-brand mb-0 h1 small">Synth Settings</span>
                <div className="collapse navbar-collapse d-flex gap-4">
                    <div className="d-flex align-items-center gap-2">
                        <label className="text-white small mb-0">Oscillator</label>
                        <select 
                            className="form-select form-select-sm bg-secondary text-white border-0" 
                            style={{ width: 'auto' }}
                            value={synthSettings.oscillator.type} 
                            onChange={(e) => updateOscillator(e.target.value)}
                        >
                            {['triangle', 'sine', 'square', 'sawtooth'].map(type => (
                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="nav-item dropup">
                        <button className="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            Envelope
                        </button>
                        <ul className="dropdown-menu p-3" style={{ minWidth: '250px' }}>
                            <li className="mb-2">
                                <label className="form-label small">Attack: {synthSettings.envelope.attack}</label>
                                <input type="range" className="form-range" min="0.001" max="2" step="0.1" 
                                    value={synthSettings.envelope.attack} 
                                    onChange={(e) => updateEnvelope('attack', Number(e.target.value))} 
                                />
                            </li>
                            <li className="mb-2">
                                <label className="form-label small">Decay: {synthSettings.envelope.decay}</label>
                                <input type="range" className="form-range" min="0.1" max="2" step="0.1" 
                                    value={synthSettings.envelope.decay} 
                                    onChange={(e) => updateEnvelope('decay', Number(e.target.value))} 
                                />
                            </li>
                            <li>
                                <label className="form-label small">Release: {synthSettings.envelope.release}</label>
                                <input type="range" className="form-range" min="0.1" max="5" step="0.1" 
                                    value={synthSettings.envelope.release} 
                                    onChange={(e) => updateEnvelope('release', Number(e.target.value))} 
                                />
                            </li>
                        </ul>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <label className="text-white small mb-0">Delay Time</label>
                        <select 
                            className="form-select form-select-sm bg-secondary text-white border-0" 
                            style={{ width: 'auto' }}
                            value={synthSettings.delayTime} 
                            onChange={(e) => updateDelayTime(e.target.value)}
                        >
                            {['2n', '4n', '8n', '16n', '32n'].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <label className="text-white small mb-0" style={{ minWidth: '80px' }}>Delay: {Math.round(synthSettings.delayWet * 100)}%</label>
                        <input type="range" className="form-range" min="0" max="1" step="0.01" 
                            value={synthSettings.delayWet} 
                            onChange={(e) => updateDelay(Number(e.target.value))} 
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default SynthSettingsBar;