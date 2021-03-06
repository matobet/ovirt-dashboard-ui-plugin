import React, { PropTypes } from 'react'
const { string, number, bool, shape, oneOf } = PropTypes
import c3 from 'c3'
import d3 from 'd3'
import { getDefaultDonutConfig } from '../compat/patternfly_defaults'

// Angular reference:
//  https://github.com/patternfly/angular-patternfly/blob/master/src/charts/donut/donut-pct-chart-directive.js
//  https://github.com/patternfly/angular-patternfly/blob/master/src/charts/donut/donut-pct-chart.html

// TODO(vs) center label is jumpy when hovering its arcs, double-check Angular reference impl.

class DonutPctChart extends React.Component {

  constructor (props) {
    super(props)
    this._chart = null
    this._chartContainer = null
  }

  componentDidMount () {
    this._generateChart(this.props)
  }

  componentWillReceiveProps (newProps) {
    this._updateChart(newProps)
  }

  componentWillUnmount () {
    this._destroyChart()
  }

  render () {
    return (
      <div className='donut-chart-pf'>
        <div ref={(e) => { this._chartContainer = e }}></div>
      </div>
    )
  }

  _generateChart ({ unit, used, total, thresholds, centerLabel }) {
    const config = Object.assign({}, getDefaultDonutConfig(), {
      bindto: this._chartContainer,
      data: {
        type: 'donut',
        columns: [
          ['used', used],
          ['available', total - used]
        ],
        names: {
          used: 'Used',
          available: 'Available'
        },
        groups: [
          ['used', 'available']
        ],
        order: null
      },
      color: {
        pattern: this._getDonutChartColorPattern({ used, total, thresholds })
      },
      tooltip: {
        contents (data) {
          const percentUsed = Math.round(data[0].ratio * 100)
          const tooltipText = `${percentUsed} % ${unit} ${data[0].name}`
          return `<span class="donut-tooltip-pf" style="white-space: nowrap;">${tooltipText}</span>`
        }
      }
    })

    this._chart = c3.generate(config)
    this._setDonutChartCenterLabel({ unit, used, total, centerLabel })
  }

  _updateChart (props) {
    this._destroyChart()
    this._generateChart(props)
  }

  _destroyChart () {
    this._chart.destroy()
  }

  _getDonutChartColorPattern ({ used, total, thresholds }) {
    const defaultPattern = getDefaultDonutConfig().color.pattern
    if (!thresholds.enabled) {
      return defaultPattern
    }

    const percentUsed = used / total * 100.0
    let color = '#3F9C35'

    if (percentUsed >= thresholds.error) {
      color = '#CC0000'
    } else if (percentUsed >= thresholds.warning) {
      color = '#EC7A08'
    }

    // return new array with first color replaced
    return [color].concat(defaultPattern.slice(1))
  }

  _setDonutChartCenterLabel ({ unit, used, total, centerLabel }) {
    let bigText = ''
    let smallText = ''

    if (centerLabel === 'used') {
      bigText = `${used}`
      smallText = `${unit} Used`
    } else if (centerLabel === 'available') {
      bigText = `${total - used}`
      smallText = `${unit} Available`
    } else if (centerLabel === 'percent') {
      bigText = `${Math.round(used / total * 100.0)} %`
      smallText = `of ${total} ${unit}`
    }

    const chartTitle = d3.select(this._chartContainer).select('text.c3-chart-arcs-title')
    chartTitle.selectAll('*').remove()
    chartTitle.insert('tspan').text(bigText).classed('donut-title-big-pf', true).attr('dy', 0).attr('x', 0)
    chartTitle.insert('tspan').text(smallText).classed('donut-title-small-pf', true).attr('dy', 20).attr('x', 0)
  }

}

DonutPctChart.propTypes = {
  unit: string.isRequired,
  used: number.isRequired,
  total: number.isRequired,
  thresholds: shape({
    enabled: bool,
    warning: number,
    error: number
  }),
  centerLabel: oneOf(['used', 'available', 'percent'])
}

DonutPctChart.defaultProps = {
  thresholds: {
    enabled: true,
    warning: 60,
    error: 90
  },
  centerLabel: 'used'
}

export default DonutPctChart
