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
  oscillators: OscillatorNode[];
  gain: GainNode;
  bpm: number;

  constructor(private alertCtrl: AlertController) {
    this.notes = calculateNotes();
    this.segments = initializeSegments(this.notes);
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');
    this.currentSegmentIndex = 0;
    this.bpm = 120;

    this.audioContext = new AudioContext();
    this.gain = this.audioContext.createGain();
    this.oscillators = [];
    for (let i = 0; i < this.notes.length; i++) {
      let oscillator = this.audioContext.createOscillator();
      oscillator.frequency.value = this.notes[i].frequency;
      oscillator.type = 'sine';
      oscillator.start();
      this.oscillators.push(oscillator);
    }
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
    if (this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1]) {
      this.playNote(note);
    } else {
      this.muteNote(note);
    }
  }

  private muteNote(note: NotesInterface) {
    try {
      this.oscillators[note.id - 1].disconnect(this.gain);
    } catch (e) {
      console.log("Already disconnected oscillator #" + note.id)
    }
  }

  // 1 / ( (beats per minute / 60s) / 1000ms ) = ms per beats
  private convertBPMToMilliseconds = () => {
    return 60000 / this.bpm;
  };

  private playNote(note: NotesInterface) {
    this.oscillators[note.id - 1].connect(this.gain);
    setTimeout(() => {
      this.muteNote(note);
    }, this.convertBPMToMilliseconds() * this.segments[this.currentSegmentIndex].duration)
  }

  selectSegment(index: number) {
    this.currentSegmentIndex = index;
    this.playSegment(index);
  }

  playSegment = (segmentIndex: number) => {
    this.segments[segmentIndex].noteToggles.map((on, index) => {
      if(on){
        this.playNote(this.notes[index]);
      }
    });
    return segmentIndex;
  };

  //use scheduler
  playSheet = () => {
    this.segments.map(segment => {
      segment.noteToggles.map((on, index) => {
        if(on){
          this.playNote(this.notes[index]);
        }
      });
    });
  };

  private setBPM = (bpm) => {
    this.bpm = bpm;
  };

  changeBPM = () => {
    let alert = this.alertCtrl.create({
      title: 'Change Beats per Minute (bpm)',
      inputs: [{name: 'bpm', value: `${this.bpm}`, type: "number",},],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {}
        },
        {
          text: 'OK',
          handler: data => {
            this.setBPM(data.bpm);
          }
        }
      ]
    });
    alert.present();
  };

}
