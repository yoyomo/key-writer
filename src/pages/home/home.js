var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { calculateNotes } from '../../assets/data/calculate-notes';
import { initializeSegments } from '../../assets/data/note-segment';
var HomePage = /** @class */ (function () {
    function HomePage(navCtrl) {
        this.navCtrl = navCtrl;
        this.notes = calculateNotes();
        this.segments = initializeSegments(this.notes);
        this.whiteBottomKeys = this.notes.filter(function (n) { return n.key.slice(-1) !== '#'; });
        this.currentSegmentIndex = 0;
    }
    HomePage.prototype.playNote = function (note) {
        var isPlaying = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1];
        this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = isPlaying;
        if (isPlaying) {
            //play frequency audio
        }
        return;
    };
    HomePage.prototype.playSegment = function (segmentIndex) {
        //play all note frequencies according to this.segments[segmentIndex].noteToggles
        // for a duration of this.segments[segmentIndex].duration according to defined BPM
    };
    HomePage = __decorate([
        Component({
            selector: 'page-home',
            templateUrl: 'home.html'
        }),
        __metadata("design:paramtypes", [NavController])
    ], HomePage);
    return HomePage;
}());
export { HomePage };
//# sourceMappingURL=home.js.map