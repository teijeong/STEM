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

def getNextAgendas(eventID):
    data = []
    event = getEvent(eventID)
    if event is None:
        return data
    try:
        cur = db.agendas.find({'_id':{'$in':event['nextAgendas']}})
        for agenda in cur:
            data.append(agenda)
    except KeyError:
        pass
    return event, data

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

def updateNextEvent(eventID, nextEventID):
    cur = db.events.find({'_id':eventID})
    cur2 = db.events.find({'_id':nextEventID})

    if cur.count() == 0 or cur2.count == 0:
        return None
    try:
        cur = db.events.update({'_id':cur[0]['nextEvent']}, {'$pull': {'prevEvents': eventID}})
    except KeyError:
        pass
    cur = db.events.update({'_id': eventID}, {'$set': {'nextEvent': nextEventID}})
    cur = db.events.update({'_id': nextEventID},
        {'$addToSet': {'prevEvents': eventID}})
    return eventID

def insertPerson(name, department):
    if not type(department) is list:
        department = [department]
    cur = db.people.find().sort('_id', pymongo.DESCENDING).limit(1)
    personID = 0
    if cur.count() > 0:
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
    agenda = {'_id': agendaID, 'name': name}
    db.agendas.insert(agenda)

    cur = db.events.update({'_id': eventID},
        {'$addToSet': {'agendas': agendaID}})
    return agenda

def deleteAgenda(agendaID, eventID):
    return db.events.update({'_id': eventID}, {'$pull': {'agendas': agendaID}})

def insertNextAgenda(name, eventID):
    cur = db.agendas.find().sort('_id', pymongo.DESCENDING).limit(1)
    if cur.count() > 0:
        agendaID = cur[0]['_id'] + 1
    else:
        agendaID = 0
    agenda = {'_id': agendaID, 'name': name}
    db.agendas.insert(agenda)

    cur = db.events.update({'_id': eventID},
        {'$addToSet': {'nextAgendas': agendaID}})
    return agenda

def deleteNextAgenda(agendaID, eventID):
    return db.events.update({'_id': eventID}, {'$pull': {'nextAgendas': agendaID}})

def createReport(eventID):
    cur = db.reports.find({'_id': eventID})
    if cur.count() != 0:
        return generateReport(eventID)

    cur = db.events.find({'_id': eventID})
    if cur.count() == 0:
        return None

    report = cur[0]
    report['time'] = str(report['time'])
    report['participants'] = []
    for person in getPeople(report['department']):
        report['participants'].append({'_id': person['_id'], 'name': person['name']})
    report['absentees'] = []
    report['dropouts']=[]

    prevEvents = []
    try:
        for prevEventID in report['prevEvents']:
            prevEvent = getEvent(prevEventID)
            prevEvent = {'_id': prevEventID, 'name': prevEvent['name'], 'agendas': []}
            _, agendas = getNextAgendas(prevEventID)
            for agenda in agendas:
                agenda['description'] = ''
                prevEvent['agendas'].append(agenda)
            prevEvents.append(prevEvent)
    except KeyError:
        pass
    report['prevEvents'] = prevEvents

    report['agendas'] = []
    for agenda in getAgendas(eventID):
        agenda['description'] = ''
        report['agendas'].append(agenda)

    try:
        nextEvent = getEvent(report['nextEvent'])
        nextEvent['time'] = str(nextEvent['time'])
        report['nextEvent'] = {'_id': report['nextEvent'], 'agendas': [],
            'name': nextEvent['name'], 'time': nextEvent['time'],
            'department': nextEvent['department']}
        _, agendas = getNextAgendas(eventID)
        for agenda in agendas:
            agenda['description'] = ''
            report['nextEvent']['agendas'].append(agenda)
    except KeyError:
        report['nextEvent'] = ''

    db.reports.insert(report)
    return report

def updateReportParticipants(reportID, restoreDropouts = False):
    cur = db.reports.find({'_id': reportID})
    if cur.count() == 0:
        if not createReport(reportID):
            return None
        cur = db.reports.find({'_id': reportID})
    report = cur[0]

    report['participants'] = []
    absentees = report['absentees']
    report['absentees'] = []
    if restoreDropouts:
        report['dropouts'] = []

    for person in getPeople(report['department']):
        for p in absentees:
            if person['_id'] == p['_id']:
                report['absentees'].append(p)
                continue
        for p in report['dropouts']:
            if person['_id'] == p['_id']:
                continue
        report['participants'].append({'_id': person['_id'], 'name': person['name']})

    db.reports.update({'_id': reportID}, report)
    return report

def updateReportAgenda(reportID, agendaID, description):
    return db.reports.update(
        {'_id': reportID, 'agendas._id': agendaID},
        {'$set': {'agendas.$.description': description}})

def updateReportPrevAgenda(reportID, prevEventID, agendaID, description):
    cur = db.reports.find({'_id': reportID})
    if cur.count() == 0:
        return None

    report = cur[0]
    idx = 0
    for prevEvent in report['prevEvents']:
        if prevEvent['_id'] == prevEventID:
            break
        idx += 1

    if idx >= len(report['prevEvents']):
        return None

    idx2 = 0
    for agenda in report['prevEvents'][idx]['agendas']:
        if agenda['_id'] == agendaID:
            break
        idx2 += 1

    agenda = 'prevEvents.' + str(idx) + '.agendas.' + str(idx2) + '.description'

    return db.reports.update(
        {'_id': reportID},
        {'$set': {agenda: description}})

def updateReportNextAgenda(reportID, agendaID, description):
    return db.reports.update(
        {'_id': reportID, 'nextEvent.agendas._id': agendaID},
        {'$set': {'nextEvent.agendas.$.description': description}})

def updateReport(reportID, report):
    cur = db.reports.find({'_id': reportID})
    if cur.count() == 0:
        createReport(reportID)
    return db.reports.update({'_id': reportID}, report)

def generateReport(reportID):
    cur = db.reports.find({'_id': reportID})
    if cur.count() == 0:
        if not createReport(reportID):
            return None
    report = db.reports.find({'_id': reportID})[0]

    event = db.events.find({'_id': reportID})[0]

    if not 'prevEvents' in event:
        event['prevEvents'] = []
    if not 'nextEvent' in event:
        event['nextEvent'] = ''

    prevEvents = []

    for prevEventID in event['prevEvents']:
        prevEvent, agendas = getNextAgendas(prevEventID)
        prevEvents.append(
            {'_id': prevEventID, 'name': prevEvent['name'], 'agendas': agendas})
        for oldPrevEvent in report['prevEvents']:
            if oldPrevEvent['_id'] == prevEventID:
                for i in range(len(agendas)):
                    for oldAgenda in oldPrevEvent['agendas']:
                        if agendas[i]['_id'] == oldAgenda['_id']:
                            prevEvents[-1]['agendas'][i]['description'] = oldAgenda['description']

    report['prevEvents'] = prevEvents

    agendas = getAgendas(reportID)

    for i in range(len(agendas)):
        for oldAgenda in report['agendas']:
            if agendas[i]['_id'] == oldAgenda['_id']:
                agendas[i]['description'] = oldAgenda['description']

    report['agendas'] = agendas

    _, agendas = getNextAgendas(reportID)

    if report['nextEvent']['_id'] == event['nextEvent']:
        for i in range(len(agendas)):
            for oldAgenda in report['nextEvent']['agendas']:
                if agendas[i]['_id'] == oldAgenda['_id']:
                    agendas[i]['description'] = oldAgenda['description']
    else:
        report['nextEvent']['id'] = event['nextEvent']
        if not event['nextEvent'] == '':
            nextEvent = getEvent(event['nextEvent'])
            report['nextEvent'] = {'_id': event['nextEvent'], 'agendas': [],
                'name': nextEvent['name'], 'time': nextEvent['time'],
                'department': nextEvent['department']}

    report['nextEvent']['agendas'] = agendas

    updateReport(reportID, report)

    return report




