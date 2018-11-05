import Timer = NodeJS.Timer;

export const C_BASE_KEY_INDEX = 39; // 0...n
export const C_BASE_NOTE_INDEXES = {c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11};
export const SCALE = 12;
export const TOTAL_NUM_OF_KEYS = 88;
export const A_BASE_KEY_INDEX = 48; // 0...n
export const A_BASE_FREQUENCY = 440;
export const QUARTER_NOTE = 4;
export const BASE_OCTAVE = 4;

export interface Note {
  type: 'note',
  index: number,
  extensions: number[],
}

export interface StartChord {
  type: 'start-chord'
}

export interface EndChord {
  type: 'end-chord',
  extensions: number[],
}

export interface Rest {
  type: 'rest',
  extensions: number[],
}

export interface StartLoop {
  type: 'start-loop'
}

export interface BreakLoop {
  type: 'break-loop'
}

export interface EndLoop {
  type: 'end-loop',
  times: number
}

export interface InfiniteLoop {
  type: 'infinite-loop'
}

export interface Tempo {
  type: 'tempo'
  tempo: number
}

export interface Octave {
  type: 'octave'
  octave: number
}

export interface DefaultDuration {
  type: 'default-duration'
  extensions: number[]
}

export interface Header {
  type: 'header'
}

export type TimedSequenceNote = Note | EndChord | Rest | DefaultDuration;

export type SequenceNote = Note | StartLoop | BreakLoop | EndLoop | InfiniteLoop | StartChord | EndChord | Rest
    | Octave | Tempo | DefaultDuration | Header;

export interface PlayState {
  index: number,
  nextNoteTime: number,
  chord: boolean,
  tempo: number,
  loopStartIndex: number,
  loopCount: number,
  loopEndIndex: number,
  infiniteLoopIndex: number,
}

export interface NotesInterface {
  index: number,
  key: string,
  octave: number,
  alt: string,
  frequency: number,
}

export module MML {

  let notes: NotesInterface[];

  let audioContext: AudioContext;
  let gain: GainNode;

  let scheduleTime = 0.1;
  let lookahead = 25;

  let startTime = 0;

  let sequences: Sequence[] = [];

  let playInterval: Timer;

  let header: Sequence;

  export const initialize = () => {
    const AudioContext = window['AudioContext'] // Default
        || window['webkitAudioContext'] // Safari and old versions of Chrome
        || window['mozAudioContext']
        || window['oAudioContext']
        || window['msAudioContext']
        || false;

    audioContext = new AudioContext();
    gain = audioContext.createGain();
    gain.connect(audioContext.destination);
    gain.gain.value = 0.25;

    calculateNotes();
  };

  let calculateNotes = () => {
    notes = [];
    const keys = ['a', 'a+', 'b', 'c', 'c+', 'd', 'd+', 'e', 'f', 'f+', 'g', 'g+'];
    const newOctaveIndex = 3;

    let octave = 0;
    let keyIndex = 0;

    for (let n = 0; n < TOTAL_NUM_OF_KEYS; n++) {
      let frequency = Math.pow(2, ((n - A_BASE_KEY_INDEX) / SCALE)) * A_BASE_FREQUENCY;
      let key = keys[keyIndex];
      let nextKey = (keyIndex + 1) % keys.length;
      octave = octave + (keyIndex === newOctaveIndex ? 1 : 0);
      let alt = key.slice(-1) === "#" ? keys[nextKey][0] + '-' : '';

      notes.push({index: n, key: key, octave: octave, alt: alt, frequency: frequency});

      keyIndex = nextKey;
    }
  };

  export const getNotes = (): NotesInterface[] => {
    return notes;
  };

  export const readMML = (mmlString: string) => {
    const mmls = mmlString.toLowerCase().replace(/\s/g, '').split(';');

    let headerMML = '';
    for(let i = mmls.length - 1; i >= 0; i--){
      let mml = mmls[i];
      if(mml.includes('%')){
        headerMML = mmls.splice(i,1)[0];
      }
    }
    mmls.unshift(headerMML);

    mmls.map(mml => {
      if (!mml) {
        return;
      }
      let sequence = new Sequence(mml, header);
      if(mml === headerMML){
        header = sequence;
        header.parseMML();
      }
      sequences.push(sequence);
    });
    parseMML();
  };

  export const parseMML = () => {
    sequences.map(sequence => {
      sequence.parseMML();
    });
  };

  export const writeToMML = (): string => {
    return sequences.map(sequence => {
      return sequence.writeToMML();
    }).join();
  };

  export const playMML = () => {
    if (!startTime) {
      startTime = audioContext.currentTime;
    }

    const relativeScheduleTime = audioContext.currentTime + scheduleTime;
    header.playMML(startTime,relativeScheduleTime);
    sequences.slice(1).map(sequence => {
      sequence.playMML(startTime, relativeScheduleTime, header);
    });
  };

  export const stop = () => {
    clearInterval(playInterval);
    gain.disconnect(audioContext.destination);
    startTime = null;
    sequences.map(sequence => {
      sequence.resetPlayState();
    });

    gain = audioContext.createGain();
    gain.connect(audioContext.destination);
  };

  export const play = () => {
    stop();
    parseMML();
    playInterval = setInterval(playMML, lookahead);
  };

  export const getDurationFromExtensions = (note: TimedSequenceNote): number => {
    let duration = note.extensions[0];
    note.extensions.slice(1).map(extension => {
      duration = MML.Sequence.calculateDurationFromNewExtension(duration, extension);
    });
    return duration;
  };

  // 1bpm = 1s -> 1beat= 1/60s, 1beat = 4 defaultDuration
  export const convertDurationToSeconds = (note: TimedSequenceNote, tempo: number) => {
    let duration = getDurationFromExtensions(note);
    if (duration === 0 || tempo === 0) {
      return Number.MAX_VALUE;
    }
    return (QUARTER_NOTE / duration) * 60 / tempo;
  };

  export const playNote = (note: Note, tempo: number, scheduledStartTime: number): OscillatorNode[] => {
    if (!scheduledStartTime) scheduledStartTime = audioContext.currentTime;

    let oscillators: OscillatorNode[] = [];
    let numberOfOscillators = 2;

    for (let i = 0; i < numberOfOscillators; i++) {
      const osc = audioContext.createOscillator();
      osc.frequency.value = notes[note.index].frequency;

      switch (i) {
        case 1:
          osc.type = 'sine';
          // osc.detune.value = -5;
          break;
        case 2:
          osc.type = 'sine';
          // osc.detune.value = 5;
          break;
      }

      osc.connect(gain);
      osc.start(scheduledStartTime);
      osc.stop(scheduledStartTime + convertDurationToSeconds(note, tempo));

      oscillators.push(osc);
    }

    return oscillators;
  };

  export const getNotesInQueue = () => {
    return sequences.map(sequence => {
      return sequence.notesInQueue;
    });
  };

  export class Sequence {

    tempo = 120;
    octave = BASE_OCTAVE;
    extensions = [QUARTER_NOTE];
    defaultExtensions = [QUARTER_NOTE];

    chordNoteIndexes = [];
    readingChord = false;

    mmlIndex = 0;
    mml: string;
    goToNext = false;

    notesInQueue: SequenceNote[] = [];
    playState: PlayState;

    constructor(mml: string, header?: Sequence | void) {
      this.mml = mml;
      if (header) {
        this.tempo = header.tempo;
        this.defaultExtensions = header.defaultExtensions;
        this.extensions = header.extensions;
      }
      this.resetPlayState();
    }

    resetPlayState = () => {
      this.playState = {
        index: 0,
        nextNoteTime: 0,
        chord: false,
        tempo: 120,
        loopStartIndex: -1,
        loopCount: -1,
        loopEndIndex: -1,
        infiniteLoopIndex: -1,
      };
    };

    expect = (reg: RegExp) => {
      if (!reg.test(this.mml[this.mmlIndex])) {
        throw new Error('Invalid MML syntax.\n' +
            'Expected: ' + reg + ', Got: ' + this.mml[this.mmlIndex]);
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
      return (this.octave - BASE_OCTAVE) * SCALE;
    };

    static calculateDurationFromNewExtension = (duration: number, extension: number) => {
      return (duration * extension) / (duration + extension);
    };

    readNextLength = () => {
      let length = 0;
      do {
        if (this.isThisValid(/\d/)) {
          length = length * 10 + parseInt(this.mml[this.mmlIndex]);
        }
      } while (this.isNextValid(/\d/));
      return [].concat(length === 0 ? this.defaultExtensions : length);
    };

    getDuration = () => {
      this.expect(/[\dl^.~]/);
      this.extensions = this.defaultExtensions;
      let changeDefaultDuration = false;

      while (this.isThisValid(/[\dl^.~]/)) {
        switch (this.mml[this.mmlIndex]) {
          case 'l':
            changeDefaultDuration = true;
            this.extensions = this.readNextLength();
            break;
          case '^':
            this.extensions = this.extensions.concat(this.readNextLength());
            break;
          case '.':
            do {
              let extension = this.extensions[this.extensions.length - 1] * 2;
              this.extensions.push(extension);
            } while (this.isNextValid(/\./));
            break;
          case '~':
            this.extensions = this.extensions.concat(...new Array(this.readNextLength()[0]).fill(this.extensions[0]));
            break;
          default: {
            this.extensions = this.readNextLength();
            break;
          }
        }
      }

      if (changeDefaultDuration) {
        this.defaultExtensions = this.extensions;
        this.notesInQueue.push({
          type: "default-duration",
          extensions: this.defaultExtensions
        });
      }

    };

    saveNote = (noteIndex: number) => {
      this.notesInQueue.push({
        type: 'note',
        index: noteIndex,
        extensions: this.extensions,
      });
    };

    nextNote = () => {
      this.extensions = this.defaultExtensions;
    };

    getNote = () => {
      this.expect(/[cdefgab]/);
      let noteIndex = C_BASE_NOTE_INDEXES[this.mml[this.mmlIndex]] + C_BASE_KEY_INDEX + this.getOctaveOffset();

      if (this.isNextValid(/[-+#\d^.]/)) {
        switch (this.mml[this.mmlIndex]) {
          case '-':
            noteIndex--;
            break;
          case '+':
          case '#':
            noteIndex++;
            break;
          default:
            if (this.readingChord) {
              break;
            }
            this.getDuration();
            break;
        }
      }

      if (this.readingChord) {
        this.chordNoteIndexes.push(noteIndex);
        return;
      }
      this.saveNote(noteIndex);
    };

    getOctave = () => {
      this.expect(/o/);
      if (this.isNextValid(/\d/)) {
        this.octave = parseInt(this.mml[this.mmlIndex]);
        this.notesInQueue.push({type: "octave", octave: this.octave});
      }
    };

    decreaseOctave = () => {
      this.expect(/>/);

      if (this.isNextValid(/\d/)) {
        this.octave -= parseInt(this.mml[this.mmlIndex]);
      } else {
        this.octave--;
      }
      this.notesInQueue.push({type: "octave", octave: this.octave});
    };

    increaseOctave = () => {
      this.expect(/</);

      if (this.isNextValid(/\d/)) {
        this.octave += parseInt(this.mml[this.mmlIndex]);
      } else {
        this.octave++;
      }
      this.notesInQueue.push({type: "octave", octave: this.octave});
    };

    getTempo = () => {
      this.expect(/t/);

      let newTempo = 0;
      while (this.isNextValid(/\d/)) {
        newTempo = newTempo * 10 + parseInt(this.mml[this.mmlIndex]);
      }
      this.tempo = newTempo;
      this.notesInQueue.push({type: "tempo", tempo: this.tempo});
    };

    getRest = () => {
      this.expect(/r/);

      if (this.isNextValid(/[\d^.]/)) {
        this.getDuration();
      }
      this.notesInQueue.push({
        type: 'rest',
        extensions: this.extensions,
      });

    };

    getChord = () => {
      this.expect(/\[/);
      this.readingChord = true;
      this.chordNoteIndexes = [];
      this.notesInQueue.push({type: 'start-chord'});
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
      this.notesInQueue.push({
        type: 'end-chord',
        extensions: this.extensions,
      });
    };

    setInfiniteLoop = () => {
      this.expect(/$/);
      this.mmlIndex++;
      this.notesInQueue.push({type: 'infinite-loop'});
    };

    startLoop = () => {
      this.expect(/\//);
      this.mmlIndex++;
      this.expect(/:/);
      this.mmlIndex++;
      this.notesInQueue.push({type: 'start-loop'});
    };

    endLoop = () => {
      this.expect(/:/);
      this.mmlIndex++;
      this.expect(/\//);
      let loopTimes = 0;
      while (this.isNextValid(/\d/)) {
        loopTimes = loopTimes * 10 + parseInt(this.mml[this.mmlIndex]);
      }
      if (loopTimes === 0) {
        loopTimes = 2;
      }

      this.notesInQueue.push({type: 'end-loop', times: loopTimes});
    };

    breakLoop = () => {
      this.expect(/\|/);
      this.notesInQueue.push({type: 'break-loop'});
    };

    setHeader = () => {
      this.expect(/%/);
      this.notesInQueue.push({type: 'header'});
    };

    parseMML = () => {
      while (this.mmlIndex < this.mml.length) {
        const prevMMLIndex = this.mmlIndex;
        this.nextNote();
        switch (this.mml[this.mmlIndex]) {
          case 'c':
          case 'd':
          case 'e':
          case 'f':
          case 'g':
          case 'a':
          case 'b':
            this.getNote();
            break;
          case '[':
            this.getChord();
            break;
          case ']':
            this.playChord();
            break;
          case 'r':
            this.getRest();
            break;
          case 'l':
            this.getDuration();
            break;
          case 'o':
            this.getOctave();
            break;
          case '>':
            this.decreaseOctave();
            break;
          case '<':
            this.increaseOctave();
            break;
          case 't':
            this.getTempo();
            break;
          case '$':
            this.setInfiniteLoop();
            break;
          case '/':
            this.startLoop();
            break;
          case ':':
            this.endLoop();
            break;
          case '|':
            this.breakLoop();
            break;
          case '%':
            this.setHeader();
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

    playMML = (relativeStartTime: number, relativeScheduleTime: number, header?: Sequence | void) => {
      while (this.playState.nextNoteTime < relativeScheduleTime
      && (!header || this.playState.nextNoteTime < header.playState.nextNoteTime)
      && this.playState.index < this.notesInQueue.length) {
        const note = this.notesInQueue[this.playState.index];
        switch (note.type) {
          case 'start-loop':
            this.playState.loopStartIndex = this.playState.index;
            break;
          case 'end-loop':
            if (this.playState.loopCount < 0) {
              this.playState.loopEndIndex = this.playState.index;
              this.playState.loopCount = note.times;
            }
            this.playState.loopCount--;
            if (this.playState.loopCount > 0) {
              this.playState.index = this.playState.loopStartIndex;
            } else {
              this.playState.loopCount = -1;
              this.playState.loopStartIndex = -1;
              this.playState.loopEndIndex = -1;
            }
            break;
          case 'break-loop':
            if (this.playState.loopCount === 1) {
              this.playState.index = this.playState.loopEndIndex;
              this.playState.loopCount = -1;
              this.playState.loopStartIndex = -1;
              this.playState.loopEndIndex = -1;
            }
            break;
          case 'infinite-loop':
            this.playState.infiniteLoopIndex = this.playState.index;
            break;
          case 'tempo':
            this.playState.tempo = note.tempo;
            break;
          case 'start-chord':
            this.playState.chord = true;
            break;
          case 'end-chord':
            this.playState.chord = false;
            this.playState.nextNoteTime += convertDurationToSeconds(note, this.playState.tempo);
            break;
          case 'rest':
            this.playState.nextNoteTime += convertDurationToSeconds(note, this.playState.tempo);
            break;
          case 'note':
            playNote(note, this.playState.tempo, relativeStartTime + this.playState.nextNoteTime);
            if (this.playState.chord) break;
            this.playState.nextNoteTime += convertDurationToSeconds(note, this.playState.tempo);
            break;
        }

        if (this.playState.infiniteLoopIndex >= 0 && this.playState.index >= this.notesInQueue.length - 1) {
          this.playState.index = this.playState.infiniteLoopIndex;
        }

        this.playState.index++;
      }
    };

    stringifyNoteKey = (note: Note): string => {
      return notes[note.index].key;
    };

    stringifyNoteDuration = (note: TimedSequenceNote, defaultDuration = QUARTER_NOTE): string => {
      let mmlDuration = "";
      let prevExtension = note.extensions[0];
      let repetition = 0;

      mmlDuration += prevExtension === defaultDuration ? "" : prevExtension;
      note.extensions.slice(1).map((extension) => {
        if (prevExtension === extension) {
          if (!repetition) {
            mmlDuration += '~';
          }
          repetition++;
        }
        else {
          if (repetition) {
            mmlDuration += repetition;
            repetition = 0;
          }

          if (prevExtension === (extension / 2)) {
            mmlDuration += '.';
          } else {
            mmlDuration += '^' + extension;
          }
        }

        prevExtension = extension;
      });
      return mmlDuration;
    };

    writeToMML = (): string => {
      let mmlText = "";
      let defaultDuration = QUARTER_NOTE;
      this.notesInQueue.map(note => {
        switch (note.type) {
          case "infinite-loop":
            mmlText += "$";
            break;
          case "octave":
            mmlText += "o" + note.octave;
            break;
          case "tempo":
            mmlText += "t" + note.tempo;
            break;
          case "default-duration":
            mmlText += "l" + this.stringifyNoteDuration(note);
            defaultDuration = getDurationFromExtensions(note);
            break;
          case "start-loop":
            mmlText += "/:";
            break;
          case "end-loop":
            mmlText += ":/" + note.times;
            break;
          case "break-loop":
            mmlText += "|";
            break;
          case "header":
            mmlText += "%";
            break;
          case "start-chord":
            mmlText += "[";
            break;
          case "end-chord":
            mmlText += "]" + this.stringifyNoteDuration(note, defaultDuration);
            break;
          case "rest":
            mmlText += "r" + this.stringifyNoteDuration(note, defaultDuration);
            break;
          case "note":
            mmlText += this.stringifyNoteKey(note) + this.stringifyNoteDuration(note, defaultDuration);
            break;
        }
      });

      mmlText += ";";

      return mmlText;
    }

  }

}

