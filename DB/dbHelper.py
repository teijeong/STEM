from pymongo import MongoClient
import datetime
import pymongo


mongoURI ='mongodb://heroku_app32258670:5hcl5oso685va7pcpo8e9ku1f5@ds061360.mongolab.com:61360/heroku_app32258670'
db = MongoClient(mongoURI).heroku_app32258670


def insertEvent(time, name, department):
    if not (type(department) is list):
        department = [department]
    start = time.replace(hour=0,minute=0,second=0,microsecond=0)
    end = time + datetime.timedelta(days = 1)
    cur = db.events.find({'time':{'$gte':start, '$lt':end}}).sort('_id',pymongo.DESCENDING).limit(1)
    eventID = 0
    if cur.count() > 0:
        eventID = (int(cur[0]['_id'].split('_')[1]) + 1)
    eventID = datetime.datetime.strftime(time, '%Y%m%d') + '_' + str(eventID)
    event = {'_id': eventID, 'time':time.replace(microsecond=0), 
        'name': name, 'department': department}
    return db.events.insert(event)

def insertPerson(name, department):
    if not (type(department) is list):
        department = [department]
    cur = db.people.find().sort('_id',pymongo.DESCENDING).limit(1)
    personID = cur[0]['_id'] + 1
    person = {'_id': personID, 'name': name, 'department': department}
    return db.people.insert(person)

def insertDepartment(name):
    cur = db.departments.find().sort('_id',pymongo.DESCENDING).limit(1)
    departmentID = cur[0]['_id'] + 1
    department = {'_id': departmentID, 'name': name}
    return db.departments.insert(department)

