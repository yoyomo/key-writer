import {Component} from '@angular/core';
import {calculateNotes, NotesInterface} from '../../assets/utils/calculate-notes';
import {MML} from '../../assets/utils/mml';
import {AlertController} from '@ionic/angular';
import Timer = NodeJS.Timer;

interface NoteSegment {
  isRest: boolean
  height: number
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  notes: NotesInterface[];
  whiteBottomKeys: NotesInterface[];

  segments: NoteSegment[][];
  currentSegmentIndex: number;
  audioContext: AudioContext;
  gain: GainNode;
  bpm: number;
  isPLaying: boolean;

  startTime: number = null;
  initialScrollPosition: number = null;
  scrollTopFrameRequest: Timer;
  scrollLeftFrameRequest: number;
  endTimeout: Timer = null;

  NOTE_SEGMENT_HEIGHT: 64;

  keyboard: HTMLElement;
  sheet: HTMLElement;

  mml: MML;

  readTextFile = (file) => {
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = () => {
      if(rawFile.readyState === 4)
      {
        if(rawFile.status === 200 || rawFile.status == 0)
        {
          let allText = rawFile.responseText;
          this.mml = new MML(allText.replace(/[\n ]/g,''));
          this.mml.parseMML();
        }
      }
    };
    rawFile.send(null);
  };

  resetSegments = () => {
    this.segments = [];
    for(let i = 0; i < this.notes.length; i++){
      this.segments[i] = [];
    }
  };

  constructor(private alertCtrl: AlertController) {
    this.notes = calculateNotes();
    this.resetSegments();
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');

    this.currentSegmentIndex = 0;
    this.bpm = 120;
    this.isPLaying = false;

    const AudioContext = window['AudioContext']
        || window['webkitAudioContext']
        || window['mozAudioContext']
        || window['oAudioContext']
        || window['msAudioContext']
        || false;

    this.audioContext = new AudioContext();
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);
    this.gain.gain.value = 0.25;

    this.readTextFile('../../assets/mml-files/cool-loop.txt'); // read from database
  }

  // First, let's shim the requestAnimationFrame API, with a setTimeout fallback
  requestAnimationFrame = window['requestAnimationFrame'] ||
      window['webkitRequestAnimationFrame'] ||
      window['mozRequestAnimationFrame'] ||
      window['oRequestAnimationFrame'] ||
      window['msRequestAnimationFrame'];

  cancelAnimationFrame = window['cancelAnimationFrame'] ||
      window['webkitCancelAnimationFrame'] ||
      window['mozCancelAnimationFrame'] ||
      window['msCancelAnimationFrame'];

  // scrolls to bottom whenever the page has loaded
  // noinspection JSUnusedGlobalSymbols
  ionViewDidEnter = () => {
    this.keyboard = document.getElementById('keyboard');
    this.sheet = document.getElementById('sheet');

    if (this.keyboard && this.sheet) {
      this.keyboard.scrollTop = this.keyboard.scrollHeight;
      this.keyboard.scrollLeft = (this.keyboard.scrollWidth - this.keyboard.clientWidth) / 2;
      this.sheet.scrollTop = this.sheet.scrollHeight;
      this.sheet.scrollLeft = (this.sheet.scrollWidth - this.sheet.clientWidth) / 2;
    }

    // this.requestAnimationFrame(this.displayNotes);
    this.displayNotes();
  };

  handleSheetScroll = (e) => {
    e.preventDefault();
    this.cancelAnimationFrame(this.scrollLeftFrameRequest);
    this.scrollLeftFrameRequest = this.requestAnimationFrame(() => this.keyboard.scrollLeft = e.target.scrollLeft);
  };

  handleKeyboardScroll = (e) => {
    e.preventDefault();
    this.cancelAnimationFrame(this.scrollLeftFrameRequest);
    this.scrollLeftFrameRequest = this.requestAnimationFrame(() => this.sheet.scrollLeft = e.target.scrollLeft);
  };

  expect = (expected, actual) => {
    if(actual !== expected){
      console.error(`Expected note length to be: ${expected}, but got: ${actual}`);
    }
  };

  displayNotes = () => {
    const sequences = this.mml.getNotesInQueue();
    this.expect(88,sequences.length);
    this.resetSegments();
    sequences.map((sequence, keyIndex) => {
      sequence.map(note => {
        let isRest = note.type === "rest";
        switch (note.type) {
          case 'rest':
          case 'note':
            this.segments[keyIndex].unshift({
              isRest: isRest, height: this.NOTE_SEGMENT_HEIGHT * (4 / note.duration)
            });
            break;
        }
      });
    });
    // this.requestAnimationFrame(this.displayNotes);
  };

  selectNote = (note: NotesInterface) => {
    this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1];
    if (this.segments[this.currentSegmentIndex].noteToggles[note.id - 1]) {
      this.playNote(note, this.audioContext.currentTime);
    }
  };

  private convertDurationToSeconds = (duration: number) => {
    return duration * 60 / this.bpm;
  };

  private playNote(note: NotesInterface, time: number = this.audioContext.currentTime) {
    let osc = this.audioContext.createOscillator();
    osc.frequency.value = note.frequency;
    osc.type = 'sawtooth';
    osc.detune.value = -5;

    osc.connect(this.gain);
    osc.start(time);
    osc.stop(time + this.convertDurationToSeconds(this.segments[this.currentSegmentIndex].duration));

    let osc2 = this.audioContext.createOscillator();
    osc2.frequency.value = note.frequency;
    osc2.type = 'triangle';
    osc2.detune.value = 5;

    osc2.connect(this.gain);
    osc2.start(time);
    osc2.stop(time + this.convertDurationToSeconds(this.segments[this.currentSegmentIndex].duration));
  }

  selectNoteOfSegment = (segmentIndex: number, note: NotesInterface) => {
    this.currentSegmentIndex = segmentIndex;
    this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1];
    this.selectSegment(segmentIndex);
  };

  selectSegment(segmentIndex: number) {
    this.currentSegmentIndex = segmentIndex;
    const now = this.audioContext.currentTime;
    this.segments[segmentIndex].noteToggles.map((on, noteIndex) => {
      if (on) {
        this.playNote(this.notes[noteIndex], now);
      }
    });
  }

  scrollPlay = () => {
    const time = this.audioContext.currentTime;
    if (!this.initialScrollPosition) { this.initialScrollPosition = this.sheet.scrollTop; }
    this.sheet.scrollTop = this.initialScrollPosition - ((this.NOTE_SEGMENT_HEIGHT * this.bpm / 60) * (time - this.startTime));
    this.scrollTopFrameRequest =  this.requestAnimationFrame(this.scrollPlay);
  };

  playSheet = () => {
    this.isPLaying = true;
    this.mml.play();
    this.scrollPlay();
  };

  endSheet = (endTime: number) => {
    if (this.audioContext.currentTime >= endTime) {
      this.stopSheet();
    } else {
      this.endTimeout = setTimeout(() => this.endSheet(endTime), 25);
    }
  };

  stopSheet = () => {
    this.isPLaying = false;
    this.mml.stop();
    this.gain.disconnect(this.audioContext.destination);
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);

    this.cancelAnimationFrame(this.scrollTopFrameRequest);
    this.initialScrollPosition = null;
    this.startTime = null;

    clearTimeout(this.endTimeout);
  };

  changeBPM = () => {
    this.alertCtrl.create({
      header: 'Change Beats per Minute (bpm)',
      inputs: [{name: 'bpm', value: `${this.bpm}`, type: 'number'}],
      buttons: [
        {
          text: 'Cancel', role: 'cancel', handler: () => {
          }
        },
        {
          text: 'OK', handler: data => {
            if (data.bpm <= 0) {
              this.alertCtrl.create({
                header: 'BPM out of bounds',
                subHeader: 'BPM have to be greater than 0',
                buttons: ['OK']
              }).then(bpmError => bpmError.present());
              return;
            }
            this.bpm = data.bpm;
          }
        }
      ]
    }).then(bpmPopup => bpmPopup.present());
  };

  restart = () => {
    this.sheet.scrollTop = this.sheet.scrollHeight;
    const wasPlaying = this.isPLaying;
    this.stopSheet();
    if (wasPlaying) { this.playSheet(); }
  }
}
