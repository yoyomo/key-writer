export function initializeSegments(notes) {
    let INITIAL_SEGMENT_COUNT = 8;
    let segments = [];
    
    for (let i = 0; i < INITIAL_SEGMENT_COUNT; i++) {
        let noteToggles = [];
        let frequencies = [];
        for (let j = 0; j < notes.length; j++) {
            noteToggles[j] = false;
            frequencies[j] = notes[j].frequency;
        }
        segments.push({ noteToggles: noteToggles, frequencies: frequencies, duration: 1 });
    }
    return segments;
}
//# sourceMappingURL=note-segment.js.map