import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity} from 'react-native';
import {calculateNotes} from './calculate-notes.js';
import {initializeNoteSegments, createNodeSegment} from './note-segment.js'

let notes = calculateNotes();
let state = {
      notes: notes,
      currentlyPlayingKeys: 'AAAA',
      noteSegments: initializeNoteSegments(notes),
      currentNoteSegment: 0
    };
export default class App extends React.Component {
  render() {
    function LeftMargin() {
      return (
        <View style={[styles.whiteKey, styles.whiteTopKeyLeftMargin]}/>
      );
    }

    function RightMargin() {
      return (
        <View style={[styles.whiteKey, styles.whiteTopKeyRightMargin, styles.br]}/>
      );
    }

    function playNote(keyNum,id,frequency){
      state = {...state};
      console.log(state.currentlyPlayingKeys,state.noteSegments[0].notes[keyNum]);
      state.currentlyPlayingKeys = id;
      state.noteSegments[0].notes[keyNum] = !state.noteSegments[0].notes[keyNum];
      console.log(state.currentlyPlayingKeys,state.noteSegments[0].notes[keyNum],frequency);
      return state;
    };

    function BlackKey(props){
      return (
        <TouchableOpacity onPress={props.onClick}
         style={[styles.blackTopKey]}/>
      );
    }

    function WhiteTopKey(props){
      let keyStyle = null;
      let br = false;
      switch (props.noteKey){
        case 'A':
          keyStyle = styles.whiteTopKeyD_G_A;
          break;
        case 'B':
          keyStyle = styles.whiteTopKeyF_B;
          br = true;
          break;
        case 'C':
          keyStyle = styles.whiteTopKeyC_E;
          break;
        case 'D':
          keyStyle = styles.whiteTopKeyD_G_A;
          break;
        case 'E':
          keyStyle = styles.whiteTopKeyC_E;
          br = true;
          break;
        case 'F':
          keyStyle = styles.whiteTopKeyF_B;
          break;
        case 'G':
          keyStyle = styles.whiteTopKeyD_G_A;
          break;

      }

      return <TouchableOpacity onPress={props.onClick}
         style={[styles.whiteKey,
            keyStyle, br && styles.br]}/>;
    }

    function WhiteBottomKey(props){
      return (
        <TouchableOpacity onPress={props.onClick}
         style={[styles.whiteKey, styles.whiteBottomKey, styles.br]}/>
      );
    }

    function TopKeys(){
      return (
        <View style={styles.topKeys}>
          <LeftMargin/>
          {state.notes.map( (note, index) => {
            let id = note.key+note.octave;
            let frequency = note.frequency;
            let keyNum = index;
            return note.key.slice(-1) === "#" ? 
              <BlackKey key={id} onClick={()=>playNote(keyNum,id,frequency)}/>
            :
             <WhiteTopKey noteKey={note.key} key={id} onClick={()=>playNote(keyNum,id,frequency)}/>;
          })}
          <RightMargin/>
        </View>
      );
    }

    function BottomKeys() {
      return (
        <View style={styles.bottomKeys}>
          {state.notes.filter((note)=>{
            if (note.key.slice(-1) === "#"){
              return false;
            }
            return true;
          }).map( (note, index) => {
            let id = note.key+note.octave;
            let frequency = note.frequency;
            let keyNum = index;
            return <WhiteBottomKey key={id} onClick={()=>playNote(keyNum,id,frequency)}/>;
          })}

        </View>
      );
    }

    function Keyboard() {
      return (
        <View style={styles.keyboard}>
          <ScrollView horizontal={true} vertical={false}>
            <View style={{flexDirection: 'column'}}>
              <TopKeys/>
              <BottomKeys/>
            </View>
          </ScrollView>
        </View>
      );
    }

    function NoteSegment(props) {
      return(
        <View style={[props.nS.id === 0 && styles.firstNoteSegment,styles.noteSegment]}>
        <Text>{props.nS.id}</Text>
        <Text>{props.nS.notes[0]}</Text>
        </View>
      );
    }

    function Sheet() {
      return (
        <View style={styles.sheet}>
          <ScrollView vertical={true}>
            {state.noteSegments.slice(0).reverse().map((nS)=>{
                return <NoteSegment nS={nS} key={nS.id}/>;
              }
            )}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Sheet/>
        <Keyboard/>
      </View>
    );
  }
}

let zoom = 1.5;

const shadow = '#333';
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheet: {
    height: '80%',
    backgroundColor: shadow,
  },
  noteSegment: {
    bottom: 0,
    left: 0,
    position: 'relative',
    height: 64,
    backgroundColor: shadow,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  firstNoteSegment: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  keyboard:{
    height: '20%',
    backgroundColor: shadow,
  },
  topKeys: {
    height: '60%',
    flexDirection: 'row',
  },
  bottomKeys: {
    height: '40%',
    flexDirection: 'row',
  },
  whiteKey: {
    backgroundColor: '#fff',
  },
  whiteBottomKey: {
    width: 24*zoom,
  },
  whiteTopKeyC_E: {
    width: 15*zoom,
  },
  whiteTopKeyD_G_A: {
    width: 14*zoom,
  },
  whiteTopKeyF_B: {
    width: 13*zoom,
  },
  whiteTopKeyLeftMargin: {
    width: 7*zoom,
  },
  whiteTopKeyRightMargin: {
    width: 9*zoom,
  },
  br: {
    borderRightWidth: 1,
    borderColor: shadow,
  },
  blackTopKey: {
    width: 14*zoom,
    backgroundColor: '#444',
  }
});
