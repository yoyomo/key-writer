import Timer = NodeJS.Timer;

export const C_BASE_KEY_INDEX = 39; // 0...n
export const C_BASE_NOTE_INDEXES = {c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11};
export const TOTAL_NUM_OF_KEYS = 88;
export const A_BASE_KEY_INDEX = 48; // 0...n
export const A_BASE_FREQUENCY = 440;

export interface Note {
  type: 'note',
  value: number,
  duration: number,
  durationInSeconds: number,
}

export interface StartChord {
  type: 'start-chord'
}

export interface EndChord {
  type: 'end-chord',
  duration: number,
  durationInSeconds: number
}

export interface Rest {
  type: 'rest',
  duration: number,
  durationInSeconds: number,
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
  value: number
}

export interface Octave {
  type: 'octave'
  value: number
}

export type SequenceNote = Note | StartLoop | BreakLoop | EndLoop | InfiniteLoop | StartChord | EndChord | Rest
    | Octave | Tempo;

export interface PlayState {
  index: number,
  nextNoteTime: number,
  chord: boolean,
  loopStartIndex: number,
  loopCount: number,
  loopEndIndex: number,
  infiniteLoopIndex: number,
}

export module MML {

  let frequencies: number[];

  let audioContext: AudioContext;
  let gain: GainNode;

  let scheduleTime = 0.1;
  let lookahead = 25;

  let startTime = 0;

  let sequences: Sequence[] = [];

  let playInterval: Timer;

  export const initializeMML = (mmlString: string) => {
    const mmls = mmlString.toLowerCase().replace(/\s/g, '').split(';');

    mmls.map(mml => {
      if (!mml) {
        return;
      }
      sequences.push(new Sequence(mml));
    });

    const AudioContext = window['AudioContext'] // Default
        || window['webkitAudioContext'] // Safari and old versions of Chrome
        || window['mozAudioContext'] // Safari and old versions of Chrome
        || window['oAudioContext'] // Safari and old versions of Chrome
        || window['msAudioContext'] // Safari and old versions of Chrome
        || false;

    audioContext = new AudioContext();
    gain = audioContext.createGain();
    gain.connect(audioContext.destination);
    gain.gain.value = 0.25;

    calculateNoteFrequencies();
    parseMML();
  };

  let calculateNoteFrequencies = () => {
    frequencies = [];
    for (let n = 0; n < TOTAL_NUM_OF_KEYS; n++) {
      const frequency = Math.pow(2, ((n - A_BASE_KEY_INDEX) / 12)) * A_BASE_FREQUENCY;
      frequencies.push(frequency);
    }
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

  export const parseMML = () => {
    sequences.map(sequence => {
      sequence.parseMML();
    });
  };

  export const playMML = () => {
    if (!startTime) {
      startTime = audioContext.currentTime;
    }

    const relativeScheduleTime = audioContext.currentTime + scheduleTime;
    sequences.map(sequence => {
      sequence.playMML(startTime, relativeScheduleTime);
    })
  };

  export const playNote = (note: Note, startTime, nextNoteTime) => {
    const osc = audioContext.createOscillator();
    osc.frequency.value = frequencies[note.value];
    osc.type = 'sawtooth';
    osc.detune.value = -5;

    osc.connect(gain);
    osc.start(startTime + nextNoteTime);
    osc.stop(startTime + nextNoteTime + note.durationInSeconds);

    const osc2 = audioContext.createOscillator();
    osc2.frequency.value = frequencies[note.value];
    osc2.type = 'triangle';
    osc2.detune.value = 5;

    osc2.connect(gain);
    osc2.start(startTime + nextNoteTime);
    osc2.stop(startTime + nextNoteTime + note.durationInSeconds);
  };

  export const getNotesInQueue = () => {
    return sequences.map(sequence => {
      return sequence.notesInQueue;
    });
  };

  export const writeToMML = () => {
    return sequences.map(sequence => {
      return sequence.writeToMML();
    });
  };

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
    playState: PlayState;

    constructor(mml: string) {
      this.mml = mml;
      this.resetPlayState();
    }

    resetPlayState = () => {
      this.playState = {
        index: 0,
        nextNoteTime: 0,
        chord: false,
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
          case 'l':
            this.normalDuration = -1;
            let length = 0;
            while (this.isNextValid(/\d/)) {
              length = length * 10 + parseInt(this.mml[this.mmlIndex]);
              this.duration = length;
            }
            break;
          case '^':
            while (this.isThisValid(/\^/)) {
              let extension = 0;
              while (this.isNextValid(/\d/)) {
                extension = extension * 10 + parseInt(this.mml[this.mmlIndex]);
              }
              if (extension === 0) {
                extension = this.duration;
              }
              this.duration = (this.duration * extension) / (this.duration + extension);
            }
            break;
          case '.':
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

    // 1bpm = 1s -> 1beat= 1/60s, 1beat = 4 duration
    convertDurationToSeconds = (duration: number, tempo: number) => {
      if (duration === 0) {
        return 0;
      }
      return (4 / duration) * 60 / tempo;
    };

    saveNote = (noteIndex: number) => {
      this.notesInQueue.push({
        type: 'note',
        value: noteIndex,
        duration: this.duration,
        durationInSeconds: this.convertDurationToSeconds(this.duration, this.tempo),
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
      this.nextNote();
    };

    getOctave = () => {
      this.expect(/o/);
      if (this.isNextValid(/\d/)) {
        this.octave = parseInt(this.mml[this.mmlIndex]);
        this.notesInQueue.push({type: "octave", value: this.octave});
      }
    };

    decreaseOctave = () => {
      this.expect(/>/);

      if (this.isNextValid(/\d/)) {
        this.octave -= parseInt(this.mml[this.mmlIndex]);
      } else {
        this.octave--;
      }
      this.notesInQueue.push({type: "octave", value: this.octave});
    };

    increaseOctave = () => {
      this.expect(/</);

      if (this.isNextValid(/\d/)) {
        this.octave += parseInt(this.mml[this.mmlIndex]);
      } else {
        this.octave++;
      }
      this.notesInQueue.push({type: "octave", value: this.octave});
    };

    getTempo = () => {
      this.expect(/t/);

      let newTempo = 0;
      while (this.isNextValid(/\d/)) {
        newTempo = newTempo * 10 + parseInt(this.mml[this.mmlIndex]);
        this.tempo = newTempo;
        this.notesInQueue.push({type: "tempo", value: this.tempo});
      }
    };

    getRest = () => {
      this.expect(/r/);

      if (this.isNextValid(/[\d^.]/)) {
        this.getDuration();
      }
      this.notesInQueue.push({
        type: 'rest', duration: this.duration,
        durationInSeconds: this.convertDurationToSeconds(this.duration, this.tempo)
      });

      this.nextNote();
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
        type: 'end-chord', duration: this.duration,
        durationInSeconds: this.convertDurationToSeconds(this.duration, this.tempo)
      });
      this.nextNote();
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
      this.notesInQueue.push({type: 'break-loop'});
    };

    parseMML = () => {
      while (this.mmlIndex < this.mml.length) {
        const prevMMLIndex = this.mmlIndex;
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

    playMML = (startTime: number, relativeScheduleTime: number) => {
      while (this.playState.nextNoteTime < relativeScheduleTime
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
          case 'start-chord':
            this.playState.chord = true;
            break;
          case 'end-chord':
            this.playState.chord = false;
            this.playState.nextNoteTime += note.durationInSeconds;
            break;
          case 'rest':
            this.playState.nextNoteTime += note.durationInSeconds;
            break;
          case 'note':
            playNote(note, startTime, this.playState.nextNoteTime);
            if (this.playState.chord) {
              break;
            }
            this.playState.nextNoteTime += note.durationInSeconds;
            break;
        }

        if (this.playState.infiniteLoopIndex >= 0 && this.playState.index >= this.notesInQueue.length - 1) {
          this.playState.index = this.playState.infiniteLoopIndex;
        }

        this.playState.index++;
      }
    };

    getNoteKey = (noteIndex: number) => {
      let baseNoteIndex =;
      return Object.keys(C_BASE_NOTE_INDEXES).find(key => C_BASE_NOTE_INDEXES[key] === baseNoteIndex);
    };

    writeToMML = () => {
      let mmlText = "";
      return this.notesInQueue.map(note => {
        switch (note.type) {
          case "infinite-loop":
            mmlText += "$";
            break;
          case "octave":
            mmlText += "o" + note.value;
            break;
          case "tempo":
            mmlText += "t" + note.value;
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
          case "start-chord":
            mmlText += "[";
            break;
          case "end-chord":
            mmlText += "]" + note.duration;
            break;
          case "rest":
            mmlText += "r" + note.duration;
            break;
          case "note":
            mmlText += this.getNoteKey(note.value) + note.duration;
            break;
        }
      });
    }

  }

}

