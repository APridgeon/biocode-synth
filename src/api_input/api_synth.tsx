import * as Tone from 'tone';
import type { process_gene_data } from './process_gene_data';
import { useState } from 'react';
import getGeneData from './info_retrieval';
import SynthSettingsBar from './synth_settings';
import FastaWindow from './sequence_window';
import GeneDiagram from './gene_diagram';
import type { ClinVarMap, ClinicalSignificance } from './clinvar_retrieval';
import { topSignificance } from './clinvar_retrieval';
import { SIG_CONFIG } from './gene_info_card';


type NoteMap = Record<string, string>;

interface NotePreset {
    label: string;
    description: string;
    ref: NoteMap;
    alt: NoteMap;
}

const NOTE_MAP_PRESETS: Record<string, NotePreset> = {
    jazz: {
        label: 'Jazz',
        description: 'Dark, bluesy feel (minor 7th)',
        ref: { A: 'C4', T: 'Eb4', C: 'G4', G: 'Bb4' },
        alt: { A: 'C3', T: 'Eb3', C: 'G3', G: 'Bb3' },
    },
    classical: {
        label: 'Classical',
        description: 'Bright, uplifting (major 7th)',
        ref: { A: 'C4', T: 'E4', C: 'G4', G: 'B4' },
        alt: { A: 'C3', T: 'E3', C: 'G3', G: 'B3' },
    },
    pentatonic: {
        label: 'Pentatonic',
        description: 'Simple, ear-friendly scale',
        ref: { A: 'C4', T: 'D4', C: 'E4', G: 'G4' },
        alt: { A: 'A3', T: 'B3', C: 'C3', G: 'D3' },
    },
    dramatic: {
        label: 'Dramatic',
        description: 'Wide range, bold contrast',
        ref: { A: 'C3', T: 'G4', C: 'E4', G: 'B4' },
        alt: { A: 'C2', T: 'G3', C: 'E3', G: 'B3' },
    },
    tense: {
        label: 'Tense',
        description: 'Dissonant, mysterious',
        ref: { A: 'C4', T: 'Db4', C: 'Eb4', G: 'F4' },
        alt: { A: 'C3', T: 'Db3', C: 'Eb3', G: 'F3' },
    },
};



/**
 * A simple wrapper for a Tone.js Synth instance.
 * This provides a basic interface to initialize, start, stop, and change the synth type.
 */
class ToneSynth {
    private synths: Map<string, any> = new Map();
    private type: string = "Synth";
    private activeSynthKey: string = "default";
    private options: any = {};
    private delay: Tone.FeedbackDelay | null = null;
    private limiter: Tone.Limiter | null = null;
    private reverb: Tone.Reverb | null = null;

    /**
     * Initializes the Tone.js context and creates the synth instance if it doesn't exist.
     */
    async init() {
        if (Tone.getContext().state !== 'running') {
            await Tone.start();
        }
        if (!this.limiter) {
            this.limiter = new Tone.Limiter(-6).toDestination();
        }
        if (!this.reverb) {
            this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).connect(this.limiter);
            await this.reverb.generate();
        }
        if (!this.delay) {
            this.delay = new Tone.FeedbackDelay("8n", 0.4).connect(this.reverb);
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
        const dest = this.delay ? this.delay : (this.limiter ? this.limiter : Tone.getDestination());
        switch (this.type) {
            case "MonoSynth": newSynth = new Tone.MonoSynth(this.options).connect(dest); break;
            case "FMSynth": newSynth = new Tone.FMSynth(this.options).connect(dest); break;
            case "AMSynth": newSynth = new Tone.AMSynth(this.options).connect(dest); break;
            case "DuoSynth": newSynth = new Tone.DuoSynth(this.options).connect(dest); break;
            case "MembraneSynth": newSynth = new Tone.MembraneSynth(this.options).connect(dest); break;
            case "PluckSynth": newSynth = new Tone.PluckSynth(this.options).connect(dest); break;
            case "MetalSynth": newSynth = new Tone.MetalSynth(this.options).connect(dest); break;
            case "NoiseSynth": newSynth = new Tone.NoiseSynth(this.options).connect(dest); break;
            case "PolySynth": newSynth = new Tone.PolySynth(Tone.Synth, this.options).connect(dest); break;
            default: newSynth = new Tone.Synth(this.options).connect(dest); break;
        }
        this.synths.set(key, newSynth);
    }

    /**
     * Sets the synth type and options, then re-initializes the instance.
     */
    setConfiguration(newType?: string, options?: any, _key: string = "default") {
        if (newType) this.type = newType;
        if (options) {
            this.options = { ...options };
            if (this.synths.has(this.activeSynthKey)) {
                this.synths.get(this.activeSynthKey).set(options);
            }
        }
        this.createSynth(this.activeSynthKey);
    }

    setDelay(wet: number, delayTime?: string) {
        if (this.delay) {
            this.delay.wet.value = wet;
            if (delayTime) this.delay.delayTime.value = delayTime;
        }
    }


    /**
     * Triggers a single note.
     */
    triggerAttackRelease(note: string, duration: string, time?: number, key: string = "default") {
        if (!this.synths.has(key)) this.createSynth(key);
        const targetSynth = this.synths.get(key);
        targetSynth?.triggerAttackRelease(note, duration, time);
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


const ToneInstanceGenerator = ({
    g_positions,
    gene_data,
    clinvarMap,
}: {
    g_positions: ReturnType<typeof process_gene_data>;
    gene_data: Awaited<ReturnType<typeof getGeneData>> | null;
    clinvarMap: ClinVarMap | null;
}) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activePreset, setActivePreset] = useState<string>('jazz');
    const [currentSig, setCurrentSig] = useState<ClinicalSignificance | null>(null);
    const [synthSettings, setSynthSettings] = useState({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 1.2 },
        delayWet: 0.15,
        delayTime: '8n',
        playbackSpeed: 1
    });

    const handleInit = async () => {
        await synth.init();
        synth.setConfiguration("FMSynth", synthSettings);
        for (let i = 0; i < 5; i++) {
            synth.setConfiguration("AMSynth", { ...synthSettings, volume: -15 }, `altSynth_${i}`);
        }
        // Dedicated synth for pathogenic/likely-pathogenic variants — louder, plucked timbre
        synth.setConfiguration("PluckSynth", { volume: 0 }, 'pathogenicSynth');
        synth.setDelay(synthSettings.delayWet, synthSettings.delayTime);
        setIsInitialized(true);
    };

    const playNotes = async () => {
        if (!g_positions) return;

        if (!isInitialized) await handleInit();

        if (Tone.getTransport().state === "started") {
            Tone.getTransport().stop();
            Tone.getTransport().cancel();
        }
        setIsPlaying(true);
        setCurrentSig(null);

        const preset = NOTE_MAP_PRESETS[activePreset];
        const dna_note_map = preset.ref;
        const alt_note_map = preset.alt;

        let currentTime = 0.1;
        const startIndex = currentIndex ?? 0;
        const remainingPositions = g_positions.slice(startIndex);
        const speedMultiplier = 1 / synthSettings.playbackSpeed;

        remainingPositions.forEach((pos, i: number) => {
            const actualIndex = startIndex + i;
            const baseTiming = '8n';
            const scaledDuration = Tone.Time(baseTiming).toSeconds() * speedMultiplier;

            // Look up ClinVar significance for this genomic position
            const cvVariants = clinvarMap?.get(pos.gloc) ?? [];
            const sig: ClinicalSignificance | null = cvVariants.length > 0 ? topSignificance(cvVariants) : null;
            const isPathogenic = sig === 'pathogenic' || sig === 'likely_pathogenic';

            Tone.getTransport().schedule((time) => {
                Tone.getDraw().schedule(() => {
                    setCurrentIndex(actualIndex);
                    setCurrentSig(sig);
                }, time);

                synth.triggerAttackRelease(dna_note_map[pos.ref] || "C4", `${scaledDuration}s`, time);

                if (Array.isArray(pos.alts) && pos.alts.length > 0) {
                    if (isPathogenic) {
                        // Pathogenic: play a distinct accent note via PluckSynth — same octave as ref (prominent)
                        const accentNote = dna_note_map[pos.alts[0]?.[0]] || dna_note_map[pos.ref] || "C4";
                        synth.triggerAttackRelease(accentNote, `${scaledDuration}s`, time, 'pathogenicSynth');
                    }
                    pos.alts.forEach((alt: string, altIdx: number) => {
                        if (alt.length > 1) {
                            const subDuration = scaledDuration / alt.length;
                            alt.split('').forEach((char, charIdx) => {
                                synth.triggerAttackRelease(
                                    alt_note_map[char] || "E3",
                                    `${subDuration}s`,
                                    time + charIdx * subDuration,
                                    `altSynth_${altIdx}`
                                );
                            });
                        } else {
                            synth.triggerAttackRelease(alt_note_map[alt] || "E3", `${scaledDuration}s`, time, `altSynth_${altIdx}`);
                        }
                    });
                }
            }, `+${currentTime}`);
            currentTime += scaledDuration;
        });

        Tone.getTransport().schedule(() => {
            Tone.getDraw().schedule(() => { setIsPlaying(false); setCurrentSig(null); }, Tone.now());
        }, `+${currentTime}`);

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
        // setCurrentIndex(null);
        setIsPlaying(false);
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

    const updateDelay = (value: number) => {
        setSynthSettings(prev => ({ ...prev, delayWet: value }));
        synth.setDelay(value);
    };

    const updateDelayTime = (value: string) => {
        setSynthSettings(prev => ({ ...prev, delayTime: value }));
        synth.setDelay(synthSettings.delayWet, value);
    };

    const updatePlaybackSpeed = (value: number) => {
        setSynthSettings(prev => ({ ...prev, playbackSpeed: value }));
    };

    const skipToNextPathogenic = () => {
        if (!g_positions || !clinvarMap) return;
        const searchFrom = (currentIndex ?? -1) + 1;
        for (let i = searchFrom; i < g_positions.length; i++) {
            const cvVariants = clinvarMap.get(g_positions[i].gloc) ?? [];
            if (cvVariants.length > 0) {
                const sig = topSignificance(cvVariants);
                if (sig === 'pathogenic' || sig === 'likely_pathogenic') {
                    stopPlayback();
                    setCurrentIndex(i);
                    return;
                }
            }
        }
        // Wrap around to first pathogenic variant
        for (let i = 0; i < searchFrom; i++) {
            const cvVariants = clinvarMap.get(g_positions[i].gloc) ?? [];
            if (cvVariants.length > 0) {
                const sig = topSignificance(cvVariants);
                if (sig === 'pathogenic' || sig === 'likely_pathogenic') {
                    stopPlayback();
                    setCurrentIndex(i);
                    return;
                }
            }
        }
    };

    const hasPathogenicVariants = g_positions && clinvarMap &&
        g_positions.some(p => {
            const cv = clinvarMap.get(p.gloc) ?? [];
            if (!cv.length) return false;
            const s = topSignificance(cv);
            return s === 'pathogenic' || s === 'likely_pathogenic';
        });

    const preset = NOTE_MAP_PRESETS[activePreset];

    return (
        <div>
            {g_positions && (
                <div className="card shadow-sm mb-3">
                    <div className="card-body">
                        {/* Primary controls */}
                        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-center mb-3">
                            <button
                                className="btn btn-success btn-lg px-5"
                                onClick={playNotes}
                                disabled={isPlaying}
                            >
                                {isPlaying ? (
                                    <><span className="spinner-border spinner-border-sm me-2" />Playing…</>
                                ) : '▶ Play'}
                            </button>
                            <button className="btn btn-warning btn-lg" onClick={togglePause}>
                                ⏸ Pause
                            </button>
                            <button className="btn btn-danger btn-lg" onClick={stopPlayback}>
                                ⏹ Stop
                            </button>
                            {hasPathogenicVariants && (
                                <button
                                    className="btn btn-lg btn-outline-danger"
                                    onClick={skipToNextPathogenic}
                                    title="Jump to next pathogenic or likely-pathogenic variant"
                                >
                                    ⏭ Skip to Pathogenic
                                </button>
                            )}
                        </div>

                        {/* Note style + speed */}
                        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-center mb-2">
                            <div className="d-flex align-items-center gap-2">
                                <label className="small fw-semibold mb-0">Sound style:</label>
                                <div className="btn-group btn-group-sm">
                                    {Object.entries(NOTE_MAP_PRESETS).map(([key, p]) => (
                                        <button
                                            key={key}
                                            className={`btn ${activePreset === key ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setActivePreset(key)}
                                            title={p.description}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <label className="small fw-semibold mb-0">Speed: {synthSettings.playbackSpeed}x</label>
                                <input
                                    type="range"
                                    className="form-range"
                                    style={{ width: '100px' }}
                                    min="0.1" max="4" step="0.1"
                                    value={synthSettings.playbackSpeed}
                                    onChange={(e) => updatePlaybackSpeed(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Note map legend */}
                        <div className="text-center mb-2">
                            <small className="text-muted">
                                <span className="fw-semibold">{preset.label}</span> — {preset.description} &nbsp;|&nbsp;
                                {Object.entries(preset.ref).map(([base, note]) => (
                                    <span key={base} className="me-2">
                                        <span className="badge bg-secondary">{base}</span> {note}
                                    </span>
                                ))}
                                <span className="ms-1 text-muted">(variants an octave lower)</span>
                            </small>
                        </div>

                        {/* ClinVar live indicator */}
                        <div
                            className="text-center mt-2 py-2 rounded fw-bold"
                            style={{
                                backgroundColor: currentSig && currentSig !== 'other'
                                    ? SIG_CONFIG[currentSig].color
                                    : 'transparent',
                                color: currentSig && currentSig !== 'other' ? '#fff' : 'transparent',
                                transition: 'background-color 0.2s, color 0.2s',
                                letterSpacing: '0.05em',
                                border: '2px solid transparent',
                            }}
                        >
                            {currentSig && currentSig !== 'other' ? SIG_CONFIG[currentSig].label : ' '}
                        </div>

                        {/* Scroll position */}
                        {g_positions && (
                            <div className="d-flex align-items-center gap-2 justify-content-center mt-2">
                                <label className="small text-muted mb-0">Start position:</label>
                                <input
                                    type="range"
                                    className="form-range"
                                    style={{ width: '200px' }}
                                    min="0"
                                    max={g_positions.length - 1}
                                    value={currentIndex ?? 0}
                                    onChange={(e) => {
                                        stopPlayback();
                                        setCurrentIndex(parseInt(e.target.value));
                                    }}
                                />
                                <span className="small text-muted">
                                    {currentIndex ?? 0} / {g_positions.length - 1}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!g_positions && (
                <div className="text-center text-muted py-5">
                    <p className="fs-5">Search for a gene above to get started.</p>
                </div>
            )}

            <SynthSettingsBar
                synthSettings={synthSettings}
                updateOscillator={updateOscillator}
                updateEnvelope={updateEnvelope}
                updateDelayTime={updateDelayTime}
                updateDelay={updateDelay}
            />

            <FastaWindow g_positions={g_positions} currentIndex={currentIndex} clinvarMap={clinvarMap} />

            <GeneDiagram data={gene_data} currentIndex={currentIndex} />
        </div>
    );
}

export default ToneInstanceGenerator;
