$(function() {

  const user_tags = JSON.parse(JSON.stringify(get_all_tags())).data;

  function get_new_tag_ID () {
    var max = parseInt(user_tags[0].tag_ID);
    for (tag of user_tags) {
      if (parseInt(tag.tag_ID) > max) {
        max = parseInt(tag.tag_ID);
      }
    } 
    console.log(max + 1);
    return max + 1
  }
  
  function populate_tag_selection(tags){
    var existing_tags = [];
    for (let i=0; i<tags.length;i++){
      if (existing_tags.includes(tags[i].tag_name) == false) {
        $("#select_tag").append(`<option value="${get_new_tag_ID()}">`+tags[i].tag_name+'</option>');
        existing_tags.push(tags[i].tag_name);
      }
    }
  }
  
  populate_tag_selection(user_tags);  
  $("#select_tag").append(`<option value="${get_new_tag_ID()}">Add new activity</option>`);

  // Display date range picker
  var start = moment().subtract(29, 'days');
  var end = moment();

  function cb(start, end) {
    $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
  }

  $('#reportrange').daterangepicker({
    startDate: start,
    endDate: end,
    ranges: {
      'Today': [moment(), moment()],
      'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
      'Last 7 Days': [moment().subtract(6, 'days'), moment()],
      'Last 30 Days': [moment().subtract(29, 'days'), moment()],
      'This Month': [moment().startOf('month'), moment().endOf('month')],
      'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    }
  }, cb);

  cb(start, end);


  $('input[name="select_date"]').daterangepicker({
    singleDatePicker: true,
    showDropdowns: true,
    minYear: 2021,
    maxYear: parseInt(moment().format('YYYY'),10)
  }, function(){
    $('input[name="select_date"]').prop("value",new Date().toLocaleDateString())
  });

  // Display time picker
  $('#timefrom').timepicker({
    'scrollDefault': 'now',
    'interval': 30,
    'dropdown': true,
    'scrollbar': true
  });
  $('#timeto').timepicker({
    'scrollDefault': 'now',
    'interval': 30,
    'dropdown': true,
    'scrollbar': true,
  });

  $("#select_tag").on("change", function(time){
    if ($("#select_tag option:selected").text() == "Add new activity"){
      $("#new-tag").collapse("show");
    } else{
      $("#new-tag").collapse("hide");
    }
  })

  $("#submit-tag-entry").on("click", function (e){
    e.preventDefault();
    var tag_date = $("#tag_fordate")[0].value;
    var tag_time_from = moment($("#timefrom")[0].value, 'hh:mm A'). format('HH:mm');
    var tag_time_to = moment($("#timeto")[0].value, 'hh:mm A'). format('HH:mm');
    var activity = $("#select_tag.custom-select")[0].value;
    var new_tag = $("#new_tag_name")[0].value;
    var recurring_event = $("#customCheck1").is(":checked");

    // console.log(tag_date,tag_time_from,tag_time_to,activity,new_tag,recurring_event)
    var date_arr = tag_date.split("/");
    var time_from_arr = tag_time_from.split(":");
    var time_to_arr = tag_time_to.split(":");

    var to_datetime = new Date(date_arr[2],date_arr[0]-1,date_arr[1],time_to_arr[0],time_to_arr[1]).toUTCString();
    var from_datetime = new Date(date_arr[2],date_arr[0]-1,date_arr[1],time_from_arr[0],time_from_arr[1]).toUTCString();
    var body = {
      "fromDatetime": from_datetime,
      "toDatetime": to_datetime,
      "tag_id": activity
    }


    console.log(body)
    if (new_tag){
      // add the new tag first, then insert tag
      // check if the randomly generated tag id exists - if not, add the new tag.
      var tag_body = {
        "tag_name": new_tag,
        "user_name": "PiusLee",
        "tag_ID": get_new_tag_ID()
      };
    } else {
       tag_body = {
        "tag_name": $("#select_tag option:selected").text(),
        "user_name": "PiusLee",
        "tag_ID": get_new_tag_ID()
      };
    }
    
    add_new_tag(tag_body);
    insert_waterusage_activity(body);
    
    location.reload();
  });

});

function get_all_readings() {
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', "http://localhost:5000/get_all_reading", false);
  xhr.send();

  // stop the engine while xhr isn't done
  for(; xhr.readyState !== 4;)

      if (xhr.status === 200) {

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

  last7days = Object.keys(readingsByDate).slice(-7);
  // console.log(last7days);

  last7dailyusage = [];
  for (day of last7days) {
    var last_record = readingsByDate[day].length - 1;
    var water_used = (readingsByDate[day][last_record].current_reading - readingsByDate[day][0].current_reading);
    last7dailyusage.push(water_used);
  }

}

function get_weekly_tags() {

    // var end_date = (new Date(Date.now()).toISOString()).slice(0,10);
    // var start_date = (new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).slice(0,10);
    var start_date = "2022-03-30"; //hardcoded
    var end_date = "2022-04-05"; // hardcoded

    var result;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', `http://localhost:5000/tag_by_date?start_date=${start_date}&end_date=${end_date}`, false);
    xhr.send();

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;) {
        if (xhr.status !== 200) {
          console.warn('request_error');
          return "none";
      }
    }
    return JSON.parse(xhr.responseText); 
}

const colors = ['rgb(255, 99, 132)','rgb(255, 159, 64)','rgb(153, 102, 255)','rgb(75, 192, 192)','rgb(54, 162, 235)', 'rgb(255, 205, 86)', "#fc32a2", "#784920", "#2f4b7c", "#ff7c43", "#beb9db", "#fdcce5", "#8bd3c7"]

function displayTags(data) {
  if (data == "none") {
    console.log("no tags are made yet!");
  } else {
    console.log("tags have been identified");
    var readings = get_all_readings();

    // SORT TAGS BY TAG_ID AND DATE
    var tagnames = [];

    var sorted_tags = data.data.sort((a,b)=>new Date(a.datetime).getTime()-new Date(b.datetime).getTime()); 

    var sortByTagIDandDate = groupBy(sorted_tags, "tag_ID");

    var date;
    for ([tagID, value] of Object.entries(sortByTagIDandDate)) {
      for (var record of value) {
        date = new Date(record.datetime).toISOString().slice(0,10); 
        record["date"] = date; 
      }
      for (tag of get_all_tags().data) {
        if (tagID == tag.tag_ID) {
          tagnames[tagID] = tag.tag_name;
        }
      }
      sortByTagIDandDate[tagID] = groupBy(value,"date");

    }
    console.log(sortByTagIDandDate);
    console.log(tagnames);

    // CALCULATE WATER USAGE
    var result = [];
    
    for ([tag, dates] of Object.entries(sortByTagIDandDate)) {
      for ([date, value] of Object.entries(dates)) {
        console.log(value);
        var last_record = value.length - 1;
        console.log(last_record);
        var firstReading, lastReading;
        for (var reading of get_all_readings().data) {
          if (value[0].datetime == reading.datetime) {
            firstReading = reading.current_reading;
          }
          if (value[last_record].datetime == reading.datetime) {
            lastReading = reading.current_reading;
          }
        }
        var water_used = lastReading - firstReading;
        console.log(water_used);

        var waterUsage = {
                      date: date,
                      index: last7days.indexOf(date), //index = 2, data=[0, 30, 20, 0, 50, 60, 0]
                      litres: water_used,
                      tagname: tagnames[tag]
                    };
        console.log(waterUsage);
        result.push(waterUsage);
      }
    }
    console.log(result);

    dataset = [];
    var existing_labels = [];
    var j = 0;
    for (record of result) {
      if (existing_labels.includes(record.tagname) == false) {

        obj = {
          label: record.tagname,
          backgroundColor: colors[j],
          data: []
        }
        existing_labels.push(record.tagname);
        dataset.push(obj);
        console.log(colors[j]);
        j++;
      }
    }
    console.log(dataset);

    //POPULATE WATER USAGE LEVELS FOR EACH LABEL e.g. showering, washing plates
    // example: var activity = {"showering": [0,0,0,0,0,0,0], "wash plates": [0,0,0,0,0,0,0]}
    // CREATE ARRAY OF SIZE 7 (for 7 days) (set all to 0 first) -> for each day of the array, find the index equivalent to index of array & REPLACE 0 WITH ITS CORRESPONDING WATER USAGE; else keep it as 0
    var activities = {};
    for (label of dataset) {
      activities[label.label] = [0,0,0,0,0,0,0];
    }

    console.log(last7dailyusage);
    var unknown = last7dailyusage; // [800,900,200,500,...]

    for ([activity,arr] of Object.entries(activities)) {
      for (var tag of result) {
        if (activity == tag.tagname) {
          arr[tag.index] += tag.litres;
          unknown[tag.index] = unknown[tag.index] - tag.litres;
        }
      }
    }

    console.log(unknown);
    for (data of dataset) {
      data.data = activities[data.label];
    }
    unknown_data = {
                      label: "Unknown",
                      backgroundColor: "#E3E6E8",
                      data: unknown
                  }
    dataset.push(unknown_data);
    console.log(dataset);
  }
}


calculate_daily_usage(get_all_readings());
var dataset = [{
                label: 'Unknown',
                backgroundColor: "#E3E6E8",
                data: last7dailyusage
              }];

displayTags(get_weekly_tags());


// Display Chart
var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: last7days,
    datasets: dataset,
  },
options: {
    tooltips: {
      displayColors: true,
      callbacks:{
        mode: 'x',
      },
    },
    scales: {
      xAxes: [{
        stacked: true,
        gridLines: {
          display: false,
        }
      }],
      yAxes: [{
        stacked: true,
        ticks: {
          beginAtZero: true,
        },
        type: 'linear',
      }]
    },
    responsive: true,
    maintainAspectRatio: false,
    legend: { position: 'bottom' },
  }
});



function get_all_tags(){
  var xhr = new XMLHttpRequest();
  // console.log(date);
    xhr.open('GET', `http://localhost:5000/tagnames`, false);
    xhr.send();

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;)
        if (xhr.status !== 200) {
          console.warn('request_error');
        } 
    return JSON.parse(xhr.responseText);
}

function add_new_tag(body){

  // console.log(body)

  var xhr = new XMLHttpRequest();
  xhr.open('POST', "http://localhost:5000/insert_Tagname", false);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.send(JSON.stringify(body));

  // stop the engine while xhr isn't done
  for(; xhr.readyState !== 4;)
      console.log(xhr)
      if (xhr.status === 200 || xhr.status === 201) {
          $("#alert_has_been_set").modal("show")
          console.log('SUCCESS', xhr.responseText);

      } else console.warn('request_error');
  // localStorage.removeItem("req_body")
  return JSON.parse(xhr.responseText);
}

function insert_waterusage_activity(body){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', "http://localhost:5000/bulk_update_hourly_tag", false);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.send(JSON.stringify(body));
  console.log(JSON.stringify(body));

  // stop the engine while xhr isn't done
  for(; xhr.readyState !== 4;)
      console.log(xhr)
      if (xhr.status === 200 || xhr.status === 201) {
          $("#alert_has_been_set").modal("show")
          console.log('SUCCESS', xhr.responseText);

      } else console.warn('request_error');
  // localStorage.removeItem("req_body")
  return JSON.parse(xhr.responseText);
}