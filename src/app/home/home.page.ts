import {Component} from '@angular/core';
import {MML, NotesInterface, QUARTER_NOTE, SequenceNote, TimedSequenceNote} from '../../assets/utils/mml';
import {AlertController} from '@ionic/angular';
import Timer = NodeJS.Timer;

export interface SequenceNoteId {
  sequence: number
  note: number
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  notes: NotesInterface[];
  whiteBottomKeys: NotesInterface[];

  header: SequenceNote[];
  sequences: SequenceNote[][];
  timedSequences: number[];

  bpm = 120;
  defaultExtension = [4];
  pedal = false;
  infiniteLoop = true;
  isPlaying = false;

  playingOscillators: { [k: number]: OscillatorNode[] } = {};
  durations = {
    1: "whole",
    2: "half",
    4: "quarter",
    8: "eighth",
    16: "sixteenth",
    32: "thirty_second",
    64: "sixty_fourth"
  };

  currentEditingNoteId: SequenceNoteId = {sequence: null, note: null};
  mouseHoldTimer = {time: 0, limit: 3, cancel: false};

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
      if (rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status == 0)) {
        let allText = rawFile.responseText;
        MML.readMML(allText.replace(/[\n ]/g, ''));
        this.readNotes();

        let mml = MML.writeToMML();
        console.log(mml);
      }
    };
    rawFile.send(null);
  };

  constructor(private alertCtrl: AlertController) {
    MML.initialize();
    this.notes = MML.getNotes().map(note => {
      return {...note, key: note.key.replace('+', '#').toUpperCase()}
    });
    this.whiteBottomKeys = this.notes.filter(n => n.key.slice(-1) !== '#');
    this.readTextFile('../../assets/mml-files/compressed.mml'); // read from database
  }

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
    this.requestAnimationFrame(() => {
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

  getDurationHeight = (duration: number) => {
    return this.NOTE_SEGMENT_HEIGHT * (QUARTER_NOTE / duration);
  };

  getSequenceNoteHeight = (sequenceNote: TimedSequenceNote) => {
    return this.getDurationHeight(MML.getDurationFromExtensions(sequenceNote));
  };

  expect = (expected, actual) => {
    if (actual !== expected) {
      console.error(`Expected note length to be: ${expected}, but got: ${actual}`);
    }
  };

  readNotes = () => {
    this.header = MML.getHeaderNotesInQueue();
    if(!this.header) {
      this.header = [
          {type: 'header'},
          {type: 'tempo', tempo: this.bpm},
          {type: 'infinite-loop'},
          {type: 'default-duration', extensions: this.defaultExtension},
          {type: 'rest', extensions: [1,1,1,1]}
          ];
    }
    this.timedSequences = [];
    this.header.map(h => {
      if(h.type === "rest"){
        let expandedExtensions = [];
        h.extensions.map(ext => {
          expandedExtensions = expandedExtensions.concat(new Array(this.defaultExtension[0]).fill(this.defaultExtension[0]*ext));
        });
        this.timedSequences = this.timedSequences.concat(expandedExtensions);
      }
    });
    this.sequences = MML.getNotesInQueue();

    this.notes.map(note => {
      if(!(this.sequences[note.index] && this.sequences[note.index].filter(n=>{return n.type==="note" && n.index===note.index}).length)){
        this.sequences.splice(note.index,0,[])
      }
    });

    this.expect(this.notes.length, this.sequences.length);
  };

  stopOscillators = (noteIndex) => {
    if (!this.playingOscillators[noteIndex]) return;
    this.playingOscillators[noteIndex].map(osc => osc.stop());
    delete this.playingOscillators[noteIndex];
  };

  playNote = (noteIndex: number) => {
    if (this.playingOscillators[noteIndex] && this.playingOscillators[noteIndex].length > 0) {
      this.stopOscillators(noteIndex);
    }
    else {
      this.playingOscillators[noteIndex] =
          MML.playNote({
            type: "note",
            index: noteIndex,
            extensions: this.pedal ? [0] : this.defaultExtension
          }, this.bpm, 0);
      this.playingOscillators[noteIndex].map((osc) => {
        osc.onended = () => this.stopOscillators(noteIndex);
      });
    }
  };

  scrollPlay = () => {
    const time = Date.now() / 1000;
    if (!this.startTime) {
      this.startTime = time;
    }
    if (!this.initialScrollPosition) {
      this.initialScrollPosition = this.sheet.scrollTop;
    }
    this.sheet.scrollTop = this.initialScrollPosition - ((this.NOTE_SEGMENT_HEIGHT * this.bpm / 60) * (time - this.startTime));
    if (this.sheet.scrollTop + this.sheet.clientHeight <= this.scrollEndHeight) return;
    this.scrollTopFrameRequest = this.requestAnimationFrame(this.scrollPlay);
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

  restart = () => {
    this.sheet.scrollTop = this.sheet.scrollHeight;
    const wasPlaying = this.isPlaying;
    this.stopSheet();
    if (wasPlaying) {
      this.playSheet();
    }
  };

  toggleEditNote = (noteId: SequenceNoteId) => {
    this.currentEditingNoteId = {sequence: noteId.sequence, note: noteId.note};
  };

  holdNote = (noteId: SequenceNoteId) => {
    this.mouseHoldTimer.time = 0;
    this.mouseHoldTimer.cancel = false;
    this.currentEditingNoteId = {sequence: null, note: null};
    let holdNoteTimeout = () => {
      setTimeout(() => {
        this.mouseHoldTimer.time++;
        if (this.mouseHoldTimer.time < this.mouseHoldTimer.limit) {
          holdNoteTimeout();
        } else if (!this.mouseHoldTimer.cancel) {
          this.toggleEditNote(noteId);
        }
      }, 100)
    };
    holdNoteTimeout();
  };

  toggleNoteOfSegment = (noteId: SequenceNoteId) => {
    if (this.mouseHoldTimer.time >= this.mouseHoldTimer.limit) return;
    this.mouseHoldTimer.cancel = true;
    let note = this.sequences[noteId.sequence][noteId.note];
    switch (note.type) {
      case "rest":
        note = {
          type: "note",
          index: noteId.sequence,
          extensions: note.extensions
        };
        MML.playNote(note, this.bpm, 0);
        break;
      case "note":
        note = {
          type: "rest",
          extensions: note.extensions
        };
        break;
    }

    this.sequences[noteId.sequence][noteId.note] = note;
  };

  deleteEditingNote = () => {
    this.sequences[this.currentEditingNoteId.sequence].splice(this.currentEditingNoteId.note, 1);
    this.currentEditingNoteId = {sequence: null, note: null};
  };

  appendRest = () => {
    this.sequences[this.currentEditingNoteId.sequence].splice(++this.currentEditingNoteId.note, 0,
        {type: "rest", extensions: this.defaultExtension});
  };

  toggleInfiniteLoop = () => {
    this.infiniteLoop = !this.infiniteLoop;

    this.sequences.map(sequence => {
      let infiniteLoopFound = false;
      for (let i = 0; i < sequence.length; i++) {
        let seqNote = sequence[i];
        if (seqNote.type === "infinite-loop") {
          sequence.splice(i, 1);
          infiniteLoopFound = true;
          break;
        }
      }
      if (!infiniteLoopFound && this.infiniteLoop) {
        sequence.unshift({type: "infinite-loop"});
      }
    });
    console.log(MML.writeToMML());
  };

  togglePedal = () => {
    if (this.pedal) {
      MML.stop();
    }
    this.pedal = !this.pedal;
  };

  updateTempo = (bpm: number) => {
    this.bpm = bpm;
    this.sequences.map(sequence => {
      let tempoFound = false;
      for (let i = 0; i < sequence.length; i++) {
        let seqNote = sequence[i];
        if (seqNote.type === "tempo") {
          seqNote.tempo = bpm;
          tempoFound = true;
          break;
        }
      }
      if (!tempoFound) {
        sequence.unshift({type: "tempo", tempo: bpm});
      }
    });
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
            this.updateTempo(data.bpm);
          }
        }
      ]
    }).then(bpmPopup => bpmPopup.present());
  };

  updateDefaultExtension = (newExtension: number[]) => {

    this.sequences.map((sequence) => {
      for (let i = sequence.length - 1; i >= 0; i--) {
        let rest = sequence[i];
        if (rest.type === "note") break;
        if (rest.type !== "rest") continue;
        if (rest.extensions.join() === this.defaultExtension.join()) {
          rest.extensions = newExtension;
        }
      }
    });

    this.header.map(headerItem => {
      if(headerItem.type === "default-duration"){
        headerItem.extensions = newExtension;
      }
    });

    this.defaultExtension = newExtension;
  };

  getSelectedNote = (): TimedSequenceNote => {
    let selectedNote = this.sequences[this.currentEditingNoteId.sequence][this.currentEditingNoteId.note];
    switch (selectedNote.type) {
      case "rest":
      case "note":
        return selectedNote;
    }
  };

  showUpdateDefaultDuration = () => {
    this.alertCtrl.create({
      header: "Set the Default Note Duration",
      inputs: Object.keys(this.durations).map(d => {
        return {
          type: 'radio', name: 'duration', value: d, label: d,
          checked: this.defaultExtension[0] === parseInt(d)
        }
      }),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Ok',
          handler: (duration: string) => {
            this.updateDefaultExtension([parseInt(duration)]);
          }
        }
      ]
    }).then(durationPopup => durationPopup.present());
  };

  updateExtensions = (newExtension: string, extensionId: number) => {
    let timedNote = this.getSelectedNote();

    switch (newExtension) {
      case " ":
        if (extensionId >= 0) timedNote.extensions.splice(extensionId, 1);
        break;
      case ".":
        let dottedDuration = timedNote.extensions.slice(-1)[0] * 2;
        timedNote.extensions.push(dottedDuration);
        break;
      default:
        if (extensionId >= 0) timedNote.extensions[extensionId] = parseInt(newExtension);
        else timedNote.extensions.push(parseInt(newExtension));
        break;
    }
  };

  showUpdateExtensions = (extensionId: number) => {
    this.alertCtrl.create({
      header: `Add Note Extension`,
      inputs: [{type: 'radio', name: 'extension', value: ' ', label: ' ', checked: extensionId < 0},
        {type: 'radio', name: 'extension', value: '.', label: '.'}]
          .concat(Object.keys(this.durations).map(d => {
            return {
              type: 'radio', name: 'extension', value: d, label: d,
              checked: extensionId >= 0 && this.getSelectedNote().extensions[extensionId] === parseInt(d)
            }
          })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Ok',
          handler: (newExtensionString: string) => {
            this.updateExtensions(newExtensionString, extensionId);
          }
        }
      ]
    }).then(extensionPopup => extensionPopup.present());
  };
}
