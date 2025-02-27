import React, { useState } from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  Button,
  TextInput,
} from 'react-native';
import axios from 'axios';
import Plotly from 'react-native-plotly';
import CollapsibleView from '@eliav2/react-native-collapsible-view';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

function Trace3D(props) {
  if (props.visible === false) {
    return <View></View>;
  }

  let canvas;

  let blackHoleX = windowWidth / 2;
  let blackHoleY = windowHeight / 2;

  let density = 200;

  let theta_arr = [];

  // let arr_size be 100
  let incrementor = (2 * Math.PI) / (density - 1);

  let i = 0;

  while (i < density) {
    theta_arr.push(incrementor * i);
    i += 1;
  }

  let phi_arr = [];

  // let arr_size be 100
  // incrementor = Math.PI / 2 / (density - 1)
  incrementor = 1;

  i = 0;

  while (i < density) {
    phi_arr.push(incrementor * i);
    i += 1;
  }

  let a = [];
  let b = [];
  let c = [];

  for (let i = 0; i < theta_arr.length; i++) {
    for (let j = 0; j < phi_arr.length; j++) {
      a.push(Math.cos(theta_arr[i]) * Math.sin(phi_arr[j]));
      b.push(Math.sin(theta_arr[i]) * Math.sin(phi_arr[j]));
      c.push(Math.cos(phi_arr[j]));
    }
  }

  let x_trace = [];
  let y_trace = [];
  let z_trace = [];

  let periastron = null;

  const [inputErrorText, setInputErrorText] = useState('');

  const requestRayTrace = (x0, y0, z0, alpha0, beta0, gamma0) => {
    setInputErrorText('');

    console.log('x0: ', x0);
    console.log('y0: ', y0);
    console.log('z0: ', z0);
    console.log('alpha0: ', alpha0);
    console.log('beta0: ', beta0);
    console.log('gamma0: ', gamma0);

    const toSend = {
      x0: Math.abs(x0),
      y0: Math.abs(y0),
      z0: Math.abs(z0),
      alpha0: alpha0,
      beta0: beta0,
      gamma0: gamma0,
    };

    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };

    axios
      .post(
        'https://schwarzschild-ray-tracing-api.herokuapp.com/3D/',
        toSend,
        config
      )
      .then((response) => {
        if (response.data === null) {
          console.log('DATA WAS NULL');
        }
        console.log('got data lol');

        setInputErrorText('');

        let data;

        console.log('type:', typeof response.data);
        if (typeof response.data === 'object') {
          data = response.data;
        } else {
          data = JSON.parse(response.data);
        }

        // https://stackoverflow.com/questions/35969974/foreach-is-not-a-function-error-with-javascript-array
        Array.prototype.forEach.call(data, (obj) => {
          x_trace.push(obj['x']);
          y_trace.push(obj['y']);
          z_trace.push(obj['z']);
        });

        let flag_no_periastron = false;

        // check if the radii are approximately the same towards the end of the trajectory

        let cntr = 0;

        x_trace.forEach((x, i) => {
          if (periastron === null) {
            periastron = { x: x, y: y_trace[i], z: z_trace[i] };
          } else {
            let curPeriastronDist = Math.sqrt(
              Math.pow(periastron.x, 2) +
                Math.pow(periastron.y, 2) +
                Math.pow(periastron.z, 2)
            );
            let candPeriastronDist = Math.sqrt(
              Math.pow(x, 2) + Math.pow(y_trace[i], 2) + Math.pow(z_trace[i], 2)
            );

            if (candPeriastronDist < curPeriastronDist) {
              periastron = { x: x, y: y_trace[i], z: z_trace[i] };
            }

            if (
              candPeriastronDist.toFixed(5) === curPeriastronDist.toFixed(5)
            ) {
              cntr += 1;
              if (cntr === 5) {
                flag_no_periastron = true;
              }
            } else if (candPeriastronDist < curPeriastronDist) {
              periastron = { x: x, y: y_trace[i], z: z_trace[i] };
              cntr = 0;
            }
          }
        });

        console.log('cntr: ', cntr);

        let trace1 = {
          name: 'Ray Trace',
          x: x_trace,
          y: y_trace,
          z: z_trace,
          type: 'scatter3d',
          mode: 'lines',
        };

        let trace2 = {
          name: 'Black Hole',
          x: a,
          y: b,
          z: c,
          type: 'scatter3d',
          mode: 'markers',
          marker: { size: 0.1, color: 'black' },
        };

        let trace3 = {
          name: 'Periastron',
          x: [periastron.x],
          y: [periastron.y],
          z: [periastron.z],
          type: 'scatter3d',
          mode: 'markers',
          marker: { size: 2 },
        };

        if (typeof alpha0 === 'string') {
          alpha0 = parseInt(alpha0);
        }

        if (typeof beta0 === 'string') {
          beta0 = parseInt(beta0);
        }

        if (typeof gamma0 === 'string') {
          gamma0 = parseInt(gamma0);
        }

        if (flag_no_periastron) {
          setStateGraph({
            data: [trace1, trace2],
            layout: {
              width: windowWidth,
              height: windowHeight - 55,
              title:
                'Ray Trace from (' +
                x_trace[0].toFixed(2) +
                ', ' +
                y_trace[0].toFixed(2) +
                ', ' +
                z_trace[0].toFixed(2) +
                ') <br>with initial velocity <' +
                alpha0.toFixed(2) +
                '°, ' +
                beta0.toFixed(2) +
                '°, ' +
                gamma0.toFixed(2) +
                '°>',
              legend: {
                yanchor: 'top',
                y: 0.99,
                xanchor: 'left',
                x: 0.01,
              },
              scene: {
                xaxis: {
                  uirevision: 'time',
                  range: [
                    -Math.max(bounds2.cartX, bounds2.cartY),
                    Math.max(bounds2.cartX, bounds2.cartY),
                  ],
                  title: 'x-axis [SR Units]',
                },
                yaxis: {
                  uirevision: 'time',
                  range: [
                    -Math.max(bounds2.cartX, bounds2.cartY),
                    Math.max(bounds2.cartX, bounds2.cartY),
                  ],
                  title: 'y-axis [SR Units]',
                },
                zaxis: {
                  uirevision: 'time',
                  range: [
                    -Math.max(bounds2.cartX, bounds2.cartY),
                    Math.max(bounds2.cartX, bounds2.cartY),
                  ],
                  title: 'z-axis [SR Units]',
                },
                aspectmode: 'string',
                aspectratio: { x: 1, y: 1, z: 1 },
                camera: {
                  eye: {
                    x: 2,
                    y: 2,
                    z: 2,
                  },
                },
              },
            },
            // https://community.plotly.com/t/is-it-possible-to-hide-the-floating-toolbar/4911/7
            // https://plotly.com/javascript/configuration-options/
            config: {
              modeBarButtonsToRemove: ['toImage'],
            },
          });
        } else {
          setStateGraph({
            data: [trace1, trace2, trace3],
            layout: {
              width: windowWidth,
              height: windowHeight - 55,
              title:
                'Ray Trace from (' +
                x_trace[0].toFixed(2) +
                ', ' +
                y_trace[0].toFixed(2) +
                ', ' +
                z_trace[0].toFixed(2) +
                ') <br>with initial velocity <' +
                alpha0.toFixed(2) +
                '°, ' +
                beta0.toFixed(2) +
                '°, ' +
                gamma0.toFixed(2) +
                '°>',
              legend: {
                yanchor: 'top',
                y: 0.99,
                xanchor: 'left',
                x: 0.01,
              },
              scene: {
                xaxis: {
                  uirevision: 'time',
                  range: [
                    -Math.max(bounds2.cartX, bounds2.cartY),
                    Math.max(bounds2.cartX, bounds2.cartY),
                  ],
                  title: 'x-axis [SR Units]',
                },
                yaxis: {
                  uirevision: 'time',
                  range: [
                    -Math.max(bounds2.cartX, bounds2.cartY),
                    Math.max(bounds2.cartX, bounds2.cartY),
                  ],
                  title: 'y-axis [SR Units]',
                },
                zaxis: {
                  uirevision: 'time',
                  range: [
                    -Math.max(bounds2.cartX, bounds2.cartY),
                    Math.max(bounds2.cartX, bounds2.cartY),
                  ],
                  title: 'z-axis [SR Units]',
                },
                aspectmode: 'string',
                aspectratio: { x: 1, y: 1, z: 1 },
                camera: {
                  eye: {
                    x: 2,
                    y: 2,
                    z: 2,
                  },
                },
              },
            },
            config: {
              modeBarButtonsToRemove: ['toImage'],
            },
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const convertPixelToCartesian = (pixelX, pixelY) => {
    let cartX, cartY;
    cartX = (pixelX - blackHoleX) / 10;
    cartY = (blackHoleY - pixelY) / 10;
    return { cartX: cartX, cartY: cartY };
  };

  const [container_style, set_container_style] = useState({
    position: 'absolute',
    paddingTop: 50,
    width: windowWidth,
    height: windowHeight - 5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const [titleButton, setTitleButton] = useState('Trace Analysis');
  const [colorButton, setColorButton] = useState('#00a3ff');

  const clickAnalysisBuildBtn = () => {
    console.log('button click');
    if (titleButton === 'Trace Analysis') {
      setTitleButton('Build Traces');
      setColorButton('rgb(255,0,0)');

      set_container_style({
        position: 'absolute',
        paddingTop: 50,
        width: windowWidth,
        height: windowHeight - 5,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      });
    } else {
      setTitleButton('Trace Analysis');
      setColorButton('#00a3ff');

      set_container_style({
        position: 'absolute',
        paddingTop: 50,
        width: '0%',
        height: '0%',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      });
    }
  };

  let bounds1 = convertPixelToCartesian(0, 0);
  let bounds2 = convertPixelToCartesian(windowWidth, windowHeight);

  let trace1 = {
    name: 'Black Hole',
    x: a,
    y: b,
    z: c,
    type: 'scatter3d',
    mode: 'markers',
    marker: { size: 0.1, color: 'black' },
  };

  const [stateGraph, setStateGraph] = useState({
    data: [trace1],
    layout: {
      width: windowWidth,
      height: windowHeight - 55,
      title: 'No Recent Trace to Display',
      scene: {
        xaxis: {
          uirevision: 'time',
          range: [-40, 40],
          title: 'x-axis [SR Units]',
        },
        yaxis: {
          uirevision: 'time',
          range: [-40, 40],
          title: 'y-axis [SR Units]',
        },
        zaxis: {
          uirevision: 'time',
          range: [-40, 40],
          title: 'z-axis [SR Units]',
        },
        aspectmode: 'string',
        aspectratio: { x: 1, y: 1, z: 1 },
        camera: {
          eye: {
            x: 2,
            y: 2,
            z: 2,
          },
        },
      },
    },
    config: {
      modeBarButtonsToRemove: ['toImage'],
    },
  });

  const clickManualEntryBtn = () => {
    if (xManual === null || xManual === '') {
      setInputErrorText('x must be filled in.');
    } else if (yManual === null || yManual === '') {
      setInputErrorText('y must be filled in.');
    } else if (zManual === null || zManual === '') {
      setInputErrorText('z must be filled in.');
    } else if (isNaN(parseFloat(xManual))) {
      setInputErrorText('x must be a real number.');
    } else if (isNaN(parseFloat(yManual))) {
      setInputErrorText('y must be a real number.');
    } else if (isNaN(parseFloat(zManual))) {
      setInputErrorText('z must be a real number.');
    } else if (
      (alpha0Manual === null || alpha0Manual === '') &&
      (beta0Manual === null || beta0Manual === '') &&
      (gamma0Manual !== null || gamma0Manual !== '')
    ) {
      setInputErrorText(
        'At least two of alpha0, beta0 and gamma0 should be filled in.'
      );
    } else if (
      (alpha0Manual === null || alpha0Manual === '') &&
      (beta0Manual !== null || beta0Manual !== '') &&
      (gamma0Manual === null || gamma0Manual === '')
    ) {
      setInputErrorText(
        'At least two of alpha0, beta0 and gamma0 should be filled in.'
      );
    } else if (
      (alpha0Manual !== null || alpha0Manual !== '') &&
      (beta0Manual === null || beta0Manual === '') &&
      (gamma0Manual === null || gamma0Manual === '')
    ) {
      setInputErrorText(
        'At least two of alpha0, beta0 and gamma0 should be filled in.'
      );
    } else if (
      (alpha0Manual === null || alpha0Manual === '') &&
      (beta0Manual === null || beta0Manual === '') &&
      (gamma0Manual === null || gamma0Manual === '')
    ) {
      setInputErrorText(
        'At least two of alpha0, beta0 and gamma0 should be filled in.'
      );
    } else if (
      isNaN(parseFloat(alpha0Manual)) &&
      alpha0Manual !== '' &&
      alpha0Manual !== null
    ) {
      setInputErrorText('alpha0 must be a real number.');
    } else if (
      isNaN(parseFloat(beta0Manual)) &&
      beta0Manual !== '' &&
      beta0Manual !== null
    ) {
      setInputErrorText('beta0 must be a real number.');
    } else if (
      isNaN(parseFloat(gamma0Manual)) &&
      gamma0Manual !== '' &&
      gamma0Manual !== null
    ) {
      setInputErrorText('gamma0 must be a real number.');
    } else if (Math.sqrt(xManual ** 2 + yManual ** 2 + zManual ** 2) < 3) {
      setInputErrorText(
        'Light source must be outside the event horizon (r0 >= 3)'
      );
    } else if (
      Math.abs(xManual) > 40 ||
      Math.abs(yManual) > 40 ||
      Math.abs(zManual) > 40
    ) {
      setInputErrorText(
        'Light source must within the range x, y, z: [-40, 40]'
      );
    } else if (alpha0Manual > 180 || alpha0Manual < -180) {
      setInputErrorText('alpha0 range: [-180, 180]');
    } else if (beta0Manual > 180 || beta0Manual < -180) {
      setInputErrorText('beta0 range: [-180, 180]');
    } else if (gamma0Manual > 180 || gamma0Manual < -180) {
      setInputErrorText('gamma0 range: [-180, 180]');
    } else if (
      (alpha0Manual !== null || alpha0Manual !== '') &&
      (beta0Manual !== null || beta0Manual !== '') &&
      (gamma0Manual === null || gamma0Manual === '')
    ) {
      let term =
        1 -
        Math.cos((alpha0Manual * Math.PI) / 180) ** 2 -
        Math.cos((beta0Manual * Math.PI) / 180) ** 2;
      term = Number(term.toFixed(5));
      if (term < 0) {
        setInputErrorText(
          'The given alpha0 and beta0 cannot lead to any valid gamma0.'
        );
      } else {
        setGamma0Manual((Math.acos(Math.sqrt(term)) * 180) / Math.PI + '');
        // since updation of usestate does not occur in time, just pass val for gamma
        requestRayTrace(
          xManual,
          yManual,
          zManual,
          alpha0Manual,
          beta0Manual,
          (Math.acos(Math.sqrt(term)) * 180) / Math.PI
        );
      }
    } else if (
      (alpha0Manual !== null || alpha0Manual !== '') &&
      (beta0Manual === null || beta0Manual === '') &&
      (gamma0Manual !== null || gamma0Manual !== '')
    ) {
      let term =
        1 -
        Math.cos((alpha0Manual * Math.PI) / 180) ** 2 -
        Math.cos((gamma0Manual * Math.PI) / 180) ** 2;
      term = Number(term.toFixed(5));
      if (term < 0) {
        setInputErrorText(
          'The given alpha0 and gamma0 cannot lead to any valid beta0.'
        );
      } else {
        setBeta0Manual((Math.acos(Math.sqrt(term)) * 180) / Math.PI + '');
        requestRayTrace(
          xManual,
          yManual,
          zManual,
          alpha0Manual,
          (Math.acos(Math.sqrt(term)) * 180) / Math.PI,
          gamma0Manual
        );
      }
    } else if (
      (alpha0Manual === null || alpha0Manual === '') &&
      (beta0Manual !== null || beta0Manual !== '') &&
      (gamma0Manual !== null || gamma0Manual !== '')
    ) {
      let term =
        1 -
        Math.cos((beta0Manual * Math.PI) / 180) ** 2 -
        Math.cos((gamma0Manual * Math.PI) / 180) ** 2;
      term = Number(term.toFixed(5));
      if (term < 0) {
        setInputErrorText(
          'The given beta0 and gamma0 cannot lead to any valid alpha0.'
        );
      } else {
        setAlpha0Manual((Math.acos(Math.sqrt(term)) * 180) / Math.PI + '');
        requestRayTrace(
          xManual,
          yManual,
          zManual,
          (Math.acos(Math.sqrt(term)) * 180) / Math.PI,
          beta0Manual,
          gamma0Manual
        );
      }
    } else if (
      (alpha0Manual !== null || alpha0Manual !== '') &&
      (beta0Manual !== null || beta0Manual !== '') &&
      (gamma0Manual !== null || gamma0Manual !== '')
    ) {
      if (
        Math.abs(
          1 -
            Math.cos((beta0Manual / 180) * Math.PI) ** 2 -
            Math.cos((gamma0Manual / 180) * Math.PI) ** 2 -
            Math.cos((alpha0Manual / 180) * Math.PI)
        ) < 1e-5
      ) {
        setInputErrorText('');
        requestRayTrace(
          xManual,
          yManual,
          zManual,
          alpha0Manual,
          beta0Manual,
          gamma0Manual
        );
      } else {
        console.log(
          'first: ',
          (
            1 -
            Math.cos((beta0Manual / 180) * Math.PI) ** 2 -
            Math.cos((gamma0Manual / 180) * Math.PI) ** 2
          ).toFixed(5)
        );
        console.log(
          'second: ',
          Math.cos((alpha0Manual / 180) * Math.PI).toFixed(5)
        );

        setInputErrorText('alpha0, beta0 and gamma0 combination are invalid.');
      }
    }
  };

  const [xManual, setXManual] = useState(null);
  const [yManual, setYManual] = useState(null);
  const [zManual, setZManual] = useState(null);
  const [alpha0Manual, setAlpha0Manual] = useState(null);
  const [beta0Manual, setBeta0Manual] = useState(null);
  const [gamma0Manual, setGamma0Manual] = useState(null);

  const [xPlaceholder, setXPlaceholder] = useState(
    'x coordinate of light source'
  );
  const [yPlaceholder, setYPlaceholder] = useState(
    'y coordinate of light source'
  );
  const [zPlaceholder, setZPlaceholder] = useState(
    'z coordinate of light source'
  );

  return (
    <View>
      <View style={container_style}>
        <CollapsibleView title="Manual Entry" style={styles.manualEntryDiv}>
          <View>
            <Text>x [R_G]:</Text>
            <TextInput
              style={styles.manualTextInput}
              placeholder={xPlaceholder}
              keyboardType="numeric"
              value={xManual}
              onChangeText={setXManual}
            />
            <Text>y [R_G]:</Text>
            <TextInput
              style={styles.manualTextInput}
              placeholder={yPlaceholder}
              keyboardType="numeric"
              value={yManual}
              onChangeText={setYManual}
            />
            <Text>z [R_G]:</Text>
            <TextInput
              style={styles.manualTextInput}
              placeholder={zPlaceholder}
              keyboardType="numeric"
              value={zManual}
              onChangeText={setZManual}
            />
            <Text>alpha0 [°]:</Text>
            <TextInput
              style={styles.manualTextInput}
              placeholder="Initial angle of ray trajectory to x-axis"
              keyboardType="numeric"
              value={alpha0Manual}
              onChangeText={setAlpha0Manual}
            />
            <Text>beta0 [°]:</Text>
            <TextInput
              style={styles.manualTextInput}
              placeholder="Initial angle of ray trajectory to y-axis"
              keyboardType="numeric"
              value={beta0Manual}
              onChangeText={setBeta0Manual}
            />
            <Text>gamma0 [°]:</Text>
            <TextInput
              style={styles.manualTextInput}
              placeholder="Initial angle of ray trajectory to z-axis"
              keyboardType="numeric"
              value={gamma0Manual}
              onChangeText={setGamma0Manual}
            />

            <Button
              onPress={clickManualEntryBtn}
              title={'Trace'}
              color={colorButton}
            />
          </View>
        </CollapsibleView>

        <View style={styles.inputErrorTextDiv}>
          <Text style={styles.errorText}>{inputErrorText}</Text>
        </View>

        <View style={styles.chartRow}>
          <Plotly
            data={stateGraph.data}
            layout={stateGraph.layout}
            enableFullPlotly
            config={stateGraph.config}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
  },
  chartRow: {
    paddingTop: 100,
    flex: 1,
    width: windowWidth - 30,
  },
  manualTextInput: {
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 5,
  },
  manualEntryDiv: {
    position: 'absolute',
    width: windowWidth * 0.85,
    zIndex: 1,
    top: 70,
    left: '5%',
    backgroundColor: 'rgb(255,255,255)',
    padding: 10,
    borderRadius: 5,
  },
  inputErrorTextDiv: {
    position: 'absolute',
    top: 30,
    zIndex: 1,
    left: '5%',
    width: windowWidth,
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
  },
  container: {
    position: 'absolute',
    paddingTop: 50,
    width: '0%',
    height: '0%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Trace3D;
