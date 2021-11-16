const chartSetObjects = {
  speedChart: null,
  headingChart: null,
  heelChart: null
};

let dataSet;
const chartOptions = {
  global: {
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
    chartArea: {backgroundColor: "transparent", fill: "transparent"},
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

function loadCharts() {
  google.charts.load("current", {
    packages: ["corechart", "line"],
    callback: () => {
      const dataSetObject = populateData();
      dataSet = dataSetObject;
      drawCharts(dataSetObject);
      resizeCharts(dataSetObject);
    },
  });
}

function resizeCharts(dataSetObject) {
  $(window).resize(() => {
    drawCharts(dataSetObject);
  });
}

function populateData() {
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
  for (const prop in gpxData) {
    if (gpxData.hasOwnProperty(prop)) {
      for (const type in chartsMapValue) {
        if (chartsMapValue.hasOwnProperty(type)) {
          resultDataSet[type].push([timeConverter(prop), Number(gpxData[prop][chartsMapValue[type]])]);
        }
      }
    }
  }
  return resultDataSet;
}

function drawCharts(dataSet) {
  chartSetObjects.headingChart = null;
  chartSetObjects.speedChart = null;
  chartSetObjects.heelChart = null;
  for (let currentChartType in dataSet) {
    if (!dataSet.hasOwnProperty(currentChartType)) return;

    const data = new google.visualization.DataTable();
    data.addColumn(chartOptions.global.hAxis.type, chartOptions.global.hAxis.title);
    data.addColumn(chartOptions.global.vAxis.type, chartOptions.global.vAxis.title);
    data.addRows(dataSet[currentChartType]);

    const options = {
      ...chartOptions.global,
      vAxis: {
        ...chartOptions.global.vAxis,
        title: chartOptions[currentChartType].vAxis.title,
      }
    };
    chartSetObjects[currentChartType]
      = new google.visualization.LineChart(document.getElementById(chartOptions[currentChartType].id));
    chartSetObjects[currentChartType].draw(data, options);
  }
}
