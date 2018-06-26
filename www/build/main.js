webpackJsonp([0],{

/***/ 107:
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = 107;

/***/ }),

/***/ 149:
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = 149;

/***/ }),

/***/ 193:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HomePage; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__assets_data_calculate_notes__ = __webpack_require__(269);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__assets_data_note_segment__ = __webpack_require__(270);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var HomePage = /** @class */ (function () {
    function HomePage() {
        this.notes = Object(__WEBPACK_IMPORTED_MODULE_1__assets_data_calculate_notes__["a" /* calculateNotes */])();
        this.segments = Object(__WEBPACK_IMPORTED_MODULE_2__assets_data_note_segment__["a" /* initializeSegments */])(this.notes);
        this.whiteBottomKeys = this.notes.filter(function (n) { return n.key.slice(-1) !== '#'; });
        this.currentSegmentIndex = 0;
    }
    //scrolls to bottom whenever the page has loaded
    HomePage.ionViewDidEnter = function () {
        var screen = document.getElementById("screen");
        if (screen) {
            screen.scrollTop = screen.scrollHeight;
            screen.scrollLeft = (screen.scrollWidth - screen.clientWidth) / 2;
        }
    };
    HomePage.prototype.playNote = function (note) {
        var isPlaying = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1];
        this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = isPlaying;
        if (isPlaying) {
            //play frequency audio
        }
        return;
    };
    HomePage.prototype.selectSegment = function (index) {
        this.currentSegmentIndex = index;
        this.playSegment(index);
        return;
    };
    HomePage.prototype.playSegment = function (segmentIndex) {
        //play all note frequencies according to this.segments[segmentIndex].noteToggles
        // for a duration of this.segments[segmentIndex].duration according to defined BPM
        return segmentIndex;
    };
    HomePage.prototype.decreaseDuration = function (segment) {
        segment.duration = segment.duration / 2;
    };
    HomePage.prototype.increaseDuration = function (segment) {
        segment.duration = segment.duration * 2;
    };
    HomePage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-home',template:/*ion-inline-start:"/Users/mando/Documents/code/key-writer/src/pages/home/home.html"*/'<ion-header>\n  <ion-navbar align="center">\n    <ion-buttons left>\n      <button ion-button icon-only class="add-note-segment">\n        <ion-icon name="remove"></ion-icon>\n      </button>\n    </ion-buttons>\n    <ion-title>\n      Key Writer\n    </ion-title>\n    <ion-buttons right>\n      <button ion-button icon-only class="add-note-segment">\n        <ion-icon name="add"></ion-icon>\n      </button>\n      <button ion-button icon-only class="add-note-segment">\n        <ion-icon name="git-branch"></ion-icon>\n      </button>\n\n    </ion-buttons>\n  </ion-navbar>\n</ion-header>\n\n<ion-content>\n  <div class="screen" id="screen">\n    <div class="book">\n      <div class="sheet">\n        <div *ngFor="let segment of segments; let segmentIndex = index"\n             [ngClass]="\'note-segment \'+(currentSegmentIndex === segmentIndex ? \'selected-segment\' : \'\')"\n             (click)="selectSegment(segmentIndex)">\n          <div [ngClass]="\'left-margin \' + (segment.noteToggles[0] ? \'on\' : \'off\')"></div>\n          <div *ngFor="let noteOfSegment of segment.noteToggles; let i = index"\n               [ngClass]="\'note-of-segment \' + (noteOfSegment ? \'on\' : \'off\') + \' \'+\n                  (notes[i].key.slice(-1) === \'#\' ? \'w-black\' : \'w-\'+notes[i].key) + (i !== notes.length-1 ? \' br\' : \'\')">\n            <!--{{notes[i].key}}-->\n          </div>\n          <div\n              [ngClass]="\'right-margin br \' + (segment.noteToggles[segment.noteToggles.length-1] ? \'on\' : \'off\')"></div>\n          <div>\n            <button ion-button icon-only color="light" class="duration" (click)="decreaseDuration(segment)">\n              -\n            </button>\n          </div>\n          <div *ngIf="(segment.duration === 0.25)">\n            <button ion-button icon-only color="light" class="duration">\n              <img src="../../assets/imgs/semicorchea.svg" width="16px" height="16px">\n            </button>\n          </div>\n          <div *ngIf="(segment.duration === 0.5)">\n            <button ion-button icon-only color="light" class="duration">\n              <img src="../../assets/imgs/corchea.svg" width="16px" height="16px">\n            </button>\n          </div>\n          <div *ngIf="(segment.duration === 1)">\n            <button ion-button icon-only color="light" class="duration">\n              <img src="../../assets/imgs/negra.svg" width="16px" height="16px">\n            </button>\n          </div>\n          <div *ngIf="(segment.duration === 2)">\n            <button ion-button icon-only color="light" class="duration" >\n              <img src="../../assets/imgs/blanca.svg" width="16px" height="16px">\n            </button>\n          </div>\n          <div *ngIf="(segment.duration === 4)">\n            <button ion-button icon-only color="light" class="duration">\n              <img src="../../assets/imgs/redonda.svg" width="16px" height="16px">\n            </button>\n          </div>\n          <div>\n            <button ion-button icon-only color="light" class="duration" (click)="increaseDuration(segment)">\n              +\n            </button>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <div class="keyboard">\n      <div class="top-keys">\n        <div class="white-key left-margin" (click)="playNote(notes[0])"></div>\n        <div *ngFor="let note of notes" col-1\n             [ngClass]="(note.key.slice(-1) === \'#\') ? \'black-top-key\' : \'white-top-key-\'+note.key"\n             (click)="playNote(note)">\n          <!--<div class="absolute">{{note.key + note.octave}}</div>-->\n        </div>\n        <div class="white-key right-margin br" (click)="playNote(notes[notes.length-1])"></div>\n      </div>\n\n      <div class="bottom-keys">\n        <div class="bottom-key" *ngFor="let whiteBottomKey of whiteBottomKeys"\n             (click)="playNote(whiteBottomKey)">\n          <div class="absolute gray">{{whiteBottomKey.key + whiteBottomKey.octave}}</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</ion-content>\n'/*ion-inline-end:"/Users/mando/Documents/code/key-writer/src/pages/home/home.html"*/
        }),
        __metadata("design:paramtypes", [])
    ], HomePage);
    return HomePage;
}());

//# sourceMappingURL=home.js.map

/***/ }),

/***/ 194:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__ = __webpack_require__(195);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__app_module__ = __webpack_require__(217);


Object(__WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_1__app_module__["a" /* AppModule */]);
//# sourceMappingURL=main.js.map

/***/ }),

/***/ 217:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_ionic_angular__ = __webpack_require__(108);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ionic_native_splash_screen__ = __webpack_require__(189);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__ionic_native_status_bar__ = __webpack_require__(192);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__app_component__ = __webpack_require__(268);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__pages_home_home__ = __webpack_require__(193);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};







var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_1__angular_core__["I" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */],
                __WEBPACK_IMPORTED_MODULE_6__pages_home_home__["a" /* HomePage */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["c" /* IonicModule */].forRoot(__WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */], {}, {
                    links: []
                })
            ],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_2_ionic_angular__["a" /* IonicApp */]],
            entryComponents: [
                __WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */],
                __WEBPACK_IMPORTED_MODULE_6__pages_home_home__["a" /* HomePage */]
            ],
            providers: [
                __WEBPACK_IMPORTED_MODULE_4__ionic_native_status_bar__["a" /* StatusBar */],
                __WEBPACK_IMPORTED_MODULE_3__ionic_native_splash_screen__["a" /* SplashScreen */],
                { provide: __WEBPACK_IMPORTED_MODULE_1__angular_core__["u" /* ErrorHandler */], useClass: __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["b" /* IonicErrorHandler */] }
            ]
        })
    ], AppModule);
    return AppModule;
}());

//# sourceMappingURL=app.module.js.map

/***/ }),

/***/ 268:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MyApp; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(108);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__ionic_native_status_bar__ = __webpack_require__(192);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__ionic_native_splash_screen__ = __webpack_require__(189);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__pages_home_home__ = __webpack_require__(193);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var MyApp = /** @class */ (function () {
    function MyApp(platform, statusBar, splashScreen) {
        this.rootPage = __WEBPACK_IMPORTED_MODULE_4__pages_home_home__["a" /* HomePage */];
        platform.ready().then(function () {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            // statusBar.styleDefault();
            // splashScreen.hide();
        });
    }
    MyApp = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({template:/*ion-inline-start:"/Users/mando/Documents/code/key-writer/src/app/app.html"*/'<ion-nav [root]="rootPage"></ion-nav>\n'/*ion-inline-end:"/Users/mando/Documents/code/key-writer/src/app/app.html"*/
        }),
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["d" /* Platform */], __WEBPACK_IMPORTED_MODULE_2__ionic_native_status_bar__["a" /* StatusBar */], __WEBPACK_IMPORTED_MODULE_3__ionic_native_splash_screen__["a" /* SplashScreen */]])
    ], MyApp);
    return MyApp;
}());

//# sourceMappingURL=app.component.js.map

/***/ }),

/***/ 269:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = calculateNotes;
function calculateNotes() {
    var notes = [];
    var keys = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    var numOfKeys = 88;
    var newOctaveIndex = 3;
    var baseKeyPosition = 49;
    var baseFrequency = 440;
    var octave = 0;
    var keyIndex = 0;
    var n = 1;
    while (n <= numOfKeys) {
        var frequency = Math.pow(2, ((n - baseKeyPosition) / 12)) * baseFrequency;
        var key = keys[keyIndex];
        octave = octave + (keyIndex === newOctaveIndex ? 1 : 0);
        var alt = key.slice(-1) === "#" ? key[0] + 'b' : '';
        notes.push({ id: n, key: key, octave: octave, alt: alt, frequency: frequency });
        keyIndex = (keyIndex + 1) % keys.length;
        n++;
    }
    return notes;
}
//# sourceMappingURL=calculate-notes.js.map

/***/ }),

/***/ 270:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = initializeSegments;
function initializeSegments(notes) {
    var INITIAL_SEGMENT_COUNT = 8;
    var segments = [];
    var noteToggles = [];
    var frequencies = [];
    for (var j = 0; j < notes.length; j++) {
        noteToggles[j] = false;
        frequencies[j] = notes[j].frequency;
    }
    for (var i = 0; i < INITIAL_SEGMENT_COUNT; i++) {
        segments.push({ noteToggles: noteToggles.slice(), frequencies: frequencies.slice(), duration: 1 });
    }
    return segments;
}
//# sourceMappingURL=note-segment.js.map

/***/ })

},[194]);
//# sourceMappingURL=main.js.map