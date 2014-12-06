

var events;
var participants = [];
var absentees = [];

var currentEvent;
var agendas = [];

//var server = "https://stem-flask.herokuapp.com/"
var server = "http://localhost:5000/"

$(document).ready(function() {

});

$("#loadEvents").click( function() {
    var date = $("#dateInput").val();
    $.ajax({
        url: server + "events",
        dataType: "jsonp",
        type: "POST",
        jsonp: "callback",
        data: {"date": date},
        success: function(data) {
            events = data.events;
            $("#events").empty();
            if (data.events.length === 0) {
                $(".container-agendas").css("visibility","hidden");
            }
            $.each(data.events, function(i, e) {
                $("#events").append("<option class='events' value=" + i + ">[" + e.time + "] " + e.name + "</option><br />");
         });
            updateEvent();
        }
    });
});

$("#events").change(updateEvent);

function updateEvent() {
    var idx = $("#events option:selected")[0].value;
    currentEvent = events[idx];

    $.ajax({
        url: server + "people",
                    //url: "http://localhost:5000/people",
        dataType: "jsonp",
        type: "POST",
        jsonp: "callback",
        data: {"departments": events[idx].department.join()},
        success: function(data) {
            participants = [];
            $.each(data.people, function(i, p) {
                participants.push(p);
            });
            updatePeople();
        }
    });
    $(".container-agendas").css("visibility","visible");
}

function updatePeople() {
    $("#participants").empty();
    $("#absentees").empty();
    $("#absentees-header").css("visibility","hidden");
    $.each(participants, function(i, p) {
        $("#participants").append(addName(p, true));
        $("#participants").append(" ");
    });
}

function presentDelete() {
    var id = $(this).parent().attr('id').substring(2);
    id = Number(id);
    $(this).parent().remove();
    var idx = indexOf(participants, function (p) {
        return p._id === id;
    });
    if (idx < 0) return;
    var p = participants[idx];
    absentees.push(p);
    $("#absentees-header").css("visibility","visible");
    $("#absentees").append(addName(p, false));
    $("#absentees").append(" ");
    participants.splice(idx, 1);
}


function absentDelete() {
    var id = $(this).parent().attr('id').substring(3);
    id = Number(id);
    $(this).parent().remove();
    var idx = indexOf(absentees, function (p) {
        return p._id === id;
    });
    if (idx < 0) return;
    absentees.splice(idx, 1);
    if (absentees.length < 1) {
        $("#absentees-header").css("visibility","hidden");
    }
}

function absentRestore() {
    var id = $(this).parent().attr('id').substring(2);
    id = Number(id);
    $(this).parent().remove();
    var idx = indexOf(absentees, function (p) {
        return p._id === id;
    });
    if (idx < 0) return;
    var p = absentees[idx];
    participants.push(p);
    $("#participants").append(addName(p, true));
    $("#participants").append(" ");
    absentees.splice(idx, 1);
    if (absentees.length < 1) {
        $("#absentees-header").css("visibility","hidden");
    }
}

function indexOf(arr, f) {
    for (var i = 0; i < arr.length; i++) {
        if (f(arr[i])) return i;
    }
    return -1;
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

        var $absentReason = $("<span class='badge reason'>사유</span>");
        $absentReason.click( function() { modifyReason($(this)); });
        $(".glyphicon-remove", $nameTag).before($absentReason);
        $(".glyphicon-remove", $nameTag).before(" ");
    }
    return $nameTag;
}

function modifyReason($element) {
    var reason = $element.text();
    if (reason === "사유") reason = "";
    $element.replaceWith("<input type='text' class='reason-text' value=" + reason + "></input>");
    $(".reason-text").focusout(function () {
        comfirmReason($(this));
    });
    $(".reason-text").keydown(function (event) {
        if (event.which === 13) comfirmReason($(this));
    });
    $(".reason-text").focus();
}

function comfirmReason($element) {
    var reason = $element.val();
    if (reason === "") reason = "사유";
    $element.replaceWith("<span class='badge reason'>" + reason + "</span>");
    $(".reason").click(function () {
        modifyReason($(this));
    });
}

//Create new agenda register form
function newAgendaForm() {
    var $agendaForm = $("<form id='form-new-agenda' class='form-inline'></form>");
    var $input = $("<div class='form-group'></div>");
    $input.append("<input type='text' id='new-agenda-name'></input>");
    var $btn = $("<button class='btn btn-primary' type='submit' id='add-agenda'>Add</button>");
    $input.append(" ");
    $input.append($btn);
    $agendaForm.append($input);
    $agendaForm.submit( function(event) { 
        event.preventDefault();
        registerAgenda($("#new-agenda-name").val(), currentEvent._id); 
    });
    return $agendaForm;
}

//Register new agenda and update layout
function registerAgenda(name, eventID) {
    $.ajax({
        url: server + "insert-agenda",
        dataType: "jsonp",
        type: "POST",
        jsonp: "callback",
        data: {
            name: name,
            eventID: eventID
        },
        success: function (data) {
            $("#form-new-agenda").remove();
            $("#agendas").append(agendaForm(data.result));
            var $btn = $("<button class='btn btn-primary' id='add-agenda'>Add Agenda</button>");
            $btn.click(function () {
                $("#agendas").append(newAgendaForm());
                $("#add-agenda").remove();
            });
            $("#agendas").append($btn);
        }
    });
}

function removeAgenda(agendaID, eventID) {
    $.ajax({
        url: server + "delete-agenda",
        dataType: "jsonp",
        type: "POST",
        jsonp: "callback",
        data: {
            agendaID: agendaID,
            eventID: eventID
        },
        success: function (data) {
            var formID = "#agenda-" + agendaID;
            $(formID).remove();
        }
    });
}

//Create agenda form
function agendaForm(agenda) {
    var $agendaForm = $("<form id='agenda-" + agenda._id + "'></form>");
    $agendaForm.append("<div class='form-group'><label>&lt;Agenda " + agenda._id + "&gt; " + agenda.name + "</label></div>");
    var $deleteBtn = $("<button class='btn btn-danger remove-agenda'>Delete</button>")
    $deleteBtn.click( function(event) {
        event.preventDefault();
        agendaID = $(this).parent().parent().attr('id').substring(7);
        removeAgenda(agendaID, currentEvent._id);
    });
    $(".form-group", $agendaForm).append($deleteBtn);
    $agendaForm.append("<div class='form-group'><label>Description</label><textarea class='form-control' rows='5'></textarea></div>");
    return $agendaForm;
}

$(document).ready(function () {
    $("#add-agenda").click(function () {
        $("#agendas").append(newAgendaForm());
        $("#add-agenda").remove();
    });
});