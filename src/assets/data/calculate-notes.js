export function calculateNotes() {
    var notes = [];
    var keys = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    var numOfKeys = 88;
    var newOctaveIndex = 3;
    var baseKeyPosition = 49;
    var baseFrequency = 440;
    var octave = 0;
    var keyIndex = 0;
    var n = 1;
    while (n <= numOfKeys) {
        var frequency = Math.pow(2, ((n - baseKeyPosition) / 12)) * baseFrequency;
        var key = keys[keyIndex];
        octave = octave + (keyIndex === newOctaveIndex ? 1 : 0);
        var alt = key.slice(-1) === "#" ? key[0] + 'b' : '';
        notes.push({ id: n, key: key, octave: octave, alt: alt, frequency: frequency });
        keyIndex = (keyIndex + 1) % keys.length;
        n++;
    }
    return notes;
}
//# sourceMappingURL=calculate-notes.js.map