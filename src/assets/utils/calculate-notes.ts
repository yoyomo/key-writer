export interface NotesInterface {
	id: number,
	key: string,
	octave: number,
	alt: string,
	frequency: number,
}

export function calculateNotes(): NotesInterface[] {
	let notes: NotesInterface[] = [];
	const keys = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
	const numOfKeys = 88;
	const newOctaveIndex = 3;
	const baseKeyPosition = 49;

	let baseFrequency = 440;
	let octave = 0;
	let keyIndex = 0;

	for(let n = 1; n <= numOfKeys; n++){
		let frequency = Math.pow(2,((n-baseKeyPosition)/12)) * baseFrequency;
		let key = keys[keyIndex];
		octave = octave + (keyIndex === newOctaveIndex ? 1 : 0);
		let alt = key.slice(-1) === "#" ? key[0] + 'b' : '';
		notes.push({id: n, key: key, 	octave: octave,	alt: alt,	frequency: frequency});

		keyIndex = (keyIndex + 1) % keys.length;
	}
	return notes;
}