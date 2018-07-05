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

  //scrolls to bottom whenever the page has loaded
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

  constructor() {
    this.notes = calculateNotes();
    this.segments = initializeSegments(this.notes);
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');
    this.currentSegmentIndex = 0;
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

  decreaseDuration(segment: SegmentsInterface){
    segment.duration = segment.duration / 2;
  }

  increaseDuration(segment: SegmentsInterface){
    segment.duration = segment.duration * 2;
  }

}
