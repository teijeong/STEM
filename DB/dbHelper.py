from pymongo import MongoClient
import datetime
import pymongo


mongoURI = 'mongodb://heroku_app32258670:5hcl5oso685va7pcpo8e9ku1f5@ds061360.mongolab.com:61360/heroku_app32258670'
db = MongoClient(mongoURI).heroku_app32258670

def getEvents(date):
    data = []
    start = datetime.datetime.strptime(date, '%Y-%m-%d')
    end = start + datetime.timedelta(days=1)
    cur = db.events.find({'time':{'$gte':start, '$lt':end}})
    for event in cur:
        event['time'] = str(event['time'])
        data.append(event)
    return data

def getEventDates(year, month):
    data = set()
    start = datetime.datetime(year, month, 1)
    end = (start + datetime.timedelta(days=31)).replace(day=1)
    cur = db.events.find({'time':{'$gte':start, '$lt':end}})
    for event in cur:
        data.add(event['time'].strftime('%Y-%m-%d'))
    return list(data)

def getDepartments(deptID=None):
    data = []
    if deptID:
        cur = db.departments.find({'_id': deptID})
    else:
        cur = db.departments.find()
    for dept in cur:
        data.append(dept)
    return data

def getPeople(departments):
    data = []
    cur = db.people.find({'department':{'$in':departments}})
    for person in cur:
        data.append(person)
    return data

def getAgendas(eventID):
    data = []
    event = getEvent(eventID)
    if event is None:
        return data
    try:
        cur = db.agendas.find({'_id':{'$in':event['agendas']}})
        for agenda in cur:
            data.append(agenda)
    except KeyError:
        pass
    return data

def getEvent(eventID):
    cur = db.events.find({'_id': eventID})
    if cur.count() > 0:
        return cur[0]
    return None

def insertEvent(time, name, department):
    if not type(department) is list:
        department = [department]
    start = time.replace(hour=0, minute=0, second=0, microsecond=0)
    end = time + datetime.timedelta(days=1)
    cur = db.events.find({'time':{'$gte':start, '$lt':end}}).sort(
        '_id', pymongo.DESCENDING).limit(1)
    eventID = 0
    if cur.count() > 0:
        eventID = (int(cur[0]['_id'].split('_')[1]) + 1)
    eventID = datetime.datetime.strftime(time, '%Y%m%d') + '_' + str(eventID)
    event = {'_id': eventID, 'time':time.replace(microsecond=0),
        'name': name, 'department': department}
    return db.events.insert(event)

def insertPerson(name, department):
    if not type(department) is list:
        department = [department]
    cur = db.people.find().sort('_id', pymongo.DESCENDING).limit(1)
    personID = cur[0]['_id'] + 1
    person = {'_id': personID, 'name': name, 'department': department}
    return db.people.insert(person)

def insertDepartment(name):
    cur = db.departments.find().sort('_id', pymongo.DESCENDING).limit(1)
    if cur.count() > 0:
        departmentID = cur[0]['_id'] + 1
    else:
        departmentID = 0
    department = {'_id': departmentID, 'name': name}
    return db.departments.insert(department)

def insertAgenda(name, eventID):
    cur = db.agendas.find().sort('_id', pymongo.DESCENDING).limit(1)
    if cur.count() > 0:
        agendaID = cur[0]['_id'] + 1
    else:
        agendaID = 0
    agenda = {'_id': agendaID, 'name': name, 'description': ''}
    db.agendas.insert(agenda)

    cur = db.events.update({'_id': eventID}, 
        {'$addToSet': {'agendas': agendaID}})
    return agenda

def deleteAgenda(agendaID, eventID):
    return db.events.update({'_id': eventID}, {'$pull': {'agendas': agendaID}})

