import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import {calculateNotes} from './calculate-notes.js';

const notes = calculateNotes();
let currentlyPlayingKeys = '';

export class LeftMargin extends React.Component {
  render() {
    return (
      <View style={[styles.whiteKey, styles.whiteTopKeyLeftMargin]}/>
    );
  }
}

export class RightMargin extends React.Component {
  render() {
    return (
      <View style={[styles.whiteKey, styles.whiteTopKeyRightMargin, styles.br]}/>
    );
  }
}

playNote = (id,frequency)=>{
  currentlyPlayingKeys = id;
  console.log(currentlyPlayingKeys,frequency);
};

export class D_G_A_Key extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={()=>playNote(this.props.id,this.props.frequency)}
       style={[styles.whiteKey, styles.whiteTopKeyD_G_A]}/>
    );
  }
}

export class BlackKey extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={()=>playNote(this.props.id,this.props.frequency)}
       style={[styles.blackTopKey]}/>
    );
  }
}

export class F_B_Key extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={()=>playNote(this.props.id,this.props.frequency)}
       style={[
        styles.whiteKey,
        styles.whiteTopKeyF_B,
        this.props.br && styles.br]} />
    );
  }
}

export class C_E_Key extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={()=>playNote(this.props.id,this.props.frequency)}
       style={[
        styles.whiteKey,
        styles.whiteTopKeyC_E,
        this.props.br && styles.br]}/>
    );
  }
}

export class WhiteBottomKey extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={()=>playNote(this.props.id, this.props.frequency)}
       style={[styles.whiteKey, styles.whiteBottomKey, styles.br]}/>
    );
  }
}

export class TopKeys extends React.Component {
  render() {
    return (
      <View style={styles.topKeys}>
        <LeftMargin/>
        {notes.map( (note) => {
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
}

export class BottomKeys extends React.Component {
  render() {
    return (
      <View style={styles.bottomKeys}>
        {notes.filter((note)=>{
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
}

export class Keyboard extends React.Component {
  render() {
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
}

export class Sheet extends React.Component {
  render() {
    return (
      <View style={styles.sheet}>
        <ScrollView vertical={true}>
          <Text>{currentlyPlayingKeys}</Text>
        </ScrollView>
      </View>
    );
  }
}

export default class App extends React.Component {
  render() {
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
