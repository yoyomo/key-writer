export function calculateNotes() {
	let notes = [];
	const keys = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
	const numOfKeys = 88;
	const newOctaveIndex = 3;
	const baseKeyPosition = 49;

	let baseFrequency = 440;
	let octave = 0;
	let keyIndex = 0;

	let n = 1;
	while(n <= numOfKeys){
		let frequency = Math.pow(2,((n-baseKeyPosition)/12)) * baseFrequency;
		let key = keys[keyIndex];
		octave = octave + (keyIndex === newOctaveIndex);
		let alt = key.slice(-1) === "#" ? key[0] + 'b' : '';
		notes.push({id: n, key: key, 	octave: octave,	alt: alt,	frequency: frequency});

		keyIndex = (keyIndex + 1) % keys.length;
		n++;
	}
	return notes;
}