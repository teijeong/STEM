#-*-coding: utf-8-*-
import flask
import datetime
import json
import re

from flask import Flask, Response
from flask import request
from flask.ext import restful
from flask.ext.restful import Resource, reqparse, fields, marshal_with
from flask.ext.cors import CORS
from pymongo import MongoClient
from bson import json_util

from DB import dbHelper

mongoURI = ('mongodb://heroku_app32258670:'
    '5hcl5oso685va7pcpo8e9ku1f5@ds061360'
    '.mongolab.com:61360/heroku_app32258670')
db = MongoClient(mongoURI).heroku_app32258670
app = Flask(__name__)
api = restful.Api(app)
CORS(app, allow_headers='Content-Type',
    methods=['GET', 'HEAD', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'])


event_fields = {
    '_id': fields.String,
    'department': fields.List(fields.Integer),
    'name': fields.String,
    'time': fields.String
}
events_fields = {
    'events': fields.List(fields.Nested(event_fields))
}

class Events(Resource):

    dateParser = reqparse.RequestParser()
    dateParser.add_argument('date', type=unicode, required=True,
        help='Date (yyyy-mm-dd) is required')

    @marshal_with(events_fields)
    def get(self):
        args = self.dateParser.parse_args()
        return {'events': dbHelper.getEvents(args['date'])}

class Event(Resource):

    eventParser = reqparse.RequestParser()
    eventParser.add_argument('date', type=unicode, required=True,
        help='Date is required')
    eventParser.add_argument('time', type=unicode, required=True,
        help='Time is required')
    eventParser.add_argument('name', type=unicode, required=True,
        help='Event name is required')
    eventParser.add_argument('departments', type=unicode, required=True,
        help='Departments are required')

    def post(self):
        args = self.eventParser.parse_args()
        eventTime = datetime.datetime.strptime(args['date'] +
            ' ' + args['time'], '%Y-%m-%d %H:%M')
        departments = [int(n) for n in args['departments'].split(',')]

        return {'_id': dbHelper.insertEvent(
            eventTime, args['name'], departments)}, 201

class EventDates(Resource):

    def get(self, date):
        if re.match('^[0-9]{4}-[01]?[0-9]$', date) is None:
            return {'error': 'invalid date'}
        date = date.split('-')
        year = int(date[0])
        month = int(date[1])
        if not 1 <= month <= 12:
            return {'error': 'invalid date'}
        return {'dates': dbHelper.getEventDates(year, month)}

depatment_fields = {
    '_id': fields.Integer,
    'name': fields.String
}
departments_fields = {
    'departments': fields.List(fields.Nested(depatment_fields))
}

class Departments(Resource):

    @marshal_with(departments_fields)
    def get(self):
        return {'departments': dbHelper.getDepartments()}

class Department(Resource):
    deptParser = reqparse.RequestParser()
    deptParser.add_argument('name', type=unicode, required=True,
        help='Name is required')

    def post(self):
        args = self.deptParser.parse_args()
        return {'_id': dbHelper.insertDepartment(args['name'])}, 201

person_fields = {
    '_id': fields.Integer,
    'name': fields.String,
    'departments': fields.List(fields.Integer)
}
people_fields = {
    'people': fields.List(fields.Nested(person_fields))
}

class People(Resource):
    deptParser = reqparse.RequestParser()
    deptParser.add_argument('departments', type=unicode, required=True,
        help='Departments are required')

    @marshal_with(people_fields)
    def get(self):
        args = self.deptParser.parse_args()
        departments = [int(n) for n in args['departments'].split(',')]

        return {'people': dbHelper.getPeople(departments)}

class Person(Resource):
    personParser = reqparse.RequestParser()
    personParser.add_argument('name', type=unicode, required=True,
        help='Name is required')
    personParser.add_argument('departments', type=unicode, required=True,
        help='Departments are required')

    def post(self):
        args = self.personParser.parse_args()
        departments = [int(n) for n in args['departments'].split(',')]

        return {'_id': dbHelper.insertPerson(args['name'], departments)}, 201

agenda_fields = {
    '_id': fields.Integer,
    'name': fields.String,
    'description': fields.String
}
agendas_fields = {
    'agendas': fields.List(fields.Nested(agenda_fields))
}

class Agendas(Resource):
    idParser = reqparse.RequestParser()
    idParser.add_argument('eventID', type=unicode, required=True,
        help='EventID is required')

    @marshal_with(agendas_fields)
    def get(self):
        args = self.idParser.parse_args()
        return {'agendas': dbHelper.getAgendas(args['eventID'])}

class Agenda(Resource):
    idParser = reqparse.RequestParser()
    idParser.add_argument('eventID', type=unicode, required=True,
        help='EventID is required')
    agendaParser = reqparse.RequestParser()
    agendaParser.add_argument('eventID', type=unicode, required=True,
        help='EventID is required')
    agendaParser.add_argument('name', type=unicode, required=True,
        help='Name is required')

    @marshal_with(agenda_fields)
    def post(self):
        args = self.agendaParser.parse_args()

        return dbHelper.insertAgenda(args['name'], args['eventID'])

    def delete(self, agendaID):
        args = self.idParser.parse_args()

        return {'result': str(dbHelper.deleteAgenda(agendaID, args['eventID']))}

@app.errorhandler(404)
def not_found(error=None):
    message = {
            'status': 404,
            'message': 'Not Found: ' + request.url,
    }
    resp = Response(
        response=json.dumps(message,
            separators=(',', ':'),
            default=json_util.default),
        status=200,
        mimetype='application/json')
    resp.status_code = 404

    return resp

api.add_resource(Events, '/events')
api.add_resource(Event, '/event')
api.add_resource(EventDates, '/events/<string:date>')
api.add_resource(Departments, '/departments')
api.add_resource(Department, '/department')
api.add_resource(People, '/people')
api.add_resource(Person, '/person')
api.add_resource(Agendas, '/agendas')
api.add_resource(Agenda, '/agenda', '/agenda/<int:agendaID>')

if __name__ == '__main__':
    app.debug = True
    app.run()
