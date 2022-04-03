$(function() {
    var water_used = get_monthly_water_usage(get_monthly_readings()); // in cubic meters
    var water_bill = calculate_water_dollar(water_used) // in dollars

    // display the amount of water used in liters
    $("#current_month_water_usage>span")[0].innerText = water_used  // in liters

    // display the estimated water used in dollars
    $("#water_bill")[0].innerText = water_bill.toFixed(2)

    // Display line chart
    var daily_chart = document.getElementById('dailychart');
    const daily_reading = JSON.parse(get_reading_today()).data;    
    var hours_arr = new Array();
    var waterusagearr = [];
    
    result = daily_reading.reduce(function (r, a) {
        r[a.hour] = r[a.hour] || [];
        r[a.hour].push(a);
        return r;
    }, Object.create(null));
     
    var no_of_hours_recorded = Object.keys(result).length
    Object.keys(result).forEach(function(key) {
        var hour_arr =  result[key];
        var no_records_in_this_hr = Object.keys(hour_arr).length -1;
        var water_usage = hour_arr[no_records_in_this_hr].current_reading - hour_arr[0].current_reading;
        hours_arr.push(key.toString());
        waterusagearr.push(water_usage)
        
    });
    // console.log(hours_arr)
    // console.log(waterusagearr)
   

    var myChart = new Chart(daily_chart, {
    type: 'line',
    data: {
        labels: hours_arr,
        // labels: ["12am", "1am", "2am", "3am","4am","5am","6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm","12am"],
        datasets: [{
        label: 'Water usage (in litres)',
        data: waterusagearr,
        // data: [13, 0, 0,0,0,0,0,22,33,38,43,43,0,0,55,53,77,35,100,102,44,30,55,77,33,22,44,5,6,88,73,76,67,55,47,22],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
        }],
    },

    })

});

function get_reading_today(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    // today = yyyy + "-" + mm + "-" + dd; 
    today = "2022-03-04";//hardcode for now as db doesnt have today's readings.
    // console.log(today);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', "https://cors-everywhere-me.herokuapp.com/http://175.41.165.232:5000/watermeter_reading_by_date?date=" + today, false);
    xhr.send();

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;)

        if (xhr.status === 200) {
            // console.log(xhr.responseText);
            console.log('SUCCESS', xhr.responseText);

        } else console.warn('request_error');

    return xhr.responseText;
}


function get_monthly_readings() {

    var current_month = ((new Date()).getMonth() + 1).toString();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', "https://cors-everywhere-me.herokuapp.com/http://175.41.165.232:5000/get_reading_by_month/" + current_month, false);
    xhr.send();

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;)

        if (xhr.status === 200) {
        } else console.warn('request_error');

    return xhr.responseText;
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

function calculate_water_dollar(amount){
    // rates according to this website: https://dollarsandsense.sg/understanding-water-bill-singapore-water-tariff-water-conservation-tax-waterborne-fee-mean/
    var tarrif, water_conservation_tax, waterborne_fee, total_bill;
    amount = amount / 1000;
    if (amount <= 40){
        tarrif = 1.21;
        water_conservation_tax = 0.61;
        waterborne_fee = 0.92;
    } else {
        tarrif = 1.52;
        water_conservation_tax = 0.99;
        waterborne_fee = 1.18;
    }

    total_bill = amount*tarrif + amount*water_conservation_tax + amount*waterborne_fee
    // console.log(total_bill);
    return total_bill

}
