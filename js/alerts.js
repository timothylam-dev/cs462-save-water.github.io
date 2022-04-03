$(function() {
    var user = "PiusLee"; // hardcoded user. can change to another user if want to test setting alarm

    var alarms_set = get_alarm(user).data
    console.log(alarms_set)



    if (alarms_set.length==0){
        $("#alarm_default").collapse("show");
    } else if (alarms_set.length > 0) {
        $("#alarm_default").collapse("hide");
        $("#alarm_show_config").collapse("show");
        $("#alarm_show_config #alert_type")[0].innerText = alarms_set[0].budget_type
        if (alarms_set[0].threshold_litres){
            $("#alarm_show_config #threshold_amount")[0].innerText = alarms_set[0].threshold_litres + "ℓ"
        } else if (alarms_set[0].threshold_price){
            $("#alarm_show_config #threshold_amount")[0].innerText = "$"+ alarms_set[0].threshold_price
        }
    }

    $("#set_alert").on("click", function(){
        // var proceed_to_set = validate(user)
        // var body = proceed_to_set
        if (validate(user)) {
            insert_alert(user);
        }
            

    })
    $("#edit_alarm_config").on("click", function(){
        update_alarm()

    })

    $("#update_alarm").on("click", function(){
            update_alert(validate(user))

    })

    $("#acknowledge-alert").on("click", function() {
        window.location.replace("./alerts.html");
    })

    $("#inputThreshold_dollars").on("change", function () {
        if ($("#inputThreshold_dollars").val().length > 0) {
            console.log("input dollars entered");
            $("#inputThreshold_litres").prop( "disabled", true );
        } else {
            $("#inputThreshold_litres").prop( "disabled", false );
        }
    })

    $("#inputThreshold_litres").on("change", function () {
        if ($("#inputThreshold_litres").val().length > 0) {
            $("#inputThreshold_dollars").prop( "disabled", true );
        } else {
            $("#inputThreshold_dollars").prop( "disabled", false );
        }
    })

})

function get_alarm(user) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://localhost:5000/budget_by_user/"+user, false);
    xhr.send();

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;)

        if (xhr.status === 200) {

            // console.log('SUCCESS', xhr.responseText);

        } else console.warn('request_error');

    return JSON.parse(xhr.responseText);
}



function validate(user){
    var alert_type = $("#inputSelectAlertType").val()
    var alert_dollars = $("#inputThreshold_dollars").val()
    var alert_litres =$("#inputThreshold_litres").val()
    console.log(alert_type, alert_dollars, alert_litres)




    if (alert_dollars && alert_litres){
        display_info_msg("Please set the amount either in dollars, or in liters only!", "show");
    } else if (isNaN(alert_type)){
        display_info_msg("Please choose a alert type!", "show");
    } else if (alert_type && alert_dollars || alert_type && alert_litres){
        var alert_freq;
        if (alert_type==1){
            alert_freq="Weekly"
        } else if (alert_type ==2){
            alert_freq = "Monthly"
        } else if (alert_type==3){
            alert_freq = "Yearly"
        }
        var req = (alert_type && alert_dollars) ? {"user": user, "budget_type": alert_freq, "threshold_price": alert_dollars} : {"user": user, "budget_type": alert_freq, "threshold_litres": alert_litres}

        console.log(req)
        // localStorage.setItem("req_body", JSON.stringify(req))
        return req
    } else {
        display_info_msg("Please set a threshold alert!", "show");
    }

}

function update_alarm(user){
    $("#alarm_default").collapse("show");
    $("#alarm_show_config").collapse("hide");

    display_info_msg("", "hide");

    $("#update_alarm").collapse("show");
    $("#set_alert").hide();


}

function insert_alert(body){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', "http://localhost:5000/post_budget", false);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(JSON.stringify(body));

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;)
        console.log(xhr)
        if (xhr.status === 200 || xhr.status === 201) {
            $("#alert_has_been_set").modal("show")
            // console.log('SUCCESS', xhr.responseText);

        } else console.warn('request_error');
    // localStorage.removeItem("req_body")
    return JSON.parse(xhr.responseText);
}

function update_alert(body){
    console.log(body)
	var user = body.user;
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', "http://localhost:5000/update_budget", false);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send(JSON.stringify(body));

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;)
        console.log(xhr)
        if (xhr.status === 200 || xhr.status === 201) {
            $("#alert_has_been_set").modal("show")

        } else console.warn('request_error');

    // localStorage.removeItem("req_body")
    return JSON.parse(xhr.responseText);
}

function display_info_msg(message , action){
    console.log(message, action)
    $(".alert-info")[0].innerText = message
    $(".alert-info").collapse(action)
}