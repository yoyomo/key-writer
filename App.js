import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import {calculateNotes} from './calculate-notes.js';

const notes = calculateNotes();

export class WhiteBottomKey extends React.Component {
  render() {
    return (
      <View style={[styles.whiteKey, styles.whiteBottomKey, styles.br]}/>
    );
  }
}

export class TopKeys extends React.Component {
  render() {
    return (
      <View style={styles.topKeys}>
        <View style={[styles.whiteKey, styles.whiteTopKeyC_E]}/>
        <View style={[styles.blackTopKey]}/>
        <View style={[styles.whiteKey, styles.whiteTopKeyD_G_A]}/>
        <View style={[styles.blackTopKey]}/>
        <View style={[styles.whiteKey, styles.whiteTopKeyC_E, styles.br]}/>
        <View style={[styles.whiteKey, styles.whiteTopKeyF_B]}/>
        <View style={[styles.blackTopKey]}/>
        <View style={[styles.whiteKey, styles.whiteTopKeyD_G_A]}/>
        <View style={[styles.blackTopKey]}/>
        <View style={[styles.whiteKey, styles.whiteTopKeyD_G_A]}/>
        <View style={[styles.blackTopKey]}/>
        <View style={[styles.whiteKey, styles.whiteTopKeyF_B, styles.br]}/>
      </View>
    );
  }
}

export class BottomKeys extends React.Component {
  render() {
    return (
      <View style={styles.bottomKeys}>
        <WhiteBottomKey />
        <WhiteBottomKey />
        <WhiteBottomKey />
        <WhiteBottomKey />
        <WhiteBottomKey />
        <WhiteBottomKey />
        <WhiteBottomKey />
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
          <Text>{notes[0].key}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 10,
  },
  sheet: {
    flex: 8,
    backgroundColor: 'steelblue',
  },
  keyboard:{
    flex: 2,
    backgroundColor: 'skyblue',
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
  br: {
    borderRightWidth: 1,
    borderColor: '#333',
  },
  blackTopKey: {
    width: 14*zoom,
    backgroundColor: '#444',
  }
});
