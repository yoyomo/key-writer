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

  let tempo = 120;
  let octave = 4;
  let duration = 4;
  let normalDuration = -1;
  let loopCount = -1;
  let loopStartIndex = -1;
  let loopEndIndex = -1;
  let infiniteLoopStartIndex = -1;

  let preLoopTempo: number;
  let preLoopOctave: number;
  let preLoopDuration: number;

  let scheduleTime = 0.1;
  let lookahead = 25;

  interface Chord {
    noteIndexes: number[]
    startTime: number
  }

  let chord: Chord = {
    noteIndexes: [],
    startTime: null
  };

  let mmlIndex = 0;
  let mml: string;
  let goToNext = false;

  let startTime: number;
  let currentTime = 0;

  let expect = (reg: RegExp) => {
    if (!reg.test(mml[mmlIndex])) {
      throw new Error("Invalid MML syntax.\n" +
          "Expected: " + reg + ", Got: " + mml[mmlIndex]);
    }
  };

  let isThisValid = (reg: RegExp) => {
    return goToNext = mml[mmlIndex] && mml[mmlIndex].trim() && reg.test(mml[mmlIndex]);
  };

  let isNextValid = (reg: RegExp) => {
    mmlIndex++;
    return isThisValid(reg);
  };

  let getOctaveOffset = () => {
    let offset = 4 * (-12);

    for (let i = 0; i < octave; i++) {
      offset += 12;
    }

    return offset;
  };

  let getDuration = () => {
    expect(/[\dl^.]/);
    normalDuration = duration;

    while (isThisValid(/[\dl^.]/)) {
      switch (mml[mmlIndex]) {
        case "l":
          normalDuration = -1;
          let length = 0;
          while (isNextValid(/\d/)) {
            length = length * 10 + parseInt(mml[mmlIndex]);
            duration = length;
          }
          break;
        case "^":
          while (isThisValid(/\^/)) {
            let extension = 0;
            while (isNextValid(/\d/)) {
              extension = extension * 10 + parseInt(mml[mmlIndex]);
            }
            if (extension === 0) extension = duration;
            duration = (duration * extension) / (duration + extension);
          }
          break;
        case ".":
          let extension = duration;
          do {
            extension *= 2;
            duration = (duration * extension) / (duration + extension);
          } while (isNextValid(/\./));
          break;
        default: {
          let length = 0;
          do {
            length = length * 10 + parseInt(mml[mmlIndex]);
            duration = length;
          } while (isNextValid(/\d/));
          break;
        }
      }
    }
  };

// 1 duration = 4beats
  let convertDurationToSeconds = (duration: number) => {
    if (duration === 0) return 0;
    return (4 / duration) * 60 / tempo;
  };

  let playNote = (noteIndex: number, time: number) => {
    let oscillator = audioContext.createOscillator();
    oscillator.frequency.value = frequencies[noteIndex];
    oscillator.type = 'sine';
    oscillator.connect(gain);

    oscillator.start(time);
    oscillator.stop(time + convertDurationToSeconds(duration));
  };

  let nextNote = () => {
    currentTime += convertDurationToSeconds(duration);
    if (normalDuration > 0) {
      duration = normalDuration;
      normalDuration = -1;
    }
  };

  let getNote = (time: number) => {
    expect(/[cdefgab]/);
    let noteIndex = NOTE_INDEXES[mml[mmlIndex]] + BASE_KEY_INDEX + getOctaveOffset();

    if (isNextValid(/[-+#\d^.]/)) {
      switch (mml[mmlIndex]) {
        case "-":
          noteIndex--;
          break;
        case "+":
        case "#":
          noteIndex++;
          break;
        default:
          if (readingChord) break;
          getDuration();
          break;
      }
    }

    if (readingChord) {
      chord.noteIndexes.push(noteIndex);
      return;
    }
    playNote(noteIndex, time);
    nextNote();
  };

  let getOctave = () => {
    expect(/o/);
    if (isNextValid(/\d/)) {
      octave = parseInt(mml[mmlIndex]);
    }
  };

  let decreaseOctave = () => {
    expect(/>/);

    if (isNextValid(/\d/)) {
      octave -= parseInt(mml[mmlIndex]);
    }
    else {
      octave--;
    }
  };

  let increaseOctave = () => {
    expect(/</);

    if (isNextValid(/\d/)) {
      octave += parseInt(mml[mmlIndex]);
    }
    else {
      octave++;
    }
  };

  let getTempo = () => {
    expect(/t/);

    let newTempo = 0;
    while (isNextValid(/\d/)) {
      newTempo = newTempo * 10 + parseInt(mml[mmlIndex]);
      tempo = newTempo;
    }
  };

  let getRest = () => {
    expect(/r/);

    if (isNextValid(/[\d^.]/)) {
      getDuration();
    }

    nextNote();
  };

  let readingChord = false;
  let getChord = (time: number) => {
    expect(/\[/);
    readingChord = true;
    chord = {noteIndexes: [], startTime: time};
  };

  let playChord = () => {
    expect(/]/);
    if (isNextValid(/[\d^.]/)) {
      getDuration();
    }
    chord.noteIndexes.map(noteIndex => {
      playNote(noteIndex, chord.startTime);
    });
    readingChord = false;
    chord = {noteIndexes: [], startTime: null};
    nextNote();
  };

  let setInfiniteLoop = () => {
    expect(/$/);
    infiniteLoopStartIndex = prepareLoopIndex();
  };

  let prepareLoopIndex = () => {
    preLoopOctave = octave;
    preLoopTempo = tempo;
    preLoopDuration = duration;
    return ++mmlIndex;
  };

  let restartLoopIndex = (index: number) => {
    mmlIndex = index;
    octave = preLoopOctave;
    tempo = preLoopTempo;
    duration = preLoopDuration;
  };

  let startLoop = () => {
    expect(/\//);
    mmlIndex++;
    expect(/:/);
    loopStartIndex = prepareLoopIndex();
  };

  let endLoop = () => {
    expect(/:/);
    mmlIndex++;
    expect(/\//);
    if (loopCount < 0) {
      loopCount = 0;
      while (isNextValid(/\d/)) {
        loopCount = loopCount * 10 + parseInt(mml[mmlIndex]);
      }
      if (loopCount === 0) loopCount = 2;
      loopEndIndex = mmlIndex;
    }

    if (--loopCount === 0) {
      return breakLoop();
    }
    if (loopStartIndex < 0) return;
    restartLoopIndex(loopStartIndex);
  };

  let breakLoop = () => {
    if (loopEndIndex < 0) return;
    if (loopCount !== 1) return;
    loopCount = -1;
    loopStartIndex = -1;
    mmlIndex = loopEndIndex;
  };

  export const playMML = (mmlString: string) => {
    mml = mmlString.toLowerCase().split(' ').join('');

    mmlIndex = 0;

    setInterval(parseMML,lookahead);
  };

  let parseMML = () => {
    if(!startTime) startTime = audioContext.currentTime;
    while (currentTime < audioContext.currentTime + scheduleTime && mmlIndex < mml.length) {
      let prevMMLIndex = mmlIndex;
      switch (mml[mmlIndex]) {
        case "c":
        case "d":
        case "e":
        case "f":
        case "g":
        case "a":
        case "b":
          getNote(startTime + currentTime);
          break;
        case "[":
          getChord(startTime + currentTime);
          break;
        case "]":
          playChord();
          break;
        case "r":
          getRest();
          break;
        case "l":
          getDuration();
          break;
        case "o":
          getOctave();
          break;
        case ">":
          decreaseOctave();
          break;
        case "<":
          increaseOctave();
          break;
        case "t":
          getTempo();
          break;
        case "$":
          setInfiniteLoop();
          break;
        case "/":
          startLoop();
          break;
        case ":":
          endLoop();
          break;
        case "|":
          breakLoop();
          break;
        default:
          goToNext = true;
          break;
      }

      if (goToNext || prevMMLIndex === mmlIndex) mmlIndex++;
      if (infiniteLoopStartIndex >= 0 && mmlIndex >= mml.length - 1) {
        restartLoopIndex(infiniteLoopStartIndex);
      }
    }
  };

}