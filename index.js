/*
 * Copyright 2016 Teppo Kurki <teppo.kurki@iki.fi>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('simulator')


module.exports = function(app) {
  const plugin = {}
  var timers = []
  var incrementingValue=new Array();
  var newValue=new Array();
  var incrementDecrement=new Array();

  plugin.start = function(props) {
    timers = (props.items || []).map((item, i) => {
      const start = new Date().getTime()
      const createDelta = () => ({
        updates: [
          {
            "$source": "simulator." + i,
            values: [
              {
                path: item.path,
                value: newValue[i]
              }
            ]
          }
        ]
      })

      return setInterval(() => {

        switch(item.animationType) {
          case 1:                                                               // Increment
            if(typeof incrementingValue[i]==='undefined') {
              incrementingValue[i] = (item.maxValue - item.minValue) * item.outputPeriod / item.dataPeriod;
              newValue[i] = item.minValue;
            }
            if(newValue[i]+incrementingValue[i]>item.maxValue)
              newValue[i] = item.minValue;
            break;
          case 2:                                                               // Decrement
            if(typeof incrementingValue[i]==='undefined') {
              incrementingValue[i] = (item.maxValue - item.minValue) * item.outputPeriod / item.dataPeriod;
              newValue[i] = item.maxValue;
            }
            if(newValue[i]-incrementingValue[i]<item.minValue)
              newValue[i] = item.maxValue;
            break;
          case 3:                                                               // Increment-Decrement
            if(typeof incrementDecrement[i]==='undefined') {
              incrementDecrement[i] = 1;
              incrementingValue[i] = (item.maxValue - item.minValue) * item.outputPeriod / item.dataPeriod;
              newValue[i] = item.minValue;
            }
            break;
          case 4:                                                               // Fixed
            if(typeof incrementingValue[i]==='undefined') {
              incrementingValue[i] = "NA";
              newValue[i] = item.minValue;
            }
            break;
          case 5:                                                               // Fixed+Rand%
            if(typeof incrementingValue[i]==='undefined')
              incrementingValue[i] = 0;
            incrementingValue[i] = (Math.random()<0.5?-1:1) * item.minValue * 0.1 * Math.random();
            newValue[i] = item.minValue + incrementingValue[i];
            break;
        }

        app.handleMessage("simulator", createDelta())

        switch(item.animationType) {
          case 1:                                                               // Increment
            newValue[i] += incrementingValue[i];
            if(newValue[i]+incrementingValue[i]>item.maxValue)
              newValue[i] = item.minValue;
            break;
          case 2:                                                               // Decrement
            newValue[i] -= incrementingValue[i];
            if(newValue[i]-incrementingValue[i]<item.minValue)
              newValue[i] = item.maxValue;
            break;
          case 3:                                                               // Increment-Decrement
            newValue[i] += incrementDecrement[i] * incrementingValue[i];
            if(incrementDecrement[i]==1) {
              if(newValue[i]+incrementingValue[i]>item.maxValue)
                incrementDecrement[i] = -1;
              }
              else
                if(newValue[i]-incrementingValue[i]<item.minValue) {
                  incrementDecrement[i] = 1;
            }
            break;
          case 4:                                                               // Fixed
            break;
          case 5:                                                               // Fixed+Rand%
            break;
        }
      }, item.outputPeriod * 1000)
    })
  }

  plugin.stop = function() {
    timers.map(clearTimeout)
  }

  plugin.id = "simulator"
  plugin.name = "Signal K delta simulator -modifying"
  plugin.description = "Plugin that generates different kinds of deltas"

  plugin.schema = {
    "title": "Simulator",
    "type": "object",
    "properties": {
      "items": {
        type: "array",
        items: {
          type: "object",
          properties:
          {
            path: {
              type: "string",
              title: "Path"
            },
            minValue: {
              type: "number",
              title: "Minimum Value",
              default: "0"
            },
            maxValue: {
              type: "number",
              title: "Maximum Value",
              default: 60
            },
            dataPeriod: {
              type: "number",
              title: "Period from minValue to maxValue (s)",
              default: 60
            },
            outputPeriod: {
              type: "number",
              title: "Output period (s)",
              default: 2
            },
            animationType: {
              type: "number",
              title: "Animation Type (1: Inc., 2: Dec., 3: Inc.+Dec., 4: Fix., 5: Fix.+Ran.%)",
              default: 2
            }
          }
        }
      }
    }
  }

  return plugin;
}
