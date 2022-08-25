const chartSetObjects = {
  speedChart: null,
  heelChart: null,
  pitchChart: null,
  headingChart: null
};

const statsDataSet = {
  speedChart: {
    mean: 0,
    median: 0,
    min: 0,
    max: 0
  },
  heelChart: {
    mean: 0,
    median: 0,
    min: 0,
    max: 0
  },
  pitchChart: {
    mean: 0,
    median: 0,
    min: 0,
    max: 0
  },
  headingChart: {
    mean: 0,
    median: 0,
    min: 0,
    max: 0
  }
}

let dataSet = {
  speedChart: null,
  heelChart: null,
  pitchChart: null,
  headingChart: null
};

const chartOptions = {
  global: {
    width: "100%",
    // explorer: {
    //   axis: 'horizontal',
    //   maxZoomIn: 0.05,
    // },
    legend: {position: "none"},
    tooltip: {isHtml: true, textStyle: {color: "black", backgroundColor: "white"}, showColorCode: true},
    hAxis: {
      type: "timeofday",
      title: "Time of Day",
      format: "HH:mm:ss",
    },
    vAxis: {
      type: "number",
      title: "Value",
    },
    backgroundColor: "transparent",
    crosshair: {
      focused: {color: 'red'},
      color: "#000",
      trigger: "both",
    },
    chartArea: {left: 60, right: 10, backgroundColor: "transparent", fill: "transparent"},
  },
  speedChart: {
    id: "chart_div_speed",
    name: "speedChart",
    gpxProperty: "speed",
    vAxis: {
      title: "Speed, Kn"
    }
  },
  heelChart: {
    id: "chart_div_heel",
    name: "heelChart",
    gpxProperty: "heel",
    vAxis: {
      title: "Heel, °"
    }
  },
  pitchChart: {
    id: "chart_div_pitch",
    name: "pitchChart",
    gpxProperty: "pitch",
    vAxis: {
      title: "Pitch, °",
    }
  },
  headingChart: {
    id: "chart_div_heading",
    name: "headingChart",
    gpxProperty: "direction",
    vAxis: {
      title: "COG, °",
    }
  }
}

function loadCharts(gpxDataValue) {
  google.charts.load("current", {
    packages: ["corechart", "line"],
    callback: async () => {
      const filteredByTimeRage = await filterGpxData(gpxDataValue);
      const dataSetObject = await populateData(filteredByTimeRage);
      dataSet = dataSetObject;
      await drawCharts(dataSetObject);
      await statsCharts(dataSetObject);
      displayStats();
      resizeCharts(dataSetObject);
    },
  });
}

async function filterGpxData(gpxDataValue) {
  const filtered = {}
  const timeStart = start_time.split(",")[1].trim();
  const startSeconds = dayTimeWithZone(get_seconds(timeStart) + secStart - timeOffset);
  const endSeconds = startSeconds + secFrame;
  return new Promise((res) => {
    let lastValue = {
      speed: 0,
      direction: 0,
      heel: 0,
      pith: 0,
      index: 0
    }
    for (let i = startSeconds; i < endSeconds; i++) {
      const currentTime = secondsToHms(i);
      if (!gpxDataValue?.hasOwnProperty(currentTime)) {
        filtered[currentTime] = {
          speed: useLastValueOnChartTime ? Number(lastValue.speed) ?? 0 : 0,
          direction: useLastValueOnChartTime ? Number(lastValue.direction) ?? 0 : 0,
          heel: useLastValueOnChartTime ? Number(lastValue.heel) ?? 0 : 0,
          pitch: useLastValueOnChartTime ? Number(lastValue.pitch) ?? 0 : 0,
          index: i - startSeconds,
          dropped: true
        }
      } else {
        filtered[currentTime] = gpxDataValue[currentTime];
        filtered[currentTime].index = i - startSeconds;
        lastValue = filtered[currentTime]
      }
    }
    res(filtered)
  })
}

async function filterDataRange() {
  const gpxDataValue = gpxData instanceof Array ? gpxData[0] : gpxData;
  const filtered = await filterGpxData(gpxDataValue);
  const dataSetNew = await populateData(filtered);
  await drawCharts(dataSetNew);
  await statsCharts(dataSetNew);
  if(updateChartStatsIfZoom) {
   displayStats();
  }
}

function clearCharts() {
  for (const type in chartSetObjects) {
    if (chartSetObjects.hasOwnProperty(type)) {
      chartSetObjects[type].clearChart()
    }
  }
}

async function statsCharts(dataSet) {
  for (const type in dataSet) {
    if (dataSet.hasOwnProperty(type)) {
      statsDataSet[type] = await calcStats(dataSet[type].map(el => el[1]))
    }
  }
}

async function calcStats(data) {
  return new Promise(res => {
    if (data?.length > 0) {
      res({
        mean: Number(mean(data)?.toFixed(2)) || 0,
        median: Number(median(data)?.toFixed(2)) || 0,
        min: Math.min.apply(Math, data) || 0,
        max: Math.max.apply(Math, data) || 0
      });
    }
    res({
      mean: 0,
      median: 0,
      min: 0,
      max: 0
    });
  })
}

function displayStats() {
  const showStat = (stats) => `
    <div class="chart_stats_block">
      <div>Mean: ${stats.mean}</div>
      <div>Median: ${stats.median}</div>
      <div>Min: ${stats.min}</div>
      <div>Max ${stats.max}</div>
    </div>
  `;
  $("#speed_stats").html(showStat(statsDataSet.speedChart));
  $("#heel_stats").html(showStat(statsDataSet.heelChart));
  $("#pitch_stats").html(showStat(statsDataSet.pitchChart));
  $("#heading_stats").html(showStat(statsDataSet.headingChart));
}

function resizeCharts(dataSetObject) {
  $(window).resize(async () => {
    clearCharts();
    await drawCharts(dataSetObject);
  });
}

async function populateData(gpxDataValue) {
  const chartsMapValue = {
    speedChart: 'speed',
    heelChart: 'heel',
    pitchChart: 'pitch',
    headingChart: 'direction'
  };
  const resultDataSet = {
    speedChart: [],
    heelChart: [],
    pitchChart: [],
    headingChart: []
  }

  return new Promise(res => {

    for (const prop in gpxDataValue) {
      if (gpxDataValue.hasOwnProperty(prop)) {
        for (const type in chartsMapValue) {
          if (chartsMapValue.hasOwnProperty(type)) {
            const valueChart = Number(gpxDataValue[prop][chartsMapValue[type]])
            resultDataSet[type].push([timeConverter(prop), valueChart]);
          }
        }
      }
    }
    res(resultDataSet)
  })
}

async function drawCharts(dataSet) {

  let data = {};
  chartSetObjects.speedChart = null;
  chartSetObjects.heelChart = null;
  chartSetObjects.pitchChart = null;
  chartSetObjects.headingChart = null;
  new Promise(res => {
    for (let currentChartType in dataSet) {
      if (dataSet.hasOwnProperty(currentChartType)) {
        data[currentChartType] = new google.visualization.DataTable();
        data[currentChartType].addColumn(chartOptions.global.hAxis.type, chartOptions.global.hAxis.title);
        data[currentChartType].addColumn(chartOptions.global.vAxis.type, chartOptions.global.vAxis.title);
        data[currentChartType].addRows(dataSet[currentChartType]);

        const options = {
          ...chartOptions.global,
          vAxis: {
            ...chartOptions.global.vAxis,
            title: chartOptions[currentChartType].vAxis.title,
          }
        };
        chartSetObjects[currentChartType]
          = new google.visualization.LineChart(document.getElementById(chartOptions[currentChartType].id));
        chartSetObjects[currentChartType].draw(data[currentChartType], options);
      }
    }
    res();
  })
}
