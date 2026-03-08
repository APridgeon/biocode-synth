import * as Tone from 'tone';

export const setupSynth = (synthType: "MonoSynth" | "FMSynth" | "AMSynth" | "Synth" | "DuoSynth" | "MembraneSynth" | "PluckSynth" | "MetalSynth" | "NoiseSynth"  = "Synth") => {
    console.log(synthType);
    let synth: any = new Tone[synthType]().toDestination();
    const panner = new Tone.Panner(0).toDestination();
    const delay = new Tone.FeedbackDelay(0, 0).connect(panner);
    
    synth.connect(delay);
    synth.connect(panner);

    const start = () => { synth.triggerAttack(440); }
    const stop = () => { synth.triggerRelease(); }

    return {
        oscillator: synth.oscillator,
        setFrequency: (freq: number) => { synth.frequency.value = freq; },
        setVolume: (vol: number) => { synth.volume.value = Tone.gainToDb(vol); },
        setFilter: (freq: number) => { synth.filter.frequency.value = freq; },
        setDelay: (time: number) => { delay.delayTime.value = time; },
        setPanning: (pan: number) => { panner.pan.value = pan; },
        init: () => { Tone.start(); },
        setType: (type: typeof synthType) => {
            synth.disconnect(delay);
            synth.disconnect(panner);
            synth.dispose();
            synth = new Tone[type]().toDestination();
            synth.connect(delay);
            synth.connect(panner);
        },
        start,
        stop,
    };
}


export const synth = setupSynth('Synth')
