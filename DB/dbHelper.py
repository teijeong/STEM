from pymongo import MongoClient
import datetime


mongoURI ='mongodb://heroku_app32258670:5hcl5oso685va7pcpo8e9ku1f5@ds061360.mongolab.com:61360/heroku_app32258670'
db = MongoClient(mongoURI).heroku_app32258670


def insertEvent(time, name, department):
    if not (type(department) is list):
        department = [department]
    start = time.replace(hour=0,minute=0,second=0,microsecond=0)
    end = time + datetime.timedelta(days = 1)
    cur = db.events.find({'time':{'$gte':start, '$lt':end}})
    eventID = datetime.datetime.strftime(time, '%Y%m%d') + '_' + str(cur.count())
    event = {'_id': eventID, 'time':time.replace(microsecond=0), 
        'name': name, 'department': department}
    return db.events.insert(event)

def insertPerson(number, name, department):
    if not (type(department) is list):
        department = [department]
    person = {'_id': number, 'name': name, 'department': department}
    return db.people.insert(person)

def insertDepartment(code, name):
    department = {'_id': code, 'name': name}
    return db.department.insert(department)

