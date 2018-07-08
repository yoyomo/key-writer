export interface SegmentsInterface {
  noteToggles: boolean[],
  duration: number,
}

export const INITIAL_SEGMENT_COUNT = 32;

export function initializeSegments(notes): SegmentsInterface[]{
  let noteToggles = new Array(notes.length).fill(false);
  let segments: SegmentsInterface[] = [];
  for(let i=0; i < INITIAL_SEGMENT_COUNT; i++){
    segments.push({noteToggles: noteToggles.slice(), duration: 1});
  }
  return segments;
}