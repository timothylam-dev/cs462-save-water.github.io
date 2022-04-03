// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

function number_format(number, decimals, dec_point, thousands_sep) {
  // *     example: number_format(1234.56, 2, ',', ' ');
  // *     return: '1 234,56'
  number = (number + '').replace(',', '').replace(' ', '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function(n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.round(n * k) / k;
    };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}

function get_all_readings() {
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', "https://cors-everywhere-me.herokuapp.com/http://175.41.165.232:5000//get_all_reading", false);
  xhr.send();

  // stop the engine while xhr isn't done
  for(; xhr.readyState !== 4;)

      if (xhr.status === 200) {
          // console.log(xhr.responseText);
          // console.log('SUCCESS', xhr.responseText);

      } else console.warn('request_error');

  return JSON.parse(xhr.responseText);
}

function groupBy(arr, criteria) {
  const newObj = arr.reduce(function (acc, currentValue) {
    if (!acc[currentValue[criteria]]) {
      acc[currentValue[criteria]] = [];
    }
    acc[currentValue[criteria]].push(currentValue);
    return acc;
  }, {});
  return newObj;
}

function calculate_daily_usage(data) {
  sorted_data = data.data.sort((a,b)=>new Date(a.datetime).getTime()-new Date(b.datetime).getTime()); 
  var readingsByDate = groupBy(sorted_data,"date");
  // console.log(readingsByDate, typeof(readingsByDate));

  last7days = Object.keys(readingsByDate).slice(-7);
  // console.log(last7days);

  last7dailyusage = [];
  for (day of last7days) {
    var last_record = readingsByDate[day].length - 1;
    var water_used = (readingsByDate[day][last_record].current_reading - readingsByDate[day][0].current_reading);
    last7dailyusage.push(water_used);
  }

  }
 

calculate_daily_usage(get_all_readings());


// Bar Chart Example
var ctx = document.getElementById("myBarChart");
var myBarChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: last7days,
    datasets: [{
      label: "Water Usage",
      backgroundColor: "#4e73df",
      hoverBackgroundColor: "#2e59d9",
      borderColor: "#4e73df",
      data: last7dailyusage,
    }],
  },
  options: {
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10,
        right: 25,
        top: 25,
        bottom: 0
      }
    },
    scales: {
      xAxes: [{
        time: {
          unit: 'day'
        },
        gridLines: {
          display: false,
          drawBorder: false
        },
        ticks: {
          maxTicksLimit: 6
        },
        maxBarThickness: 25,
      }],
      yAxes: [{
        ticks: {
          min: 0,
          max: 1000,
          maxTicksLimit: 10,
          padding: 10,
          // Include a dollar sign in the ticks
          callback: function(value, index, values) {
            return number_format(value) + "ℓ";
          }
        },
        gridLines: {
          color: "rgb(234, 236, 244)",
          zeroLineColor: "rgb(234, 236, 244)",
          drawBorder: false,
          borderDash: [2],
          zeroLineBorderDash: [2]
        }
      }],
    },
    legend: {
      display: false
    },
    tooltips: {
      titleMarginBottom: 10,
      titleFontColor: '#6e707e',
      titleFontSize: 14,
      backgroundColor: "rgb(255,255,255)",
      bodyFontColor: "#858796",
      borderColor: '#dddfeb',
      borderWidth: 1,
      xPadding: 15,
      yPadding: 15,
      displayColors: false,
      caretPadding: 10,
      callbacks: {
        label: function(tooltipItem, chart) {
          var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
          return datasetLabel + ': ' + number_format(tooltipItem.yLabel) + "ℓ";
        }
      }
    },
  }
});
