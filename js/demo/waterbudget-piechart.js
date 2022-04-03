// import DateTime from 'luxon/src/datetime.js'
var DateTime = luxon.DateTime;

// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

// Pie Chart Example


Chart.pluginService.register({
  beforeDraw: function(chart) {
    if (chart.config.options.elements.center) {
      // Get ctx from string
      var ctx = chart.chart.ctx;

      // Get options from the center object in options
      var centerConfig = chart.config.options.elements.center;
      var fontStyle = centerConfig.fontStyle || 'Arial';
      var txt = centerConfig.text;
      var color = centerConfig.color || '#000';
      var maxFontSize = centerConfig.maxFontSize || 75;
      var sidePadding = centerConfig.sidePadding || 20;
      var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2)
      // Start with a base font of 30px
      ctx.font = "30px " + fontStyle;

      // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
      var stringWidth = ctx.measureText(txt).width;
      var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

      // Find out how much the font can grow in width.
      var widthRatio = elementWidth / stringWidth;
      var newFontSize = Math.floor(30 * widthRatio);
      var elementHeight = (chart.innerRadius * 2);

      // Pick a new font size so it will not be larger than the height of label.
      var fontSizeToUse = Math.min(newFontSize, elementHeight, maxFontSize);
      var minFontSize = centerConfig.minFontSize;
      var lineHeight = centerConfig.lineHeight || 25;
      var wrapText = false;

      if (minFontSize === undefined) {
        minFontSize = 20;
      }

      if (minFontSize && fontSizeToUse < minFontSize) {
        fontSizeToUse = minFontSize;
        wrapText = true;
      }

      // Set font settings to draw it correctly.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
      var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
      ctx.font = fontSizeToUse + "px " + fontStyle;
      ctx.fillStyle = color;

      if (!wrapText) {
        ctx.fillText(txt, centerX, centerY);
        return;
      }

      var words = txt.split(' ');
      var line = '';
      var lines = [];

      // Break words up into multiple lines if necessary
      for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > elementWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }

      // Move the center up depending on line height and number of lines
      centerY -= (lines.length / 2) * lineHeight;

      for (var n = 0; n < lines.length; n++) {
        ctx.fillText(lines[n], centerX, centerY);
        centerY += lineHeight;
      }
      //Draw text in center
      ctx.fillText(line, centerX, centerY);
    }
  }
});

function get_budget () {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', "http://localhost:5000/budget_by_user/PiusLee", false);
  xhr.send();

  // stop the engine while xhr isn't done
  for(; xhr.readyState !== 4;)

      if (xhr.status === 200) {
          // console.log(xhr.responseText);
          // console.log('SUCCESS', xhr.responseText);

      } else console.warn('request_error');
  // console.log(JSON.parse(xhr.responseText));
  return JSON.parse(xhr.responseText);
}

function get_monthly_readings() {

  var current_month = ((new Date()).getMonth() + 1).toString();
  // console.log(current_month);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', "http://localhost:5000//get_reading_by_month/" + current_month, false);
  xhr.send();

  // stop the engine while xhr isn't done
  for(; xhr.readyState !== 4;)

      if (xhr.status === 200) {
          // console.log(xhr.responseText);
          // console.log('SUCCESS', xhr.responseText);

      } else console.warn('request_error');

  return xhr.responseText;
}

function get_all_readings() {
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', "http://localhost:5000//get_all_reading", false);
  xhr.send();

  // stop the engine while xhr isn't done
  for(; xhr.readyState !== 4;)

      if (xhr.status === 200) {
          // console.log(xhr.responseText);
          // console.log('SUCCESS', xhr.responseText);

      } else console.warn('request_error');

  return JSON.parse(xhr.responseText);
}

function get_monthly_water_usage(data){
  // console.log(data, typeof(data));
  jsondata = (JSON.parse(data)).data;
  // current func doesn't filter by month. maybe backend can do it: get monthly readings.

  // jsondata.sort((a,b)=> (a.current_reading > b.current_reading ? 1 : -1)) // sort by water_meter_reading asc. logic is that readings will surely rise as time goes on
  jsondata.sort((a,b)=>new Date(a.datetime).getTime()-new Date(b.datetime).getTime());  //sort by ascending datetime
  // console.log(jsondata);
  
  var last_record = jsondata.length -1
  var water_used = (jsondata[last_record].current_reading - jsondata[0].current_reading) // in cubic meterrs
  // console.log(water_used);
  return water_used;
}

function calculate_weekly_usage(data) {
  data = (JSON.parse(data)).data;
  var sorted_data = data.sort((a,b)=>(new Date(a.datetime)).getTime() - (new Date(b.datetime)).getTime()); 
  var last_index = sorted_data.map(obj => (DateTime.fromISO(obj.date)).weekNumber).lastIndexOf(DateTime.now().weekNumber);
  var first_index = sorted_data.map(obj => (DateTime.fromISO(obj.date)).weekNumber).indexOf(DateTime.now().weekNumber);

  // console.log(first_index);
  // console.log(last_index);
  if (first_index == -1 && last_index == -1) {
    var weekly_usage = 0;
  } else {
    weekly_usage = (sorted_data[last_index].current_reading - sorted_data[first_index].current_reading);
  }
  return weekly_usage;
}

function calculate_litres_from_dollars(amount){
  // rates according to this website: https://dollarsandsense.sg/understanding-water-bill-singapore-water-tariff-water-conservation-tax-waterborne-fee-mean/
  var tarrif, water_conservation_tax, waterborne_fee, litres;


  if (amount <= (40 *1.21 + 40*0.61 + 40*0.92)) {  
      tarrif = 1.21;
      water_conservation_tax = 0.61;
      waterborne_fee = 0.92;
  } else {
      tarrif = 1.52;
      water_conservation_tax = 0.99;
      waterborne_fee = 1.18;
  }
  multiplier = tarrif + water_conservation_tax + waterborne_fee;
  litres = (amount / multiplier) * 1000;
  return litres 
}


function calculate_percentOfBudget(data) {
  // console.log(data);
  // console.log(data.data[0].budget_type);

  if (data.data[0].threshold_litres) {
    var threshold = data.data[0].threshold_litres;

  } else {
    threshold = calculate_litres_from_dollars(data.data[0].threshold_price);
  }

  if (data.data[0].budget_type == "Weekly") {
    usage = calculate_weekly_usage(get_monthly_readings());
    $("#water-budget-title")[0].innerText = "Weekly Water Usage Budget";

  } else if (data.data[0].budget_type == "Monthly") {
    usage = get_monthly_water_usage(get_monthly_readings());
    $("#water-budget-title")[0].innerText = "Monthly Water Usage Budget";
    
  } else {
    usage = calculate_yearly_usage(get_all_readings());
    $("#water-budget-title")[0].innerText = "Yearly Water Usage Budget";
  
  }
  excess = threshold - usage;
  usage = Math.round(usage);
  excess = Math.round(excess);
  budget_percent = Math.round((usage / threshold) * 100);

  if (budget_percent > 100) {
    budget_percent = 100;
    excess = 0;
    exceededBy = Math.round(usage - threshold);
  }
}

function calculate_yearly_usage(data) {
  sorted_data = data.data.sort((a,b)=>new Date(a.datetime).getTime()-new Date(b.datetime).getTime()); 

  var last_index = sorted_data.map(obj => (new Date(obj.date)).getFullYear()).lastIndexOf((new Date()).getFullYear());
  var first_index = sorted_data.map(obj => (new Date(obj.date)).getFullYear()).indexOf((new Date()).getFullYear());

  console.log(first_index);
  console.log(last_index);

  if (first_index == -1 && last_index == -1) {
    var yearly_usage = 0;
  } else {
    var yearly_usage = (sorted_data[last_index].current_reading - sorted_data[first_index].current_reading);
  }
  return yearly_usage;
}

calculate_percentOfBudget(get_budget());
// console.log(budget_percent);
// console.log(usage);
// console.log(excess);

// console.log(exceededBy);

config = {
  type: 'doughnut',
  data: {
    labels: ["Used (ℓ)", "Available (ℓ)"],
    datasets: [{
      data: [usage, excess],   // CHANGE THE VALUES HERE TO ACTUAL PERCENTAGE OF WATER USAGE
      backgroundColor: ['#D21404', '#36b9cc'],
      hoverBackgroundColor: ['#E3242B','#2c9faf'],
      hoverBorderColor: "rgba(234, 236, 244, 1)",
    }],
  },
  options: {
    maintainAspectRatio: false,
    tooltips: {
      backgroundColor: "rgb(255,255,255)",
      bodyFontColor: "#858796",
      borderColor: '#dddfeb',
      borderWidth: 1,
      xPadding: 15,
      yPadding: 15,
      displayColors: false,
      caretPadding: 10,
    },
    legend: {
      display: false
    },
    cutoutPercentage: 80,
    elements: {
      center: {
        text: "",
        color: '#1338BE', // Default is #000000
        fontStyle: 'Nunito', // Default is Arial
        sidePadding: 20, // Default is 20 (as a percentage)
        minFontSize: 25, // Default is 20 (in px), set to false and text will not wrap.
        lineHeight: 25 // Default is 25 (in px), used for when text wraps
      }
    }
  },
}



if (budget_percent == 100) {
  config.options.elements.center.text = `Water Budget Exceeded by ${exceededBy}ℓ!`;
} else {
  config.options.elements.center.text = budget_percent.toString() + "%"; // set doughnut chart centre text to dataset in config
}

// if (budget_percent > 100) {
//   budget_percent = 100;
//   config.options.elements.center.text = "Water Budget Exceeded!"
// }


// console.log(config.data.datasets[0].data[0]);  

var ctx = document.getElementById("myPieChart");
var myPieChart = new Chart(ctx, config);