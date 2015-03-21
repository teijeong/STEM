

var events;
var nextEvents;

var currentEvent;

/*/*/var server = "https://stem-flask.herokuapp.com/";
//*/var server = "http://localhost:5000/";

var eventDates = [];
var eventMonths = [];

var agendas = [];
var selectedAgenda;
var selectedNextAgenda;

var report;

var prevEvents;
var nextEvent;

$(document).ready(function() {

    var date = new Date();

    $("#dateInput").change(loadEvents);
    $("#events").change(updateEvent);
    $("#date-next-event").change(function () {
        if ($("#existing-event:checked").length === 1)
            loadNextEvents();
    });
    $("#save-next-event").click(uploadNextEvent);

    $("#dateInput").datepicker({
        beforeShowDay: function(date) {
            var monthString = jQuery.datepicker.formatDate("yy-mm", date);
            var dateString = jQuery.datepicker.formatDate("yy-mm-dd", date);
            if (dateString.substring(8) == "01")
                updateEventDates(monthString.substring(0,4), monthString.substring(5), true);
            return [eventDates.indexOf(dateString) != -1];
        },
        dateFormat: "yy-mm-dd",
        constrainInput: true
    });
    $("#date-next-event").datepicker({
        beforeShowDay: function(date) {
            if ($("#existing-event:checked").length === 0) return [true];
            var monthString = jQuery.datepicker.formatDate("yy-mm", date);
            var dateString = jQuery.datepicker.formatDate("yy-mm-dd", date);
            if (dateString.substring(8) == "01")
                updateEventDates(monthString.substring(0,4), monthString.substring(5), true);
            return [eventDates.indexOf(dateString) != -1];
        },
        dateFormat: "yy-mm-dd",
        constrainInput: true
    });

    $.ajax({
        url: server + "departments",
        type: "GET",
        crossDomain: true,
        success: function(data) {
            $("#departments-next-event").append(departmentSelectForm(data.departments));
        }
    });

    $.ajax({
        url: server + "agenda-list",
        type: "GET",
        crossDomain: true,
        success: function(agendaList) {
            $.each(agendaList, function(i, agenda) {
                agendas.push({label: agenda.name, value: agenda.name, id: agenda._id});
            });
        }
    })

    $("#time-next-event").timepicker({
        stepMinute: 5
    });

});

function updateEventDates(year, month, fromDatepicker) {
    if (month < 10) month = "0" + parseInt(month, 10);
    var date = year + "-" + month;
    if (eventMonths.indexOf(date) != -1) return;

    $.ajax({
        url: server + "events/" + date,
        crossDomain: true,
        type: "GET",
        success: function(data) {
            eventMonths.push(date);
            $.each(data.dates, function(i, e) {
                eventDates.push(e);
            });
            if (fromDatepicker) $("#dateInput").datepicker("refresh");
            if (fromDatepicker) $("#date-next-event").datepicker("refresh");
        }
    });
}

function loadEvents() {
    var date = $("#dateInput").val();
    $.ajax({
        url: server + "events",
        crossDomain: true,
        type: "GET",
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
}

function loadNextEvents(){
    var date = $("#date-next-event").val();
    $("#name-next-event").replaceWith(
        "<select class='form-control' id='name-next-event'></select>");
    $("#name-next-event").change(updateNextEventDetails);

    $.ajax({
        url: server + "events",
        crossDomain: true,
        type: "GET",
        data: {"date": date},
        success: function(data) {
            nextEvents = data.events;
            $("#name-next-event").empty();
            $.each(data.events, function(i, e) {
                $("#name-next-event").append("<option class='events' value=" + i + ">[" + e.time + "] " + e.name + "</option><br />");
            });
            if ($("#existing-event:checked").length === 1) {
                var idx = $("#name-next-event option:selected")[0].value;
                updateNextEventDetails();
            }
        }
    });
}

function updateEvent() {
    var idx = $("#events option:selected")[0].value;
    currentEvent = events[idx];
    if ($("#existing-event:checked").length === 0) {
        applyDepartmentSelection(currentEvent.department);
    }

    $.ajax({
        url: server + "report/" + currentEvent._id,
        crossDomain: true,
        type: "GET",
        success: function(data) {
            report = data;
            updateReport();
        }
    });

    $("#participants-header").css("visibility", "visible");
    $(".container-prev-agendas").css("visibility", "visible");
    $(".container-agendas").css("visibility", "visible");
    $(".container-next-meeting").css("visibility", "visible");
}

function updateReport() {

    updatePeople();
    updatePrevAgendas();
    updateAgendas();
    updateNextEvent();
}

function updatePeople() {
    $("#participants").empty();
    $("#absentees").empty();
    $("#absentees-header").css("visibility","hidden");
    $.each(report.participants, function(i, p) {
        $("#participants").append(addName(p, true));
        $("#participants").append(" ");
    });
    if (report.absentees.length > 0)
        $("#absentees-header").css("visibility","visible");

    $.each(report.absentees, function(i, p) {
        $("#absentees").append(addName(p, false, p.reason));
        $("#absentees").append(" ");
    });
}

function updateAgendas() {
    $("#agendas").empty();
    $("#agenda-list").empty();

    $.each(report.agendas, function(i, agenda) {
        $("#agendas").append(agendaForm(agenda));
        $("#agenda-list").append("<li id=agenda-list-item-" + agenda._id + ">" + agenda.name + "</li>");
    });

    $("#agendas").append("<button class='btn btn-primary btn-submit' id='add-new-agenda'>Add Agenda</button>");
    $("#add-new-agenda").click(function () {
        $("#agendas").append(newAgendaForm());
        $("#add-new-agenda").remove();
    });
}

function updatePrevAgendas() {
    $("#prev-agendas").empty();
    $("#prev-agenda-list").empty();

    $.each(report.prevEvents, function(i, prevEvent) {
        var listID = "prev-agenda-" + prevEvent._id;
        $("#prev-agendas").append("<div id='" + listID + "'></div>");
        $("#prev-agendas #" + listID).append(
            "<h4>[" + prevEvent._id + "] " + prevEvent.name + "</h4>");
        $("#prev-agenda-list").append(
            "<h4>[" + prevEvent._id + "] " + prevEvent.name + "</h4>");
        $("#prev-agenda-list").append("<ul class='" + listID + "'></ul>");
        $.each(prevEvent.agendas, function(i, agenda) {
            $("#prev-agendas #" + listID).append(prevAgendaForm(agenda));
            $("#prev-agenda-list ." + listID).append("<li id=prev-agenda-list-item-" + agenda._id + ">" + agenda.name + "</li>");
        });
    });
}

function updateNextEvent() {
    if (!(eventID = currentEvent._id))
        return;
    if (report.nextEvent._id === "")
        return;

    $("#next-agendas").empty();

    $("#existing-event").prop("checked", true);
    var datetime = report.nextEvent.time;
    $("#date-next-event").val(
        datetime.substring(0,10));
    $("#time-next-event").val(
        datetime.substring(11,16));
    $("#time-next-event").prop("disabled", true);
    $("#name-next-event").replaceWith(
        "<input type='text' class='form-control' id='name-next-event' value='[" +
        datetime + "] " + report.nextEvent.name + "' />");
    $("#name-next-event").prop("disabled", true);
    applyDepartmentSelection(report.nextEvent.department);
    $("#departments-next-event input").prop("disabled", true);
    $.each(report.nextEvent.agendas, function(i, agenda) {
        $("#next-agendas").append(nextAgendaForm(agenda));
    });
}

function presentDelete() {
    var id = $(this).parent().attr('id').substring(2);
    id = Number(id);
    $(this).parent().remove();
    var idx = indexOf(report.participants, function (p) {
        return p._id === id;
    });
    if (idx < 0) return;
    var p = report.participants[idx];
    p.reason = "";
    report.absentees.push(p);
    $("#absentees-header").css("visibility","visible");
    $("#absentees").append(addName(p, false));
    $("#absentees").append(" ");
    report.participants.splice(idx, 1);
}


function absentDelete() {
    var id = $(this).parent().attr('id').substring(3);
    id = Number(id);
    $(this).parent().remove();
    var idx = indexOf(report.absentees, function (p) {
        return p._id === id;
    });
    report.dropouts.push(report.absentees[idx]);
    if (idx < 0) return;
    report.absentees.splice(idx, 1);
    if (report.absentees.length < 1) {
        $("#absentees-header").css("visibility","hidden");
    }
}

function absentRestore() {
    var id = $(this).parent().attr('id').substring(2);
    id = Number(id);
    $(this).parent().remove();
    var idx = indexOf(report.absentees, function (p) {
        return p._id === id;
    });
    if (idx < 0) return;
    var p = report.absentees[idx];
    report.participants.push(p);
    $("#participants").append(addName(p, true));
    $("#participants").append(" ");
    report.absentees.splice(idx, 1);
    if (report.absentees.length < 1) {
        $("#absentees-header").css("visibility","hidden");
    }
}

function indexOf(arr, f) {
    for (var i = 0; i < arr.length; i++) {
        if (f(arr[i])) return i;
    }
    return -1;
}

function addName(person, isPresent, reason) {
    var $nameTag = $("<span class='label person'></span>");
    $nameTag.attr("id", "P-" + person._id);
    $nameTag.append(person.name);
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

        if (reason === undefined || reason === "") reason = "사유";
        var $absentReason = $("<span class='badge reason'>" + reason + "</span>");
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
        confirmReason($(this));
    });
    $(".reason-text").keydown(function (event) {
        if (event.which === 13) comfirmReason($(this));
    });
    $(".reason-text").focus();
}

function confirmReason($element) {
    var reason = $element.val();
    var id = $element.parent().attr('id').substring(2);
    id = Number(id);
    $.each(report.absentees, function (i, p) {
        if (p._id === id) {
            report.absentees[i].reason = reason
        }
    });

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
    $input.find("input").autocomplete({
        source: agendas,
        select: function(event, ui) {
            $("#new-agenda-name").val(ui.item.label);
            selectedAgenda = ui.item;
        }
    });
    var $btn = $("<button class='btn btn-default' type='submit' id='add-agenda'>Add</button>");
    $input.append(" ");
    $input.append($btn);
    $agendaForm.append($input);
    $agendaForm.submit( function(event) {
        event.preventDefault();

        if (selectedAgenda && $("#new-agenda-name").val() === selectedAgenda.value) {
            var i = 0;
            for (i = 0; i < report.agendas.length; i++) {
                if (report.agendas[i]._id === selectedAgenda.id) {
                    alert("Agenda already exists.");
                    break;
                }
            }
            if (i === report.agendas.length)
                registerExistingAgenda(selectedAgenda.id, currentEvent._id);
        }
        else
            registerAgenda($("#new-agenda-name").val(), currentEvent._id);
    });

    return $agendaForm;
}

//Register new agenda and update layout
function registerAgenda(name, eventID) {
    $.ajax({
        url: server + "agenda",
        crossDomain: true,
        type: "POST",
        data: {
            name: name,
            eventID: eventID
        },
        success: function (result) {
            $("#form-new-agenda").remove();
            $("#agendas").append(agendaForm(result));
            $("#agenda-list").append("<li id=agenda-list-item-" + result._id + ">" + result.name + "</li>");
            report.agendas.push(result);
            var $btn = $("<button class='btn btn-primary btn-submit' id='add-new-agenda'>Add Agenda</button>");
            $btn.click(function () {
                $("#agendas").append(newAgendaForm());

                $("#add-new-agenda").remove();
            });
            $("#agendas").append($btn);
        }
    });
}




function registerExistingAgenda(agendaID, eventID) {
    $.ajax({
        url: server + "agenda/" + agendaID,
        crossDomain: true,
        type: "PUT",
        data: {
            eventID: eventID
        },
        success: function (result) {
            $("#form-new-agenda").remove();
            $("#agendas").append(agendaForm(result));
            $("#agenda-list").append("<li id=agenda-list-item-" + result._id + ">" + result.name + "</li>");
            report.agendas.push(result);
            var $btn = $("<button class='btn btn-primary btn-submit' id='add-new-agenda'>Add Agenda</button>");
            $btn.click(function () {
                $("#agendas").append(newAgendaForm());
                $("#add-new-agenda").remove();
            });
            $("#agendas").append($btn);
        }
    });
}

function removeAgenda(agendaID, eventID) {
    $.ajax({
        url: server + "agenda/" + agendaID,
        crossDomain: true,
        type: "DELETE",
        data: {
            eventID: eventID
        },
        success: function (data) {
            var formID = "#agenda-" + agendaID;
            var listID = "#agenda-list-item-" + agendaID;
            $.each(report.agendas, function(i, agenda) {
                if (agenda._id === agendaID) {
                    report.agendas.splice(i);
                    return false;
                }
            });
            $(formID).remove();
            $(listID).remove();
        }
    });
}

//Create agenda form
function agendaForm(agenda) {
    var $agendaForm = $("<form id='agenda-" + agenda._id + "'></form>");
    $agendaForm.append("<div class='form-group'><label>&lt;Agenda " + agenda._id + "&gt; " + agenda.name + "</label></div>");
    var $deleteBtn = $("<button class='btn btn-danger remove-agenda'>Delete</button>");
    $deleteBtn.click( function(event) {
        event.preventDefault();
        removeAgenda(agenda._id, currentEvent._id);
    });
    $(".form-group", $agendaForm).append($deleteBtn);
    var $description = $("<div class='form-group'><label>Description</label><textarea class='form-control' rows='5'></textarea></div>");
    $($description).find("textarea").val(agenda.description);
    $($description).find("textarea").change( function() {
        var agendaID = agenda._id;
        var text = $(this).val();
        $.each(report.agendas, function(i, agenda) {
            if (agenda._id === agendaID) {
                report.agendas[i].description = text;
            }
        });
    });
    $agendaForm.append($description);
    return $agendaForm;
}

//Create agenda form
function prevAgendaForm(agenda) {
    var $agendaForm = $("<form id='prev-agenda-" + agenda._id + "'></form>");
    $agendaForm.append("<div class='form-group'><label>&lt;Agenda " + agenda._id + "&gt; " + agenda.name + "</label></div>");
    var $description = $("<div class='form-group'><label>Description</label><textarea class='form-control' rows='5'></textarea></div>");
    $($description).find("textarea").val(agenda.description);
    $($description).find("textarea").change( function() {
        var eventID = $(this).parent().parent().parent().attr('id').substring(12);
        var agendaID = agenda._id;
        var text = $(this).val();
        $.each(report.prevEvents, function(i, prevEvent) {
            if (prevEvent._id === eventID) {
                $.each(report.prevEvents[i].agendas, function(j, agenda) {
                    if (agenda._id === agendaID) {
                        report.prevEvents[i].agendas[j].description = text;
                    }
                });
            }
        });
    });
    $agendaForm.append($description);
    return $agendaForm;
}

function departmentSelectForm(depts) {
    var $departments = $("<div></div>");
    $.each(depts, function(i,e) {
        $departments.append("<label class='checkbox-inline'>" +
            "<input type='checkbox' value='" + e._id + "'>" +
            e.name + "</label>");
    });
    return $departments;
}

function applyDepartmentSelection(depts) {
    var depts = depts;
    $("#departments-next-event input").each( function(i, e) {
        if (depts.indexOf(parseInt(e.value)) === -1)
            e.checked = false;
        else
            e.checked = true;
    });
}

$("#existing-event").change( function () {
    if ($("#existing-event:checked").length === 1) {
        $("#date-next-event").val("");
        $("#time-next-event").val("");
        $("#time-next-event").prop("disabled", true);
        $("#name-next-event").replaceWith("<select class='form-control' id='name-next-event'></select>");
        $("#departments-next-event input").prop("disabled", true);
    } else {
        $("#time-next-event").prop("disabled", false);
        $("#name-next-event").replaceWith("<input class='form-control' type='text' id='name-next-event' />");
        $("#departments-next-event input").prop("disabled", false);

        var idx = $("#events option:selected")[0].value;
        applyDepartmentSelection(currentEvent.department);
    }
    $("#name-next-event").change(updateNextEventDetails);
});

function updateNextEventDetails() {
    if ($("#existing-event:checked").length === 1) {
        var idx = $("#name-next-event option:selected")[0].value;
        $("#time-next-event").val(nextEvents[idx].time.substring(11,16));
        applyDepartmentSelection(nextEvents[idx].department);
    }
}

$("#add-new-next-agenda").click( function () {
    $("#next-agendas").append(newNextAgendaForm());
    $("#add-new-next-agenda").remove();
});


//Create new agenda register form
function newNextAgendaForm() {
    var $agendaForm = $("<form id='form-new-next-agenda' class='form-inline'></form>");
    var $input = $("<div class='form-group'></div>");
    $input.append("<input type='text' id='new-next-agenda-name'></input>");
    $input.find("input").autocomplete({
        source: agendas,
        select: function(event, ui) {
            $("new-next-agenda-name").val(ui.item.label);
            selectedNextAgenda = ui.item;
        }
    });
    $("#new-next-agenda-name").autocomplete({
        source: agendas,
        select: function(event, ui) {
            $("new-next-agenda-name").val(ui.item.label);
            selectedNextAgenda = ui.item;
        }
    });
    var $btn = $("<button class='btn btn-default' type='submit' id='add-next-agenda'>Add</button>");
    $input.append(" ");
    $input.append($btn);
    $agendaForm.append($input);
    $agendaForm.submit( function(event) {
        event.preventDefault();
        if (selectedNextAgenda && $("#new-next-agenda-name").val() === selectedNextAgenda.value) {
            var i = 0;
            for (i = 0; i < report.nextEvent.agendas.length; i++) {
                if (report.nextEvent.agendas[i]._id === selectedNextAgenda.id) {
                    alert("Agenda already exists.");
                    break;
                }
            }
            if (i === report.nextEvent.agendas.length)
                registerNextExistingAgenda(selectedNextAgenda.id, currentEvent._id);
        }
        else
            registerNextAgenda($("#new-next-agenda-name").val(), currentEvent._id);
    });
    return $agendaForm;
}


//Register new agenda and update layout
function registerNextAgenda(name, eventID) {
    $.ajax({
        url: server + "next-agenda",
        crossDomain: true,
        type: "POST",
        data: {
            name: name,
            eventID: eventID
        },
        success: function (result) {
            $("#form-new-next-agenda").remove();
            $("#next-agendas").append(nextAgendaForm(result));
            report.nextEvent.agendas.push(result);
            var $btn = $("<button class='btn btn-primary btn-submit' id='add-new-next-agenda'>Add Agenda</button>");
            $btn.click(function () {
                $("#add-new-next-agenda").remove();
                $("#next-agendas").append(newNextAgendaForm());
            });
            $("#next-agendas").append($btn);
        }
    });
}

function registerNextExistingAgenda(agendaID, eventID) {
    $.ajax({
        url: server + "next-agenda/" + agendaID,
        crossDomain: true,
        type: "PUT",
        data: {
            eventID: eventID
        },
        success: function (result) {
            $("#form-new-next-agenda").remove();
            $("#next-agendas").append(nextAgendaForm(result));
            $("#next-agenda-list").append("<li id=next-agenda-list-item-" + result._id + ">" + result.name + "</li>");
            report.nextEvent.agendas.push(result);
            var $btn = $("<button class='btn btn-primary btn-submit' id='add-new-next-agenda'>Add Agenda</button>");
            $btn.click(function () {
                $("#next-agendas").append(newNextAgendaForm());
                $("#add-new-next-agenda").remove();
            });
            $("#next-agendas").append($btn);
        }
    });
}

function removeNextAgenda(agendaID, eventID) {
    $.ajax({
        url: server + "next-agenda/" + agendaID,
        crossDomain: true,
        type: "DELETE",
        data: {
            eventID: eventID
        },
        success: function (data) {
            var formID = "#next-agenda-" + agendaID;
            console.log(formID);
            $.each(report.nextEvent.agendas, function(i, agenda) {
                if (agenda._id === agendaID) {
                    report.nextEvent.agendas.splice(i);
                    return false;
                }
            });
            $(formID).remove();

        }
    });
}

//Create agenda form
function nextAgendaForm(agenda) {
    var $agendaForm = $("<form id='next-agenda-" + agenda._id + "'></form>");
    $agendaForm.append("<div class='form-group'><label>&lt;Agenda " + agenda._id + "&gt; " + agenda.name + "</label></div>");
    var $deleteBtn = $("<button class='btn btn-danger remove-agenda'>Delete</button>");
    $deleteBtn.click( function(event) {
        event.preventDefault();
        agendaID = $(this).parent().parent().attr('id').substring(12);
        removeNextAgenda(agendaID, currentEvent._id);
    });
    $(".form-group", $agendaForm).append($deleteBtn);
    return $agendaForm;
}


function uploadNextEvent() {
    if ($("#existing-event:checked").length === 1) {
        var idx = $("#name-next-event option:selected")[0].value || $("#name-next-event").val();
        putNextEvent(nextEvents[idx]._id);
    } else {
        registerEvent();
    }

    function putNextEvent(nextEventID) {
        $.ajax({
            url: server + "event/" + currentEvent._id,
            crossDomain: true,
            type: "PUT",
            data: {
                nextEventID: nextEventID
            },
            success: function (data) {
                alert(JSON.stringify(data));
            }
        });
        updateReportNextEvent(nextEventID);
    }

    function registerEvent() {
        var date = $("#date-next-event").val();
        var time = $("#time-next-event").val();
        var name = $("#name-next-event").val();
        var depts = "";
        $("#departments-next-event input:checked").each(function() {
            depts = depts + "," + $(this).val();
        });
        if (depts.length > 0) depts = depts.substring(1);

        if (date.length === 0 || name.length === 0 || depts.length === 0) {
            alert("Fill out all the forms");
            return;
        }
        $.ajax({
            url: server + "event",
            type: "POST",
            crossDomain: true,
            data: {"date": date, "time": time, "name": name, "departments": depts},
            success: function(data) {
                updateReportNextEvent(data._id);
            }
        });
    }

    function updateReportNextEvent(eventID) {
        $("#existing-event").prop("checked", true);
        $("#time-next-event").prop("disabled", true);
        $("#name-next-event").prop("disabled", true);
        $("#departments-next-event input").prop("disabled", true);
        $.ajax({
            url: server + "event/" + eventID,
            type: "GET",
            crossDomain: true,
            success: function(nextEvent) {
                var agendas = report.nextEvent.agendas;
                report.nextEvent = nextEvent;
                report.nextEvent.agendas = agendas;
                $("#name-next-event").replaceWith(
                    "<input type='text' class='form-control' id='name-next-event' value='[" +
                    report.nextEvent.time + "] " + report.nextEvent.name + "' />");
            }
        });
    }
}

$("#remove-next-event").click(function() {
    $.ajax({
        url: server + "event/" + currentEvent._id,
        crossDomain: true,
        type: "PUT",
        data: {
            nextEventID: ""
        },
        success: function (data) {
            $("#date-next-event").val("");
            $("#name-next-event").val("");
            $("#time-next-event").val("");
            $("#time-next-event").prop("disabled", false);
            $("#name-next-event").replaceWith("<input class='form-control' type='text' id='name-next-event' />");
            $("#departments-next-event input").prop("disabled", false);
            applyDepartmentSelection(currentEvent.department);
            alert(JSON.stringify(data));
        }
    });
});

$("#save-report").click(function() {
    $.ajax({
            url: server + "report/" + currentEvent._id,
            type: "PUT",
            crossDomain: true,
            data: {"report": JSON.stringify(report)},
            success: function(data) {
                alert("Saved");
            }
        });
});