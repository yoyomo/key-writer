import {Component} from '@angular/core';
import {calculateNotes, NotesInterface} from '../../assets/data/calculate-notes';
import {initializeSegments, SegmentsInterface} from '../../assets/data/note-segment';

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

  constructor() {
    this.notes = calculateNotes();
    this.segments = initializeSegments(this.notes);
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');
    this.currentSegmentIndex = 0;

    let AudioContext = window.AudioContext || webkitAudioContext;
    this.audioContext = new AudioContext();
    this.gain = this.audioContext.createGain();
    this.oscillators = [];
    for(let i=0; i < this.notes.length; i++){
      let oscillator = this.audioContext.createOscillator();
      oscillator.frequency.value = this.notes[i].frequency;
      oscillator.type = 'sine';
      oscillator.start();
      this.oscillators.push(oscillator);
    }
  }

  //scrolls to bottom whenever the page has loaded
  // noinspection JSUnusedGlobalSymbols
  static ionViewDidEnter() {
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
  }

  handleSheetScroll(e){
    e.preventDefault();
    let keyboard = document.getElementById("keyboard");
    keyboard.scrollLeft = e.target.scrollLeft;
  }

  handleKeyboardScroll(e){
    e.preventDefault();
    let sheet = document.getElementById("sheet");
    sheet.scrollLeft = e.target.scrollLeft;
  }

  playNote(note: NotesInterface) {
    let isPlaying = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1];
    this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = isPlaying;
    if (isPlaying) {
      //play frequency audio
      this.oscillators[note.id-1].connect(this.gain);
      this.gain.connect(this.audioContext.destination);
    }else{
      try{
        this.oscillators[note.id-1].disconnect(this.gain);
      }catch(e){
        console.log("Already disconnected oscillator #"+note.id)
      }
    }
    return;
  }

  selectSegment(index: number) {
    this.currentSegmentIndex = index;
    this.playSegment(index);
    return;
  }

  playSegment(segmentIndex: number) {
    //play all note frequencies according to this.segments[segmentIndex].noteToggles
    // for a duration of this.segments[segmentIndex].duration according to defined BPM

    return segmentIndex;
  }

}
