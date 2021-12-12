const chartSetObjects = {
  speedChart: null,
  headingChart: null,
  heelChart: null
};

const statsDataSet = {
  speedChart: {
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
  },
  heelChart: {
    mean: 0,
    median: 0,
    min: 0,
    max: 0
  },
}

let dataSet = {
  speedChart: null,
  headingChart: null,
  heelChart: null
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
  headingChart: {
    id: "chart_div_heading",
    name: "headingChart",
    gpxProperty: "direction",
    vAxis: {
      title: "Heading, °",
    }
  },
  heelChart: {
    id: "chart_div_heel",
    name: "heelChart",
    gpxProperty: "heel",
    vAxis: {
      title: "Heel, °"
    }
  }
}

function loadCharts(gpxDataValue) {
  google.charts.load("current", {
    packages: ["corechart", "line"],
    callback: async () => {
      // const filteredByTimeRage = await filterGpxData(gpxDataValue);
      const dataSetObject = await populateData(gpxDataValue);
      dataSet = dataSetObject;
      await drawCharts(dataSetObject);
      await statsCharts(dataSetObject);
      displayStats();
      resizeCharts(dataSetObject);
    },
  });
}

async function filterGpxData(gpxDataValue) {
  return gpxDataValue;
  const filtered = {}
  const timeStart = start_time.split(",")[1].trim();
  const startSeconds = get_seconds(timeStart) + secStart - timeOffset;
  const endSeconds = startSeconds + secFrame;
  // console.log(secondsToHms(startSeconds),secondsToHms(endSeconds))
  return new Promise((res) => {
    for (let time in gpxDataValue) {
      const currentTime = get_seconds(time);
      if (startSeconds <= currentTime && currentTime <= endSeconds) {
        filtered[time] = gpxDataValue[time];
      }
    }
    res(filtered)
  })
}

async function filterDataRange() {
  return;
  const filtered = await filterGpxData(gpxData);
  const dataSetNew = await populateData(filtered);
  await drawCharts(dataSetNew);
  await statsCharts(dataSetNew);
  displayStats();
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
  $("#heading_stats").html(showStat(statsDataSet.headingChart));
  $("#heel_stats").html(showStat(statsDataSet.heelChart));
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
    headingChart: 'direction',
    heelChart: 'heel'
  };
  const resultDataSet = {
    speedChart: [],
    headingChart: [],
    heelChart: []
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
  chartSetObjects.headingChart = null;
  chartSetObjects.speedChart = null;
  chartSetObjects.heelChart = null;
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
