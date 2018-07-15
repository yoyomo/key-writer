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

let audioContext = new AudioContext();
let gain = audioContext.createGain();
gain.connect(audioContext.destination);

let tempo = 120;
let octave = 4;
let duration = 4;
let loopCount = -1;
let loopIndex = -1;
let infiniteLoop = false;

let mmlIndex = 0;
let mml: string;
let validRegex: RegExp;

let currentTime = 0;

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

let expect = (str: string, reg: RegExp) => {
  if(!reg.test(str)){
    throw new Error("Invalid MML syntax.\n" +
        "Expected: "+reg+", Got: "+str);
  }
};

let isValid = (str: string, reg: RegExp) => {
  validRegex = reg;
  return str && str.trim() && reg.test(str);
};

let getOctaveOffset = () => {
  let offset = 4 * (-12);

  for(let i = 0; i < octave; i++){
    offset += 12;
  }

  return offset;
};

let getNote = (time: number) => {
  expect(mml[mmlIndex], /[cdefgab]/);
  let noteIndex = NOTE_INDEXES[mml[mmlIndex]] + BASE_KEY_INDEX + getOctaveOffset();

  mmlIndex++;
  if(isValid(mml[mmlIndex], /[-+#\d]/)) {
    switch (mml[mmlIndex]) {
      case "-":
        noteIndex--;
        break;
      case "+":
      case "#":
        noteIndex++;
        break;
      default:
        getDuration();
        break;
    }
  }

  playNote(noteIndex,time);
  currentTime += convertDurationToSeconds(duration);
};

let getOctave = () => {
  expect(mml[mmlIndex], /o/);
  mmlIndex++;
  if(isValid(mml[mmlIndex], /\d/)) {
    octave = parseInt(mml[mmlIndex]);
  }
};

let decreaseOctave = () => {
  expect(mml[mmlIndex], />/);
  mmlIndex++;
  if(isValid(mml[mmlIndex], /\d/)) {
    octave -= parseInt(mml[mmlIndex]);
  }
  else{
    octave--;
  }
};

let increaseOctave = () => {
  expect(mml[mmlIndex], /</);
  mmlIndex++;
  if(isValid(mml[mmlIndex], /\d/)) {
    octave += parseInt(mml[mmlIndex]);
  }
  else{
    octave++;
  }
};

export const playMML = (mmlString: string) => {
  mml = mmlString.toLowerCase();

  let startTime = audioContext.currentTime;
  mmlIndex = 0;
  while(mmlIndex < mml.length) {
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
        getChord();
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
        mmlIndex++;
        break;
    }

    if(isValid(mml[mmlIndex],validRegex)) mmlIndex++;
  }


};