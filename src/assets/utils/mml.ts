export module MML {

  let getNoteFrequencies = () => {
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

  const BASE_KEY_INDEX = 39; // 0...n
  const NOTE_INDEXES = {c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11};

  let frequencies = getNoteFrequencies();

  let AudioContext = window["AudioContext"] // Default
      || window["webkitAudioContext"] // Safari and old versions of Chrome
      || window["mozAudioContext"] // Safari and old versions of Chrome
      || window["oAudioContext"] // Safari and old versions of Chrome
      || window["msAudioContext"] // Safari and old versions of Chrome
      || false;

  let audioContext = new AudioContext();
  let gain = audioContext.createGain();
  gain.connect(audioContext.destination);

  let scheduleTime = 0.1;
  let lookahead = 25;

  let startTime: number;

  interface Chord {
    noteIndexes: number[]
    startTime: number
  }

  class Sequence {

    tempo = 120;
    octave = 4;
    duration = 4;
    normalDuration = -1;
    loopCount = -1;
    loopStartIndex = -1;
    loopEndIndex = -1;
    infiniteLoopStartIndex = -1;

    preLoopTempo: number;
    preLoopOctave: number;
    preLoopDuration: number;


    chord: Chord = {
      noteIndexes: [],
      startTime: null
    };
    readingChord = false;

    mmlIndex = 0;
    mml: string;
    goToNext = false;

    relativeNextNoteTime = 0;

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

// 1 duration = 4beats
    convertDurationToSeconds = (duration: number) => {
      if (duration === 0) return 0;
      return (4 / duration) * 60 / this.tempo;
    };

    playNote = (noteIndex: number, time: number) => {
      let oscillator = audioContext.createOscillator();
      oscillator.frequency.value = frequencies[noteIndex];
      oscillator.type = 'sine';
      oscillator.connect(gain);

      oscillator.start(time);
      oscillator.stop(time + this.convertDurationToSeconds(this.duration));
    };

    nextNote = () => {
      this.relativeNextNoteTime += this.convertDurationToSeconds(this.duration);
      if (this.normalDuration > 0) {
        this.duration = this.normalDuration;
        this.normalDuration = -1;
      }
    };

    getNote = (time: number) => {
      this.expect(/[cdefgab]/);
      let noteIndex = NOTE_INDEXES[this.mml[this.mmlIndex]] + BASE_KEY_INDEX + this.getOctaveOffset();

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
        this.chord.noteIndexes.push(noteIndex);
        return;
      }
      this.playNote(noteIndex, time);
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

      this.nextNote();
    };

    getChord = (time: number) => {
      this.expect(/\[/);
      this.readingChord = true;
      this.chord = {noteIndexes: [], startTime: time};
    };

    playChord = () => {
      this.expect(/]/);
      if (this.isNextValid(/[\d^.]/)) {
        this.getDuration();
      }
      this.chord.noteIndexes.map(noteIndex => {
        this.playNote(noteIndex, this.chord.startTime);
      });
      this.readingChord = false;
      this.chord = {noteIndexes: [], startTime: null};
      this.nextNote();
    };

    setInfiniteLoop = () => {
      this.expect(/$/);
      this.infiniteLoopStartIndex = this.prepareLoopIndex();
    };

    prepareLoopIndex = () => {
      this.preLoopOctave = this.octave;
      this.preLoopTempo = this.tempo;
      this.preLoopDuration = this.duration;
      return ++this.mmlIndex;
    };

    restartLoopIndex = (index: number) => {
      this.mmlIndex = index;
      this.octave = this.preLoopOctave;
      this.tempo = this.preLoopTempo;
      this.duration = this.preLoopDuration;
    };

    startLoop = () => {
      this.expect(/\//);
      this.mmlIndex++;
      this.expect(/:/);
      this.loopStartIndex = this.prepareLoopIndex();
    };

    endLoop = () => {
      this.expect(/:/);
      this.mmlIndex++;
      this.expect(/\//);
      if (this.loopCount < 0) {
        this.loopCount = 0;
        while (this.isNextValid(/\d/)) {
          this.loopCount = this.loopCount * 10 + parseInt(this.mml[this.mmlIndex]);
        }
        if (this.loopCount === 0) this.loopCount = 2;
        this.loopEndIndex = this.mmlIndex;
      }

      if (--this.loopCount === 0) {
        return this.exitLoop();
      }
      if (this.loopStartIndex < 0) return;
      this.restartLoopIndex(this.loopStartIndex);
    };

    breakLoop = () => {
      if (this.loopCount !== 1) return;
      this.exitLoop();
    };

    exitLoop = () => {
      if (this.loopEndIndex < 0) return;
      this.loopCount = -1;
      this.loopStartIndex = -1;
      this.mmlIndex = this.loopEndIndex;
      this.loopEndIndex = -1;
    };

    parseMML = (relativeCurrentTime: number) => {
      while (this.relativeNextNoteTime < relativeCurrentTime + scheduleTime
      && this.mmlIndex < this.mml.length) {
        let prevMMLIndex = this.mmlIndex;
        switch (this.mml[this.mmlIndex]) {
          case "c":
          case "d":
          case "e":
          case "f":
          case "g":
          case "a":
          case "b":
            this.getNote(startTime + this.relativeNextNoteTime);
            break;
          case "[":
            this.getChord(startTime + this.relativeNextNoteTime);
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
        if (this.infiniteLoopStartIndex >= 0 && this.mmlIndex >= this.mml.length) {
          this.restartLoopIndex(this.infiniteLoopStartIndex);
        }
      }
    }

  }

  let sequences: Sequence[] = [];

  export const playMML = (mmlString: string) => {
    let mmls = mmlString.toLowerCase().replace(/\s/g, '').split(';');

    mmls.map(mml => {
      if (!mml) return;
      sequences.push(new Sequence(mml));
    });

    setInterval(parseMML, lookahead);
  };

  let parseMML = () => {
    if (!startTime) startTime = audioContext.currentTime;

    let relativeCurrentTime = audioContext.currentTime;
    sequences.map(sequence => {
      sequence.parseMML(relativeCurrentTime);
    });
  };

}