var green_check = document.getElementById("green");
var slider = document.getElementById("slider");
var ctx = document.getElementById('myChart').getContext('2d');
var id= $('#variableJSON1').text();

$(function(){  

    $('#red').change(function(){
        if($(this).prop('checked')){
            console.log("RED checked");
            dweetio.dweet_for(id+"_nodemcu_static", {redled:1}, function(err, dweet){
                if(err)
                    console.log(err);
                else
                    console.log(dweet.content); // The content of the dweet        
            });
        }else{
            console.log("Unchecked");
            dweetio.dweet_for(id+"_nodemcu_static", {redled:0}, function(err, dweet){
                if(err)
                    console.log(err);
                else
                    console.log(dweet.content); // The content of the dweet        
            });
        }
    });
    $('#green').change(function(){
        if($(this).prop('checked')){
            console.log("Green checked");
            dweetio.dweet_for(id+"_nodemcu_static", {greenled:1}, function(err, dweet){
                if(err)
                    console.log(err);
                else
                    console.log(dweet.content); // The content of the dweet        
            });
        }else{
            console.log("Unchecked");
            dweetio.dweet_for(id+"_nodemcu_static", {greenled:0}, function(err, dweet){
                if(err)
                    console.log(err);
                else
                    console.log(dweet.content); // The content of the dweet        
            });
        }
    });

    $('#slider').change(function(){
        $("#sliderval").html( $(this).val());

        dweetio.dweet_for(id+"_nodemcu_static", {slider:$(this).val()}, function(err, dweet){
            if(err)
                console.log(err);
            else
                console.log(dweet.content); // The content of the dweet        
        });
    });
    var data={
        labels: [],
        datasets: [{
            fill: false,
            borderColor: '#2196f3', // Add custom color border (Line)
            backgroundColor: '#2196f3', // Add custom color background (Points and Fill)
            borderWidth: 1 // Specify bar border width
        }]
    }
    var chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height 
    }
    });
    let dp=[];
    let label=[];
    let i=0;
    $.get('https://dweet.io/get/latest/dweet/for/'+id+'_nodemcu_init')
    .done(function(dweet){
        //console.log(dweet);
        //Initilize the Toggle switches
        if(dweet.with[0].content.redled==1 && $('#red').prop('checked')==false){
            $('#red').click();
        }
        if(dweet.with[0].content.greenled==1 && $('#green').prop('checked')==false){
            $('#green').click();
        }

        //Initilize the Slider
        $("#sliderval").html( dweet.with[0].content.slider);
        $('#slider').val(dweet.with[0].content.slider);

        //Initilize the Gauge
        document.getElementById('canvas').setAttribute("data-value", dweet.with[0].content.ldr);
        
        //Initilize the Line chart
        let dist= dweet.with[0].content.dist; //json object with five ultasonic value
        for (let prop in dist){
            label.push(new Date(dist[prop].when).toLocaleString().split(',')[1]);
            dp.push(dist[prop].value);
        }
        data.labels = label;
        data.datasets[0].label= new Date(dist['first'].when).toLocaleString().split(',')[0];
        data.datasets[0].data=dp;
        //console.log(dp);
        chart.update();
    })
    .fail(function(){
        console.log('Unable to initlize dashboard');
    });
    dweetio.listen_for(id+"_nodemcu_dynamic", function(dweet){
        // This will be called anytime there is a new dweet for my-thing
        if(dweet.content.ldr){
            document.getElementById('canvas').setAttribute("data-value", dweet.content.ldr);
        }
        if(dweet.content.dist){
            label.push(new Date().toLocaleString().split(',')[1]);
            dp.push(dweet.content.dist);
            i = dp.length;
            if(i>5){
                dp.shift();
                label.shift();
                i--;
            }
            data.labels = label;
            data.datasets[0].label= new Date(dweet.created).toLocaleString().split(',')[0];
            data.datasets[0].data=dp;
            //console.log(dp);
            chart.update();  
        }
    });
});