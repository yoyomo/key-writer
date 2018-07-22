
export const C_BASE_KEY_INDEX = 39; // 0...n
export const NOTE_INDEXES = {c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11};

export interface Note {
  type: "note",
  value: number,
  duration: number,
  tempo: number,
}

export interface StartChord{
  type: "start-chord"
}
export interface EndChord {
  type: "end-chord",
}

export interface Rest {
  type: "rest",
  duration: number,
  tempo: number,
}

export interface StartLoop{
  type: "start-loop"
}
export interface BreakLoop {
  type: "break-loop"
}
export interface EndLoop {
  type: "end-loop",
  times: number
}
export interface InfiniteLoop {
  type: "infinite-loop"
}
export type SequenceNote = Note | StartLoop | BreakLoop | EndLoop | InfiniteLoop | StartChord | EndChord | Rest;

export class MML {

  getNoteFrequencies = () => {
    let frequencies: number[] = [];
    const numOfKeys = 88;
    const baseKeyPosition = 49;
    const baseFrequency = 440;

    for (let n = 1; n <= numOfKeys; n++) {
      let frequency = Math.pow(2, ((n - baseKeyPosition) / 12)) * baseFrequency;
      frequencies.push(frequency);
    }
    return frequencies;
  };

  frequencies = this.getNoteFrequencies();

  audioContext: AudioContext;
  gain: GainNode;

  scheduleTime = 0.1;
  lookahead = 25;

  startTime = 0;

  sequences: Sequence[] = [];

  constructor(mmlString: string){
    let mmls = mmlString.toLowerCase().replace(/\s/g, '').split(';');

    mmls.map(mml => {
      if (!mml) return;
      this.sequences.push(new Sequence(mml));
    });

    let AudioContext = window["AudioContext"] // Default
        || window["webkitAudioContext"] // Safari and old versions of Chrome
        || window["mozAudioContext"] // Safari and old versions of Chrome
        || window["oAudioContext"] // Safari and old versions of Chrome
        || window["msAudioContext"] // Safari and old versions of Chrome
        || false;

    this.audioContext = new AudioContext();
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);

    this.parseMML();
  }

  playInterval: number;

  stop = () => {
    clearInterval(this.playInterval);
    this.gain.disconnect(this.audioContext.destination);
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);
  };

  play = () => {
    this.parseMML();
    this.playInterval = setInterval(this.playMML, this.lookahead);
  };

  private parseMML = () => {
    this.sequences.map(sequence => {
      sequence.parseMML();
    });
  };

  private playMML = () => {
    if (!this.startTime) this.startTime = this.audioContext.currentTime;

    let relativeScheduleTime = this.audioContext.currentTime + this.scheduleTime;
    this.sequences.map(sequence => {
      sequence.playMML(this.startTime, relativeScheduleTime, this.audioContext, this.gain, this.frequencies);
    })
  };

  getNotesInQueue = () => {
    return this.sequences.map(sequence => {
      return sequence.notesInQueue;
    });
  };
}

class Sequence {

  tempo = 120;
  octave = 4;
  duration = 4;
  normalDuration = -1;

  chordNoteIndexes = [];
  readingChord = false;

  mmlIndex = 0;
  mml: string;
  goToNext = false;

  notesInQueue: SequenceNote[] = [];
  playState = {
    index: 0,
    nextNoteTime: 0,
    chord: false,
    loopStartIndex: -1,
    loopCount: -1,
    loopEndIndex: -1,
    infiniteLoopIndex: -1,
  };

  constructor(mml: string) {
    this.mml = mml;
  }

  expect = (reg: RegExp) => {
    if (!reg.test(this.mml[this.mmlIndex])) {
      throw new Error("Invalid MML syntax.\n" +
          "Expected: " + reg + ", Got: " + this.mml[this.mmlIndex]);
    }
  };

  isThisValid = (reg: RegExp) => {
    return this.goToNext = this.mml[this.mmlIndex] && this.mml[this.mmlIndex].trim() && reg.test(this.mml[this.mmlIndex]);
  };

  isNextValid = (reg: RegExp) => {
    this.mmlIndex++;
    return this.isThisValid(reg);
  };

  getOctaveOffset = () => {
    let offset = 4 * (-12);

    for (let i = 0; i < this.octave; i++) {
      offset += 12;
    }

    return offset;
  };

  getDuration = () => {
    this.expect(/[\dl^.]/);
    this.normalDuration = this.duration;

    while (this.isThisValid(/[\dl^.]/)) {
      switch (this.mml[this.mmlIndex]) {
        case "l":
          this.normalDuration = -1;
          let length = 0;
          while (this.isNextValid(/\d/)) {
            length = length * 10 + parseInt(this.mml[this.mmlIndex]);
            this.duration = length;
          }
          break;
        case "^":
          while (this.isThisValid(/\^/)) {
            let extension = 0;
            while (this.isNextValid(/\d/)) {
              extension = extension * 10 + parseInt(this.mml[this.mmlIndex]);
            }
            if (extension === 0) extension = this.duration;
            this.duration = (this.duration * extension) / (this.duration + extension);
          }
          break;
        case ".":
          let extension = this.duration;
          do {
            extension *= 2;
            this.duration = (this.duration * extension) / (this.duration + extension);
          } while (this.isNextValid(/\./));
          break;
        default: {
          let length = 0;
          do {
            length = length * 10 + parseInt(this.mml[this.mmlIndex]);
            this.duration = length;
          } while (this.isNextValid(/\d/));
          break;
        }
      }
    }
  };

  saveNote = (noteIndex: number) => {
    this.notesInQueue.push({
      type: "note",
      value: noteIndex,
      duration: this.duration,
      tempo: this.tempo,
    });
  };

  nextNote = () => {
    if (this.normalDuration > 0) {
      this.duration = this.normalDuration;
      this.normalDuration = -1;
    }
  };

  getNote = () => {
    this.expect(/[cdefgab]/);
    let noteIndex = NOTE_INDEXES[this.mml[this.mmlIndex]] + C_BASE_KEY_INDEX + this.getOctaveOffset();

    if (this.isNextValid(/[-+#\d^.]/)) {
      switch (this.mml[this.mmlIndex]) {
        case "-":
          noteIndex--;
          break;
        case "+":
        case "#":
          noteIndex++;
          break;
        default:
          if (this.readingChord) break;
          this.getDuration();
          break;
      }
    }

    if (this.readingChord) {
      this.chordNoteIndexes.push(noteIndex);
      return;
    }
    this.saveNote(noteIndex);
    this.nextNote();
  };

  getOctave = () => {
    this.expect(/o/);
    if (this.isNextValid(/\d/)) {
      this.octave = parseInt(this.mml[this.mmlIndex]);
    }
  };

  decreaseOctave = () => {
    this.expect(/>/);

    if (this.isNextValid(/\d/)) {
      this.octave -= parseInt(this.mml[this.mmlIndex]);
    }
    else {
      this.octave--;
    }
  };

  increaseOctave = () => {
    this.expect(/</);

    if (this.isNextValid(/\d/)) {
      this.octave += parseInt(this.mml[this.mmlIndex]);
    }
    else {
      this.octave++;
    }
  };

  getTempo = () => {
    this.expect(/t/);

    let newTempo = 0;
    while (this.isNextValid(/\d/)) {
      newTempo = newTempo * 10 + parseInt(this.mml[this.mmlIndex]);
      this.tempo = newTempo;
    }
  };

  getRest = () => {
    this.expect(/r/);

    if (this.isNextValid(/[\d^.]/)) {
      this.getDuration();
    }
    this.notesInQueue.push({type: "rest", duration: this.duration, tempo: this.tempo});

    this.nextNote();
  };

  getChord = () => {
    this.expect(/\[/);
    this.readingChord = true;
    this.chordNoteIndexes = [];
    this.notesInQueue.push({type: "start-chord"});
  };

  playChord = () => {
    this.expect(/]/);
    if (this.isNextValid(/[\d^.]/)) {
      this.getDuration();
    }
    this.chordNoteIndexes.map(noteIndex => {
      this.saveNote(noteIndex);
    });
    this.readingChord = false;
    this.chordNoteIndexes = [];
    this.notesInQueue.push({type: "end-chord"});
    this.nextNote();
  };

  setInfiniteLoop = () => {
    this.expect(/$/);
    this.mmlIndex++;
    this.notesInQueue.push({type: "infinite-loop"});
  };

  startLoop = () => {
    this.expect(/\//);
    this.mmlIndex++;
    this.expect(/:/);
    this.mmlIndex++;
    this.notesInQueue.push({type: "start-loop"});
  };

  endLoop = () => {
    this.expect(/:/);
    this.mmlIndex++;
    this.expect(/\//);
    let loopTimes = 0;
    while (this.isNextValid(/\d/)) {
      loopTimes = loopTimes * 10 + parseInt(this.mml[this.mmlIndex]);
    }
    if (loopTimes === 0) loopTimes = 2;

    this.notesInQueue.push({type: "end-loop", times: loopTimes});
  };

  breakLoop = () => {
    this.notesInQueue.push({type: "break-loop"});
  };

  parseMML = () => {
    while (this.mmlIndex < this.mml.length) {
      let prevMMLIndex = this.mmlIndex;
      switch (this.mml[this.mmlIndex]) {
        case "c":
        case "d":
        case "e":
        case "f":
        case "g":
        case "a":
        case "b":
          this.getNote();
          break;
        case "[":
          this.getChord();
          break;
        case "]":
          this.playChord();
          break;
        case "r":
          this.getRest();
          break;
        case "l":
          this.getDuration();
          break;
        case "o":
          this.getOctave();
          break;
        case ">":
          this.decreaseOctave();
          break;
        case "<":
          this.increaseOctave();
          break;
        case "t":
          this.getTempo();
          break;
        case "$":
          this.setInfiniteLoop();
          break;
        case "/":
          this.startLoop();
          break;
        case ":":
          this.endLoop();
          break;
        case "|":
          this.breakLoop();
          break;
        default:
          this.goToNext = true;
          break;
      }

      if (this.goToNext || prevMMLIndex === this.mmlIndex) {
        this.mmlIndex++;
        this.goToNext = false;
      }
    }
  };

  // 1bpm = 1s -> 1beat= 1/60s, 1beat = 4 duration
  convertDurationToSeconds = (duration: number, tempo: number) => {
    if (duration === 0) return 0;
    return (4 / duration) * 60 / tempo;
  };

  playMML = (startTime: number, relativeScheduleTime: number, audioContext: AudioContext, gain: GainNode, frequencies: number[]) => {
    while(this.playState.nextNoteTime < relativeScheduleTime
    && this.playState.index < this.notesInQueue.length){
      let note = this.notesInQueue[this.playState.index];
      switch(note.type){
        case "start-loop":
          this.playState.loopStartIndex = this.playState.index;
          break;
        case "end-loop":
          if(this.playState.loopCount < 0){
            this.playState.loopEndIndex = this.playState.index;
            this.playState.loopCount = note.times;
          }
          this.playState.loopCount--;
          if (this.playState.loopCount > 0){
            this.playState.index = this.playState.loopStartIndex;
          }
          else{
            this.playState.loopCount = -1;
            this.playState.loopStartIndex = -1;
            this.playState.loopEndIndex = -1;
          }
          break;
        case "break-loop":
          if (this.playState.loopCount === 1){
            this.playState.index = this.playState.loopEndIndex;
            this.playState.loopCount = -1;
            this.playState.loopStartIndex = -1;
            this.playState.loopEndIndex = -1;
          }
          break;
        case "infinite-loop":
          this.playState.infiniteLoopIndex = this.playState.index;
          break;
        case "start-chord":
          this.playState.chord = true;
          break;
        case "end-chord":
          this.playState.chord = false;
          break;
        case "rest":
          this.playState.nextNoteTime += this.convertDurationToSeconds(note.duration, note.tempo);
          break;
        case "note":
          let oscillator = audioContext.createOscillator();
          oscillator.frequency.value = frequencies[note.value];
          oscillator.type = 'sine';
          oscillator.connect(gain);

          oscillator.start(startTime + this.playState.nextNoteTime);

          oscillator.stop(startTime + this.playState.nextNoteTime + this.convertDurationToSeconds(note.duration, note.tempo));

          if(this.playState.chord) break;
          this.playState.nextNoteTime += this.convertDurationToSeconds(note.duration, note.tempo);
          break;
      }

      if(this.playState.infiniteLoopIndex >= 0 && this.playState.index >= this.notesInQueue.length - 1){
        this.playState.index = this.playState.infiniteLoopIndex;
      }

      this.playState.index++;
    }
  }

}
