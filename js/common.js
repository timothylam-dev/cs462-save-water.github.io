function get_monthly_readings() {
    const d = new Date();
    let month = d.getMonth()+1;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', "http://175.41.165.232:5000/get_reading_by_month/"+month, false);
    xhr.send();

    // stop the engine while xhr isn't done
    for(; xhr.readyState !== 4;)

        if (xhr.status === 200) {

            // console.log('SUCCESS', xhr.responseText);

        } else console.warn('request_error');

    return JSON.parse(xhr.responseText);
}