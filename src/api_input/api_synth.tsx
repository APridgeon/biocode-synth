import * as Tone from 'tone';
import type { process_gene_data } from './process_gene_data';
import { useState } from 'react';
import getGeneData from './info_retrieval';
import SynthSettingsBar from './synth_settings';
import FastaWindow from './sequence_window';


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
    private delay: Tone.FeedbackDelay | null = null;
    private limiter: Tone.Limiter | null = null;

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
        if (!this.delay) {
            this.delay = new Tone.FeedbackDelay("8n", 0.5).connect(this.limiter);
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
    setConfiguration(newType?: string, options?: any, key: string = "default") {
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
    gene_data 
}: { g_positions: ReturnType<typeof process_gene_data>, gene_data: Awaited<ReturnType<typeof getGeneData>> | null }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [synthSettings, setSynthSettings] = useState({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 },
        delayWet: 0.15,
        delayTime: '8n'
    });

    const handleInit = async () => {
        await synth.init();
        synth.setConfiguration("FMSynth", synthSettings);
        // Initialize multiple alt synths to handle potential multiple concurrent variants
        for (let i = 0; i < 5; i++) {
            synth.setConfiguration("Synth", { ...synthSettings, volume: -12 }, `altSynth_${i}`);
        }
        synth.setDelay(synthSettings.delayWet, synthSettings.delayTime);
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
        setIsPlaying(true);

        let currentTime = 0.1;

        g_positions.forEach((pos, index: number) => {
            const randomTiming = '8n' // durations[Math.floor(Math.random() * durations.length)];
            Tone.getTransport().schedule((time) => {
                Tone.getDraw().schedule(() => setCurrentIndex(index), time);
                // Play Reference Base
                synth.triggerAttackRelease(dna_note_map[pos.ref] || "C4", randomTiming, time);
                // Play Alt Base on a different synth if it exists
                if (Array.isArray(pos.alts)) {
                    pos.alts.forEach((alt: string, altIdx: number) => {
                        synth.triggerAttackRelease(dna_note_map[alt] || "E3", randomTiming, time, `altSynth_${altIdx}`);
                    });
                }
            }, `+${currentTime}`);
            currentTime += Tone.Time(randomTiming).toSeconds();
        });

        Tone.getTransport().schedule(() => {
            Tone.getDraw().schedule(() => setIsPlaying(false), Tone.now());
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
        setCurrentIndex(null);
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
                <button className="btn btn-outline-primary btn-sm" onClick={playNotes} disabled={isPlaying}>
                    Play Sequence
                </button>
                <button className="btn btn-outline-warning btn-sm" onClick={togglePause}>
                    Pause/Resume
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={stopPlayback}>
                    Stop
                </button>
            </div>

            <SynthSettingsBar 
                synthSettings={synthSettings}
                updateOscillator={updateOscillator}
                updateEnvelope={updateEnvelope}
                updateDelayTime={updateDelayTime}
                updateDelay={updateDelay}
            />

            <FastaWindow g_positions={g_positions} currentIndex={currentIndex} />
        </div>
    );
}

export default ToneInstanceGenerator;
