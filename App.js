import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity} from 'react-native';
import {calculateNotes} from './calculate-notes.js';

export default class App extends React.Component {
  render() {
    let state = {
      notes: calculateNotes(),
      currentlyPlayingKeys: 'AAAA',
    };
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

    function playNote(id,frequency){
      state = {...state};
      console.log(state.currentlyPlayingKeys);
      state.currentlyPlayingKeys = id;
      console.log(state.currentlyPlayingKeys,frequency);
      return state;
    };

    function D_G_A_Key (props){
      return (
        <TouchableOpacity onPress={()=>playNote(props.id,props.frequency)}
         style={[styles.whiteKey, styles.whiteTopKeyD_G_A]}/>
      );
    }

    function BlackKey(props){
      return (
        <TouchableOpacity onPress={()=>playNote(props.id,props.frequency)}
         style={[styles.blackTopKey]}/>
      );
    }

    function F_B_Key(props){
      return (
        <TouchableOpacity onPress={()=>playNote(props.id,props.frequency)}
         style={[
          styles.whiteKey,
          styles.whiteTopKeyF_B,
          props.br && styles.br]} />
      );
    }

    function C_E_Key(props) {
      return (
        <TouchableOpacity onPress={()=>playNote(props.id,props.frequency)}
         style={[
          styles.whiteKey,
          styles.whiteTopKeyC_E,
          props.br && styles.br]}/>
      );
    }

    function WhiteBottomKey(props){
      return (
        <TouchableOpacity onPress={()=>playNote(props.id, props.frequency)}
         style={[styles.whiteKey, styles.whiteBottomKey, styles.br]}/>
      );
    }

    function TopKeys(){
      return (
        <View style={styles.topKeys}>
          <LeftMargin/>
          {state.notes.map( (note) => {
            let id = note.key+note.octave;
            if (note.key.slice(-1) === "#"){
              return <BlackKey frequency={note.frequency} id={id} key={id}/>;
            }
            switch (note.key) {
              case 'A':
                return <D_G_A_Key frequency={note.frequency} id={id} key={id}/>;
              case 'B':
                return <F_B_Key frequency={note.frequency} br={true} id={id} key={id}/>;
              case 'C':
                return <C_E_Key frequency={note.frequency} id={id} key={id}/>;
              case 'D':
                return <D_G_A_Key frequency={note.frequency} id={id} key={id}/>;
              case 'E':
                return <C_E_Key br={true} frequency={note.frequency} id={id} key={id}/>;
              case 'F':
                return <F_B_Key frequency={note.frequency} id={id} key={id}/>;
              case 'G':
                return <D_G_A_Key frequency={note.frequency} id={id} key={id}/>;
            }
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
          }).map( (note) => {
            let id = note.key+note.octave;
            return <WhiteBottomKey frequency={note.frequency} id={id} key={id}/>;
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

    function Sheet(state) {
      return (
        <View style={styles.sheet}>
          <ScrollView vertical={true}>
            <Text>currently playing keys: {state.currentlyPlayingKeys}</Text>
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
    backgroundColor: 'steelblue',
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
