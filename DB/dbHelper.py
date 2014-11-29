from pymongo import MongoClient
import datetime

client = MongoClient()

def insertEvent(time, name, department):
    if not (type(department) is list):
        department = [department]
    start = time.replace(hour=0,minute=0,second=0,microsecond=0)
    end = time + datetime.timedelta(days = 1)
    cur = client.stem.events.find({'time':{'$gte':start, '$lt':end}})
    eventID = datetime.datetime.strftime(time, '%Y%m%d') '_' + str(cur.count())
    event = {'_id': eventID, 'time':time, 
        'name': name, 'department': department}
    return client.stem.events.insert(event)

def insertPerson(number, name, department):
    if not (type(department) is list):
        department = [department]
    person = {'_id': number, 'name': name, 'department': department}
    return client.stem.people.insert(person)

def insertDepartment(code, name):
    department = {'_id': code, 'name': name}
    return client.stem.department.insert(department)

