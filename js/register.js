/*/*/var server = "https://stem-flask.herokuapp.com/"
//*/var server = "http://localhost:5000/"

$(document).ready(function() {
    $("#dateInput").datepicker({
        dateFormat: "yy-mm-dd",
        constrainInput: true
    });

    $("#timeInput").timepicker({
        stepMinute: 5
    });

    for (var i = 0; i < 12; i++) {
        if (i == 0)
            $("#hour").append("<option id='hr-12'>12</option>");
        else if (i > 9)
            $("#hour").append("<option>" + i + "</option>");
        else
            $("#hour").append("<option>0" + i + "</option>");

        if (i < 2)
            $("#minute").append("<option>0" + (i * 5) + "</option>");
        else
            $("#minute").append("<option>" + (i * 5) + "</option>");
    }

    $.ajax({
        url: server + "departments",
        type: "GET",
        crossDomain: true,
        success: function(data) {
            $("#person-departments").append(departmentSelectForm(data.departments));
            $("#event-departments").append(departmentSelectForm(data.departments));
        }
    })
});

$("input[name=AMPM]").change( function() {
    console.log($("input[name=AMPM]:checked").val());
    if ($("input[name=AMPM]:checked").val() == "AM")
        $("#hr-12").text("00");
    else
        $("#hr-12").text("12");
});

$("#registerEvent").click( function() {
    var date = $("#dateInput").val();
    var isPM = true;
    var hour = $("#hour option:selected")[0].value;
    var minute = $("#minute option:selected")[0].value;

    if ($("input[name=AMPM]:checked").val() == "AM") isPM = false;

    if (isPM && hour != "12") hour = parseInt(hour, 10) + 12;

    var time = hour + ":" + minute;
    console.log(time);
    var name = $("#eventName").val();
    var depts = "";
    $("#event-departments input:checked").each(function() {
        depts = depts + "," + $(this).val();
    });
    if (depts.length > 0) depts = depts.substring(1);
    
    if (date.length == 0 || name.length == 0 || depts.length == 0) {
        alert("Fill out all the forms");
        return;
    }

    $.ajax({
        url: server + "event",
        type: "POST",
        crossDomain: true,
        data: {"date": date, "time": time, "name": name, "departments": depts},
        success: function(data) {
            alert(JSON.stringify(data));
        }
    });
});

$("#registerDepartment").click( function() {
    var name = $("#departmentName").val();

    if (name.length == 0) {
        alert("Fill out all the forms");
        return;
    }

    $.ajax({
        url: server + "department",
        type: "POST",
        crossDomain: true,
        data: {"name": name},
        success: function(data) {
            alert(JSON.stringify(data));
        }
    });
});

$("#registerPerson").click( function() {
    var name = $("#personName").val();
    var depts = "";
    $("#person-departments input:checked").each(function() {
        depts = depts + "," + $(this).val();
    });
    if (depts.length > 0) depts = depts.substring(1);

    if (name.length == 0 || depts.length == 0) {
        alert("Fill out all the forms");
        return;
    }

    $.ajax({
        url: server + "person",
        type: "POST",
        crossDomain: true,
        data: {"name": name, "departments": depts},
        success: function(data) {
            alert(JSON.stringify(data));
        }
    });
});

function indexOf(arr, f) {
    for (var i = 0; i < arr.length; i++) {
        if (f(arr[i])) return i;
    }
    return -1;
}

function departmentSelectForm(depts) {
    $departments = $("<div></div>");
    $.each(depts, function(i,e) {
        $departments.append("<label class='checkbox-inline'>" +
            "<input type='checkbox' value='" + e._id + "'>" 
            + e.name + "</label>");
    });
    return $departments;
}

function addName(person, isPresent) {
    var $nameTag = $("<span class='label person'></span>");
    $nameTag.attr("id", "P-" + person._id);
    $nameTag.append("[" + person._id + "] " + person.name);
    var $deleteButton = $("<span class='glyphicon glyphicon-remove'></span>");
    if (isPresent) {
        $nameTag.addClass("label-primary");
        $deleteButton.addClass("present-delete");
        $deleteButton.click(presentDelete);
    } else {
        $nameTag.addClass("label-danger");
        $deleteButton.addClass("absent-delete");
        $deleteButton.click(absentDelete);
    }
    $nameTag.append(" ");
    $nameTag.append($deleteButton);
    if (!isPresent) {
        $nameTag.append(" ");
        var $restoreButton = $("<span class='glyphicon glyphicon-upload absent-restore'></span>");
        $restoreButton.click(absentRestore);
        $nameTag.append($restoreButton);
    }
    return $nameTag;
}