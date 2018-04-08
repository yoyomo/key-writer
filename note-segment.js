export function createNoteSegment(notes){
  let noteSegment = [];
  for(let i=0; i < notes.length; i++){
    noteSegment.push(false);
  }
  return noteSegment;
}
let INITIAL_NOTE_SEGMENT_COUNT = 8;
export function initializeNoteSegments(notes){
  let noteSegments =[];
  for(let i=0; i < INITIAL_NOTE_SEGMENT_COUNT; i++){
    noteSegments.push({id: i, notes: createNoteSegment(notes)});
  }
  return noteSegments;
}