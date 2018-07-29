import {Component} from '@angular/core';
import {calculateNotes, NotesInterface} from '../../assets/utils/calculate-notes';
import {initializeSegments, SegmentsInterface} from '../../assets/utils/note-segment';
import {MML} from '../../assets/utils/mml';
import {AlertController} from '@ionic/angular';
import Timer = NodeJS.Timer;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
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
  scrollTopFrameRequest: Timer;
  scrollLeftFrameRequest: number;
  endTimeout: Timer = null;

  NOTE_SEGMENT_HEIGHT: number;

  keyboard: HTMLElement;
  sheet: HTMLElement;

  mml: MML;

  constructor(private alertCtrl: AlertController) {
    this.notes = calculateNotes();
    this.segments = initializeSegments(this.notes);
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');

    this.currentSegmentIndex = 0;
    this.bpm = 120;
    this.isPLaying = false;

    const AudioContext = window['AudioContext'] // Default
        || window['webkitAudioContext'] // Safari and old versions of Chrome
        || window['mozAudioContext'] // Safari and old versions of Chrome
        || window['oAudioContext'] // Safari and old versions of Chrome
        || window['msAudioContext'] // Safari and old versions of Chrome
        || false;

    this.audioContext = new AudioContext();
    this.gain = this.audioContext.createGain();
    this.gain.connect(this.audioContext.destination);
    this.gain.gain.value = 0.25;

    this.mml = new MML('$o3/:e:/3 r /:d:/3;' +
        '$o3/:g:/3 r /:g-:/3;' +
        '$o3/:b:/3 r /:b:/3;' +
        '$o3/:r:/3 r /:a:/3;');
    this.mml.play();
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

    this.NOTE_SEGMENT_HEIGHT = document.querySelector('.note-segment').clientHeight;

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

  displayNotes = () => {
    const sequences = this.mml.getNotesInQueue();
    console.log(sequences);
    sequences.map(sequence => {
      sequence.map(note => {
        switch (note.type) {
          case 'note':
            const noteDiv = document.createElement('div');
            noteDiv.className = 'on';
            noteDiv.style.height = '' + this.NOTE_SEGMENT_HEIGHT * (4 / note.duration);
            // make note segments be 0-87 (for all keys)
            // find which note-segment with note.value
            // make this function in angular for better performance (not have to delete each div and recreate)
            this.sheet.appendChild(noteDiv);
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
    const oscillator = this.audioContext.createOscillator();
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
    const now = this.audioContext.currentTime;
    let durationCount = 0;
    let endTime = 0;
    this.segments.map(segment => {
      const segmentTime = now + this.convertDurationToSeconds(durationCount);
      let lastNote = false;

      segment.noteToggles.map((on, index) => {
        if (on) {
          if (!this.startTime) { this.startTime = this.audioContext.currentTime; }
          this.playNote(this.notes[index], segmentTime);
          lastNote = true;
        }
      });
      durationCount += segment.duration;
      if (lastNote) { endTime = segmentTime + this.convertDurationToSeconds(segment.duration); }
    });

    this.endTimeout = setTimeout(() => {this.endSheet(endTime); }, endTime);

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
