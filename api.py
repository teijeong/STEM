#-*-coding: utf-8-*-
import flask
import datetime
import json

from flask import Flask, Response
from flask import request
from pymongo import MongoClient
from bson import json_util

db = MongoClient().stem
app = Flask(__name__)

@app.route('/events', methods=['GET', 'POST'])
def getEvents():
    try:
        if request.method == 'POST':
            date = reques.form['date']
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
def getPeople():
    try:
        if request.method == 'POST':
            depts = reques.form['departments']
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

if __name__ == '__main__':
    app.debug=True
    app.run()
