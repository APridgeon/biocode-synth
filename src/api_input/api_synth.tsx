import * as Tone from 'tone';
import type { process_gene_data } from './process_gene_data';
import { useState } from 'react';
import getGeneData from './info_retrieval';


const dna_note_map: Record<string, string> = {
    'A': 'C4',
    'T': 'E4',
    'C': 'G4',
    'G': 'B4'
};

const durations = ['1n', '2n', '4n', '8n', '16n', '32n'];


/**
 * A simple wrapper for a Tone.js Synth instance.
 * This provides a basic interface to initialize, start, stop, and change the synth type.
 */
class ToneSynth {
    private synths: Map<string, any> = new Map();
    private type: string = "Synth";
    private activeSynthKey: string = "default";
    private options: any = {};

    /**
     * Initializes the Tone.js context and creates the synth instance if it doesn't exist.
     */
    async init() {
        if (Tone.getContext().state !== 'running') {
            await Tone.start();
        }
        if (!this.synths.has(this.activeSynthKey)) {
            this.createSynth(this.activeSynthKey);
        }
    }

    /**
     * Internal helper to instantiate the specific Tone.js synth class.
     */
    private createSynth(key: string) {
        if (this.synths.has(key)) {
            this.synths.get(key).dispose();
        }

        let newSynth;
        // Mapping string types to Tone.js classes
        switch (this.type) {
            case "MonoSynth": newSynth = new Tone.MonoSynth(this.options).toDestination(); break;
            case "FMSynth": newSynth = new Tone.FMSynth(this.options).toDestination(); break;
            case "AMSynth": newSynth = new Tone.AMSynth(this.options).toDestination(); break;
            case "DuoSynth": newSynth = new Tone.DuoSynth(this.options).toDestination(); break;
            case "MembraneSynth": newSynth = new Tone.MembraneSynth(this.options).toDestination(); break;
            case "PluckSynth": newSynth = new Tone.PluckSynth(this.options).toDestination(); break;
            case "MetalSynth": newSynth = new Tone.MetalSynth(this.options).toDestination(); break;
            case "NoiseSynth": newSynth = new Tone.NoiseSynth(this.options).toDestination(); break;
            case "PolySynth": newSynth = new Tone.PolySynth(Tone.Synth, this.options).toDestination(); break;
            default: newSynth = new Tone.Synth(this.options).toDestination(); break;
        }
        this.synths.set(key, newSynth);
    }

    /**
     * Sets the synth type and options, then re-initializes the instance.
     */
    setConfiguration(newType?: string, options?: any) {
        if (newType) this.type = newType;
        if (options) {
            this.options = { ...this.options, ...options };
            if (this.synths.has(this.activeSynthKey)) {
                this.synths.get(this.activeSynthKey).set(options);
            }
        }
        this.createSynth(this.activeSynthKey);
    }

    /**
     * Triggers a single note.
     */
    triggerAttackRelease(note: string, duration: string, time?: number) {
        if (!this.synths.has(this.activeSynthKey)) this.init();
        this.synths.get(this.activeSynthKey)?.triggerAttackRelease(note, duration, time);
    }

    /**
     * Starts the synth (placeholder for transport-based logic if needed).
     */
    start() {
        console.log("Synth started");
    }

    /**
     * Stops all sounds and releases the synth.
     */
    stop() {
        this.synths.forEach(s => {
            s.releaseAll?.();
            if (s.triggerRelease) s.triggerRelease();
        });
        Tone.getTransport().stop();
    }

    get instance() {
        return this.synths.get(this.activeSynthKey);
    }
}

export const synth = new ToneSynth();

/**
 * React Component to initialize and test the ToneJS instance.
 */
const ToneInstanceGenerator = ({ 
    g_positions, 
    gene_data 
}: { g_positions: ReturnType<typeof process_gene_data>, gene_data: Awaited<ReturnType<typeof getGeneData>> | null }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [synthSettings, setSynthSettings] = useState({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }
    });

    const renderFastaWindow = () => {
        if (!gene_data?.fasta) return null;
        const sequence = gene_data.fasta;
        const windowSize = 50;
        const halfWindow = Math.floor(windowSize / 2);
        
        const center = currentIndex ?? 0;
        let start = Math.max(0, center - halfWindow);
        let end = Math.min(sequence.length, start + windowSize);
        
        // Adjust start if we are near the end of the sequence
        if (end - start < windowSize) {
            start = Math.max(0, end - windowSize);
        }

        const prefix = sequence.substring(start, center);
        const highlight = currentIndex !== null ? sequence[center] : "";
        const suffix = sequence.substring(center + (highlight ? 1 : 0), end);

        return (
            <div className="mt-3 p-2 bg-dark text-white font-monospace" style={{ wordBreak: 'break-all', fontSize: '1rem', borderRadius: '4px' }}>
                <span className="text-muted">...</span>
                {prefix}
                <span className="bg-warning text-dark fw-bold">{highlight}</span>
                {suffix}
                <span className="text-muted">...</span>
            </div>
        );
    };

    const handleInit = async () => {
        await synth.init();
        synth.setConfiguration("Synth", synthSettings);
        setIsInitialized(true);
        console.log("Tone.js Initialized with positions:", g_positions);
    };

    const playNotes = () => {
        if (!g_positions) return;
        console.log("Playing positions:", g_positions);
        
        if (Tone.getTransport().state === "started") {
            Tone.getTransport().stop();
            Tone.getTransport().cancel();
        }

        let currentTime = 0.1;

        g_positions.forEach((pos: any, index: number) => {
            const randomTiming = '8n' // durations[Math.floor(Math.random() * durations.length)];
            Tone.getTransport().schedule((time) => {
                Tone.Draw.schedule(() => setCurrentIndex(index), time);
                synth.triggerAttackRelease(dna_note_map[pos.ref] || "C4", randomTiming, time);
            }, `+${currentTime}`);
            currentTime += Tone.Time(randomTiming).toSeconds();
        });

        Tone.getTransport().start();
    };

    const togglePause = () => {
        if (Tone.getTransport().state === "started") {
            Tone.getTransport().pause();
        } else {
            Tone.getTransport().start();
        }
    };

    const stopPlayback = () => {
        Tone.getTransport().stop();
        Tone.getTransport().cancel();
        setCurrentIndex(null);
    };

    const updateEnvelope = (field: string, value: number) => {
        const newSettings = { ...synthSettings, envelope: { ...synthSettings.envelope, [field]: value } };
        setSynthSettings(newSettings);
        synth.setConfiguration(undefined, newSettings);
    };

    const updateOscillator = (type: string) => {
        const newSettings = { ...synthSettings, oscillator: { type } };
        setSynthSettings(newSettings);
        synth.setConfiguration(undefined, newSettings);
    };

    return (
        <div className="p-3 border rounded shadow-sm bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="m-0">Tone.js Controller</h5>
                {currentIndex !== null && g_positions && g_positions[currentIndex] && (
                    <div className="d-flex gap-2">
                        <span className="badge bg-info text-dark">Index: {currentIndex}</span>
                        <span className="badge bg-secondary">Ref: {g_positions[currentIndex].ref} | Alt: {g_positions[currentIndex].alts}</span>
                    </div>
                )}
            </div>
            <div className="d-flex gap-2">
                <button className={`btn btn-sm ${isInitialized ? 'btn-primary' : 'btn-outline-primary'}`} onClick={handleInit}>
                    Initialize Audio
                </button>
                <button className="btn btn-outline-primary btn-sm" onClick={playNotes}>
                    Play Sequence
                </button>
                <button className="btn btn-outline-warning btn-sm" onClick={togglePause}>
                    Pause/Resume
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={stopPlayback}>
                    Stop
                </button>
            </div>

            <div className="row mt-3 g-2">
                <div className="col-md-12">
                    <label className="form-label small">Oscillator Type</label>
                    <select 
                        className="form-select form-select-sm" 
                        value={synthSettings.oscillator.type} 
                        onChange={(e) => updateOscillator(e.target.value)}
                    >
                        {['triangle', 'sine', 'square', 'sawtooth'].map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="form-label small">Attack: {synthSettings.envelope.attack}</label>
                    <input type="range" className="form-range" min="0.001" max="2" step="0.1" value={synthSettings.envelope.attack} onChange={(e) => updateEnvelope('attack', Number(e.target.value))} />
                </div>
                <div className="col-md-6">
                    <label className="form-label small">Decay: {synthSettings.envelope.decay}</label>
                    <input type="range" className="form-range" min="0.1" max="2" step="0.1" value={synthSettings.envelope.decay} onChange={(e) => updateEnvelope('decay', Number(e.target.value))} />
                </div>
                <div className="col-md-6">
                    <label className="form-label small">Release: {synthSettings.envelope.release}</label>
                    <input type="range" className="form-range" min="0.1" max="5" step="0.1" value={synthSettings.envelope.release} onChange={(e) => updateEnvelope('release', Number(e.target.value))} />
                </div>
            </div>

            {renderFastaWindow()}
        </div>
    );
}

export default ToneInstanceGenerator;
