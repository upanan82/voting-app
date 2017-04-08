'use strict';

$(document).ready(function() {
    nameFunc();
    if (window.location.pathname == '/') start("");
    else start("my");
    if (window.location.pathname.split('/')[1] == 'polls') pollPage();
    $( "#select" ).change(function() {
        if($('#select').val() == "val1") $("#own").fadeIn("fast");
        else $("#own").fadeOut("fast");
    });
});


// Create a new poll
function newPoll() {
    if ($('#title').val() == '') {
        alert("Enter the title!");
        return false;
    }
    else if ($('#text').val().split('\n').length < 2) {
        alert("Min 2 elements!");
        return false;
    }
    var text = $('#text').val().replace(/[,.;]/g, '').replace(/\s{2,}/g, ' '),
        arr = text.split('\n');
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == '') {
            alert("Empty line!");
            return false;
        }
        else for (var j = i + 1; j < arr.length; j++)
            if (arr[i] == arr[j]) {
                alert("Elements are repeated! (" + arr[i] + ")");
                return false;
            }
    }
    var title = $('#title').val().replace(/[,.;]/g, '').replace(/\s{2,}/g, ' '),
        data = {title : title, text : arr};
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
		contentType: 'application/json',
        url: '/newPoll',						
        success: function(data) {
            window.location.href = "/polls/" + data;
        }
    });
}

// List of polls
function start(a) {
    var data = {ind : a};
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
		contentType: 'application/json',
        url: '/start',						
        success: function(data) {
            if (data != '') {
                var arr = data.split(','),
                    str = '';
                arr.reverse();
		        for (var i = 0; i < arr.length; i += 2)
			        str += '<a href="polls/' + arr[i] + '"><li>' + arr[i + 1] + '</li></a>';
                $('.list').html(str);
            }
            else $('.list').html('Poll list is empty!');
        }
    });
}

// View user name
function nameFunc() {
    $.ajax({
        type: 'POST',
        url: '/nameD',						
        success: function(data) {
            $('#display-name').html(data);
        }
    });
}

// Demonstration of poll
function pollPage() {
    $.ajax({
        type: 'POST',
        url: '/pollPage',						
        success: function(data) {
            var arr = data.split(','),
                ind2 = arr.pop(),
                ind1 = arr.pop(),
                title = arr.pop(),
                arrA = [],
                arrB = [],
                arrC = [],
                ctx = $("#myChart"),
                str = '<option value="" disabled="disabled" selected="selected" hidden="">Choose an option...: </option>';
            if (ind2 == 'OK') $('.btn2').css({'display':'inline-block'});
            $('#titlePol').html(title);
            for (var i = 0; i < arr.length; i = i + 2) {
                str += '<option>' + arr[i] + '</option>';
                arrA.push(arr[i]);
                arrB.push(arr[i + 1]);
                arrC.push(getRandomColor());
            }
            var result = arrB.reduce(function(sum, current) {
                return sum + current;
            }, 0);
            if (ind1 == 'OK') {
                str += '<option value="val1">Own option</option>';
                $('header').html('<p style="padding-bottom: 10px;"><span id="display-name"></span></p><a class="menu" href="/">Home</a><p>|</p><a class="menu" href="/my">My Polls</a><p>|</p><a class="menu" href="/new">New Poll</a><p>|</p><a class="menu" href="/logout">Logout</a>');
            }
            else $('header').html('<p style="padding-bottom: 10px;"><span id="display-name"></span></p><a class="menu" href="/">Home</a><p>|</p><a class="menu" href="/auth/github">Login with GitHub</a>');
            nameFunc();
            $('#select').html(str);
            var myChart = new Chart(ctx, {
                type: 'doughnut',
                options: {
                    animation: {
                        animateScale: true
                    }
                },
                data: {
                    labels: arrA,
                    datasets: [{
                        data: arrB,
                        backgroundColor: arrC,
                        hoverBackgroundColor: arrC,
                    }]
                }
            });
            if (result == 0) alert('Be the first. Vote to see the diagram.');
        }
    });
}

// Delete poll
function remove() {
    if (confirm('Are you sure to remove this poll?')) {
        $.ajax({
            type: 'POST',
            url: '/remove',						
            success: function(data) {
                alert('Successfully removed the poll!');
                window.location = '/my';
            }
        });
    }
}

// Take a vote
function pollFunc() {
    var index = '';
    if ($('#select').val() == "val1") index = $("#own").val().replace(/[,.;]/g, '').replace(/\s{2,}/g, ' ');
    else index = $('#select option:selected').text();
    var data = {index : index};
    $.ajax({
            type: 'POST',
            url: '/poll',
            data: JSON.stringify(data),
		    contentType: 'application/json',
            success: function(data) {
                if (data == 'err') alert('You can only vote oncea poll!')
                else pollPage();
            }
        });
}

// Random color function
function getRandomColor() {
    var letters = '0123456789ABCDEF',
        color = '#';
    for (var i = 0; i < 6; i++)
        color += letters[Math.floor(Math.random() * 16)];
    return color;
}

// Tweet function
function tweet() {
    var url = window.location.href;
    window.open("https://twitter.com/intent/tweet?hashtags=voting&text=Voting App " + url, '_blank');
}