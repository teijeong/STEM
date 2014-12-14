#-*-coding: utf-8-*-
import flask
import datetime
import json

from flask import Flask, Response
from flask import request
from pymongo import MongoClient
from bson import json_util

from helper import crossdomain, jsonp

from DB import dbHelper

mongoURI ='mongodb://heroku_app32258670:5hcl5oso685va7pcpo8e9ku1f5@ds061360.mongolab.com:61360/heroku_app32258670'
db = MongoClient(mongoURI).heroku_app32258670
app = Flask(__name__)

@app.route('/events', methods=['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def getEvents():
    try:
        if request.method == 'POST':
            date = request.form['date']
        elif request.method == 'GET':
            date = request.args.get('date','')
    except KeyError:
        pass
    data = []
    if date:
        start = datetime.datetime.strptime(date, '%Y-%m-%d')
        end = start + datetime.timedelta(days=1)
        cur = db.events.find({'time':{'$gte':start, '$lt':end}})
        for event in cur:
            event['time'] = str(event['time'])
            data.append(event)
        data = {'events':data}
    else:
        data = {'msg': 'date is not given'}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    return resp

@app.route('/people', methods = ['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def getPeople():
    try:
        if request.method == 'POST':
            depts = request.form['departments']
        elif request.method == 'GET':
            depts = request.args.get('departments','')
    except KeyError:
        pass
    data = []
    if depts:
        depts = [int(n) for n in depts.split(',')]
        cur = db.people.find({'department':{'$in':depts}})
        for person in cur:
            data.append(person)
        data = {'people': data}
    else:
        data = {'msg': 'departments are not given'}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    return resp

@app.route('/departments', methods = ['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def getDepartments():
    data = []
    cur = db.departments.find()
    for department in cur:
        data.append(department)
    data = {'departments': data}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')  
    return resp

@app.route('/agendas', methods = ['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def getAgendas():
    data = []
    try:
        if request.method == 'POST':
            eventID = request.form['eventID']
        elif request.method == 'GET':
            eventID = request.args.get('eventID','')
    except KeyError:
        pass
    cur = db.events.find({'_id': eventID})
    if cur.count() <= 0:
        data = {'msg': 'No event found'}
        resp = Response(
            response = json.dumps(data, 
                separators = (',',':'),
                default=json_util.default), 
            status = 200, 
            mimetype = 'application/json')
        return resp
    
    try:
        agendas = cur[0]['agendas']
    except KeyError:
        agendas = []
    cur = db.agendas.find({'_id': {'$in':agendas}})
    for agenda in cur:
        data.append(agenda)
    data = {'agendas': data}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')  
    return resp

@app.route('/insert-event', methods=['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def insertEvent():
    try:
        if request.method == 'POST':
            date = request.form['date']
            time = request.form['time']
            name = request.form['name']
            departments = request.form['departments']
        elif request.method == 'GET':
            date = request.args.get('date','')
            time = request.args.get('time','')
            name = request.args.get('name','')
            departments = request.args.get('departments','')
    except KeyError:
        data = {'msg': 'FAIL'}
        resp = Response(
            response = json.dumps(data, 
                separators = (',',':'),
                default=json_util.default), 
            status = 200, 
            mimetype = 'application/json')
        return resp
    eventTime = datetime.datetime.strptime(date + ' ' + time, '%Y-%m-%d %H:%M')
    departments = [int(n) for n in departments.split(',')]
    result = dbHelper.insertEvent(eventTime, name, departments);
    data = {'msg': 'SUCCESS', 'result': result}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    return resp

@app.route('/insert-person', methods = ['GET', 'POST', 'PUT'])
@crossdomain(origin='*')
@jsonp
def insertPerson():
    try:
        if request.method == 'POST':
            name = request.form['name']
            departments = request.form['departments']
        elif request.method == 'GET':
            name = request.args.get('name','')
            departments = request.args.get('departments','')
    except KeyError:
        data = {'msg': 'FAIL'}
    departments = [int(n) for n in departments.split(',')]
    result = dbHelper.insertPerson(name, departments)
    data = {'msg': 'SUCCESS', 'result': result}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    return resp


@app.route('/insert-department', methods = ['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def insertDepartment():
    try:
        if request.method == 'POST':
            name = request.form['name']
        elif request.method == 'GET':
            name = request.args.get('name','')
    except KeyError:
        data = {'msg': 'FAIL'}
    result = dbHelper.insertDepartment(name)
    data = {'msg': 'SUCCESS', 'result': result}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    return resp

@app.route('/insert-agenda', methods = ['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def insertAgenda():
    try:
        if request.method == 'POST':
            name = request.form['name']
            eventID = request.form['eventID']
        elif request.method == 'GET':
            name = request.args.get('name','')
            eventID = request.args.get('eventID','')
    except KeyError:
        data = {'msg': 'FAIL'}
    result = dbHelper.insertAgenda(name, eventID)
    data = {'msg': 'SUCCESS', 'result': result}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    return resp

@app.route('/delete-agenda', methods = ['GET', 'POST'])
@crossdomain(origin='*')
@jsonp
def deleteAgenda():
    try:
        if request.method == 'POST':
            agendaID = request.form['agendaID']
            eventID = request.form['eventID']
        elif request.method == 'GET':
            agendaID = request.args.get('agendaID','')
            eventID = request.args.get('eventID','')
    except KeyError:
        data = {'msg': 'FAIL'}
    agendaID = int(agendaID)
    result = dbHelper.deleteAgenda(agendaID, eventID)
    data = {'msg': 'SUCCESS', 'result': result}
    resp = Response(
        response = json.dumps(data, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    return resp

@app.errorhandler(404)
def not_found(error=None):
    message = {
            'status': 404,
            'message': 'Not Found: ' + request.url,
    }
    resp = Response(
        response = json.dumps(message, 
            separators = (',',':'),
            default=json_util.default), 
        status = 200, 
        mimetype = 'application/json')
    resp.status_code = 404

    return resp

if __name__ == '__main__':
    app.debug=True
    app.run()
