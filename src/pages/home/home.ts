import {Component} from '@angular/core';
import {calculateNotes, NotesInterface} from '../../assets/utils/calculate-notes';
import {initializeSegments, SegmentsInterface} from '../../assets/utils/note-segment';
import {AlertController} from "ionic-angular";
import {MML} from "../../assets/utils/mml";
import playMML = MML.playMML;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  notes: NotesInterface[];
  segments: SegmentsInterface[];
  whiteBottomKeys: NotesInterface[];
  currentSegmentIndex: number;
  audioContext: AudioContext;
  gain: GainNode;
  bpm: number;
  isPLaying: boolean;

  startTime: number = null;
  initialScrollPosition: number = null;
  animationFrameRequest: number;
  endTimeout: number = null;

  NOTE_SEGMENT_HEIGHT: number;

  keyboard: HTMLElement;
  sheet: HTMLElement;

  constructor(private alertCtrl: AlertController) {
    this.notes = calculateNotes();
    this.segments = initializeSegments(this.notes);
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');

    this.currentSegmentIndex = 0;
    this.bpm = 120;
    this.isPLaying = false;

    let AudioContext = window["AudioContext"] // Default
        || window["webkitAudioContext"] // Safari and old versions of Chrome
        || window["mozAudioContext"] // Safari and old versions of Chrome
        || window["oAudioContext"] // Safari and old versions of Chrome
        || window["msAudioContext"] // Safari and old versions of Chrome
        || false;

    this.audioContext = new AudioContext();
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);

    playMML("$t120l8c16d16e16 /:f16a16|c16 o5c16:/4 o4[fac o5c]8.............grarbr4........^4 [ceg<C]4. t500 o4cr o3er c r o er <<<e1.");
  }

  // First, let's shim the requestAnimationFrame API, with a setTimeout fallback
  requestAnimationFrame = (function(){
    return  window["requestAnimationFrame"] ||
        window["webkitRequestAnimationFrame"] ||
        window["mozRequestAnimationFrame"] ||
        window["oRequestAnimationFrame"] ||
        window["msRequestAnimationFrame"] ||
        function( callback ){
          window.setTimeout(callback, 1000 / 60);
        };
  })();

  cancelAnimationFrame = window["cancelAnimationFrame"] ||
      window["mozCancelAnimationFrame"] ||
      window["webkitCancelAnimationFrame"] ||
      window["msCancelAnimationFrame"];

  //scrolls to bottom whenever the page has loaded
  // noinspection JSUnusedGlobalSymbols
  ionViewDidEnter = () => {
    this.keyboard = document.getElementById("keyboard");
    this.sheet = document.getElementById("sheet");

    if (this.keyboard && this.sheet) {
      this.keyboard.scrollTop = this.keyboard.scrollHeight;
      this.keyboard.scrollLeft = (this.keyboard.scrollWidth - this.keyboard.clientWidth) / 2;
      this.sheet.scrollTop = this.sheet.scrollHeight;
      this.sheet.scrollLeft = (this.sheet.scrollWidth - this.sheet.clientWidth) / 2;
    }

    this.NOTE_SEGMENT_HEIGHT = document.querySelector(".note-segment").clientHeight;
  };

  handleSheetScroll = (e) => {
    e.preventDefault();
    let keyboard = document.getElementById("keyboard");
    keyboard.scrollLeft = e.target.scrollLeft;
  };

  handleKeyboardScroll = (e) => {
    e.preventDefault();
    let sheet = document.getElementById("sheet");
    sheet.scrollLeft = e.target.scrollLeft;
  };

  selectNote(note: NotesInterface) {
    if (this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1]) {
      this.playNote(note, this.audioContext.currentTime);
    }
  }

  private convertDurationToSeconds = (duration: number) => {
    return duration * 60 / this.bpm;
  };

  private playNote(note: NotesInterface, time: number = this.audioContext.currentTime) {
    let oscillator = this.audioContext.createOscillator();
    oscillator.frequency.value = note.frequency;
    oscillator.type = 'sine';

    oscillator.connect(this.gain);
    oscillator.start(time);
    oscillator.stop(time + this.convertDurationToSeconds(this.segments[this.currentSegmentIndex].duration));
  }

  selectNoteOfSegment = (segmentIndex: number, note: NotesInterface) => {
    this.currentSegmentIndex = segmentIndex;
    this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1];
    this.selectSegment(segmentIndex);
  };

  selectSegment(segmentIndex: number) {
    this.currentSegmentIndex = segmentIndex;
    let now = this.audioContext.currentTime;
    this.segments[segmentIndex].noteToggles.map((on, noteIndex) => {
      if (on) {
        this.playNote(this.notes[noteIndex], now);
      }
    });
  }

  scrollPlay = () => {
    let time = this.audioContext.currentTime;
    if (!this.initialScrollPosition) this.initialScrollPosition = this.sheet.scrollTop;
    this.sheet.scrollTop = this.initialScrollPosition - ((this.NOTE_SEGMENT_HEIGHT * this.bpm / 60) * (time - this.startTime));
    this.animationFrameRequest =  this.requestAnimationFrame(this.scrollPlay);
  };

  playSheet = () => {
    this.isPLaying = true;
    let now = this.audioContext.currentTime;
    let durationCount = 0;
    let endTime = 0;
    this.segments.map(segment => {
      let segmentTime = now + this.convertDurationToSeconds(durationCount);
      let lastNote = false;

      segment.noteToggles.map((on, index) => {
        if (on) {
          if (!this.startTime) this.startTime = this.audioContext.currentTime;
          this.playNote(this.notes[index], segmentTime);
          lastNote = true;
        }
      });
      durationCount += segment.duration;
      if(lastNote) endTime = segmentTime + this.convertDurationToSeconds(segment.duration);
    });

    this.endTimeout = setTimeout(()=>{this.endSheet(endTime)}, endTime);

    this.scrollPlay();
  };

  endSheet = (endTime: number) => {
    if(this.audioContext.currentTime >= endTime){
      this.stopSheet();
    }else{
      this.endTimeout = setTimeout(()=>this.endSheet(endTime), 25);
    }
  };

  stopSheet = () => {
    this.isPLaying = false;
    this.gain.disconnect(this.audioContext.destination);
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);

    this.cancelAnimationFrame(this.animationFrameRequest);
    this.initialScrollPosition = null;
    this.startTime = null;

    clearTimeout(this.endTimeout);
  };

  changeBPM = () => {
    let alert = this.alertCtrl.create({
      title: 'Change Beats per Minute (bpm)',
      inputs: [{name: 'bpm', value: `${this.bpm}`, type: "number"}],
      buttons: [
        {
          text: 'Cancel', role: 'cancel', handler: () => {
          }
        },
        {
          text: 'OK', handler: data => {
            this.bpm = data.bpm;
          }
        }
      ]
    });
    return alert.present();
  };

  restart = () => {
    this.sheet.scrollTop = this.sheet.scrollHeight;
    let wasPlaying = this.isPLaying;
    this.stopSheet();
    if(wasPlaying) this.playSheet()
  };

}
