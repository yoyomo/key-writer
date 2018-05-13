export interface SegmentsInterface {
  noteToggles: boolean[],
  frequencies: number[],
  duration: number,
}

export function initializeSegments(notes): SegmentsInterface[]{
  const INITIAL_SEGMENT_COUNT = 8;
  let segments: SegmentsInterface[] = [];

  let noteToggles = [];
  let frequencies = [];
  for(let j=0; j < notes.length; j++){
    noteToggles[j] = false;
    frequencies[j] = notes[j].frequency;
  }

  for(let i=0; i < INITIAL_SEGMENT_COUNT; i++){
    segments.push({noteToggles: noteToggles.slice(), frequencies: frequencies.slice(), duration: 1});
  }
  return segments;
}