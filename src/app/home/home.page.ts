import {Component} from '@angular/core';
import {calculateNotes, NotesInterface} from '../../assets/utils/calculate-notes';
import {MML, Note, Rest, SequenceNote} from '../../assets/utils/mml';
import {AlertController} from '@ionic/angular';
import Timer = NodeJS.Timer;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  notes: NotesInterface[];
  whiteBottomKeys: NotesInterface[];

  sequences: SequenceNote[][];

  bpm: number;
  isPlaying = false;

  startTime: number = null;
  initialScrollPosition: number = null;
  scrollTopFrameRequest: Timer;
  scrollLeftFrameRequest: number;

  NOTE_SEGMENT_HEIGHT = 64;

  keyboard: HTMLElement;
  sheet: HTMLElement;

  scrollEndHeight: number;

  readTextFile = (file) => {
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = () => {
      if(rawFile.readyState === 4)
      {
        if(rawFile.status === 200 || rawFile.status == 0)
        {
          let allText = rawFile.responseText;
          MML.initializeMML(allText.replace(/[\n ]/g,''));
          this.readNotes();
        }
      }
    };
    rawFile.send(null);
  };

  constructor(private alertCtrl: AlertController) {
    this.notes = calculateNotes();
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');

    this.bpm = 120;

    this.readTextFile('../../assets/mml-files/long.mml'); // read from database
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
    this.requestAnimationFrame(()=> {
      this.keyboard = document.getElementById('keyboard');
      this.sheet = document.getElementById('sheet');

      if (this.keyboard && this.sheet) {
        this.keyboard.scrollTop = this.keyboard.scrollHeight;
        this.keyboard.scrollLeft = (this.keyboard.scrollWidth - this.keyboard.clientWidth) / 2;
        this.sheet.scrollTop = this.sheet.scrollHeight;
        this.sheet.scrollLeft = (this.sheet.scrollWidth - this.sheet.clientWidth) / 2;
      }

      this.scrollEndHeight = document.querySelector('.empty-space').scrollHeight;
    });
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

  readNotes = () => {
    this.sequences = MML.getNotesInQueue();
    this.expect(88, this.sequences.length);
  };

  selectNote = (note: Note) => {
    // this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1];
    // if (this.segments[this.currentSegmentIndex].noteToggles[note.id - 1]) {
      MML.playNote(note,0,0);
    // }
  };

  selectNoteOfSegment = (sequenceIndex: number, sequenceNoteIndex: number) => {
    let note = this.sequences[sequenceIndex][sequenceNoteIndex];
    switch(note.type){
      case "rest":
          note = {type: "note", value: sequenceIndex, duration: note.duration, durationInSeconds: note.durationInSeconds};
        break;
      case "note":
        note = {type: "rest", duration: note.duration, durationInSeconds: note.durationInSeconds};
        break;
    }

    this.sequences[sequenceIndex][sequenceNoteIndex] = note;
  };

  selectSegment = (segmentIndex: number) => {
  //   this.currentSegmentIndex = segmentIndex;
  //   const now = this.audioContext.currentTime;
  //   this.segments[segmentIndex].noteToggles.map((on, noteIndex) => {
  //     if (on) {
  //       this.playNote(this.notes[noteIndex], now);
  //     }
  //   });
  };

  scrollPlay = () => {
    const time = Date.now() / 1000;
    if(!this.startTime) { this.startTime = time; }
    if (!this.initialScrollPosition) { this.initialScrollPosition = this.sheet.scrollTop; }
    this.sheet.scrollTop = this.initialScrollPosition - ((this.NOTE_SEGMENT_HEIGHT * this.bpm / 60) * (time - this.startTime));
    if(this.sheet.scrollTop + this.sheet.clientHeight <= this.scrollEndHeight) return;
    this.scrollTopFrameRequest =  this.requestAnimationFrame(this.scrollPlay);
  };

  playSheet = () => {
    this.isPlaying = true;
    MML.play();
    this.scrollPlay();
  };

  stopSheet = () => {
    this.isPlaying = false;
    MML.stop();

    this.cancelAnimationFrame(this.scrollTopFrameRequest);
    this.initialScrollPosition = null;
    this.startTime = null;
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
    const wasPlaying = this.isPlaying;
    this.stopSheet();
    if (wasPlaying) { this.playSheet(); }
  }
}
