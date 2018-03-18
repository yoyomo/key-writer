export function calculateNotes() {
	let notes = [
		{key: 'A0', 	alt: '', 	frequency: 27.5000},
		{key: 'A#0', 	alt: 'Bb0', frequency: 29.1352}
	];
	let keys = ['C','D','E','F','G','A','B'];
	let minimumOctave = 1;
	let maximumOctave = 7;

	for(let i=minimumOctave; i <= maximumOctave; i++){
		for(let j=0; j < keys.length; j++){
			let key = keys[j] + i;
			let frequency = 440;
			notes.push({key: key, frequency: frequency})
		}
	}

	notes.push({key: 'C8', frequency: 4186.01});
	return notes;
}