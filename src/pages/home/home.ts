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
  ionViewDidEnter() {
    let screen = document.getElementById("screen");
    if (screen) {
      screen.scrollTop = screen.scrollHeight;
      screen.scrollLeft = (screen.scrollWidth - screen.clientWidth) / 2;
    }
  }

  constructor() {
    this.notes = calculateNotes();
    this.segments = initializeSegments(this.notes);
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');
    this.currentSegmentIndex = 0;
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

}
