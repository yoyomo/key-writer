import {Component} from '@angular/core';
import {calculateNotes, NotesInterface} from '../../assets/utils/calculate-notes';
import {initializeSegments, SegmentsInterface} from '../../assets/utils/note-segment';
import {AlertController} from "ionic-angular";

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

  constructor(private alertCtrl: AlertController) {
    this.notes = calculateNotes();
    this.segments = initializeSegments(this.notes);
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');
    this.currentSegmentIndex = 0;
    this.bpm = 120;
    this.isPLaying = false;

    this.audioContext = new AudioContext();
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);
  }

  //scrolls to bottom whenever the page has loaded
  // noinspection JSUnusedGlobalSymbols
  ionViewDidEnter = () => {
    let screen = document.getElementById("screen");
    let keyboard = document.getElementById("keyboard");
    let sheet = document.getElementById("sheet");

    if (screen) {
      screen.scrollTop = screen.scrollHeight;
      screen.scrollLeft = (screen.scrollWidth - screen.clientWidth) / 2;
      keyboard.scrollTop = keyboard.scrollHeight;
      keyboard.scrollLeft = (keyboard.scrollWidth - keyboard.clientWidth) / 2;
      sheet.scrollTop = sheet.scrollHeight;
      sheet.scrollLeft = (sheet.scrollWidth - sheet.clientWidth) / 2;
    }
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
    let now = this.audioContext.currentTime;
    if (this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1]) {
      this.playNote(note, now);
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

  selectSegment(segmentIndex: number) {
    this.currentSegmentIndex = segmentIndex;
    let now = this.audioContext.currentTime;
    this.segments[segmentIndex].noteToggles.map((on, noteIndex) => {
      if (on) {
        this.playNote(this.notes[noteIndex], now);
      }
    });
  }

  startTime: number;
  startingScrollPosition: number;
  scrollPlay = () => {
    let sheet = document.getElementById("sheet");
    let time = this.audioContext.currentTime;
    if(!this.startingScrollPosition) this.startingScrollPosition = sheet.scrollTop;
    sheet.scrollTop = this.startingScrollPosition - (64 * (60 / this.bpm)) * (time - this.startTime);
    if(sheet.scrollTop > 0){
      setTimeout(this.scrollPlay, (60/this.bpm) * 1000 / 64);
    }
    else{
      this.startingScrollPosition = null;
      this.startTime = null;
    }
  };

  playSheet = () => {
    this.isPLaying = true;
    let now = this.audioContext.currentTime;
    let durationCount = 0;
    this.segments.map(segment => {
      let segmentTime = now + this.convertDurationToSeconds(durationCount);
      segment.noteToggles.map((on, index) => {
        if (on) {
          if(!this.startTime) this.startTime = this.audioContext.currentTime;
          this.playNote(this.notes[index], segmentTime);
        }
      });
      durationCount += segment.duration;
    });

    this.scrollPlay();
  };

  stopSheet = () => {
    this.isPLaying = false;
  };

  changeBPM = () => {
    let alert = this.alertCtrl.create({
      title: 'Change Beats per Minute (bpm)',
      inputs: [{name: 'bpm', value: `${this.bpm}`, type: "number"}],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'OK',
          handler: data => {
            this.bpm = data.bpm;
          }
        }
      ]
    });
    alert.present();
  };

}
