
const durations = ['1n', '2n', '4n', '8n', '16n'];

const dna_note_map: Record<string, string> = {
    'A': 'C4',
    'T': 'E4',
    'C': 'G4',
    'G': 'B4'
};

const protein_note_map: Record<string, string> = {
    'A': 'C3',
    'R': 'D3',
    'N': 'E3',
    'D': 'F3',
    'C': 'G3',
    'E': 'A3',
    'Q': 'B3',
    'G': 'C4',
    'H': 'D4',
    'I': 'E4',
    'L': 'F4',
    'K': 'G4',
    'M': 'A4',
    'F': 'B4',
    'P': 'C5',
    'S': 'D5',
    'T': 'E5',
    'W': 'F5',
    'Y': 'G5',
    'V': 'A5'
};

const SequenceManager = () => {

    let sequence = ''

    const calculate_timings = (sequence_mode: 'dna' | 'protein' = 'dna') => {
        console.log(sequence)
        const seq_array = sequence.split('')
        const seq_objects = seq_array.map(base => {
            const note = sequence_mode === 'dna' ? dna_note_map[base] : protein_note_map[base];
            return {
                base: base,
                timing: durations[Math.floor(Math.random() * durations.length)],
                note: note
            }
        })
        return seq_objects
    }

    return {
        setSequence: (new_sequence: string) => sequence = new_sequence,
        calculate_timings
    }

}

export const sequence_manager = SequenceManager()
