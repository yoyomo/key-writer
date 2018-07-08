webpackJsonp([0],{

/***/ 108:
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
webpackEmptyAsyncContext.id = 108;

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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__assets_utils_calculate_notes__ = __webpack_require__(269);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__assets_utils_note_segment__ = __webpack_require__(270);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_ionic_angular__ = __webpack_require__(54);
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
    function HomePage(alertCtrl) {
        var _this = this;
        this.alertCtrl = alertCtrl;
        //scrolls to bottom whenever the page has loaded
        // noinspection JSUnusedGlobalSymbols
        this.ionViewDidEnter = function () {
            var screen = document.getElementById("screen");
            var keyboard = document.getElementById("keyboard");
            var sheet = document.getElementById("sheet");
            if (screen) {
                screen.scrollTop = screen.scrollHeight;
                screen.scrollLeft = (screen.scrollWidth - screen.clientWidth) / 2;
                keyboard.scrollTop = keyboard.scrollHeight;
                keyboard.scrollLeft = (keyboard.scrollWidth - keyboard.clientWidth) / 2;
                sheet.scrollTop = sheet.scrollHeight;
                sheet.scrollLeft = (sheet.scrollWidth - sheet.clientWidth) / 2;
            }
        };
        this.handleSheetScroll = function (e) {
            e.preventDefault();
            var keyboard = document.getElementById("keyboard");
            keyboard.scrollLeft = e.target.scrollLeft;
        };
        this.handleKeyboardScroll = function (e) {
            e.preventDefault();
            var sheet = document.getElementById("sheet");
            sheet.scrollLeft = e.target.scrollLeft;
        };
        // 1 / ( (beats per minute / 60s) / 1000ms ) = ms per beats
        this.convertBPMToMilliseconds = function () {
            return 60000 / _this.bpm;
        };
        this.playSegment = function (segmentIndex) {
            _this.segments[segmentIndex].noteToggles.map(function (on, index) {
                if (on) {
                    _this.playNote(_this.notes[index]);
                }
            });
            return segmentIndex;
        };
        //use scheduler
        this.playSheet = function () {
            _this.segments.map(function (segment) {
                segment.noteToggles.map(function (on, index) {
                    if (on) {
                        _this.playNote(_this.notes[index]);
                    }
                });
            });
        };
        this.setBPM = function (bpm) {
            _this.bpm = bpm;
        };
        this.changeBPM = function () {
            var alert = _this.alertCtrl.create({
                title: 'Change Beats per Minute (bpm)',
                inputs: [{ name: 'bpm', value: "" + _this.bpm, type: "number", },],
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: function () { }
                    },
                    {
                        text: 'OK',
                        handler: function (data) {
                            _this.setBPM(data.bpm);
                        }
                    }
                ]
            });
            alert.present();
        };
        this.notes = Object(__WEBPACK_IMPORTED_MODULE_1__assets_utils_calculate_notes__["a" /* calculateNotes */])();
        this.segments = Object(__WEBPACK_IMPORTED_MODULE_2__assets_utils_note_segment__["a" /* initializeSegments */])(this.notes);
        this.whiteBottomKeys = this.notes.filter(function (n) { return n.key.slice(-1) !== '#'; });
        this.currentSegmentIndex = 0;
        this.bpm = 120;
        this.audioContext = new AudioContext();
        this.gain = this.audioContext.createGain();
        this.oscillators = [];
        for (var i = 0; i < this.notes.length; i++) {
            var oscillator = this.audioContext.createOscillator();
            oscillator.frequency.value = this.notes[i].frequency;
            oscillator.type = 'sine';
            oscillator.start();
            this.oscillators.push(oscillator);
        }
        this.gain.connect(this.audioContext.destination);
    }
    HomePage.prototype.selectNote = function (note) {
        if (this.segments[this.currentSegmentIndex].noteToggles[note.id - 1] = !this.segments[this.currentSegmentIndex].noteToggles[note.id - 1]) {
            this.playNote(note);
        }
        else {
            this.muteNote(note);
        }
    };
    HomePage.prototype.muteNote = function (note) {
        try {
            this.oscillators[note.id - 1].disconnect(this.gain);
        }
        catch (e) {
            console.log("Already disconnected oscillator #" + note.id);
        }
    };
    HomePage.prototype.playNote = function (note) {
        var _this = this;
        this.oscillators[note.id - 1].connect(this.gain);
        setTimeout(function () {
            _this.muteNote(note);
        }, this.convertBPMToMilliseconds() * this.segments[this.currentSegmentIndex].duration);
    };
    HomePage.prototype.selectSegment = function (index) {
        this.currentSegmentIndex = index;
        this.playSegment(index);
    };
    HomePage = __decorate([
        Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["m" /* Component */])({
            selector: 'page-home',template:/*ion-inline-start:"/Users/mando/Documents/code/key-writer/src/pages/home/home.html"*/'<ion-header>\n  <ion-navbar align="center">\n    <ion-title>\n      Key Writer\n    </ion-title>\n    <ion-buttons right>\n      <button ion-button icon-only (click)="changeBPM()">\n        <span>{{bpm}}bpm</span>\n      </button>\n      <button ion-button icon-only (click)="playSheet()">\n        <ion-icon name="play"></ion-icon>\n      </button>\n    </ion-buttons>\n  </ion-navbar>\n</ion-header>\n\n<ion-content>\n  <div class="screen" id="screen">\n    <div class="book">\n      <div id="sheet" (scroll)="handleSheetScroll($event)" class="sheet">\n        <div *ngFor="let segment of segments; let segmentIndex = index"\n             [ngClass]="\'note-segment \'+(currentSegmentIndex === segmentIndex ? \'selected-segment\' : \'\')"\n             (click)="selectSegment(segmentIndex)">\n          <div [ngClass]="\'left-margin \' + (segment.noteToggles[0] ? \'on\' : \'off\')"></div>\n          <div *ngFor="let noteOfSegment of segment.noteToggles; let i = index"\n               [ngClass]="\'note-of-segment \' + (noteOfSegment ? \'on\' : \'off\') + \' \'+\n                  (notes[i].key.slice(-1) === \'#\' ? \'w-black\' : \'w-\'+notes[i].key) + (i !== notes.length-1 ? \' br\' : \'\')">\n            <!--{{notes[i].key}}-->\n          </div>\n          <div\n              [ngClass]="\'right-margin br \' + (segment.noteToggles[segment.noteToggles.length-1] ? \'on\' : \'off\')"></div>\n        </div>\n      </div>\n    </div>\n\n    <div class="keyboard" id="keyboard" (scroll)="handleKeyboardScroll($event)">\n      <div class="top-keys">\n        <div class="white-key left-margin" (click)="playNote(notes[0])"></div>\n        <div *ngFor="let note of notes" col-1\n             [ngClass]="(note.key.slice(-1) === \'#\') ? \'black-top-key\' : \'white-top-key-\'+note.key"\n             (click)="selectNote(note)">\n          <!--<div class="absolute">{{note.key + note.octave}}</div>-->\n        </div>\n        <div class="white-key right-margin br" (click)="playNote(notes[notes.length-1])"></div>\n      </div>\n\n      <div class="bottom-keys">\n        <div class="bottom-key" *ngFor="let whiteBottomKey of whiteBottomKeys"\n             (click)="selectNote(whiteBottomKey)">\n          <div class="absolute gray">{{whiteBottomKey.key + whiteBottomKey.octave}}</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</ion-content>\n'/*ion-inline-end:"/Users/mando/Documents/code/key-writer/src/pages/home/home.html"*/
        }),
        __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_3_ionic_angular__["a" /* AlertController */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_3_ionic_angular__["a" /* AlertController */]) === "function" && _a || Object])
    ], HomePage);
    return HomePage;
    var _a;
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_ionic_angular__ = __webpack_require__(54);
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
                __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["d" /* IonicModule */].forRoot(__WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */], {}, {
                    links: []
                })
            ],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_2_ionic_angular__["b" /* IonicApp */]],
            entryComponents: [
                __WEBPACK_IMPORTED_MODULE_5__app_component__["a" /* MyApp */],
                __WEBPACK_IMPORTED_MODULE_6__pages_home_home__["a" /* HomePage */]
            ],
            providers: [
                __WEBPACK_IMPORTED_MODULE_4__ionic_native_status_bar__["a" /* StatusBar */],
                __WEBPACK_IMPORTED_MODULE_3__ionic_native_splash_screen__["a" /* SplashScreen */],
                { provide: __WEBPACK_IMPORTED_MODULE_1__angular_core__["u" /* ErrorHandler */], useClass: __WEBPACK_IMPORTED_MODULE_2_ionic_angular__["c" /* IonicErrorHandler */] }
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_ionic_angular__ = __webpack_require__(54);
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
        __metadata("design:paramtypes", [__WEBPACK_IMPORTED_MODULE_1_ionic_angular__["e" /* Platform */], __WEBPACK_IMPORTED_MODULE_2__ionic_native_status_bar__["a" /* StatusBar */], __WEBPACK_IMPORTED_MODULE_3__ionic_native_splash_screen__["a" /* SplashScreen */]])
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
/* unused harmony export INITIAL_SEGMENT_COUNT */
/* harmony export (immutable) */ __webpack_exports__["a"] = initializeSegments;
var INITIAL_SEGMENT_COUNT = 32;
function initializeSegments(notes) {
    var noteToggles = new Array(notes.length).fill(false);
    var segments = [];
    for (var i = 0; i < INITIAL_SEGMENT_COUNT; i++) {
        segments.push({ noteToggles: noteToggles.slice(), duration: 1 });
    }
    return segments;
}
//# sourceMappingURL=note-segment.js.map

/***/ })

},[194]);
//# sourceMappingURL=main.js.map