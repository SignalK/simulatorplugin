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
                value: item.minValue + (
                  ((new Date().getTime() - start) / 1000) % (item.dataPeriod || 60))
                  / (item.dataPeriod || 60)
                  * (item.maxValue - item.minValue)
              }
            ]
          }
        ]
      })

      return setInterval(() => {
        app.handleMessage("simulator", createDelta())
      }, item.outputPeriod * 1000 || 1000)
    })
  }
  plugin.stop = function() {
    timers.map(clearTimeout)
  }

  plugin.id = "simulator"
  plugin.name = "Signal K delta simulator"
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
            }
          }
        }
      }
    }
  }

  return plugin;
}
