import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { synth } from "./synth"
import * as Tone from 'tone'
import { sequence_manager } from "./sequenceManager"


function SynthInput() {

    const [isPlaying, setPlaying] = useState(false)
    const [sequenceMode, setSequenceMode] = useState("dna")

    const sequence_ref = useRef<{ sequence: string }>(null)

    const play_synth = async () => {

        console.log(sequence_manager.calculate_timings(sequenceMode as any))
        if(Tone.getContext().state == 'running'){
            synth.start()
        } else {
            synth.init()
            synth.start()
        }
        setPlaying(true)
    }

    const stop_synth = () => {
        synth.stop()
        setPlaying(false)
    }


    useEffect(() => {
        console.log(isPlaying)
    }, [isPlaying])




    return (
        <>
            <div className="container d-flex justify-content-center align-items-center" style={{minHeight: '50vh'}}>
                <div className="w-50">
                    <div className="d-flex justify-content-center mb-3">
                        <div className="btn-group" role="group" aria-label="Mode selection">
                            <input type="radio" className="btn-check" name="modeRadio" id="dnaMode" autoComplete="off" defaultChecked={sequenceMode === "dna"} onClick={() => setSequenceMode("dna")} />
                            <label className="btn btn-outline-success" htmlFor="dnaMode">DNA</label>
                            <input type="radio" className="btn-check" name="modeRadio" id="proteinMode" autoComplete="off" defaultChecked={sequenceMode === "protein"} onClick={() => setSequenceMode("protein")} />
                            <label className="btn btn-outline-success" htmlFor="proteinMode">Protein</label>
                        </div>
                    </div>
                    <SequenceInput sequenceMode={sequenceMode} ref={sequence_ref}/>
                    <div className="d-flex justify-content-center mt-3 gap-2">
                        <button className="btn btn-success px-4" id="playBtn" onClick={play_synth}>Play</button>
                        <button className="btn btn-secondary" id="stopBtn" onClick={stop_synth}>Stop</button>
                        <button className="btn btn-outline-danger" id="clearBtn">Clear</button>
                    </div>
                </div>
            </div>
        </>
    )
}

const SequenceInput = forwardRef((props: {sequenceMode: string}, ref) => {
    const { sequenceMode } = props


    const [sequence, setSequence] = useState("")

    const restrict_characters = (e: React.InputEvent<HTMLInputElement>) => {
        e.data = e.data.toUpperCase()
        switch(sequenceMode){
            case "dna":
                if (!['A', 'T', 'C', 'G'].includes(e.data)) {
                    e.preventDefault()
                }
                break
            case "protein":
                if (!['A', 'R', 'N', 'D', 'C', 'E', 'Q', 'G',
                     'H', 'I', 'L', 'K', 'M', 'F', 'P', 'S',
                      'T', 'W', 'Y', 'V'].includes(e.data)) {
                    e.preventDefault()
                }
                break
        }
    }

    useEffect(() => {
        setSequence("")
    }, [sequenceMode])

    useImperativeHandle(ref, () => ({
        sequence: sequence
    }))


    return (
        <>
            <input type="text" 
                pattern="[a-z]" 
                className="form-control form-control-lg text-center border-success shadow-sm"
                placeholder="Enter sequence..." 
                id="sequenceInput" 
                onBeforeInput={e => restrict_characters(e)} 
                //@ts-ignore
                onInput={(e) => {setSequence(e.target.value.toUpperCase()); sequence_manager.setSequence(e.target.value.toUpperCase())}}
                style={{textTransform: "uppercase"}} 
                value={sequence}/>
        </>
    )
})


export default SynthInput
