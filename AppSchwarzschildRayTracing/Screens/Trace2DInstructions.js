import React from 'react'
import {StyleSheet, Dimensions, View, Text, ScrollView, StatusBar} from 'react-native';
import CollapsibleView from "@eliav2/react-native-collapsible-view";

function Trace2DInstructions(props) {

  if (props.visible === false) {
    return (
    <View>
    </View>
  );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.h1}>Instructions</Text>

        <Text style={styles.h2}>Drag Input</Text>
          <Text>Rest your finger on the screen. This point will be the source of your desired ray.</Text>
          <Text/>
          <Text>Drag your finger to any other point on the screen. This will determine the initial angle of the trajectory with respect to the ray source.</Text>

        <Text style={styles.h2}>Manual Input</Text>
          <Text>Expand the Manual Entry Drop down. The cartesian plane is divided such that the black hole is situated at the origin.</Text>
          <Text/>
          <Text>The width of the screen spans +/- 20 Schwarzschild Radii (SR), and the height of the screen spans +/- 40 SR.</Text>
          <Text/>
          <Text>Note that delta0 is defined to be anti-clockwise angle formed by the position vector of the ray source and the initial direction of the ray. </Text>

          <Text style={styles.h3}>Source Point Constraints</Text>
            <Text>We denote r0 as the initial distance of the light source to the Black Hole. Please ensure that the ray starts outside the event horizon, i.e., that r0 >= 3</Text>
            <Text/>
            <Text>r0 can be calculated by the following equation: r0 = sqrt(x^2 + y^2).</Text>

        <Text style={styles.h2}>Analysis Mode</Text>
          <Text>Click on the Trace Analysis button, which will give a detailed plot of the ray and it's trajectory.</Text>

    </ScrollView>
  )
}
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  bold: {
      fontWeight: 'bold'
  },
  italics: {
      fontStyle: 'italic'
  },
  titleContainer: {
    position: 'absolute',
    width: 350,
    top: windowHeight / 10,
    left: (windowWidth / 2) - (350 / 2)
  }, container: {
    top: StatusBar.currentHeight,
    height: windowHeight - 120,
    width: windowWidth,
    position: 'absolute',
    padding: 20
  },
  h1: {
      fontSize: 50
  },
  h2: {
      fontStyle: 'italic',
    fontSize: 40
  },
  h3: {
      textDecorationLine: 'underline',
    fontSize: 25
  },
});

export default Trace2DInstructions;
