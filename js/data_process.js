/*
    CalDavZAP - the open source CalDAV Web Client
    Copyright (C) 2011-2015
        Jan Mate <jan.mate@inf-it.com>
        Andrej Lezo <andrej.lezo@inf-it.com>
        Matej Mihalik <matej.mihalik@inf-it.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
String.prototype.parseComnpactISO8601 = function(uid) {
    if (this.length >= 15)
        var formattedString = this.substring(0, 4) + '/' + this.substring(4, 6) + '/' + this.substring(6, 8) + ' ' + this.substring(9, 11) + ':' + this.substring(11, 13) + ':' + this.substring(13, 15);
    else
        var formattedString = this.substring(0, 4) + '/' + this.substring(4, 6) + '/' + this.substring(6, 8) + ' ' + '00:00:00';

    var value = Date.parse(formattedString);
    if (isNaN(value))
        return false
    else
        return new Date(value);
}

function repeatStartCompare(objA, objB) {
    var startA = '',
        startB = '';
    if (objA.rec_id != '')
        startA = objA.rec_id.parseComnpactISO8601();
    else if (objA.start)
        startA = new Date(objA.start.getTime());
    else if (objA.end)
        startA = new Date(objA.end.getTime());
    else
        startA = Infinity;

    if (objB.rec_id != '')
        startB = objB.rec_id.parseComnpactISO8601();
    else if (objB.start)
        startB = new Date(objB.start.getTime());
    else if (objB.end)
        startB = new Date(objB.end.getTime());
    else
        startB = Infinity;

    if (startA < startB)
        return -1;
    if (startA > startB)
        return 1;

    return 0;
}

function findWeek(weekNo, inDate, day) {
    var distance = (day + 7 - inDate.getDay()) % 7;
    var date = new Date(inDate.getTime());
    date.setDate(date.getDate() + distance);
    if (date.getWeekNo() <= weekNo)
        date.setDate(date.getDate() + 7 * (weekNo - date.getWeekNo()));
    else {
        var actualYearWeeks = new Date(date.getFullYear(), 11, 31, 1, 1, 1).getWeekNo();
        date.setDate(date.getDate() + 7 * (actualYearWeeks - date.getWeekNo()));
    }

}
String.prototype.getSecondsFromOffset = function() {
    if (this.length >= 5) {
        var hours = this.substring(1, 3);
        var minutes = this.substring(3, 5);
        var seconds = '00';
        if (this.length >= 7)
            seconds = this.substring(5, 7);

        var value = parseInt(hours, 10) * 60 * 60 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
        if (this.charAt(0) == '-')
            value = value * -1;

        if (!isNaN(value))
            return value
        else
            return 0;
    } else
        return 0;
}

Array.prototype.indexElementOf = function(value) {
    for (var i = 0; i < this.length; i++)
        if (this[i].indexOf(value) != -1)
            return i;
    return -1;
}

function processByDay(byDaysIn, date, newDates, start, interval, count, uid, frequency, wkst) {
    var weekCount = count
    var numbers = new Array();
    var firstDates = new Array();
    var checkDate = new Date(date.getTime());
    var weekStartDate = new Date(date.getTime());
    var byDays = byDaysIn.slice();
    if (byDays.length == 0)
        byDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    var weekStart = parseInt(wkst, 10);
    if (isNaN(weekStart))
        weekStart = 1;

    weekStartDate.setDate(1);
    var firstOfMonthDayOfWeek = weekStartDate.getDay();
    var daysUntilFirst = (weekStart + 1 - firstOfMonthDayOfWeek) % 7;
    if (daysUntilFirst <= 0)
        weekStartDate.setDate(daysUntilFirst + 7);
    else
        weekStartDate.setDate(daysUntilFirst);

    var dateStartWeek = new Date(start.getTime());
    if (dateStartWeek.getDay() >= weekStart)
        dateStartWeek.setDate(dateStartWeek.getDate() - (dateStartWeek.getDay() - weekStart));
    else
        dateStartWeek.setDate(dateStartWeek.getDate() - (7 - (weekStart - dateStartWeek.getDay())));
    for (var p = 0; p < byDays.length; p++) {
        var insertIndex = firstDates.length;
        var checkString = byDays[p].match(vCalendar.pre['+/-number']);
        byDays[p] = byDays[p].replace(checkString[0], '');

        byDays[p] = byDays[p].replace('MO', 1).replace('TU', 2).replace('WE', 3).replace('TH', 4).replace('FR', 5).replace('SA', 6).replace('SU', 0);

        checkDate.setDate(1);
        var firstOfMonthDayOfWeek = checkDate.getDay();
        var daysUntilFirst = (parseInt(byDays[p], 10) + 1 - firstOfMonthDayOfWeek) % 7;
        if (daysUntilFirst <= 0)
            checkDate.setDate(daysUntilFirst + 7);
        else
            checkDate.setDate(daysUntilFirst);

        for (var i = 0; i < firstDates.length; i++)
            if (firstDates[i].customCompare(checkDate.getTime() + '', globalSortAlphabet, 1, false) == 1) {
                insertIndex = i;
                break;
            }
        firstDates.splice(insertIndex, 0, checkDate.getTime() + '');

        numbers.splice(insertIndex, 0, checkString[0]);
        if (numbers[insertIndex] != '') {
            numbers[insertIndex] = parseInt(numbers[insertIndex], 10);
            if (numbers[insertIndex] < 0) {
                var checkMonthDate = new Date(checkDate.getTime());
                checkMonthDate.setDate(checkMonthDate.getDate() + 21 + 7);
                if (checkDate.getMonth() == checkMonthDate.getMonth())
                    numbers[insertIndex] = 5 - (numbers[insertIndex] * -1) + 1;
                else
                    numbers[insertIndex] = 4 - (numbers[insertIndex] * -1) + 1;

            }
        }
    }

    if (frequency == 4) {
        var copyDate = firstDates.slice();
        var copyInsertIndex = firstDates.length;
        var isInc = false;
        var co = 0;

        for (var i = 0; i < copyDate.length; i++)
            if (new Date(parseInt(copyDate[i], 10)) < weekStartDate)
                co++;
        if (co == copyDate.length && weekCount != 0)
            weekCount++;

        for (var i = 0; i < copyDate.length; i++) {
            var testDate = new Date(parseInt(copyDate[i], 10));
            if (testDate < weekStartDate) {
                for (var k = 0; k < firstDates.length; k++)
                    if (testDate.getTime() == new Date(parseInt(firstDates[k], 10)).getTime()) {
                        firstDates.splice(k, 1);
                        break;
                    }

                if (testDate > start)
                    if (weekCount == 0 || (weekCount - 1) % interval == 0)
                        if (start.getTime() != testDate.getTime())
                            newDates.splice(newDates.length, 0, new Date(testDate.getTime()));
                isInc = true;
                testDate.setDate(testDate.getDate() + 7);

                for (var j = 0; j < firstDates.length; j++)
                    if (firstDates[j].customCompare(testDate.getTime() + '', globalSortAlphabet, 1, false) == 1) {
                        copyInsertIndex = j;
                        break;
                    }
                firstDates.splice(copyInsertIndex, 0, testDate.getTime() + '');
            }
        }
        if (isInc && weekCount == 0 && weekStartDate > start)
            weekCount++;
    }

    for (var k = 1; k <= 5; k++) {
        var testDate = new Date(parseInt(firstDates[0], 10));
        var isValid = true;
        var diffMonth = 0;

        if ((testDate >= start && frequency == 4) || (testDate >= dateStartWeek && frequency == 4)) {
            if (weekCount % interval != 0)
                isValid = false;
            weekCount++;
        }

        for (var i = 0; i < firstDates.length; i++) {
            var checkFirstDate = new Date(parseInt(firstDates[i], 10));
            if (isValid)
                if (date.getMonth() == checkFirstDate.getMonth() && checkFirstDate >= start) {
                    if (numbers[i] != '') {
                        if (k == numbers[i])
                            newDates.splice(newDates.length, 0, new Date(checkFirstDate.getTime()));
                    } else
                        newDates.splice(newDates.length, 0, new Date(checkFirstDate.getTime()));
                }
            if (date.getMonth() != checkFirstDate.getMonth())
                diffMonth++;
            checkFirstDate.setDate(checkFirstDate.getDate() + 7);
            firstDates[i] = checkFirstDate.getTime();
        }
        if (diffMonth == firstDates.length)
            return {
                newDates: newDates,
                weekCount: weekCount - 1
            };
    }
    return {
        newDates: newDates,
        weekCount: weekCount
    };
}

function processRule(vcalendar, start, pars, dates, frequency, deadLine, interval, uid, rCount, eventStart, wkst) {

    if (pars.length < 1 || frequency < 0)
        return {
            dates: dates,
            rCount: rCount
        };
    var delIndex = 0;
    var newDates = new Array();
    if (pars.indexElementOf('BYMONTH=') != -1) {
        delIndex = pars.indexElementOf('BYMONTH=');
        var byMonthList = pars[delIndex].split('=')[1].split(',');
        checkDate = new Date(start.getTime());
        checkDate.setDate(1);
        while (checkDate < deadLine) {

            if (byMonthList.indexOf((checkDate.getMonth() + 1) + '') != -1) {
                var testMonthDay = new Date(checkDate.getTime());
                testMonthDay.setDate(start.getDate());
                if (testMonthDay.getMonth() == checkDate.getMonth())
                    newDates.splice(newDates.length, 0, new Date(checkDate.getFullYear(), checkDate.getMonth(), start.getDate(), checkDate.getHours(), checkDate.getMinutes(), checkDate.getSeconds()));
                else
                    newDates.splice(newDates.length, 0, new Date(checkDate.getTime()));
            }
            checkDate.setMonth(checkDate.getMonth() + 1);
        }
    } else if ((pars.indexElementOf('BYMONTHDAY=') != -1)) {
        delIndex = pars.indexElementOf('BYMONTHDAY=');
        var byMonthDayList = pars[delIndex].split('=')[1].split(',');
        var vcalendar_element = vcalendar.match(vCalendar.pre['contentline_RRULE2']);
        if (vcalendar_element != null) {
            var parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            var ruleString = parsed[4];
            var isByMonth = false;
            if (ruleString.indexOf('BYMONTH=') != -1)
                isByMonth = true;
            if (isByMonth) {
                for (var i = 0; i < dates.length; i++)
                    for (var j = 0; j < byMonthDayList.length; j++) {
                        var date = new Date(dates[i].getTime());
                        var prevDate = new Date(date.getTime());
                        var testValue = parseInt(byMonthDayList[j], 10);
                        if (testValue > 0)
                            date.setDate(parseInt(byMonthDayList[j], 10));
                        else {
                            date.setMonth(date.getMonth() + 1);
                            date.setDate(testValue + 1);
                        }
                        if (date >= start && date.getMonth() == prevDate.getMonth())
                            newDates.splice(newDates.length, 0, new Date(date.getTime()));
                    }
            } else if (frequency > 5) {
                pars.splice(pars.length, 0, 'BYMONTH=' + (eventStart.getMonth() + 1) + '');
                return processRule(vcalendar.replace(ruleString, ruleString += ';BYMONTH=' + (eventStart.getMonth() + 1) + ''), start, pars, newDates, frequency, deadLine, interval, uid, rCount, eventStart, wkst);
            } else {
                var checkDate = new Date(eventStart.getTime());
                checkDate.setDate(1);
                var tmpCount = 0;
                while (checkDate < deadLine) {
                    for (var j = 0; j < byMonthDayList.length; j++) {
                        var date = new Date(checkDate.getTime());
                        var testValue = parseInt(byMonthDayList[j], 10);
                        if (testValue > 0)
                            date.setDate(parseInt(byMonthDayList[j], 10));
                        else {
                            date.setFullYear(date.getFullYear() + 1);
                            date.setDate(testValue + 1);
                        }
                        var intOK = true;
                        if (tmpCount % interval != 0)
                            intOK = false;
                        tmpCount++;
                        if (date < start)
                            continue;
                        if (intOK) {
                            rCount = tmpCount;
                            newDates.splice(newDates.length, 0, new Date(date.getTime()));
                        }
                    }
                    checkDate.setMonth(checkDate.getMonth() + 1);
                }
            }
        }
    } else if ((pars.indexElementOf('BYDAY=') != -1)) {
        delIndex = pars.indexElementOf('BYDAY=');
        var byDayList = pars[delIndex].split('=')[1].split(',');
        var vcalendar_element = vcalendar.match(vCalendar.pre['contentline_RRULE2']);
        if (vcalendar_element != null) {
            var parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            var ruleString = parsed[4];
            var isByMonth = false;
            var weekCount = rCount;
            if (ruleString.indexOf('BYMONTH=') != -1 && ruleString.indexOf('BYMONTHDAY=') == -1) {
                for (var i = 0; i < dates.length; i++) { //for (var j=0;j<byDayList.length;j++)
                    //{
                    var newObj = processByDay(byDayList, dates[i], newDates, start, interval, weekCount, uid, frequency, wkst);
                    newDates = newObj.newDates.slice();
                    weekCount = newObj.weekCount;
                    rCount = newObj.weekCount;
                    //}
                }
            } else if (ruleString.indexOf('BYMONTH=') == -1 && ruleString.indexOf('BYMONTHDAY=') == -1) {
                var checkDate = new Date(start.getTime());
                var newDead = new Date(deadLine.getTime());
                newDead.setDate(1);
                newDead.setMonth(newDead.getMonth() + 1);
                while (checkDate < newDead) {
                    //for (var j=0;j<byDayList.length;j++)
                    //{

                    if (eventStart.getTime() == checkDate.getTime() || checkDate >= start) {
                        var testInt = false;

                        if (frequency == 5) {
                            if (rCount % interval == 0) {
                                testInt = true;

                            }
                        } else
                            testInt = true;

                        if (testInt) {
                            var newObj = processByDay(byDayList, checkDate, newDates, start, interval, weekCount, uid, frequency, wkst);
                            newDates = newObj.newDates.slice();
                            if (frequency == 4) {
                                weekCount = newObj.weekCount;
                                rCount = newObj.weekCount;
                            }

                        }
                        if (frequency == 5)
                            rCount++;
                    }

                    //}
                    var testNexMonth = new Date(checkDate.getTime());
                    testNexMonth.setMonth(testNexMonth.getMonth() + 1);
                    var monthDiff = testNexMonth.getMonth() - checkDate.getMonth();

                    checkDate.setMonth(checkDate.getMonth() + 1);
                    if (monthDiff > 1)
                        checkDate.setDate(-1);
                }
            } else if (ruleString.indexOf('BYMONTHDAY=') != -1) {
                for (var i = 0; i < dates.length; i++)
                    for (var j = 0; j < byDayList.length; j++) {
                        var newDates = new Array();
                        var checkString = byDayList[j].match(vCalendar.pre['+/-number']);
                        byDayList[j] = byDayList[j].replace(checkString[0], '');
                        byDayList[j] = byDayList[j].replace('MO', 1).replace('TU', 2).replace('WE', 3).replace('TH', 4).replace('FR', 5).replace('SA', 6).replace('SU', 0);
                        if (checkString[0] != "") {
                            var number = parseInt(checkString[0], 10);
                            var checkDate = new Date(dates[i].getTime());
                            checkDate.setDate(1);
                            var firstOfMonthDayOfWeek = checkDate.getDay();
                            var daysUntilFirst = (parseInt(byDayList[j], 10) + 1 - firstOfMonthDayOfWeek) % 7;
                            if (daysUntilFirst <= 0)
                                checkDate.setDate(daysUntilFirst + 7);
                            else
                                checkDate.setDate(daysUntilFirst);

                            if (number > 0)
                                for (var k = 1; k <= 5; k++) {
                                    if (k % number == 0)
                                        if ((dates[i].getMonth() == checkDate.getMonth()) && (dates[i].getDate() == checkDate.getDate()) && dates[i] > start)
                                            newDates.splice(newDates.length, 0, new Date(checkDate.getTime()));
                                    checkDate.setDate(checkDate.getDate() + 7);
                                } else {
                                var checkMonthDate = new Date(checkDate.getTime());
                                checkMonthDate.setDate(checkMonthDate.getDate() + 21 + 7);
                                if (checkDate.getMonth() == checkMonthDate.getMonth())
                                    var weekOfMonth = 5;
                                else
                                    var weekOfMonth = 4;
                                for (var k = 1; k <= weekOfMonth; k++) {
                                    if (k % (weekOfMonth - number + 1) == 0)
                                        if (dates[i].getMonth() == checkDate.getMonth() && date > start) {
                                            newDates.splice(newDates.length, 0, new Date(checkDate.getTime()));
                                            break;
                                        }

                                    checkDate.setDate(checkDate.getDate() + 7);
                                }

                            }
                        } else {
                            var checkDate = new Date(dates[i].getTime());
                            checkDate.setDate(1);
                            var firstOfMonthDayOfWeek = checkDate.getDay();
                            var daysUntilFirst = (parseInt(byDayList[j], 10) + 1 - firstOfMonthDayOfWeek) % 7;
                            if (daysUntilFirst <= 0)
                                checkDate.setDate(1 + daysUntilFirst + 7);
                            else
                                checkDate.setDate(daysUntilFirst);
                            for (var k = 1; k <= 5; k++) {
                                if ((dates[i].getMonth() == checkDate.getMonth()) && (dates[i].getDate() == checkDate.getDate()) && dates[i] > start)
                                    newDates.splice(newDates.length, 0, new Date(checkDate.getTime()));
                                checkDate.setDate(checkDate.getDate() + 7);
                            }
                        }
                    }
            }

        }
    } else
        return {
            dates: dates,
            rCount: rCount
        };
    pars.splice(delIndex, 1);
    return processRule(vcalendar, start, pars, newDates, frequency, deadLine, interval, uid, rCount, eventStart, wkst);
}

function applyTimezone(previousTimezone, isEventLocal) {
    updateMainLoaderTextTimezone();
    $('#MainLoader').show();

    var eventsDone = false;
    var todosDone = false;
    var collections = globalResourceCalDAVList.collections;
    var todoCollections = globalResourceCalDAVList.TodoCollections;
    var calendarCount = 0,
        calendarCounter = 0;
    var todoCount = 0,
        todoCounter = 0;

    for (var i = 0; i < collections.length; i++) {
        if (collections[i].uid != undefined) {
            calendarCount++;
        }
    }

    for (var i = 0; i < todoCollections.length; i++) {
        if (todoCollections[i].uid != undefined) {
            todoCount++;
        }
    }

    var eventsArray = globalEventList.displayEventsArray;
    var todosArray = globalEventList.displayTodosArray;

    for (var i = 0; i < collections.length; i++) {
        if (collections[i].uid != undefined) {
            setTimeout(function(i) {
                for (var j = 0; j < eventsArray[collections[i].uid].length; j++) {
                    if (eventsArray[collections[i].uid][j].timeZone == 'local' || eventsArray[collections[i].uid][j].allDay) {
                        continue;
                    }
                    var dateStart = eventsArray[collections[i].uid][j].start;
                    var previousOffset = getOffsetByTZ(previousTimezone, dateStart).getSecondsFromOffset();
                    var actualOffset = '';

                    if (typeof globalSessionTimeZone != 'undefined' &&
                        globalSessionTimeZone != null &&
                        globalSessionTimeZone != '') {

                        actualOffset = getOffsetByTZ(globalSessionTimeZone, dateStart).getSecondsFromOffset();
                    } else {
                        actualOffset = dateStart.getTimezoneOffset() * 60 * -1;
                    }

                    // if timezonesupport is turned off go to local
                    if (typeof isEventLocal != 'undefined') {
                        actualOffset = getOffsetByTZ(eventsArray[collections[i].uid][j].timeZone, dateStart).getSecondsFromOffset();
                    }

                    if (typeof isEventLocal != 'undefined' && !isEventLocal) {
                        var intOffset = (previousOffset - actualOffset) * 1000;
                    } else {
                        var intOffset = (actualOffset - previousOffset) * 1000;
                    }
                    eventsArray[collections[i].uid][j].start.setTime(eventsArray[collections[i].uid][j].start.getTime() + intOffset);

                    if (eventsArray[collections[i].uid][j].end) {
                        eventsArray[collections[i].uid][j].end.setTime(eventsArray[collections[i].uid][j].end.getTime() + intOffset);
                    }

                    var calEvent = eventsArray[collections[i].uid][j];
                    if (j == 0 ||
                        j > 0 &&
                        eventsArray[collections[i].uid][j].id != eventsArray[collections[i].uid][j - 1].id) {

                        if (calEvent.alertTime.length > 0) {
                            for (var k = 0; k < calEvent.alertTimeOut.length; k++) {
                                clearTimeout(calEvent.alertTimeOut[k]);
                            }

                            var aTime = '',
                                now = new Date();

                            for (var alarmIterator = 0; alarmIterator < calEvent.alertTime.length; alarmIterator++) {
                                if (eventsArray[collections[i].uid][j].start != null &&
                                    calEvent.alertTime[alarmIterator].charAt(0) == '-') {

                                    aTime = eventsArray[collections[i].uid][j].start.getTime() - parseInt(calEvent.alertTime[alarmIterator].substring(1, calEvent.alertTime[alarmIterator].length - 1));
                                } else if (eventsArray[collections[i].uid][j].end != null &&
                                    calEvent.alertTime[alarmIterator].charAt(0) == '+')

                                    aTime = eventsArray[collections[i].uid][j].end.getTime() + parseInt(calEvent.alertTime[alarmIterator].substring(1, calEvent.alertTime[alarmIterator].length - 1));
                                else {
                                    var previousOffset = getOffsetByTZ(previousTimezone, $.fullCalendar.parseDate(calEvent.alertTime[alarmIterator])).getSecondsFromOffset();
                                    var actualOffset = '';

                                    if (typeof globalSessionTimeZone != 'undefined' &&
                                        globalSessionTimeZone != null &&
                                        globalSessionTimeZone != '') {

                                        actualOffset = getOffsetByTZ(globalSessionTimeZone, $.fullCalendar.parseDate(calEvent.alertTime[alarmIterator])).getSecondsFromOffset();
                                    } else {
                                        actualOffset = $.fullCalendar.parseDate(calEvent.alertTime[alarmIterator]).getTimezoneOffset() * 60 * -1;
                                    }

                                    if (typeof isEventLocal != 'undefined') {
                                        actualOffset = getOffsetByTZ(eventsArray[collections[i].uid][j].timeZone, $.fullCalendar.parseDate(calEvent.alertTime[alarmIterator])).getSecondsFromOffset();
                                    }

                                    if (typeof isEventLocal != 'undefined' && !isEventLocal) {
                                        var intOffset = (previousOffset - actualOffset) * 1000;
                                    } else {
                                        var intOffset = (actualOffset - previousOffset) * 1000;
                                    }

                                    aTime = new Date($.fullCalendar.parseDate(calEvent.alertTime[alarmIterator]).getTime() + intOffset);
                                    eventsArray[collections[i].uid][j].alertTime[alarmIterator] = $.fullCalendar.formatDate(aTime, "yyyy-MM-dd HH:mm:ss");
                                }

                                if (aTime > now) {
                                    var delay = aTime - now;
                                    if (maxAlarmValue < delay) {
                                        delay = maxAlarmValue;
                                    }

                                    eventsArray[collections[i].uid][j].alertTimeOut[alarmIterator] = setTimeout(function() {
                                        showAlertEvents(calEvent.id, (aTime - now), {
                                            start: calEvent.start,
                                            allDay: calEvent.allDay,
                                            title: calEvent.title
                                        });
                                    }, delay);
                                }
                            }
                        }
                    }
                }
                calendarCounter++;
                if (calendarCounter == calendarCount) {
                    refetchCalendarEvents();
                    eventsDone = true;
                    if (todosDone) {
                        $('#MainLoader').hide();
                    }
                }
            }, 10, i);
        }
    }
}

function getLocalOffset(date) {
    if (typeof globalSessionTimeZone != 'undefined' && globalSessionTimeZone != null && globalSessionTimeZone != '')
        return getOffsetByTZ(globalSessionTimeZone, date).getSecondsFromOffset() * -1;
    else
        date.getTimezoneOffset() * 60;
}

function changeRuleForFuture(inputEvent, repeatCount) {
    var vcalendar = inputEvent.vcalendar;
    var vcalendar_element = vcalendar.match(vCalendar.pre['contentline_RRULE2']);
    if (vcalendar_element != null) {
        parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
        var ruleParts = parsed[4].split(';');
        var foundUntil = false;
        var parsedLine = parsed[0];
        for (var i = 0; i < ruleParts.length; i++) {
            if (ruleParts[i].indexOf('UNTIL') != -1 || ruleParts[i].indexOf('COUNT') != -1) {
                parsedLine = parsedLine.replace(ruleParts[i], 'COUNT=' + (repeatCount - 1));
                foundUntil = true;
            }
        }

        if (!foundUntil) {
            var tmp = parsed[4] + ';COUNT=' + (repeatCount - 1);
            parsedLine = parsedLine.replace(parsed[4], tmp);
        }
        vcalendar = vcalendar.replace(parsed[0], parsedLine);
    }
    return vcalendar;
}

function buildTimezoneComponent(tzName) {
    var component = '';
    var dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    if (!tzName || tzName == 'local' || tzName == 'UTC')
        return component;
    if (tzName in timezones) {
        component += 'BEGIN:VTIMEZONE\r\nTZID:' + tzName + '\r\n';
        for (comp in timezones[tzName]) {
            if (comp == 'daylightComponents') {
                var daylightC = timezones[tzName].daylightComponents;
                var compName = 'DAYLIGHT';
            } else if (comp == 'standardComponents') {
                var daylightC = timezones[tzName].standardComponents;
                var compName = 'STANDARD';
            }

            for (var i in daylightC) {
                if (isNaN(i))
                    continue;

                component += 'BEGIN:' + compName + '\r\n';
                for (key in daylightC[i]) {
                    switch (key) {
                        case 'dtStart':
                            component += 'DTSTART:' + daylightC[i][key] + '\r\n';
                            break;
                        case 'tzName':
                            component += 'TZNAME:' + daylightC[i][key] + '\r\n';
                            break;
                        case 'tzOffsetFROM':
                            component += 'TZOFFSETFROM:' + daylightC[i][key] + '\r\n';
                            break;
                        case 'tzOffsetTO':
                            component += 'TZOFFSETTO:' + daylightC[i][key] + '\r\n';
                            break;
                        case 'startMonth':
                            component += 'RRULE:FREQ=YEARLY';
                            if (daylightC[i]['startMonth'])
                                component += ';BYMONTH=' + daylightC[i]['startMonth'];

                            if (typeof daylightC[i]['startDay'] != 'undefined' && typeof dayNames[daylightC[i]['startDay']] != 'undefined') {
                                if (!daylightC[i]['startCount'])
                                    component += ';BYDAY=' + dayNames[daylightC[i]['startDay']];
                                else
                                    component += ';BYDAY=' + daylightC[i]['startCount'] + dayNames[daylightC[i]['startDay']];
                            }
                            component += '\r\n';
                            break;
                        case 'rDates':
                            if (daylightC[i]['rDates'])
                                for (var j = 0; j < daylightC[i]['rDates'].length; j++)
                                    component += 'RDATE:' + daylightC[i]['rDates'][j] + '\r\n';
                            break;
                        default:
                            break;
                    }
                }
                component += 'END:' + compName + '\r\n';
            }
        }
        component += 'END:VTIMEZONE\r\n';
    }
    return component;
}

function getOffsetByTZ(tZone, date, uid) {
    var offset = '+0000';
    if (tZone in timezones && tZone != 'UTC') {
        var objDayLight = '',
            objStandard = '';
        var checkRule = true;

        var daylightComponents = timezones[tZone].daylightComponents;
        var actualDaylightComponent;
        if (daylightComponents) {
            for (var i = 0; i < daylightComponents.length; i++) {
                if (daylightComponents[i].dtStart.parseComnpactISO8601() > date)
                    continue;

                if (checkRule && daylightComponents[i].startMonth) // is RRULE SET
                {
                    objDayLight = daylightComponents[i];
                    actualDaylightComponent = getDateFromDay(objDayLight, date, false, uid);
                    break;
                } else {
                    for (var j = 0; j < daylightComponents[i].rDates.length; j++) {
                        if (daylightComponents[i].rDates[j].parseComnpactISO8601() < date && (actualDaylightComponent == null || (date - daylightComponents[i].rDates[j].parseComnpactISO8601()) < (date - actualDaylightComponent.startDate))) {
                            objDayLight = daylightComponents[i];
                            actualDaylightComponent = {
                                offsetFrom: objDayLight.tzOffsetFROM,
                                offsetTo: objDayLight.tzOffsetTO,
                                startDate: daylightComponents[i].rDates[j].parseComnpactISO8601()
                            };
                        }
                    }
                }
                checkRule = false;
            }
        }

        var standardComponents = timezones[tZone].standardComponents;
        var actualStandardComponent;
        checkRule = true;
        if (standardComponents) {
            for (var i = 0; i < standardComponents.length; i++) {
                if (standardComponents[i].dtStart.parseComnpactISO8601() > date)
                    continue;

                if (checkRule && standardComponents[i].startMonth) // is RRULE SET
                {
                    objDayLight = standardComponents[i];
                    actualStandardComponent = getDateFromDay(objDayLight, date);
                    break;
                } else {
                    for (var j = 0; j < standardComponents[i].rDates.length; j++) {
                        if (standardComponents[i].rDates[j].parseComnpactISO8601() < date && (actualStandardComponent == null || (date - standardComponents[i].rDates[j].parseComnpactISO8601()) < (date - actualStandardComponent.startDate))) {
                            objStandard = standardComponents[i];
                            actualStandardComponent = {
                                offsetFrom: objStandard.tzOffsetFROM,
                                offsetTo: objStandard.tzOffsetTO,
                                startDate: standardComponents[i].rDates[j].parseComnpactISO8601()
                            };
                        }
                    }
                }
                checkRule = false;
            }
        }

        if (actualDaylightComponent && actualStandardComponent) {
            if (actualDaylightComponent.startDate > actualStandardComponent.startDate)
                offset = actualDaylightComponent.offsetTo;
            else
                offset = actualStandardComponent.offsetTo;
        } else if (actualDaylightComponent)
            offset = actualDaylightComponent.offsetTo;
        else if (actualStandardComponent)
            offset = actualStandardComponent.offsetTo;
    } else if (tZone == 'local')
        offset = getStringLocalOffset(date);
    return offset;
}

function getStringLocalOffset(date) {
    var offset = '+0000';
    var localOffset = date.getTimezoneOffset();
    if (localOffset > 0) {
        var hours = Math.floor(localOffset / 60);
        var minutes = localOffset - hours * 60;
        offset = '-' + (hours < 10 ? '0' + hours : hours);
        offset += (minutes < 10 ? '0' + minutes : minutes);
    } else if (localOffset < 0) {
        localOffset = localOffset * -1;
        var hours = Math.floor(localOffset / 60);
        var minutes = localOffset - hours * 60;
        offset = '+' + (hours < 10 ? '0' + hours : hours);
        offset += (minutes < 10 ? '0' + minutes : minutes);
    }

    return offset;
}

function getDayLightObject(tzObject, t) {
    var dayLightStartDate, dayLightEndDate, myDate = t;
    dayLightStartDate = getDateFromDay(tzObject, t);
    dayLightEndDate = getDateFromDay(tzObject, t);

    for (var i = 0; i < tzObject.rDatesDT.length; i++) {
        var dateDT = tzObject.rDatesDT[i].parseComnpactISO8601();
        if (dateDT)
            if (dateDT.getFullYear() == t.getFullYear()) {
                dayLightStartDate = dateDT;
                break;
            }
    }

    for (var i = 0; i < tzObject.rDatesST.length; i++) {
        var dateST = tzObject.rDatesST[i].parseComnpactISO8601();
        if (dateST && dateST.getFullYear() == t.getFullYear()) {
            dayLightEndDate = dateST;
            break;
        }
    }

    if (dayLightStartDate > dayLightEndDate) {
        if (myDate > dayLightStartDate)
            dayLightEndDate.setFullYear(dayLightEndDate.getFullYear() + 1);
        else
            dayLightStartDate.setFullYear(dayLightStartDate.getFullYear() - 1);
    }

    return {
        dayLightStartDate: dayLightStartDate,
        dayLightEndDate: dayLightEndDate
    };
}

function deleteEventFromArray(uid) {
    var rid = uid.substring(0, uid.lastIndexOf('/') + 1);
    var count = 0;
    if (globalEventList.displayEventsArray[rid] != null && typeof globalEventList.displayEventsArray[rid] != 'undefined')
        for (var i = globalEventList.displayEventsArray[rid].length - 1; i >= 0; i--)
            if (globalEventList.displayEventsArray[rid][i].id == uid) {
                count++;
                for (var o = 0; o < globalEventList.displayEventsArray[rid][i].alertTimeOut.length; o++)
                    clearTimeout(globalEventList.displayEventsArray[rid][i].alertTimeOut[o]);
                globalEventList.displayEventsArray[rid].splice(i, 1);
            }
    if (count == 0)
        if (globalEventList.displayTodosArray[rid] != null && typeof globalEventList.displayTodosArray[rid] != 'undefined')
            for (var i = globalEventList.displayTodosArray[rid].length - 1; i >= 0; i--)
                if (globalEventList.displayTodosArray[rid][i].id == uid) {
                    for (var o = 0; o < globalEventList.displayTodosArray[rid][i].alertTimeOut.length; o++)
                        clearTimeout(globalEventList.displayTodosArray[rid][i].alertTimeOut[o]);
                    globalEventList.displayTodosArray[rid].splice(i, 1);
                }
}

function findEventInArray(uid, isEvent, repeatHash) {
    var rid = uid.substring(0, uid.lastIndexOf('/') + 1);
    var firstItem = null;
    if (isEvent) {
        for (var i = 0; i < globalEventList.displayEventsArray[rid].length; i++)
            if (globalEventList.displayEventsArray[rid][i].id == uid)
                return globalEventList.displayEventsArray[rid][i];
    } else {
        for (var i = 0; i < globalEventList.displayTodosArray[rid].length; i++)
            if (globalEventList.displayTodosArray[rid][i].id == uid) {
                if (typeof repeatHash == 'undefined' || repeatHash == null)
                    return globalEventList.displayTodosArray[rid][i];
                else if (globalEventList.displayTodosArray[rid][i].repeatHash == repeatHash)
                    return globalEventList.displayTodosArray[rid][i];
                else if (firstItem == null)
                    firstItem = globalEventList.displayTodosArray[rid][i];
            }
    }
    return firstItem || '';
}

function getvCalendarstart(inputEvent) {
    var vcalendar_element = '',
        itsOK = false,
        vEvent = inputEvent.vcalendar;

    if (vEvent.match(vCalendar.pre['vcalendar'])) {
        vcalendar_element = vEvent.match(vCalendar.pre['beginVTODO']);
        if (vcalendar_element != null) {
            var endVT = vEvent.match(vCalendar.pre['endVTODO']);
            if (endVT != null) {
                return '1970-01-01T01:01:01Z';
            }
            return false;
        }

        vcalendar_element = vEvent.match(vCalendar.pre['beginVEVENT']);
        if (vcalendar_element == null)
            itsOK = false;
        else
            itsOK = true;

        if (!itsOK)
            return false;

        vcalendar_element = vEvent.match(vCalendar.pre['endVEVENT']);

        if (vcalendar_element == null)
            itsOK = false;
        else
            itsOK = true;

        if (!itsOK)
            return false;

        var oo = '',
            start = '',
            help1;

        /*
        vcalendar_element=vEvent.match(vCalendar.pre['tzone']);

        if (vcalendar_element!=null)
        vEvent=vEvent.replace(vcalendar_element[0],'');
        */

        //FIX
        var beginTimeZone = vEvent.indexOf('BEGIN:VTIMEZONE');
        var startEndTimeZone = vEvent.lastIndexOf('END:VTIMEZONE');
        var endTimeZone = 0;

        if (beginTimeZone != -1 && startEndTimeZone != -1) {
            for (i = (startEndTimeZone + 2); i < vEvent.length; i++) {
                if (vEvent.charAt(i) == '\n') {
                    endTimeZone = i + 1;
                    break;
                }
            }
            vTimeZone = vEvent.substring(beginTimeZone, endTimeZone);
            vEvent = vEvent.substring(0, beginTimeZone) + vEvent.substring(endTimeZone, vEvent.length);
        }

        vcalendar_element = vEvent.match(vCalendar.pre['contentline_DTSTART']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            start = parsed[4];
            help1 = start;

            if (help1.indexOf("T") == -1)
                help1 = help1.substring(0, 4) + '-' + help1.substring(4, 6) + '-' + help1.substring(6, 8) + 'T00:00:00Z';
            else
                help1 = help1.substring(0, 4) + '-' + help1.substring(4, 6) + '-' + help1.substring(6, 8) + 'T' + help1.substring(9, 11) + ':' + help1.substring(11, 13) + ':' + help1.substring(13, 15) + 'Z';

            start = help1;
        }

        if (start != '') {
            var t = $.fullCalendar.parseDate(help1);

            if ((t.toString()) == 'Invalid Date')
                return false;
        }
        return help1;
    } else
        return -1;
}

function giveMeUntilDate(start, count, frequency, interval, allDay) {
    var varDate = $.fullCalendar.parseDate(start);
    var monthPlus = 0,
        dayPlus = 0;
    if (frequency == "DAILY") {
        monthPlus = 0,
            dayPlus = 1;
    } else if (frequency == "WEEKLY") {
        monthPlus = 0,
            dayPlus = 7;
    } else if (frequency == "MONTHLY") {
        monthPlus = 1,
            dayPlus = 0;
    } else if (frequency == "YEARLY") {
        monthPlus = 12,
            dayPlus = 0;
    }
    var iterator = 1,
        counter = 1;
    while (iterator < count) {
        if (counter % interval == 0)
            iterator++;

        if (allDay)
            var td = new Date(varDate.getFullYear(), varDate.getMonth() + monthPlus, varDate.getDate() + dayPlus);
        else
            var td = new Date(varDate.getFullYear(), varDate.getMonth() + monthPlus, varDate.getDate() + dayPlus, varDate.getHours(), varDate.getMinutes(), varDate.getSeconds());

        varDate = td;
        counter++;
    }
    return varDate;
}

function checkAndFixMultipleUID(vcalendar, isEvent) {
    var vcalendarOrig = vcalendar;
    var uidArray = {};
    var uidC = 0;
    var eventStringArray = new Array();
    var componentS = 'VEVENT';
    if (!isEvent)
        componentS = 'VTODO';
    var checkVcalendar = vcalendarOrig;
    var valarm = checkVcalendar.match(vCalendar.pre['valarm']);
    if (valarm != null)
        checkVcalendar = checkVcalendar.replace(valarm[0], '');
    while (checkVcalendar.match(vCalendar.pre['contentline_UID']) != null) {
        vcalendar_element = checkVcalendar.match(vCalendar.pre['contentline_UID']);
        if (vcalendar_element[0] != null) {
            if (typeof uidArray[vcalendar_element[0]] == 'undefined') {
                uidArray[vcalendar_element[0]] = {
                    isTimezone: false,
                    string: ''
                };
                uidC++;
            }
        }
        checkVcalendar = checkVcalendar.replace(vcalendar_element[0], '\r\n');
    }
    if (uidC == 1)
        return [vcalendar];
    var beginTimeZone = vcalendarOrig.indexOf('BEGIN:VTIMEZONE');
    var startEndTimeZone = vcalendarOrig.lastIndexOf('END:VTIMEZONE');
    var endTimeZone = 0;
    var vTimeZone = '';
    if (beginTimeZone != -1 && startEndTimeZone != -1) {
        for (i = (startEndTimeZone + 2); i < vcalendarOrig.length; i++) {
            if (vcalendarOrig.charAt(i) == '\n') {
                endTimeZone = i + 1;
                break;
            }
        }
        vTimeZone = vcalendarOrig.substring(beginTimeZone, endTimeZone);
        vcalendarOrig = vcalendarOrig.substring(0, beginTimeZone) + vcalendarOrig.substring(endTimeZone, vcalendarOrig.length);
    }
    while (vcalendarOrig.match(vCalendar.pre[componentS.toLowerCase()]) != null) {
        if (vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:' + componentS) - 2, vcalendarOrig.indexOf('BEGIN:' + componentS)) == '\r\n') {
            var partEvent = vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:' + componentS) - 2, vcalendarOrig.indexOf('END:' + componentS) + ('END:' + componentS).length);
            vcalendarOrig = vcalendarOrig.replace(partEvent, '');
        } else {
            var partEvent = vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:' + componentS), vcalendarOrig.indexOf('END:' + componentS) + ('END:' + componentS).length);
            vcalendarOrig = vcalendarOrig.replace(partEvent, '');
            partEvent += '\r\n';
        }
        var tmpEvent = partEvent;
        var valarm = tmpEvent.match(vCalendar.pre['valarm']);
        if (valarm != null)
            tmpEvent = tmpEvent.replace(valarm[0], '');
        vcalendar_element = tmpEvent.match(vCalendar.pre['contentline_UID']);
        if (vcalendar_element[0] != null) {
            var vcalendar_element_start = tmpEvent.match(vCalendar.pre['contentline_DTSTART']);
            if (vcalendar_element_start != null) {
                var parsed = vcalendar_element_start[0].match(vCalendar.pre['contentline_parse']);

                var pars = vcalendarSplitParam(parsed[3]);
                if (pars.indexElementOf('TZID=') != -1)
                    uidArray[vcalendar_element[0]].isTimezone = true;
            }
            if (!isEvent && !uidArray[vcalendar_element[0]].isTimezone) {
                var vcalendar_element_start = tmpEvent.match(vCalendar.pre['contentline_DUE']);
                if (vcalendar_element_start != null) {
                    var parsed = vcalendar_element_start[0].match(vCalendar.pre['contentline_parse']);

                    var pars = vcalendarSplitParam(parsed[3]);
                    if (pars.indexElementOf('TZID=') != -1)
                        uidArray[vcalendar_element[0]].isTimezone = true;
                }
            }
            uidArray[vcalendar_element[0]].string += partEvent;
        }
    }
    for (var uid in uidArray) {
        var vcalendarS = '';
        // vEvent BEGIN (required by RFC)
        if (vCalendar.tplM['begin'] != null && (process_elem = vCalendar.tplM['begin'][0]) != undefined)
            vcalendarS += vCalendar.tplM['begin'][0];
        else {
            process_elem = vCalendar.tplC['begin'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            vcalendarS += process_elem;
        }

        // VERSION (required by RFC)
        if (vCalendar.tplM['contentline_VERSION'] != null && (process_elem = vCalendar.tplM['contentline_VERSION'][0]) != undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
            if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
        } else {
            process_elem = vCalendar.tplC['contentline_VERSION'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        }
        process_elem = process_elem.replace('##:::##version##:::##', '2.0');
        vcalendarS += process_elem;

        // CALSCALE
        if (vCalendar.tplM['contentline_CALSCALE'] != null && (process_elem = vCalendar.tplM['contentline_CALSCALE'][0]) != undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
            if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
        } else {
            process_elem = vCalendar.tplC['contentline_CALSCALE'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        }
        process_elem = process_elem.replace('##:::##calscale##:::##', 'GREGORIAN');
        vcalendarS += process_elem;
        if (uidArray[uid].isTimezone)
            vcalendarS += vTimeZone;
        vcalendarS = vcalendarS.substring(0, vcalendarS.length - 2);
        vcalendarS += uidArray[uid].string;
        if (vcalendarS.lastIndexOf('\r\n') != (vcalendarS.length - 2))
            vcalendarS += '\r\n';
        // PRODID
        if (vCalendar.tplM['contentline_PRODID'] != null && (process_elem = vCalendar.tplM['contentline_PRODID'][0]) != undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
            if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
        } else {
            process_elem = vCalendar.tplC['contentline_PRODID'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
        }
        process_elem = process_elem.replace('##:::##value##:::##', '-//Inf-IT//' + globalAppName + ' ' + globalVersion + '//EN');
        vcalendarS += process_elem;

        if (typeof vCalendar.tplM['unprocessed'] != 'undefined' && vCalendar.tplM['unprocessed'] != '' && vCalendar.tplM['unprocessed'] != null)
            vcalendarS += vCalendar.tplM['unprocessed'].replace(RegExp('^\r\n'), '');

        vCalendar.tplM['unprocessed'] = new Array();
        // vCalendar END (required by RFC)

        if (vCalendar.tplM['end'] != null && (process_elem = vCalendar.tplM['end'][0]) != undefined)
            vcalendarS += vCalendar.tplM['end'][0];
        else {
            process_elem = vCalendar.tplC['end'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            vcalendarS += process_elem;
        }
        eventStringArray.push(vcalendarS);
    }
    return eventStringArray;
}

function dataToVcalendar (operation, accountUID, inputUID, inputEtag, delUID, isFormHidden, deleteMode, attendees) {
    // 功能：生成 ics 文件
    // 输入：operation: 操作方式, 
    //      accountUID, 
    //      inputUID, 
    //      inputEtag, 
    //      delUID, 
    //      isFormHidden, 
    //      deleteMode, 
    //      attendees: 被邀请人数组，其值为 globalUserData 中的下标；
    // 输出：

    var vevent        = false;
    var vCalendarText = '';
    var groupCounter  = 0;
    var sel_option    = 'local';
    
    // vEvent BEGIN (required by RFC)
    if (vCalendar.tplM['begin']!=null && (process_elem=vCalendar.tplM['begin'][0])!=undefined) {
        vCalendarText += vCalendar.tplM['begin'][0];
    }
    else {
        process_elem = vCalendar.tplC['begin'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        vCalendarText += process_elem;
    }

    // VERSION (required by RFC)
    if (vCalendar.tplM['contentline_VERSION']!=null && (process_elem=vCalendar.tplM['contentline_VERSION'][0])!=undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
        if (parsed[1] != '') {
            // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        }
    }
    else {
        process_elem = vCalendar.tplC['contentline_VERSION'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
    }
    process_elem = process_elem.replace('##:::##version##:::##', '2.0');
    vCalendarText += process_elem;

    // CALSCALE
    if (vCalendar.tplM['contentline_CALSCALE']!=null && (process_elem=vCalendar.tplM['contentline_CALSCALE'][0])!=undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
        if (parsed[1] != '') {
            // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        } 
    }
    else {
        process_elem = vCalendar.tplC['contentline_CALSCALE'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
    }
    process_elem = process_elem.replace('##:::##calscale##:::##', 'GREGORIAN');
    vCalendarText += process_elem;
    
    if (delUID != '') {
        var rid = delUID.substring(0, delUID.lastIndexOf('/')+1);
    }
    else {
        var rid = inputUID.substring(0, inputUID.lastIndexOf('/')+1);
    }
    var inputEvents = jQuery.grep(globalEventList.displayEventsArray[rid],function(e){if (e.id==$('#uid').val() && (e.repeatCount<2 || !e.repeatCount))return true});

    var tzArray    = new Array();
    var tzString   = '';
    var isTimeZone = false;
    
    var origVcalendarString = '';
    var eventStringArray    = new Array();

    if (inputEvents.length > 0) {
        var rid = $('#uid').val().substring(0, $('#uid').val().lastIndexOf('/')+1);
        if (rid) {
            if (globalEventList.events[rid][$('#uid').val()].uid != undefined) {
                origVcalendarString = globalEventList.events[rid][$('#uid').val()].vcalendar;
            }
        }
        while (origVcalendarString.match(vCalendar.pre['vevent']) != null) {
            if (origVcalendarString.substring(origVcalendarString.indexOf('BEGIN:VEVENT')-2, origVcalendarString.indexOf('BEGIN:VEVENT'))=='\r\n') {
                var partEvent = origVcalendarString.substring(origVcalendarString.indexOf('BEGIN:VEVENT')-2,origVcalendarString.indexOf('END:VEVENT')+'END:VEVENT'.length);
                origVcalendarString = origVcalendarString.replace(partEvent, '');
            }
            else {
                var partEvent = origVcalendarString.substring(origVcalendarString.indexOf('BEGIN:VEVENT'),origVcalendarString.indexOf('END:VEVENT')+'END:VEVENT'.length);
                origVcalendarString = origVcalendarString.replace(partEvent, '');
                partEvent += '\r\n';
            }
            eventStringArray[eventStringArray.length] = partEvent;
        }
    }

    var origTimezone = '';
    for (var iE=0; iE<inputEvents.length; iE++) {
        if (tzArray.indexOf(inputEvents[iE].timeZone) == -1) {
            if (inputEvents[iE].allDay || (deleteMode && ($('#vcalendarHash').val()==hex_sha256(inputEvents[iE].vcalendar)))) {
                continue;
            }
            var component = buildTimezoneComponent(inputEvents[iE].timeZone);
            if (component!='' && ($('#vcalendarHash').val()!=hex_sha256(inputEvents[iE].vcalendar))) {
                tzArray[tzArray.length] = inputEvents[iE].timeZone;
                tzString += component;
                if (tzString.lastIndexOf('\r\n') != (tzString.length-2)) {
                    tzString += '\r\n';
                }
                isTimeZone = true;
            }
            else if (component!='' && $('#vcalendarHash').val()==hex_sha256(inputEvents[iE].vcalendar)) {
                origTimezone += component;
            }
        }
    }

    if (isTimeZone) {
        if (vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) {
            vCalendarText += '\r\n';
        }
        vCalendarText += tzString;
    }


    var realEvent      = '';
    var futureMode     = false;
    var beginVcalendar = vCalendarText;

    for (var j=0; j<inputEvents.length; j++) {
        eventStringArray.splice(eventStringArray.indexOf(inputEvents[j].vcalendar), 1);
        if(($('#futureStart').val()== '' && $('#vcalendarHash').val()!=hex_sha256(inputEvents[j].vcalendar)) || inputEvents[j].rec_id!=$('#recurrenceID').val()) {
            var stringUIDcurrent = inputEvents[j].vcalendar.match(vCalendar.pre['contentline_UID']);
            if (stringUIDcurrent != null) {
                stringUIDcurrent = stringUIDcurrent[0].match(vCalendar.pre['contentline_parse'])[4];
            }

            if((deleteMode && $('#vcalendarHash').val()==hex_sha256(inputEvents[j].vcalendar)) || (deleteMode && !inputEvents[j].rec_id && $('#vcalendarUID').val()==stringUIDcurrent)) {
                var ruleString     = inputEvents[j].vcalendar.match(vCalendar.pre['contentline_RRULE2']);
                var origRuleString = ruleString;
                var exDate         = inputEvents[j].start;
                var process_elem   = vCalendar.tplC['contentline_EXDATE'];
                process_elem       = process_elem.replace('##:::##group_wd##:::##', '');
                process_elem       = process_elem.replace('##:::##params_wsc##:::##', '');

                if (inputEvents[j].allDay) {
                    exDate       = $('#recurrenceID').val();
                    process_elem = process_elem.replace('##:::##AllDay##:::##', ';'+vcalendarEscapeValue('VALUE=DATE'));
                    process_elem = process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
                    process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(exDate));
                }
                else {
                    exDate = $('#recurrenceID').val().parseComnpactISO8601();
                    if(!$('#allday').prop('checked')) {
                        if (globalSettings.timezonesupport.value) {
                            sel_option = $('#timezone').val();
                        }
                    }

                    if (sel_option != 'local') {
                        var valOffsetFrom = getOffsetByTZ(sel_option, exDate);
                        var intOffset     = valOffsetFrom.getSecondsFromOffset()*-1;
                        exDate            = new Date(exDate.setSeconds(intOffset));
                    }
                    else {
                        exDate = new Date(exDate.setSeconds(getLocalOffset(exDate)));
                    }
                    
                    exDate       = $.fullCalendar.formatDate(exDate, "yyyyMMdd'T'HHmmss'Z'");
                    process_elem = process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
                    process_elem = process_elem.replace('##:::##TZID##:::##','');
                    process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(exDate));
                }
                inputEvents[j].vcalendar = inputEvents[j].vcalendar.replace(ruleString,ruleString+process_elem);
            }

            if (inputEvents[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) {
                vCalendarText+=inputEvents[j].vcalendar.substring(2,inputEvents[j].vcalendar.length);
            }
            else if((inputEvents[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || 
                (inputEvents[j].vcalendar.indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2))) {

                vCalendarText += inputEvents[j].vcalendar;
            }
            else {
                vCalendarText += '\r\n'+inputEvents[j].vcalendar;
            }
        }
        else if($('#futureStart').val().split(';')[0]!='' && $('#futureStart').val().split(';')[1]!=inputEvents[j].start) {
            if($('#futureStart').val().split(';')[0]>1 && $('#vcalendarHash').val()==hex_sha256(inputEvents[j].vcalendar)) {
                inputEvents[j].vcalendar = changeRuleForFuture(inputEvents[j], $('#futureStart').val().split(';')[0]);
            }

            if (inputEvents[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) {
                vCalendarText+=inputEvents[j].vcalendar.substring(2,inputEvents[j].vcalendar.length);
            }
            else if((inputEvents[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || 
                (inputEvents[j].vcalendar.indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) ) {

                vCalendarText += inputEvents[j].vcalendar;
            }
            else {
                vCalendarText += '\r\n'+inputEvents[j].vcalendar;
            }
            futureMode = true;
        }
        else if (deleteMode && $('#futureStart').val().split(';')[0]!='' && $('#futureStart').val().split(';')[1]==inputEvents[j].start) {
            if($('#vcalendarHash').val() == hex_sha256(inputEvents[j].vcalendar)) {
                inputEvents[j].vcalendar = changeRuleForFuture(inputEvents[j], 2);
            }

            if (inputEvents[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) {
                vCalendarText += inputEvents[j].vcalendar.substring(2,inputEvents[j].vcalendar.length);
            }
            else if((inputEvents[j].vcalendar.indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || 
                (inputEvents[j].vcalendar.indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) ) {

                vCalendarText += inputEvents[j].vcalendar;
            }
            else {
                vCalendarText += '\r\n'+inputEvents[j].vcalendar;
            }
        }
        else {
            realEvent = inputEvents[j];
        }
    }

    vCalendarText = vCalendarText.replace(realEvent.vcalendar,'');
    for (var ip=0; ip<eventStringArray.length; ip++) {
        if (eventStringArray[ip].indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) {
            vCalendarText += eventStringArray[ip].substring(2,eventStringArray[ip].length);
        }
        else if((eventStringArray[ip].indexOf('\r\n')==0 && vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) || 
            (eventStringArray[ip].indexOf('\r\n')!=0 && vCalendarText.lastIndexOf('\r\n')==(vCalendarText.length-2)) ) {

            vCalendarText += eventStringArray[ip];
        }
        else {
            vCalendarText += '\r\n'+eventStringArray[ip];
        }
    }
    var origEvent = '';
    if (deleteMode || futureMode) {
        if (vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) {
            vCalendarText += '\r\n';
        }
        if(!isTimeZone && futureMode && origTimezone!='') {
            vCalendarText += origTimezone;
            if (vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2))
                vCalendarText += '\r\n';
        }

        // PRODID
        if (vCalendar.tplM['contentline_PRODID']!=null && (process_elem=vCalendar.tplM['contentline_PRODID'][0])!=undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
            if (parsed[1] != '') {
                // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
            } 
        }
        else {
            process_elem = vCalendar.tplC['contentline_PRODID'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
        }
        process_elem = process_elem.replace('##:::##value##:::##', '-//Inf-IT//'+globalAppName+' '+globalVersion+'//EN');
        vCalendarText += process_elem;
        
        if((typeof vCalendar.tplM['unprocessed']!='undefined') && (vCalendar.tplM['unprocessed']!='') && (vCalendar.tplM['unprocessed']!=null)) {
            vCalendarText += vCalendar.tplM['unprocessed'].replace(RegExp('^\r\n'), '');
        }

        vCalendar.tplM['unprocessed']=new Array();
        // vCalendar END (required by RFC)

        if (vCalendar.tplM['end']!=null && (process_elem=vCalendar.tplM['end'][0])!=undefined) {
            vCalendarText+=vCalendar.tplM['end'][0];
        }
        else {
            process_elem = vCalendar.tplC['end'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            vCalendarText += process_elem;
        }
        if (deleteMode) {
            var fixedArr = checkAndFixMultipleUID(vCalendarText,true);
            var inputS   = fixedArr[0];
            fixedArr.splice(0,1);
            return putVcalendarToCollection(accountUID, inputUID, inputEtag, inputS, delUID, 'vevent', isFormHidden, deleteMode, fixedArr);
        }
        else if (futureMode) {
            origEvent     = vCalendarText;
            vCalendarText = beginVcalendar;
        }
    }

    var timeZoneAttr = '';
    if (typeof globalSessionTimeZone!='undefined' && globalSessionTimeZone) {
        sel_option = globalSessionTimeZone;
    }
    var isUTC = false;

    if(!$('#allday').prop('checked')) {
        if (globalSettings.timezonesupport.value) {
            sel_option = $('#timezone').val();
        }
        //else
        //{
        //  if (inputEvents.length>0)
        //      sel_option=inputEvents[0].timeZone;
        //}

        if (sel_option == 'UTC') {
            isUTC        = true;
            timeZoneAttr = '';
        }
        else if (sel_option == 'local') {
            timeZoneAttr = '';
        }
        else if (sel_option == 'custom') {
            timeZoneAttr = ';'+vcalendarEscapeValue('TZID='+realEvent.timeZone);
        }
        else {
            timeZoneAttr = ';'+vcalendarEscapeValue('TZID='+sel_option);
        }

        var timezoneComponent = '';
        if (globalSettings.rewritetimezonecomponent.value || !vCalendar.tplM['unprocessedVTIMEZONE']) {
            if (tzArray.indexOf(sel_option) == -1) {
                timezoneComponent = buildTimezoneComponent(sel_option);
            }
        }
        else {
            timezoneComponent = vCalendar.tplM['unprocessedVTIMEZONE'];
        }

        if (vCalendarText.lastIndexOf('\r\n')!=(vCalendarText.length-2)) {
            vCalendarText += '\r\n';
        }
            
        vCalendarText += timezoneComponent;
    }

    // ---------------------------------- EVENT ---------------------------------- //
    if (vCalendar.tplM['beginVEVENT']!=null && (process_elem=vCalendar.tplM['beginVEVENT'][0])!=undefined) {
        if (vCalendarText.lastIndexOf('\r\n') == (vCalendarText.length-2)) {
            vCalendarText += vCalendar.tplM['beginVEVENT'][0];
        }
        else {
            vCalendarText += '\r\n'+vCalendar.tplM['beginVEVENT'][0];
        }
        vevent = true;
    }
    else {
        process_elem = vCalendar.tplC['beginVEVENT'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');

        if (vCalendarText.lastIndexOf('\r\n') == (vCalendarText.length-2)) {
            vCalendarText += process_elem;
        }
        else {
            vCalendarText += '\r\n'+process_elem;
        }
        vevent = true;
    }

    var d, utc, d = new Date();
    utc =   d.getUTCFullYear() + (d.getUTCMonth()+1<10 ? '0' : '') + (d.getUTCMonth()+1) + (d.getUTCDate()<10 ? '0' : '') + 
            d.getUTCDate() + 'T' + (d.getUTCHours()<10 ? '0' : '') + d.getUTCHours() + (d.getUTCMinutes()<10 ? '0' : '') + 
            d.getUTCMinutes() + (d.getUTCSeconds()<10 ? '0' : '') + d.getUTCSeconds() + 'Z';
    var create = true;

    if($('#recurrenceID').val() == '') {
        var checkVal = 'orig';
    }
    else {
        var checkVal = $('#recurrenceID').val();
    }

    var created = '';
    for (vev in vCalendar.tplM['contentline_CREATED']) {
        if (vev == checkVal) {
            created = vCalendar.tplM['contentline_CREATED'][vev];
        }
    }
    if (created != '') {
        process_elem = created;
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
        if (parsed[1] != '') {
            // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        }
    }
    else {
        process_elem = vCalendar.tplC['contentline_CREATED'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(utc));
    }
    vCalendarText += process_elem;

    if (vCalendar.tplM['contentline_LM']!=null && (process_elem=vCalendar.tplM['contentline_LM'][0])!=undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
        if (parsed[1] != '') {
            // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        } 
    }
    else {
        process_elem = vCalendar.tplC['contentline_LM'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
    }
    process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(utc));
    vCalendarText += process_elem;

    if (vCalendar.tplM['contentline_DTSTAMP']!=null && (process_elem=vCalendar.tplM['contentline_DTSTAMP'][0])!=undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
        if (parsed[1] != '') {
            // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        }
    }
    else {
        process_elem = vCalendar.tplC['contentline_DTSTAMP'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
    }
    process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(utc));
    vCalendarText += process_elem;

    // UID (required by RFC)
    if($('#futureStart').val()=='' && (operation!='MOVE_IN' && operation!='MOVE_OTHER') && 
        (vCalendar.tplM['contentline_UID']!=null && (process_elem=vCalendar.tplM['contentline_UID'][0]) != undefined)) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
        
        if (parsed[1] != '') {
            // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        } 
    }
    else {
        process_elem = vCalendar.tplC['contentline_UID'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
        // it is VERY small probability, that for 2 newly created vevents/vtodos the same UID is generated (but not impossible :( ...)
        var newUID   = globalEventList.getNewUID();
        process_elem = process_elem.replace('##:::##uid##:::##', newUID);
    }
    vCalendarText += process_elem;

    if (vCalendar.tplM['contentline_SUMMARY']!=null && (process_elem=vCalendar.tplM['contentline_SUMMARY'][0])!=undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
        if (parsed[1] != '') {
            // if group is present, replace the object and related objects' group names 
            process_elem = ('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        }
    }
    else {
        process_elem = vCalendar.tplC['contentline_SUMMARY'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
    }
    process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#name').val()));
    //process_elem=process_elem.replace('##:::##value##:::##',vcalendarEscapeValue('zmena'));
    vCalendarText += process_elem;
    
    if($('#priority').val() != '0') {
        if (vCalendar.tplM['contentline_PRIORITY']!=null && (process_elem=vCalendar.tplM['contentline_PRIORITY'][0])!=undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed=('\r\n'+process_elem).match(RegExp('\r\n((?:'+vCalendar.re['group']+'\\.)?)', 'm'));
            if (parsed[1]!='') // if group is present, replace the object and related objects' group names
                process_elem=('\r\n'+process_elem).replace(RegExp('\r\n'+parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem'+(groupCounter++)+'.').substring(2);
        }
        else {
            process_elem=vCalendar.tplC['contentline_PRIORITY'];
            process_elem=process_elem.replace('##:::##group_wd##:::##', '');
            process_elem=process_elem.replace('##:::##params_wsc##:::##', '');
        }
        process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#priority').val()));
        vCalendarText+=process_elem;
    }
    
    if (vevent) {
        if (($('#repeat').val() != 'no-repeat')&&($('#repeatEvent').val()!="false")) {
            var interval = $("#repeat_interval_detail").val();
            var byDay = '';
            var monthDay = '';
            var bymonth = '';
            var wkst = '';

            if (interval == 1 || interval == '') {
                interval = '';
            } else interval = ";INTERVAL=" + $("#repeat_interval_detail").val();

            var frequency = $('#repeat').val();
            if (frequency == 'TWO_WEEKLY') {
                frequency = 'WEEKLY';
                interval = ";INTERVAL=" + 2;
            } else if (frequency == 'BUSINESS') {
                frequency = 'WEEKLY';
                byDay = ';BYDAY=';
                if (globalSettings.weekenddays.value.length > 0) {
                    for (var i = 0; i < 7; i++)
                        if (globalSettings.weekenddays.value.indexOf(i) == -1)
                            byDay += i + ',';
                    byDay = byDay.substring(0, byDay.length - 1);
                    byDay = byDay.replace(1, 'MO').replace(2, 'TU').replace(3, 'WE').replace(4, 'TH').replace(5, 'FR').replace(6, 'SA').replace(0, 'SU');
                } else {
                    byDay = 'SA,SU';
                }
                interval = '';
            } else if (frequency == 'WEEKEND') {
                frequency = 'WEEKLY';
                byDay = ';BYDAY=';
                if (globalSettings.weekenddays.value.length > 0) {
                    for (var i = 0; i < globalSettings.weekenddays.value.length; i++)
                        byDay += globalSettings.weekenddays.value[i] + ',';
                    byDay = byDay.substring(0, byDay.length - 1);
                    byDay = byDay.replace(1, 'MO').replace(2, 'TU').replace(3, 'WE').replace(4, 'TH').replace(5, 'FR').replace(6, 'SA').replace(0, 'SU');
                } else {
                    byDay = 'SA,SU';
                }
                interval = '';
            } else if (frequency == 'CUSTOM_WEEKLY') {
                frequency = 'WEEKLY';
                var byDayArray = $('#week_custom .customTable td.selected');
                if (byDayArray.length > 0) {
                    byDay = ';BYDAY=';
                    for (var ri = 0; ri < byDayArray.length; ri++)
                        byDay += $(byDayArray[ri]).attr('data-type') + ',';
                    byDay = byDay.substring(0, byDay.length - 1);

                    byDay = byDay.replace(1, 'MO').replace(2, 'TU').replace(3, 'WE').replace(4, 'TH').replace(5, 'FR').replace(6, 'SA').replace(0, 'SU');
                    if (globalSettings.mozillasupport.value == null || !globalSettings.mozillasupport.value)
                        if (realEvent != '') {
                            if (realEvent.wkst != '')
                                wkst = ';WKST=' + realEvent.wkst.replace(1, 'MO').replace(2, 'TU').replace(3, 'WE').replace(4, 'TH').replace(5, 'FR').replace(6, 'SA').replace(0, 'SU');
                        } else
                            wkst = ';WKST=' + globalSettings.datepickerfirstdayofweek.value.toString().replace(1, 'MO').replace(2, 'TU').replace(3, 'WE').replace(4, 'TH').replace(5, 'FR').replace(6, 'SA').replace(0, 'SU');
                }
            } else if (frequency == 'CUSTOM_MONTHLY') {
                frequency = 'MONTHLY';
                var byDayFirstPart = '';
                var monthCustomOption = $('#repeat_month_custom_select').val();
                if (monthCustomOption != 'custom' && $('#repeat_month_custom_select2').val() != 'DAY') {
                    if (monthCustomOption != '')
                        byDay = ';BYDAY=';
                    switch (monthCustomOption) {
                        case 'every':
                            byDayFirstPart = '';
                            break;
                        case 'first':
                            byDayFirstPart = '1';
                            break;
                        case 'second':
                            byDayFirstPart = '2';
                            break;
                        case 'third':
                            byDayFirstPart = '3';
                            break;
                        case 'fourth':
                            byDayFirstPart = '4';
                            break;
                        case 'fifth':
                            byDayFirstPart = '5';
                            break;
                        case 'last':
                            byDayFirstPart = '-1';
                            break;
                        default:
                            byDayFirstPart = '';
                            break;
                    }
                    byDay += byDayFirstPart + $('#repeat_month_custom_select2').val();
                } else if (monthCustomOption != 'custom' && $('#repeat_month_custom_select2').val() == 'DAY') {
                    byDay = '';
                    switch (monthCustomOption) {
                        case 'every':
                            monthDay = ';BYMONTHDAY=';
                            for (var p = 1; p < 32; p++)
                                monthDay += p + ',';
                            monthDay = monthDay.substring(0, monthDay.length - 1);
                            break;
                        case 'first':
                            monthDay = ';BYMONTHDAY=1';
                            break;
                        case 'second':
                            monthDay = ';BYMONTHDAY=2';
                            break;
                        case 'third':
                            monthDay = ';BYMONTHDAY=3';
                            break;
                        case 'fourth':
                            monthDay = ';BYMONTHDAY=4';
                            break;
                        case 'fifth':
                            monthDay = ';BYMONTHDAY=5';
                            break;
                        case 'last':
                            monthDay = ';BYMONTHDAY=-1';
                            break;
                        default:
                            byDayFirstPart = '';
                            monthDay = '';
                            break;
                    }
                } else {
                    var monthDayArray = $('#month_custom2 .selected');
                    if (monthDayArray.length > 0) {
                        monthDay = ';BYMONTHDAY=';
                        for (var ri = 0; ri < monthDayArray.length; ri++)
                            monthDay += $(monthDayArray[ri]).attr('data-type') + ',';
                        monthDay = monthDay.substring(0, monthDay.length - 1);
                    }
                }
            } else if (frequency == 'CUSTOM_YEARLY') {
                frequency = 'YEARLY';
                var byDayFirstPart = '';
                var monthCustomOption = $('#repeat_year_custom_select1').val();

                var monthArray = $('#year_custom3 .selected');
                if (monthArray.length > 0) {
                    bymonth = ';BYMONTH=';
                    for (var ri = 0; ri < monthArray.length; ri++) {
                        var val = parseInt($(monthArray[ri]).attr('data-type'), 10);
                        if (!isNaN(val))
                            bymonth += (val + 1) + ',';
                    }
                    bymonth = bymonth.substring(0, bymonth.length - 1);
                }

                if (monthCustomOption != 'custom' && $('#repeat_year_custom_select2').val() != 'DAY') {
                    if (monthCustomOption != '')
                        byDay = ';BYDAY=';
                    switch (monthCustomOption) {
                        case 'every':
                            byDayFirstPart = '';
                            break;
                        case 'first':
                            byDayFirstPart = '1';
                            break;
                        case 'second':
                            byDayFirstPart = '2';
                            break;
                        case 'third':
                            byDayFirstPart = '3';
                            break;
                        case 'fourth':
                            byDayFirstPart = '4';
                            break;
                        case 'fifth':
                            byDayFirstPart = '5';
                            break;
                        case 'last':
                            byDayFirstPart = '-1';
                            break;
                        default:
                            byDayFirstPart = '';
                            break;
                    }
                    byDay += byDayFirstPart + $('#repeat_month_custom_select2').val();
                } else if (monthCustomOption != 'custom' && $('#repeat_year_custom_select2').val() == 'DAY') {
                    byDay = '';
                    switch (monthCustomOption) {
                        case 'every':
                            monthDay = ';BYMONTHDAY=';
                            for (var p = 1; p < 32; p++)
                                monthDay += p + ',';
                            monthDay = monthDay.substring(0, monthDay.length - 1);
                            break;
                        case 'first':
                            monthDay = ';BYMONTHDAY=1';
                            break;
                        case 'second':
                            monthDay = ';BYMONTHDAY=2';
                            break;
                        case 'third':
                            monthDay = ';BYMONTHDAY=3';
                            break;
                        case 'fourth':
                            monthDay = ';BYMONTHDAY=4';
                            break;
                        case 'fifth':
                            monthDay = ';BYMONTHDAY=5';
                            break;
                        case 'last':
                            monthDay = ';BYMONTHDAY=-1';
                            break;
                        default:
                            byDayFirstPart = '';
                            monthDay = '';
                            break;
                    }
                } else {
                    var monthDayArray = $('#year_custom1 .selected');
                    if (monthDayArray.length > 0) {
                        monthDay = ';BYMONTHDAY=';
                        for (var ri = 0; ri < monthDayArray.length; ri++)
                            monthDay += $(monthDayArray[ri]).attr('data-type') + ',';
                        monthDay = monthDay.substring(0, monthDay.length - 1);
                    }
                }
            }

            if (vCalendar.tplM['contentline_RRULE'] != null && (process_elem = vCalendar.tplM['contentline_RRULE'][0]) != undefined) {
                // replace the object and related objects' group names (+ append the related objects after the processed)
                parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
                if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                    process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
            } else {
                process_elem = vCalendar.tplC['contentline_RRULE'];
                process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
            }

            if ($('#repeat_end_details').val() == "on_date") {
                var dateUntil = $.datepicker.parseDate(globalSettings.datepickerformat.value, $('#repeat_end_date').val());
                var datetime_until = '';
                if (!$('#allday').prop('checked')) {
                    var tForR = new Date(Date.parse("01/02/1990, " + $('#time_from').val()));
                    dateUntil.setHours(tForR.getHours());
                    dateUntil.setMinutes(tForR.getMinutes());
                    dateUntil.setSeconds(tForR.getSeconds());
                    if (globalSettings.timezonesupport.value && sel_option in timezones) {
                        var valOffsetFrom = getOffsetByTZ(sel_option, dateUntil);
                    }
                    if (valOffsetFrom) {
                        var intOffset = valOffsetFrom.getSecondsFromOffset() * 1000 * -1;
                        dateUntil.setTime(dateUntil.getTime() + intOffset);
                    }
                    datetime_until = $.fullCalendar.formatDate(dateUntil, "yyyyMMdd'T'HHmmss'Z'");
                } else {
                    datetime_until = $.fullCalendar.formatDate(dateUntil, 'yyyyMMdd') + 'T000000Z';
                }

                process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue("FREQ=" + frequency) + interval + ";UNTIL=" + datetime_until + bymonth + monthDay + byDay + wkst);
            } else if ($('#repeat_end_details').val() == "after")
                process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue("FREQ=" + frequency) + interval + ";COUNT=" + (parseInt($('#repeat_end_after').val())) + bymonth + monthDay + byDay + wkst);
            else
                process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue("FREQ=" + frequency) + interval + bymonth + monthDay + byDay + wkst);

            vCalendarText += process_elem;

            if (realEvent.repeatStart) {
                var a = $.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_from').val());
                var repeatStart = realEvent.repeatStart;
                var b = new Date(1970, 1, 1, 0, 0, 0);
                if (!$('#allday').prop('checked')) {
                    b = new Date(Date.parse("01/02/1990, " + $('#time_from').val()));
                    a.setHours(b.getHours());
                    a.setMinutes(b.getMinutes());
                    a.setSeconds(b.getSeconds());
                }
                var offsetDate = a - repeatStart;

                for (var iter in vCalendar.tplM['contentline_EXDATE']) {
                    if (isNaN(iter))
                        continue;

                    var exStr = ('\r\n' + vCalendar.tplM['contentline_EXDATE'][iter]).match(vCalendar.pre['contentline_parse']);
                    var exVal = exStr[4].parseComnpactISO8601();
                    if (exVal) {
                        if (exStr[4].indexOf('T') == -1 && !$('#allday').prop('checked')) {
                            //HERE
                            var timePart = new Date(Date.parse("01/02/1990, " + $('#time_from').val()));
                            var time_from = $.fullCalendar.formatDate(b, 'HHmmss');
                            exVal = (exStr[4] + 'T' + time_from).parseComnpactISO8601();
                            if (sel_option != 'local') {
                                var valOffsetFrom = getOffsetByTZ(sel_option, exVal);
                                var intOffset = valOffsetFrom.getSecondsFromOffset() * -1;
                                exVal = new Date(exVal.setSeconds(intOffset));
                            }
                        } else if (exStr[4].indexOf('T') != -1 && !$('#allday').prop('checked')) {
                            if (sel_option != 'local') {
                                var valOffsetFrom = getOffsetByTZ(sel_option, exVal);
                                var origValOffset = getOffsetByTZ(realEvent.timeZone, exVal);
                                var intOffset = (valOffsetFrom.getSecondsFromOffset() - origValOffset.getSecondsFromOffset()) * -1;
                                exVal = new Date(exVal.setSeconds(intOffset));
                            } else {
                                var origValOffset = getOffsetByTZ(realEvent.timeZone, exVal);
                                exVal = new Date(exVal.setSeconds(origValOffset.getSecondsFromOffset()));
                            }
                        }


                        var value = new Date(exVal.getTime() + offsetDate);
                        process_elem = vCalendar.tplC['contentline_EXDATE'];
                        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
                        if (!$('#allday').prop('checked')) {
                            //if (exStr[4].indexOf('T')==-1)
                            //  var newValue=new Date(value.setMinutes(new Date().getTimezoneOffset()));

                            newValue = $.fullCalendar.formatDate(value, "yyyyMMdd'T'HHmmss") + (sel_option != 'local' ? 'Z' : '');
                            process_elem = process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));
                            process_elem = process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
                            process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
                        } else {
                            var newValue = $.fullCalendar.formatDate(value, "yyyyMMdd");
                            process_elem = process_elem.replace('##:::##AllDay##:::##', ';' + vcalendarEscapeValue('VALUE=DATE'));
                            process_elem = process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
                            process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
                        }
                        vCalendarText += process_elem;
                    }
                }
            }
        }

        // -- 读取界面上的提醒信息 --
        if ($('#alertTxt').attr('value') !== '-1,-1,-1') {
            var alarmUniqueArray = new Array();
            var alarmText = '';

            if (vCalendar.tplM['beginVALARM'] != null && (process_elem = vCalendar.tplM['beginVALARM'][0]) != undefined) {
                alarmText += vCalendar.tplM['beginVALARM'][0];
            }
            else {
                process_elem = vCalendar.tplC['beginVALARM'];
                process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                alarmText += process_elem;
                vevent = true;
            }

            var before_time = $("#alertTxt").attr('value');
            var duration = "-P";

            duration += before_time.split(',')[0] + "D";
            duration += "T" + before_time.split(',')[1] + "H";
            duration += before_time.split(',')[2] + "M";


            if (vCalendar.tplM['contentline_TRIGGER'] != null && (process_elem = vCalendar.tplM['contentline_TRIGGER'][0]) != undefined) {
                parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
                if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                    process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
            } 
            else {
                process_elem = vCalendar.tplC['contentline_TRIGGER'];
                process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
            }

            process_elem = process_elem.replace('##:::##VALUE=DATE-TIME##:::##', '');
            process_elem = process_elem.replace('##:::##VALUE=DURATION##:::##', ';VALUE=DURATION');
            process_elem = process_elem.replace('##:::##value##:::##', duration);
            alarmText += process_elem;

            if (vCalendar.tplM['contentline_ACTION'] != null && (process_elem = vCalendar.tplM['contentline_ACTION'][0]) != undefined) {
                parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
                if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                    process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
            } else {
                process_elem = vCalendar.tplC['contentline_ACTION'];
                process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
            }
            process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue('DISPLAY'));
            alarmText += process_elem;
            var a = new Date();
            
            if ((typeof vCalendar.tplM['unprocessedVALARM'] != 'undefined' && typeof vCalendar.tplM['unprocessedVALARM'][0] != 'undefined') && (vCalendar.tplM['unprocessedVALARM'][0] != '') && (vCalendar.tplM['unprocessedVALARM'][0] != null)) {
                tmp = vCalendar.tplM['unprocessedVALARM'][0].replace(RegExp('^\r\n'), '').replace(RegExp('\r\n$'), '');
                if (tmp.indexOf('\r\n') == 0)
                    tmp = tmp.substring(2, tmp.length);
                if (tmp.lastIndexOf('\r\n') != (tmp.length - 2))
                    tmp += '\r\n';
                alarmText += tmp;
            }
            if (vCalendar.tplM['endVALARM'] != null && (process_elem = vCalendar.tplM['endVALARM'][0]) != undefined)
                alarmText += vCalendar.tplM['endVALARM'][0];
            else {
                process_elem = vCalendar.tplC['endVALARM'];
                process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                alarmText += process_elem;
            }
            if (alarmUniqueArray.indexOf(alarmText) == -1) {
                alarmUniqueArray.push(alarmText);
                vCalendarText += alarmText;
            }
        }

        // -------------------------------------------

        vCalendar.tplM['unprocessedVALARM'] = new Array();

        if ($('#avail').val() != 'none') {
            if (vCalendar.tplM['contentline_TRANSP'] != null && (process_elem = vCalendar.tplM['contentline_TRANSP'][0]) != undefined) {
                // replace the object and related objects' group names (+ append the related objects after the processed)
                parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
                if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                    process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
            } else {
                process_elem = vCalendar.tplC['contentline_TRANSP'];
                process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
            }
            if ($('#avail').val() == 'busy')
                process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue('OPAQUE'));
            else
                process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue('TRANSPARENT'));
            vCalendarText += process_elem;
        }

        if ($('#url_EVENT').val() != '') {
            if (vCalendar.tplM['contentline_URL'] != null && (process_elem = vCalendar.tplM['contentline_URL'][0]) != undefined) {
                // replace the object and related objects' group names (+ append the related objects after the processed)
                parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
                if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                    process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
            } else {
                process_elem = vCalendar.tplC['contentline_URL'];
                process_elem = process_elem.replace('##:::##group_wd##:::##', '');
                process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
            }
            process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#url_EVENT').val()));
            vCalendarText += process_elem;
        }
    }

    // 新增事件邀请他人功能，通过新增参数 attendees（数组）来实现。
    if (attendees && attendees.length > 0) {
        vCalendarText += "ORGANIZER:urn:x-uid:" + globalAccountSettings[0].cahref.slice(-37,-1) + "\n";
        // vCalendarText += "ORGANIZER;" + ":MAILTO:user07@example.com\n";
        vCalendarText += "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=CHAIR;PARTSTAT=ACCEPTED:urn:x-uid:" + 
                            globalAccountSettings[0].cahref.slice(-37,-1) + "\n";

        for (var i = 0; i < attendees.length; i++) {
            var userNum = attendees[i]; // 将 uid 改为下标
            vCalendarText += "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:MAILTO:" + 
                                globalUserData[userNum].e_mail + "\n";    
        }
    }

    //DESCRIPTION
    if ($('#note').val() != '') {
        // NOTE
        if (vCalendar.tplM['contentline_NOTE'] != null && (process_elem = vCalendar.tplM['contentline_NOTE'][0]) != undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
            if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
        } else {
            process_elem = vCalendar.tplC['contentline_NOTE'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
        }
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#note').val()));
        vCalendarText += process_elem;
    }

    if ($('#status').val() != 'NONE') {

        //if((value=$('[id="vcalendar_editor"] [data-type="\\%note"]').find('textarea').val())!='')
        //{
        if (vCalendar.tplM['contentline_STATUS'] != null && (process_elem = vCalendar.tplM['contentline_STATUS'][0]) != undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
            if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
        } else {
            process_elem = vCalendar.tplC['contentline_STATUS'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
        }
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#status').val()));
        vCalendarText += process_elem;
    }

    //CLASS
    if ($('#type').val() != '') {
        // CLASS
        if (vCalendar.tplM['contentline_CLASS'] != null && (process_elem = vCalendar.tplM['contentline_CLASS'][0]) != undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
            if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
        } else {
            process_elem = vCalendar.tplC['contentline_CLASS'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
            if (typeof vCalendar.tplM['contentline_CLASS'] == 'undefined' || vCalendar.tplM['contentline_CLASS'] == null || vCalendar.tplM['contentline_CLASS'].length == 0)
                process_elem = '';
        }

        if ($('.row_type').css('display') != 'none') {
            process_elem = vCalendar.tplC['contentline_CLASS'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
            // process_elem=process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#type').val().toUpperCase()));
            process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue('PUBLIC'));
        }
        vCalendarText += process_elem;
    }

    //RECURRENCE-ID
    if ($('#recurrenceID').val()) {
        if (vCalendar.tplM['contentline_REC_ID'] != null && (process_elem = vCalendar.tplM['contentline_REC_ID'][0]) != undefined) {
            // replace the object and related objects' group names (+ append the related objects after the processed)
            parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
            if (parsed[1] != '') // if group is present, replace the object and related objects' group names
                process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
        } else {
            process_elem = vCalendar.tplC['contentline_REC_ID'];
            process_elem = process_elem.replace('##:::##group_wd##:::##', '');
            process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
        }

        var rec_id = $('#recurrenceID').val()
        if (rec_id.indexOf('T') == -1) {
            process_elem = process_elem.replace('##:::##AllDay##:::##', ';' + vcalendarEscapeValue('VALUE=DATE'));
            process_elem = process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
            process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(rec_id));
        } else {
            process_elem = process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));

            /*if((typeof vCalendar.tplM['unprocessed']!='undefined') && (vCalendar.tplM['unprocessed']!='') && (vCalendar.tplM['unprocessed']!=null))
            {
                var checkTZID=vCalendar.tplM['unprocessed'].match(vCalendar.pre['contentline_TZID']);
                if (checkTZID!=null)
                {
                    parsed=checkTZID[0].match(vCalendar.pre['contentline_parse']);
                    process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+parsed[4]));
                }
                else
                    process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+ sel_option));
            }
            else*/

            process_elem = process_elem.replace('##:::##TZID##:::##', timeZoneAttr);
            if (isUTC && rec_id.charAt(rec_id.length - 1) != 'Z')
                rec_id += 'Z';
            process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(rec_id));
        }
        vCalendarText += process_elem;
    }

    if (vCalendar.tplM['contentline_E_DTSTART'] != null && (process_elem = vCalendar.tplM['contentline_E_DTSTART'][0]) != undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
        if (parsed[1] != '') // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
    } else {
        process_elem = vCalendar.tplC['contentline_E_DTSTART'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
    }

    var datetime_from = '',
        datetime_to = '';
    var a = $.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_from').val());
    var a2 = $.datepicker.parseDate(globalSettings.datepickerformat.value, $('#date_to').val());
    var b = new Date(1970, 1, 1, 0, 0, 0);
    if (datetime_from == '')
        datetime_from = $.fullCalendar.formatDate(a, 'yyyyMMdd');

    if (datetime_to == '')
        datetime_to = $.fullCalendar.formatDate(a2, 'yyyyMMdd');

    var dateTo = $.datepicker.parseDate('yymmdd', datetime_to);

    if ($('#allday').prop('checked')) {
        process_elem = process_elem.replace('##:::##AllDay##:::##', ';' + vcalendarEscapeValue('VALUE=DATE'));
        process_elem = process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(datetime_from));
    } else {
        b = new Date(Date.parse("01/02/1990, " + $('#time_from').val()));
        var time_from = $.fullCalendar.formatDate(b, 'HHmmss');
        process_elem = process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));

        /*if((typeof vCalendar.tplM['unprocessed']!='undefined') && (vCalendar.tplM['unprocessed']!='') && (vCalendar.tplM['unprocessed']!=null))
        {
            var checkTZID=vCalendar.tplM['unprocessed'].match(vCalendar.pre['contentline_TZID']);
            if (checkTZID!=null)
            {
                parsed=checkTZID[0].match(vCalendar.pre['contentline_parse']);
                process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+parsed[4]));
            }
            else
                process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+ sel_option));
        }
        else*/
        process_elem = process_elem.replace('##:::##TZID##:::##', timeZoneAttr);
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(datetime_from + 'T' + time_from + (isUTC ? 'Z' : '')));
    }

    vCalendarText += process_elem;

    if (realEvent != '') {
        if (realEvent.type != '') {
            var repeatStart = realEvent.repeatStart;
            a.setHours(b.getHours());
            a.setMinutes(b.getMinutes());
            a.setSeconds(b.getSeconds());
            var changeDate = a;
            var offsetDate = changeDate - repeatStart;
            var realEventUID = realEvent.vcalendar.match(vCalendar.pre['contentline_UID']);

            if (realEventUID != null)
                realEventUID = realEventUID[0].match(vCalendar.pre['contentline_parse'])[4];

            if (offsetDate != 0) {
                var vcalendarOrig = vCalendarText;
                var eventArray = new Array(),
                    backupEventArray = new Array();
                while (vcalendarOrig.match(vCalendar.pre['vevent']) != null) {
                    if (vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VEVENT') - 2, vcalendarOrig.indexOf('BEGIN:VEVENT')) == '\r\n') {
                        var partEvent = vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VEVENT') - 2, vcalendarOrig.indexOf('END:VEVENT') + 'END:VEVENT'.length);
                        vcalendarOrig = vcalendarOrig.replace(partEvent, '');
                    } else {
                        var partEvent = vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VEVENT'), vcalendarOrig.indexOf('END:VEVENT') + 'END:VEVENT'.length);
                        vcalendarOrig = vcalendarOrig.replace(partEvent, '');
                        partEvent += '\r\n';
                    }
                    eventArray[eventArray.length] = partEvent;
                    backupEventArray[backupEventArray.length] = partEvent;
                }
                if (eventArray.length == 0)
                    console.log("Error: '" + inputUID + "': unable to parse vEvent");

                for (var it = 0; it < eventArray.length; it++) {
                    var findUid = eventArray[it].match(vCalendar.pre['contentline_UID']);
                    if (findUid != null) {
                        if (findUid[0].match(vCalendar.pre['contentline_parse'])[4] != realEventUID)
                            continue;
                    }
                    var findRec = eventArray[it].match(vCalendar.pre['contentline_RECURRENCE_ID']);
                    if (findRec != null) {
                        var parsed = findRec[0].match(vCalendar.pre['contentline_parse']);

                        process_elem = vCalendar.tplC['contentline_REC_ID'];
                        process_elem = process_elem.replace('##:::##group_wd##:::##', parsed[1]);
                        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');

                        var value = parsed[4].parseComnpactISO8601();
                        if (value) {
                            value = new Date(value.getTime() + offsetDate)

                            var newValue = $.fullCalendar.formatDate(value, "yyyyMMdd'T'HHmmss");
                            if (isUTC)
                                newValue += 'Z';

                            if ($('#allday').prop('checked')) {
                                newValue = $.fullCalendar.formatDate(value, "yyyyMMdd");
                                process_elem = process_elem.replace('##:::##AllDay##:::##', ';' + vcalendarEscapeValue('VALUE=DATE'));
                                process_elem = process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(''));
                                process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
                            } else {
                                process_elem = process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));

                                /*if((typeof vCalendar.tplM['unprocessed']!='undefined') && (vCalendar.tplM['unprocessed']!='') && (vCalendar.tplM['unprocessed']!=null))
                                {
                                    var checkTZID=vCalendar.tplM['unprocessed'].match(vCalendar.pre['contentline_TZID']);
                                    if (checkTZID!=null)
                                    {
                                        parsed=checkTZID[0].match(vCalendar.pre['contentline_parse']);
                                        process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+parsed[4]));
                                    }
                                    else
                                        process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+ sel_option));
                                }
                                else*/
                                process_elem = process_elem.replace('##:::##TZID##:::##', timeZoneAttr);
                                process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(newValue));
                            }
                            eventArray[it] = eventArray[it].replace(findRec[0], '\r\n' + process_elem);
                        }
                    }
                    vCalendarText = vCalendarText.replace(backupEventArray[it], eventArray[it]);
                }
            }
        }
    }

    if (vCalendar.tplM['contentline_E_DTEND'] != null && (process_elem = vCalendar.tplM['contentline_E_DTEND'][0]) != undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
        if (parsed[1] != '') // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
    } else {
        process_elem = vCalendar.tplC['contentline_E_DTEND'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
    }

    if ($('#allday').prop('checked')) {
        var dateAfter = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate() + 1);
        dateAfter = dateAfter.getFullYear() + '' + ((dateAfter.getMonth() + 1) < 10 ? '0' + (dateAfter.getMonth() + 1) : (dateAfter.getMonth() + 1)) + '' + ((dateAfter.getDate()) < 10 ? '0' + (dateAfter.getDate()) : (dateAfter.getDate()));
        process_elem = process_elem.replace('##:::##AllDay##:::##', ';' + vcalendarEscapeValue('VALUE=DATE'));
        process_elem = process_elem.replace('##:::##TZID##:::##', vcalendarEscapeValue(""));
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(dateAfter));
    } else {
        var b2 = new Date(Date.parse("01/02/1990, " + $('#time_to').val()));
        var time_to = $.fullCalendar.formatDate(b2, 'HHmmss');
        process_elem = process_elem.replace('##:::##AllDay##:::##', vcalendarEscapeValue(''));

        /*if((typeof vCalendar.tplM['unprocessed']!='undefined') && (vCalendar.tplM['unprocessed']!='') && (vCalendar.tplM['unprocessed']!=null))
        {
            var checkTZID=vCalendar.tplM['unprocessed'].match(vCalendar.pre['contentline_TZID']);
            if (checkTZID!=null)
            {
                parsed=checkTZID[0].match(vCalendar.pre['contentline_parse']);
                process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+parsed[4]));
            }
            else
                process_elem=process_elem.replace('##:::##TZID##:::##', ';'+vcalendarEscapeValue("TZID="+sel_option));
        }
        else*/
        process_elem = process_elem.replace('##:::##TZID##:::##', timeZoneAttr);
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue(datetime_to + 'T' + time_to + (isUTC ? 'Z' : '')));
    }
    vCalendarText += process_elem;

    //RFC OPTIONAL
    if (vCalendar.tplM['contentline_LOCATION'] != null && (process_elem = vCalendar.tplM['contentline_LOCATION'][0]) != undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
        if (parsed[1] != '') // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
    } else {
        process_elem = vCalendar.tplC['contentline_LOCATION'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
    }

    if ($('#location').val() != '') {
        process_elem = process_elem.replace('##:::##value##:::##', vcalendarEscapeValue($('#location').val()));
        vCalendarText += process_elem;
    }

    if ($('#recurrenceID').val() == '') {
        var checkVal = 'orig';
    }
    else {
        var checkVal = $('#recurrenceID').val();
    }

    if (typeof vCalendar.tplM['unprocessedVEVENT'] != 'undefined' && vCalendar.tplM['unprocessedVEVENT'] != null) {
        for (vev in vCalendar.tplM['unprocessedVEVENT']) {
            if (vev == checkVal) {
                // vCalendarText += vCalendar.tplM['unprocessedVEVENT'][vev].replace(RegExp('^\r\n'), '');
            }
        }
    }

    //vCalendar.tplM['unprocessedVEVENT']=new Array();

    if (vCalendar.tplM['endVEVENT'] != null && (process_elem = vCalendar.tplM['endVEVENT'][0]) != undefined)
        vCalendarText += vCalendar.tplM['endVEVENT'][0];
    else {
        process_elem = vCalendar.tplC['endVEVENT'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        vCalendarText += process_elem;
    }

    // PRODID
    if (vCalendar.tplM['contentline_PRODID'] != null && (process_elem = vCalendar.tplM['contentline_PRODID'][0]) != undefined) {
        // replace the object and related objects' group names (+ append the related objects after the processed)
        parsed = ('\r\n' + process_elem).match(RegExp('\r\n((?:' + vCalendar.re['group'] + '\\.)?)', 'm'));
        if (parsed[1] != '') // if group is present, replace the object and related objects' group names
            process_elem = ('\r\n' + process_elem).replace(RegExp('\r\n' + parsed[1].replace('.', '\\.'), 'mg'), '\r\nitem' + (groupCounter++) + '.').substring(2);
    } else {
        process_elem = vCalendar.tplC['contentline_PRODID'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        process_elem = process_elem.replace('##:::##params_wsc##:::##', '');
    }
    process_elem = process_elem.replace('##:::##value##:::##', '-//Inf-IT//' + globalAppName + ' ' + globalVersion + '//EN');
    vCalendarText += process_elem;

    if (typeof vCalendar.tplM['unprocessed'] != 'undefined' && vCalendar.tplM['unprocessed'] != '' && vCalendar.tplM['unprocessed'] != null)
        vCalendarText += vCalendar.tplM['unprocessed'].replace(RegExp('^\r\n'), '');

    vCalendar.tplM['unprocessed'] = new Array();
    // vCalendar END (required by RFC)

    if (vCalendar.tplM['end'] != null && (process_elem = vCalendar.tplM['end'][0]) != undefined)
        vCalendarText += vCalendar.tplM['end'][0];
    else {
        process_elem = vCalendar.tplC['end'];
        process_elem = process_elem.replace('##:::##group_wd##:::##', '');
        vCalendarText += process_elem;
    }
    var nextVcalendars = new Array();
    if (futureMode && origEvent != '') {
        var fixed = checkAndFixMultipleUID(origEvent, true);
        if (fixed.length == 1)
            nextVcalendars[nextVcalendars.length] = origEvent;
        else
            nextVcalendars = fixed;
    }
    var fixedArr = checkAndFixMultipleUID(vCalendarText, true);
    fixedArr = $.merge(nextVcalendars, fixedArr);
    var inputS = fixedArr[0];
    fixedArr.splice(0, 1);
    if (operation == 'MOVE_IN') {
        return moveVcalendarToCollection(accountUID, inputUID, inputEtag, inputS, delUID, 'vevent', isFormHidden, deleteMode, fixedArr);
    } else {
        return putVcalendarToCollection(accountUID, inputUID, inputEtag, inputS, delUID, 'vevent', isFormHidden, deleteMode, fixedArr);
    }
}

/** 
 * @desc 选择接受或拒绝邀请事件
 * @author BuptStEve
 * @param {Object} inputEvent 该事件对象
 * @param {Boolean} isAgree 是否同意
 */
function changeVcalendarInvitation(inputEvent, isAgree) {
    var tmp_sp1 = inputEvent.originVcalendar.split('\r\n');
    var tmp_sp2 = "";
    var tmp_output = "";

    for (var i=0; i<tmp_sp1.length; i++) {
        // 查找要修改的字段的位置
        var tmp_regexp = RegExp('urn:x-uid:'+globalAccountSettings[0].cahref.slice(-37,-1)); 

        if (tmp_regexp.test(tmp_sp1[i])) {
            // 找到当前帐号的那一行
            tmp_sp2 = tmp_sp1[i].split(';');

            for (var j=0; j<tmp_sp2.length; j++) {
                // 往回拼接split
                var tmp_str = tmp_sp2[j]; // 暂存可能被修改的字符串

                if (tmp_str.split('=')[0] === "PARTSTAT") {
                    // 查找到了要修改的位置
                    if (isAgree) {
                        // 同意该事件
                        tmp_str = "PARTSTAT=ACCEPTED";
                    } 
                    else {
                        // 拒绝该事件
                        tmp_str = "PARTSTAT=DECLINED";
                    }
                }

                if (j < tmp_sp2.length-1) {
                    tmp_output += tmp_str + ";";
                }
                else {
                    tmp_output += tmp_str;
                }
            }
            tmp_sp1[i] = tmp_output;
            break;
        }
    }

    inputEvent.vcalendar = splitJointString(tmp_sp1, "\r\n");

    var res     = globalAccountSettings[0];
    var tmp     = res.href.match(vCalendar.pre['hrefRex']);
    var origUID = tmp[1]+res.userAuth.userName+'@'+tmp[2];
    
    putVcalendarToCollection(origUID, inputEvent.id, inputEvent.etag, inputEvent.vcalendar, "", "vevent");
}

function splitJointString(arr, split) {
    /* 功能：将被split后的数组，拼接成string
     * 输入：arr: split后的数组, 
     *      split 用于split的字符串:
     * 输出：拼接后的字符串
    */

    var outputstr = "";
    for (var i = 0; i < arr.length; i++) {
        if (i < arr.length - 1) {
            outputstr += arr[i] + split;
        } 
        else {
            outputstr += arr[i];
        }
    }
    return outputstr;
}

function fullVcalendarToData(inputEvent) {
    CalDAVeditor_cleanup();
    var vcalendar = '';
    var rid = inputEvent.id.substring(0, inputEvent.id.lastIndexOf('/') + 1);
    if (globalEventList.events[rid][inputEvent.id].uid != undefined)
        vcalendar = globalEventList.events[rid][inputEvent.id].vcalendar;
    if (!vcalendar)
        return false;

    var vcalendar_full = vcalendar.split('\r\n');

    if ((parsed = ('\r\n' + vcalendar_full[0] + '\r\n').match(vCalendar.pre['contentline_parse'])) == null)
        return false;

    //BEGIN, END VCALENDAR
    vCalendar.tplM['begin'][0] = vCalendar.tplC['begin'].replace(/##:::##group_wd##:::##/g, vcalendar_begin_group = parsed[1]);
    // parsed (contentline_parse)=[1]->"group.", [2]->"name", [3]->";param;param", [4]->"value"
    if ((parsed = ('\r\n' + vcalendar_full[vcalendar_full.length - 2] + '\r\n').match(vCalendar.pre['contentline_parse'])) == null)
        return false;
    // values not directly supported by the editor (old values are kept intact)
    vCalendar.tplM['end'][0] = vCalendar.tplC['end'].replace(/##:::##group_wd##:::##/g, vcalendar_end_group = parsed[1]);

    if (vcalendar_begin_group != vcalendar_end_group)
        return false; // the vCalendar BEGIN and END "group" are different
    // remove the vCalendar BEGIN and END

    vcalendar = '\r\n' + vcalendar_full.slice(1, vcalendar_full.length - 2).join('\r\n') + '\r\n';

    /*
    vcalendar_element=vcalendar.match(vCalendar.pre['tzone']);
    if (vcalendar_element!=null)
        vcalendar=vcalendar.replace(vcalendar_element[0],'');
    */

    //FIX TIMEZONE
    var beginTimeZone = vcalendar.indexOf('BEGIN:VTIMEZONE');
    var startEndTimeZone = vcalendar.lastIndexOf('END:VTIMEZONE');
    var endTimeZone = 0;
    var vTimeZone = '';

    if (beginTimeZone != -1 && startEndTimeZone != -1) {
        for (i = (startEndTimeZone + 2); i < vcalendar.length; i++) {
            if (vcalendar.charAt(i) == '\n') {
                endTimeZone = i + 1;
                break;
            }
        }
        vTimeZone = vcalendar.substring(beginTimeZone, endTimeZone);
        vcalendar = vcalendar.substring(0, beginTimeZone) + vcalendar.substring(endTimeZone, vcalendar.length);
    }

    vcalendar_element = vcalendar.match(RegExp('\r\n' + vCalendar.re['contentline_CALSCALE'], 'mi'));

    if (vcalendar_element != null) {
        parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
        //note=String(vcalendar_element).split(':')[1];
        version = vcalendarUnescapeValue(parsed[4]);
        vCalendar.tplM['contentline_CALSCALE'][0] = vCalendar.tplC['contentline_CALSCALE'];
        vCalendar.tplM['contentline_CALSCALE'][0] = vCalendar.tplM['contentline_CALSCALE'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
        vCalendar.tplM['contentline_CALSCALE'][0] = vCalendar.tplM['contentline_CALSCALE'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
        vcalendar = vcalendar.replace(vcalendar_element[0], '\r\n');

        if (parsed[1] != '') {
            var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
            while ((vcalendar_element_related = vcalendar.match(re)) != null) {
                // append the parameter to its parent
                vCalendar.tplM['contentline_CALSCALE'][0] += vcalendar_element_related[0].substr(2);
                // remove the processed parameter
                vcalendar = vcalendar.replace(vcalendar_element_related[0], '\r\n');
            }
        }
    }

    vcalendar_element = vcalendar.match(RegExp('\r\n' + vCalendar.re['contentline_VERSION'], 'mi'));

    if (vcalendar_element != null) {
        parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
        //note=String(vcalendar_element).split(':')[1];
        version = vcalendarUnescapeValue(parsed[4]);
        vCalendar.tplM['contentline_VERSION'][0] = vCalendar.tplC['contentline_VERSION'];
        vCalendar.tplM['contentline_VERSION'][0] = vCalendar.tplM['contentline_VERSION'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
        vCalendar.tplM['contentline_VERSION'][0] = vCalendar.tplM['contentline_VERSION'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
        vcalendar = vcalendar.replace(vcalendar_element[0], '\r\n');

        if (parsed[1] != '') {
            var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
            while ((vcalendar_element_related = vcalendar.match(re)) != null) {
                // append the parameter to its parent
                vCalendar.tplM['contentline_VERSION'][0] += vcalendar_element_related[0].substr(2);
                // remove the processed parameter
                vcalendar = vcalendar.replace(vcalendar_element_related[0], '\r\n');
            }
        }
    }

    //PRODID
    vcalendar_element = vcalendar.match(RegExp('\r\n' + vCalendar.re['contentline_PRODID'], 'mi'));
    if (vcalendar_element != null) {
        parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

        vCalendar.tplM['contentline_PRODID'][0] = vCalendar.tplC['contentline_PRODID'];
        vCalendar.tplM['contentline_PRODID'][0] = vCalendar.tplM['contentline_PRODID'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
        vCalendar.tplM['contentline_PRODID'][0] = vCalendar.tplM['contentline_PRODID'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
        vcalendar = vcalendar.replace(vcalendar_element[0], '\r\n');
        if (parsed[1] != '') {
            var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
            while ((vcalendar_element_related = vcalendar.match(re)) != null) {
                // append the parameter to its parent
                vCalendar.tplM['contentline_PRODID'][0] += vcalendar_element_related[0].substr(2);
                // remove the processed parameter
                vcalendar = vcalendar.replace(vcalendar_element_related[0], '\r\n');
            }
        }
    }

    var eventArray = new Array();
    while (vcalendar.match(vCalendar.pre['vevent']) != null) {
        var partEvent = vcalendar.substring(vcalendar.indexOf('BEGIN:VEVENT') - 2, vcalendar.indexOf('END:VEVENT') + 'END:VEVENT'.length);
        eventArray[eventArray.length] = partEvent;
        vcalendar = vcalendar.replace(partEvent, '');
    }
    if (eventArray.length == 0)
        console.log("Error: '" + inputEvent.id + "': unable to parse vEvent");

    for (var it = 0; it < eventArray.length; it++) {
        // ------------------------------ VEVENT ------------------------------ //
        var vevent = eventArray[it];
        var vevent_full = vevent.split('\r\n');

        if (vevent == null)
            return false;

        //vcalendar=vcalendar.replace(vevent[0], '\r\n');

        //BEGIN
        if ((parsed = ('\r\nBEGIN:VEVENT\r\n').match(vCalendar.pre['contentline_parse'])) == null)
            return false;
        //BEGIN, END VCALENDAR
        vCalendar.tplM['beginVEVENT'][0] = vCalendar.tplC['beginVEVENT'].replace(/##:::##group_wd##:::##/g, vcalendar_begin_group = parsed[1]);
        // parsed (contentline_parse)=[1]->"group.", [2]->"name", [3]->";param;param", [4]->"value"
        if ((parsed = ('\r\n' + vcalendar_full[vevent_full.length - 2] + '\r\n').match(vCalendar.pre['contentline_parse'])) == null)
            return false;
        // values not directly supported by the editor (old values are kept intact)
        vCalendar.tplM['endVEVENT'][0] = vCalendar.tplC['endVEVENT'].replace(/##:::##group_wd##:::##/g, vcalendar_end_group = parsed[1]);

        if (vcalendar_begin_group != vcalendar_end_group)
            return false; // the vCalendar BEGIN and END "group" are different

        // remove the vCalendar BEGIN and END

        vevent = '\r\n' + vevent_full.slice(2, vevent_full.length - 1).join('\r\n') + '\r\n';
        //SUMMARY
        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_SUMMARY'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            //note=String(vcalendar_element).split(':')[1];
            title = vcalendarUnescapeValue(parsed[4]);
            vCalendar.tplM['contentline_SUMMARY'][0] = vCalendar.tplC['contentline_SUMMARY'];
            vCalendar.tplM['contentline_SUMMARY'][0] = vCalendar.tplM['contentline_SUMMARY'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_SUMMARY'][0] = vCalendar.tplM['contentline_SUMMARY'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_SUMMARY'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_TRANSP'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            //note=String(vcalendar_element).split(':')[1];
            title = vcalendarUnescapeValue(parsed[4]);
            vCalendar.tplM['contentline_TRANSP'][0] = vCalendar.tplC['contentline_TRANSP'];
            vCalendar.tplM['contentline_TRANSP'][0] = vCalendar.tplM['contentline_TRANSP'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_TRANSP'][0] = vCalendar.tplM['contentline_TRANSP'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_TRANSP'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_PRIORITY'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

            //note=String(vcalendar_element).split(':')[1];
            title = vcalendarUnescapeValue(parsed[4]);

            vCalendar.tplM['contentline_PRIORITY'][0] = vCalendar.tplC['contentline_PRIORITY'];
            vCalendar.tplM['contentline_PRIORITY'][0] = vCalendar.tplM['contentline_PRIORITY'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_PRIORITY'][0] = vCalendar.tplM['contentline_PRIORITY'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_PRIORITY'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //LOCATION
        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_LOCATION'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            //note=String(vcalendar_element).split(':')[1];
            title = vcalendarUnescapeValue(parsed[4]);
            vCalendar.tplM['contentline_LOCATION'][0] = vCalendar.tplC['contentline_LOCATION'];
            vCalendar.tplM['contentline_LOCATION'][0] = vCalendar.tplM['contentline_LOCATION'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_LOCATION'][0] = vCalendar.tplM['contentline_LOCATION'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_LOCATION'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //URL
        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_URL'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            //note=String(vcalendar_element).split(':')[1];
            title = vcalendarUnescapeValue(parsed[4]);
            vCalendar.tplM['contentline_URL'][0] = vCalendar.tplC['contentline_URL'];
            vCalendar.tplM['contentline_URL'][0] = vCalendar.tplM['contentline_URL'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_URL'][0] = vCalendar.tplM['contentline_URL'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_URL'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        // ------------------------------ VALARM ------------------------------ //
        var valarm = vevent.match(vCalendar.pre['valarm']);
        if (valarm != null) {
            vevent = vevent.replace(valarm[0], '');
            var alarmString = '';
            var alarmArray = new Array();

            for (var i = 0; i < valarm[0].length; i++) {
                if (valarm[0].substring(i - 'END:VALARM'.length, i) == 'END:VALARM') {
                    alarmArray[alarmArray.length] = alarmString + '\r\n';
                    alarmString = '';
                }
                alarmString += valarm[0][i];
            }

            for (var j = 0; j < alarmArray.length; j++) {
                checkA = alarmArray[j].match(vCalendar.re['valarm']);
                if (checkA != null) {
                    var valarm_full = checkA[0].split('\r\n');

                    //BEGIN
                    if ((parsed = ('\r\n' + valarm_full[0] + '\r\n').match(vCalendar.pre['contentline_parse'])) == null)
                        return false;

                    //BEGIN, END VCALENDAR
                    vCalendar.tplM['beginVALARM'][j] = vCalendar.tplC['beginVALARM'].replace(/##:::##group_wd##:::##/g, vcalendar_begin_group = parsed[1]);

                    // parsed (contentline_parse)=[1]->"group.", [2]->"name", [3]->";param;param", [4]->"value"
                    if ((parsed = ('\r\n' + valarm_full[valarm_full.length - 2] + '\r\n').match(vCalendar.pre['contentline_parse'])) == null)
                        return false;

                    // values not directly supported by the editor (old values are kept intact)
                    vCalendar.tplM['endVALARM'][j] = vCalendar.tplC['endVALARM'].replace(/##:::##group_wd##:::##/g, vcalendar_end_group = parsed[1]);

                    if (vcalendar_begin_group != vcalendar_end_group)
                        return false; // the vCalendar BEGIN and END "group" are different

                    // remove the vCalendar BEGIN and END
                    alarmArray[j] = '\r\n' + valarm_full.slice(1, valarm_full.length - 2).join('\r\n') + '\r\n';

                    trigger = alarmArray[j].match(vCalendar.pre['contentline_TRIGGER']);

                    if (trigger != null) {
                        parsed = (trigger[0] + '\r\n').match(vCalendar.pre['contentline_parse']);

                        vCalendar.tplM['contentline_TRIGGER'][j] = vCalendar.tplC['contentline_TRIGGER'];
                        vCalendar.tplM['contentline_TRIGGER'][j] = vCalendar.tplM['contentline_TRIGGER'][j].replace(/##:::##group_wd##:::##/g, parsed[1]);
                        var pars = vcalendarSplitParam(parsed[3]);
                        var parString = '';
                        for (var i = 0; i < pars.length; i++) {
                            if ((pars[i] != 'VALUE=DATE-TIME') && (pars[i] != 'VALUE=DURATION') && (pars[i] != ''))
                                parString += ';' + pars[i];
                        }
                        vCalendar.tplM['contentline_TRIGGER'][j] = vCalendar.tplM['contentline_TRIGGER'][j].replace(/##:::##params_wsc##:::##/g, parString);
                        alarmArray[j] = alarmArray[j].replace(trigger[0], '');
                        if (parsed[1] != '') {
                            var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                            while ((vcalendar_element_related = vevent.match(re)) != null) {
                                // append the parameter to its parent
                                vCalendar.tplM['contentline_TRIGGER'][j] += vcalendar_element_related[0].substr(2);
                                // remove the processed parameter
                                vevent = vevent.replace(vcalendar_element_related[0], '');
                            }
                        }
                    }
                    note = alarmArray[j].match(vCalendar.pre['contentline_NOTE']);
                    if (note != null) {
                        parsed = note[0].match(vCalendar.pre['contentline_parse']);
                        vCalendar.tplM['contentline_VANOTE'][j] = vCalendar.tplC['contentline_VANOTE'];
                        vCalendar.tplM['contentline_VANOTE'][j] = vCalendar.tplM['contentline_VANOTE'][j].replace(/##:::##group_wd##:::##/g, parsed[1]);
                        vCalendar.tplM['contentline_VANOTE'][j] = vCalendar.tplM['contentline_VANOTE'][j].replace(/##:::##params_wsc##:::##/g, parsed[3]);
                        alarmArray[j] = alarmArray[j].replace(note[0], '\r\n');
                        if (parsed[1] != '') {
                            var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                            while ((vcalendar_element_related = vevent.match(re)) != null) {
                                // append the parameter to its parent
                                vCalendar.tplM['contentline_VANOTE'][0] += vcalendar_element_related[0].substr(2);
                                // remove the processed parameter
                                vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                            }
                        }
                    }
                    action = (alarmArray[j]).match(vCalendar.pre['contentline_ACTION']);

                    if (action != null) {
                        parsed = action[0].match(vCalendar.pre['contentline_parse']);
                        vCalendar.tplM['contentline_ACTION'][j] = vCalendar.tplC['contentline_ACTION'];
                        vCalendar.tplM['contentline_ACTION'][j] = vCalendar.tplM['contentline_ACTION'][j].replace(/##:::##group_wd##:::##/g, parsed[1]);
                        vCalendar.tplM['contentline_ACTION'][j] = vCalendar.tplM['contentline_ACTION'][j].replace(/##:::##params_wsc##:::##/g, parsed[3]);
                        alarmArray[j] = alarmArray[j].replace(action[0], '\r\n');

                        if (parsed[1] != '') {
                            var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                            while ((vcalendar_element_related = vevent.match(re)) != null) {
                                // append the parameter to its parent
                                vCalendar.tplM['contentline_ACTION'][0] += vcalendar_element_related[0].substr(2);
                                // remove the processed parameter
                                vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                            }
                        }
                    }
                    var checkUnprocess = $.trim(alarmArray[j]);

                    if (checkUnprocess != '')
                        vCalendar.tplM['unprocessedVALARM'][j] = alarmArray[j];
                }
            }
        }

        // NOTE
        vcalendar_element = vevent.match(vCalendar.pre['contentline_NOTE']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

            vCalendar.tplM['contentline_NOTE'][0] = vCalendar.tplC['contentline_NOTE'];
            vCalendar.tplM['contentline_NOTE'][0] = vCalendar.tplM['contentline_NOTE'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_NOTE'][0] = vCalendar.tplM['contentline_NOTE'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_NOTE'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //CLASS
        vcalendar_element = vevent.match(vCalendar.pre['contentline_CLASS']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

            vCalendar.tplM['contentline_CLASS'][0] = vCalendar.tplC['contentline_CLASS'];
            vCalendar.tplM['contentline_CLASS'][0] = vCalendar.tplM['contentline_CLASS'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_CLASS'][0] = vCalendar.tplM['contentline_CLASS'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vCalendar.tplM['contentline_CLASS'][0] = vCalendar.tplM['contentline_CLASS'][0].replace(/##:::##value##:::##/g, parsed[4]);

            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_CLASS'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        vcalendar_element = vevent.match(vCalendar.pre['contentline_STATUS']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            title = vcalendarUnescapeValue(parsed[4]);

            vCalendar.tplM['contentline_STATUS'][0] = vCalendar.tplC['contentline_STATUS'];
            vCalendar.tplM['contentline_STATUS'][0] = vCalendar.tplM['contentline_STATUS'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_STATUS'][0] = vCalendar.tplM['contentline_STATUS'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);

            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_STATUS'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //RECURRENCE-ID
        var rec = '';
        vcalendar_element = vevent.match(vCalendar.pre['contentline_RECURRENCE_ID']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            var rec = parsed[4];
            vCalendar.tplM['contentline_REC_ID'][0] = vCalendar.tplC['contentline_REC_ID'];
            vCalendar.tplM['contentline_REC_ID'][0] = vCalendar.tplM['contentline_REC_ID'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            var pars = vcalendarSplitParam(parsed[3]);
            var parString = '';

            for (var i = 0; i < pars.length; i++) {
                if ((pars[i] != 'VALUE=DATE') && (pars[i].indexOf('TZID=') == -1) && (pars[i] != ''))
                    parString += ';' + pars[i];
            }

            vCalendar.tplM['contentline_REC_ID'][0] = vCalendar.tplM['contentline_REC_ID'][0].replace(/##:::##params_wsc##:::##/g, parString);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');
            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_REC_ID'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }
        if (rec == '')
            rec = 'orig';

        //EXDATE
        var i = -1;
        while (vevent.match(vCalendar.pre['contentline_EXDATE']) != null) {
            i++;
            vcalendar_element = vevent.match(vCalendar.pre['contentline_EXDATE']);
            if (vcalendar_element != null) {
                parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

                vCalendar.tplM['contentline_EXDATE'][i] = vCalendar.tplC['contentline_EXDATE'];
                vCalendar.tplM['contentline_EXDATE'][i] = vCalendar.tplM['contentline_EXDATE'][i].replace(/##:::##group_wd##:::##/g, parsed[1]);
                var pars = vcalendarSplitParam(parsed[3]);
                var parString = '',
                    dateStr = '';

                for (var j = 0; j < pars.length; j++) {
                    if (pars[j] != 'VALUE=DATE' && pars[j] != '')
                        parString += ';' + pars[j];
                    if (pars[j] == 'VALUE=DATE')
                        dateStr = pars[j];
                }

                if (dateStr.indexOf('VALUE=DATE') != -1)
                    vCalendar.tplM['contentline_EXDATE'][i] = vCalendar.tplM['contentline_EXDATE'][i].replace(/##:::##AllDay##:::##/g, ';VALUE=DATE');
                else
                    vCalendar.tplM['contentline_EXDATE'][i] = vCalendar.tplM['contentline_EXDATE'][i].replace(/##:::##AllDay##:::##/g, '');

                vCalendar.tplM['contentline_EXDATE'][i] = vCalendar.tplM['contentline_EXDATE'][i].replace(/##:::##TZID##:::##/g, '');
                vCalendar.tplM['contentline_EXDATE'][i] = vCalendar.tplM['contentline_EXDATE'][i].replace(/##:::##params_wsc##:::##/g, parString);
                vCalendar.tplM['contentline_EXDATE'][i] = vCalendar.tplM['contentline_EXDATE'][i].replace(/##:::##value##:::##/g, parsed[4]);
                vevent = vevent.replace(vcalendar_element[0], '\r\n');
                if (parsed[1] != '') {
                    var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                    while ((vcalendar_element_related = vevent.match(re)) != null) {
                        // append the parameter to its parent
                        vCalendar.tplM['contentline_EXDATE'][i] += vcalendar_element_related[0].substr(2);
                        // remove the processed parameter
                        vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                    }
                }
            }
        }
        //END

        vcalendar_element = vevent.match(vCalendar.pre['contentline_DTEND']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            vCalendar.tplM['contentline_E_DTEND'][0] = vCalendar.tplC['contentline_E_DTEND'];
            vCalendar.tplM['contentline_E_DTEND'][0] = vCalendar.tplM['contentline_E_DTEND'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            var pars = vcalendarSplitParam(parsed[3]);
            var parString = '';

            for (var i = 0; i < pars.length; i++) {
                if ((pars[i] != 'VALUE=DATE') && (pars[i].indexOf('TZID=') == -1) && (pars[i] != ''))
                    parString += ';' + pars[i];
            }

            vCalendar.tplM['contentline_E_DTEND'][0] = vCalendar.tplM['contentline_E_DTEND'][0].replace(/##:::##params_wsc##:::##/g, parString);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');
            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_E_DTEND'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //START
        vcalendar_element = vevent.match(vCalendar.pre['contentline_DTSTART']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            vCalendar.tplM['contentline_E_DTSTART'][0] = vCalendar.tplC['contentline_E_DTSTART'];
            vCalendar.tplM['contentline_E_DTSTART'][0] = vCalendar.tplM['contentline_E_DTSTART'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            var pars = vcalendarSplitParam(parsed[3]);
            var parString = '';

            for (var i = 0; i < pars.length; i++) {
                if ((pars[i] != 'VALUE=DATE') && (pars[i].indexOf('TZID=') == -1) && (pars[i] != ''))
                    parString += ';' + pars[i];
            }
            vCalendar.tplM['contentline_E_DTSTART'][0] = vCalendar.tplM['contentline_E_DTSTART'][0].replace(/##:::##params_wsc##:::##/g, parString);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');
            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_E_DTSTART'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //RRULE
        vcalendar_element = vevent.match(vCalendar.pre['contentline_RRULE2']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            vCalendar.tplM['contentline_RRULE'][0] = vCalendar.tplC['contentline_RRULE'];
            vCalendar.tplM['contentline_RRULE'][0] = vCalendar.tplM['contentline_RRULE'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            var pars = parsed[4].split(';');
            var parString = '';

            for (var i = 0; i < pars.length; i++) {
                if ((pars[i].indexOf('FREQ=') == -1) && (pars[i].indexOf('COUNT=') == -1) && (pars[i].indexOf('UNTIL=') == -1) && (pars[i] != '') && (pars[i].indexOf('INTERVAL=') == -1) && (pars[i].indexOf('BYDAY=') == -1) && (pars[i].indexOf('BYMONTHDAY=') == -1) && (pars[i].indexOf('BYMONTH=') == -1) && (pars[i].indexOf('WKST=') == -1))
                    parString += ';' + pars[i];
            }
            vCalendar.tplM['contentline_RRULE'][0] = vCalendar.tplM['contentline_RRULE'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vCalendar.tplM['contentline_RRULE'][0] = vCalendar.tplM['contentline_RRULE'][0].replace(/##:::##value##:::##/g, '##:::##value##:::##' + parString);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');
            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_RRULE'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //UID
        vcalendar_element = inputEvent.vcalendar.match(RegExp('\r\n' + vCalendar.re['contentline_UID'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

            vCalendar.tplM['contentline_UID'][0] = vCalendar.tplC['contentline_UID'];
            vCalendar.tplM['contentline_UID'][0] = vCalendar.tplM['contentline_UID'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_UID'][0] = vCalendar.tplM['contentline_UID'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vCalendar.tplM['contentline_UID'][0] = vCalendar.tplM['contentline_UID'][0].replace(/##:::##uid##:::##/g, parsed[4]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');
            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_UID'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }
        //CREATED
        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_CREATED'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

            vCalendar.tplM['contentline_CREATED'][rec] = vCalendar.tplC['contentline_CREATED'];
            vCalendar.tplM['contentline_CREATED'][rec] = vCalendar.tplM['contentline_CREATED'][rec].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_CREATED'][rec] = vCalendar.tplM['contentline_CREATED'][rec].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vCalendar.tplM['contentline_CREATED'][rec] = vCalendar.tplM['contentline_CREATED'][rec].replace(/##:::##value##:::##/g, parsed[4]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');
            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_CREATED'][rec] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //LAST-MODIFIED
        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_LM'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

            vCalendar.tplM['contentline_LM'][0] = vCalendar.tplC['contentline_LM'];
            vCalendar.tplM['contentline_LM'][0] = vCalendar.tplM['contentline_LM'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_LM'][0] = vCalendar.tplM['contentline_LM'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_LM'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }

        //DTSTAMP
        vcalendar_element = vevent.match(RegExp('\r\n' + vCalendar.re['contentline_DTSTAMP'], 'mi'));
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            vCalendar.tplM['contentline_DTSTAMP'][0] = vCalendar.tplC['contentline_DTSTAMP'];
            vCalendar.tplM['contentline_DTSTAMP'][0] = vCalendar.tplM['contentline_DTSTAMP'][0].replace(/##:::##group_wd##:::##/g, parsed[1]);
            vCalendar.tplM['contentline_DTSTAMP'][0] = vCalendar.tplM['contentline_DTSTAMP'][0].replace(/##:::##params_wsc##:::##/g, parsed[3]);
            vevent = vevent.replace(vcalendar_element[0], '\r\n');

            if (parsed[1] != '') {
                var re = RegExp('\r\n' + parsed[1].replace('.', '\\..*') + '\r\n', 'im');
                while ((vcalendar_element_related = vevent.match(re)) != null) {
                    // append the parameter to its parent
                    vCalendar.tplM['contentline_DTSTAMP'][0] += vcalendar_element_related[0].substr(2);
                    // remove the processed parameter
                    vevent = vevent.replace(vcalendar_element_related[0], '\r\n');
                }
            }
        }
        if (vevent.indexOf('\r\n') == 0)
            vevent = vevent.substring(2, vevent.length - 2);

        if (vevent.lastIndexOf('\r\n') != (vevent.length - 2))
            vevent += '\r\n';

        vCalendar.tplM['unprocessedVEVENT'][rec] = vevent;
    }

    if (vcalendar.indexOf('\r\n') == 0)
        vcalendar = vcalendar.substring(2, vcalendar.length - 2);

    if (vcalendar.lastIndexOf('\r\n') != (vcalendar.length - 2))
        vcalendar += '\r\n';

    //if (vTimeZone!='')
    //  vcalendar+=vTimeZone;
    vCalendar.tplM['unprocessedVTIMEZONE'] = vTimeZone;
    vCalendar.tplM['unprocessed'] = vcalendar;
}

function parseAlarmWeek(value) {
    var durValue = '';
    var durChar = 'W';
    var toSecondsValue = 60 * 60 * 24 * 7;

    value = value.substring(value.indexOf('P') + 1);
    durValue = value.substring(0, value.indexOf(durChar));
    return durValue * toSecondsValue * 1000 + durChar;
}

function parseAlarmDay(value) {
    var durValue = '';
    var durChar = 'D';
    var toSecondsValue = 60 * 60 * 24;
    var returnValue = 0;

    value = value.substring(value.indexOf('P') + 1);
    durValue = value.substring(0, value.indexOf(durChar));
    returnValue = durValue * toSecondsValue * 1000;

    value = value.substring(value.indexOf(durChar + 1));

    if (value.indexOf('T') != -1) {
        durValue = parseAlarmTime(value);
        if (durValue) {
            durChar = durValue.substring(durValue.length - 1);
            durValue = durValue.substring(0, durValue.length - 1);
            returnValue += durValue;
        }
    }
    return returnValue + durChar;
}

function parseAlarmTime(value) {
    var durValue = '';
    var durChar = '';
    var toSecondsValue = 0;
    var returnValue = 0;

    value = value.substring(value.indexOf('T') + 1);
    while (value != '') {
        if (value.indexOf('H') != -1) {
            durChar = 'H';
            toSecondsValue = 60 * 60;
        } else if (value.indexOf('M') != -1) {
            durChar = 'M';
            toSecondsValue = 60;
        } else if (value.indexOf('S') != -1) {
            durChar = 'S';
            toSecondsValue = 1;
        }
        durValue = value.substring(0, value.indexOf(durChar))
        value = value.substring(value.indexOf(durChar) + 1);
        returnValue += durValue * toSecondsValue;
    }
    if (durChar != '')
        return returnValue * 1000 + durChar;
    else
        return false;
}

function getDateFromDay(objComponent, t, disableRecursion, uid) {
    var daylightStartsMonth = objComponent.startMonth - 1,
        daylightStartsDay = objComponent.startDay,
        daylightStartCount = objComponent.startCount,
        daylightStartsHours = objComponent.dtStart.parseComnpactISO8601(uid).getHours(),
        daylightStartsMinutes = objComponent.dtStart.parseComnpactISO8601().getMinutes();
    //daylightStartsDay++;
    if (daylightStartsDay == 7)
        daylightStartsDay = 0;
    var checkDate = new Date(t.getFullYear(), daylightStartsMonth, 1, 23, 59, 0);
    if (disableRecursion)
        checkDate.setFullYear(checkDate.getFullYear() - 1);

    var firstOfMonthDayOfWeek = checkDate.getDay();
    if (firstOfMonthDayOfWeek != daylightStartsDay) {
        var daysUntilFirst = (1 + daylightStartsDay - firstOfMonthDayOfWeek) % 7;
        if (daysUntilFirst <= 0)
            checkDate.setDate(daysUntilFirst + 7);
        else
            checkDate.setDate(daysUntilFirst);
    }

    if (daylightStartCount > 0) {
        var daysUntilDaylight = (parseInt(daylightStartCount) - 1) * 7;
        var dayLightStartDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() + daysUntilDaylight, daylightStartsHours, daylightStartsMinutes);
    } else {
        var tmpLastDay = 21 + checkDate.getDate();
        var checkTmpDay = new Date(t.getFullYear(), daylightStartsMonth, tmpLastDay + 7, 23, 59, 0);

        if (checkTmpDay.getMonth() != daylightStartsMonth)
            var lastDay = tmpLastDay;
        else
            var lastDay = tmpLastDay + 7;

        var daysUntilDaylight = (daylightStartCount + 1) * 7;
        var dayLightStartDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), lastDay + daysUntilDaylight, daylightStartsHours, daylightStartsMinutes);
    }

    if (dayLightStartDate > t && !disableRecursion)
        dayLightStartDate = getDateFromDay(objComponent, t, true).startDate;

    return {
        offsetFrom: objComponent.tzOffsetFROM,
        offsetTo: objComponent.tzOffsetTO,
        startDate: dayLightStartDate
    };
}

function vcalendarToData(inputCollection, inputEvent, isNew) {
    var vcalendarOrig = inputEvent.vcalendar;
    var eventArray    = new Array();

    //CHECK CALSCALE
    var elem = vcalendarOrig.match(vCalendar.pre['contentline_CALSCALE']);
    if (elem != null) {
        calscale = elem[0].match(vCalendar.pre['contentline_parse'])[4];
        if (calscale != 'GREGORIAN') {
            console.log("Error:'" + inputEvent.uid + "': Unsupported calscale in:" + vcalendarOrig);
            return false;
        }
    }

    //CHECK VERSION
    var elemV = vcalendarOrig.match(vCalendar.pre['contentline_VERSION']);
    if (elemV != null) {
        var ver = elemV[0].match(vCalendar.pre['contentline_parse'])[4];
        if (ver != '2.0') {
            console.log("Error:'" + inputEvent.uid + "': Unsupported version (" + ver + ") in:" + vcalendarOrig);
            return false;
        }
    }

    //FIX TIMEZONE
    var beginTimeZone    = vcalendarOrig.indexOf('BEGIN:VTIMEZONE'),
        startEndTimeZone = vcalendarOrig.lastIndexOf('END:VTIMEZONE'),
        endTimeZone      = 0;

    var rid  = inputEvent.uid.substring(0, inputEvent.uid.lastIndexOf('/') + 1),
        evid = inputEvent.uid.substring(inputEvent.uid.lastIndexOf('/') + 1, inputEvent.uid.length);

    var isChange   = false,
        needReload = false;

    if (!isNew) {
        var events = findEventInArray(inputEvent.uid, true);
        if (events != '') {
            if (events.etag != inputEvent.etag) {
                for (var i = 0; i < events.alertTimeOut.length; i++) {
                    clearTimeout(events.alertTimeOut[i]);
                }
                deleteEventFromArray(inputEvent.uid);

                if ($('#show').val() != '') {
                    if ($('#show').val() == inputEvent.uid) {
                        if ($('#repeatEvent').val() == "true" || $('#recurrenceID').val() != '') {
                            var name = globalCalEvent.title;
                            showEventForm(null, null, {title: name, id: inputEvent.uid}, globalJsEvent, 'show', '', true);
                            $('#editAll').css('visibility', 'hidden');
                            $('#editFuture').css('visibility', 'hidden');
                            $('#editOnlyOne').css('visibility', 'hidden');
                            $('#repeatConfirmBoxContent').html('<b>' + name + "</b> " + localization[globalInterfaceLanguage].repeatChangeTxt);
                            $('#repeatConfirmBoxQuestion').html(localization[globalInterfaceLanguage].repeatChangeTxtClose);
                        } else {
                            needReload = true;
                        }
                    }
                }
                isChange = true;
            }
        }
    }

    if ((beginTimeZone != -1) && (startEndTimeZone != -1)) {
        for (i = (startEndTimeZone + 2); i < vcalendarOrig.length; i++) {
            if (vcalendarOrig.charAt(i) == '\n') {
                endTimeZone = i + 1;
                break;
            }
        }
        vTimeZone = vcalendarOrig.substring(beginTimeZone, endTimeZone);
        vcalendar = vcalendarOrig.substring(0, beginTimeZone) + vcalendarOrig.substring(endTimeZone, vcalendarOrig.length);
    }

    /*
    vcalendar_element=vcalendar.match(vCalendar.pre['tzone']);
    if (vcalendar_element!=null)
        vcalendar=vcalendar.replace(vcalendar_element[0],'');
    */
    var recurrence_id_array = new Array();
    while (vcalendarOrig.match(vCalendar.pre['vevent']) != null) {
        if (vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VEVENT') - 2, vcalendarOrig.indexOf('BEGIN:VEVENT')) == '\r\n') {
            var partEvent = vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VEVENT') - 2, vcalendarOrig.indexOf('END:VEVENT') + 'END:VEVENT'.length);
            vcalendarOrig = vcalendarOrig.replace(partEvent, '');
        } else {
            var partEvent = vcalendarOrig.substring(vcalendarOrig.indexOf('BEGIN:VEVENT'), vcalendarOrig.indexOf('END:VEVENT') + 'END:VEVENT'.length);
            vcalendarOrig = vcalendarOrig.replace(partEvent, '');
            partEvent += '\r\n';
        }
        var rec_array = partEvent.match(vCalendar.pre['contentline_RECURRENCE_ID']),
            uidString = partEvent.match(vCalendar.pre['contentline_UID']);

        if (uidString != null && rec_array != null) {
            recurrence_id_array[recurrence_id_array.length] = rec_array[0].match(vCalendar.pre['contentline_parse'])[4] + ';' + uidString[0].match(vCalendar.pre['contentline_parse'])[4];
        }
        eventArray[eventArray.length] = partEvent;
    }
    if (eventArray.length == 0) {
        console.log("Error: '" + inputEvent.uid + "': unable to parse vEvent");
    }

    // 循环处理 eventArray 中的各个事件（从服务器中读取的各个ics），将其放进 displayEventsArray 或其他的数据结构
    for (var evIt = 0; evIt < eventArray.length; evIt++) {
        var intOffset      = 0,
            oo             = '',
            note           = '',
            start          = '',
            end            = '',
            title          = '',
            location       = '',
            frequency      = '',
            interval       = '',
            byMonthDay     = '',
            byDay          = '',
            until          = '',
            valOffsetFrom  = '',
            valOffsetTo    = '',
            realStart      = '',
            realEnd        = '',
            rec_id         = '',
            wkst           = '',
            classType      = '',
            avail          = '',
            hrefUrl        = '',
            stringUID      = '',
            status         = '',
            tzName         = 'local',
            priority       = "0",
            returnForValue = true,
            all            = false,
            isUntilDate    = false,
            isRepeat       = false,
            alertTime      = new Array(),
            alertNote      = new Array(),
            alertTimeOut   = new Array(),
            pars           = new Array();

        var dtStartTimezone = '';
        var dates     = new Array();
        var vcalendar = eventArray[evIt];
        var stringUID = vcalendar.match(vCalendar.pre['contentline_UID']);

        if (stringUID != null) {
            stringUID = stringUID[0].match(vCalendar.pre['contentline_parse'])[4];
        }

        var exDates      = new Array();
        var exDate       = null;
        var exDate_array = new Array();
        var vcalendar2   = vcalendar + '';

        while (vcalendar2.match(vCalendar.pre['contentline_EXDATE']) != null) {
            exDate = vcalendar2.match(vCalendar.pre['contentline_EXDATE']);
            exDate_array[exDate_array.length] = exDate[0];
            vcalendar2 = vcalendar2.replace(exDate, '\r\n');
        }

        vcalendar_element = vcalendar.match(vCalendar.pre['contentline_RRULE2']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
            // || ((parsed[4].indexOf('FREQ=MONTHLY')!=-1||parsed[4].indexOf('FREQ=YEARLY')!=-1)&&parsed[4].indexOf('BYDAY')!=-1)&&parsed[4].search('[0-9]')==-1)
            if (parsed[4].indexOf('BYSETPOS') != -1 || parsed[4].indexOf('BYWEEKNO') != -1) {
                console.log("Error:'" + inputEvent.uid + "': Unsupported recurrence rule in event:" + vcalendar);
                return false;
            }
            pars = parsed[4].split(';');
            var parString = '';

            if (pars.length > 0) {
                isRepeat = true;
            }
            for (var i = 0; i < pars.length; i++) {
                if (pars[i].indexOf('FREQ=') != -1) {
                    frequency = pars[i].split('=')[1];
                }
                else if (pars[i].indexOf('INTERVAL=') != -1) {
                    interval = pars[i].split('=')[1];
                }
                else if (pars[i].indexOf('COUNT=') != -1) {
                    until = pars[i].split('=')[1];
                    if (until == 0) {
                        returnForValue = false;
                        break
                    } else if (isNaN(until)) {
                        returnForValue = false;
                        break
                    }
                } else if (pars[i].indexOf('UNTIL=') != -1) {
                    isUntilDate = true;
                    until = pars[i].split('=')[1];
                    //if (until.indexOf('T')==-1)
                    // until+='T000000Z';

                } else if (pars[i].indexOf('WKST=') != -1) {
                    wkst = pars[i].split('=')[1].replace(/\d*MO/, 1).replace(/\d*TU/, 2).replace(/\d*WE/, 3).replace(/\d*TH/, 4).replace(/\d*FR/, 5).replace(/\d*SA/, 6).replace(/\d*SU/, 0);
                    if (globalSettings.mozillasupport.value != null && globalSettings.mozillasupport.value) {
                        wkst = '';
                    }
                } else if (pars[i].indexOf('BYMONTHDAY=') != -1) {
                    byMonthDay = pars[i].split('=')[1];
                }
                else if (pars[i].indexOf('BYDAY=') != -1) {
                    byDay = pars[i].split('=')[1];
                    byDay = byDay.replace(/\d*MO/, 1).replace(/\d*TU/, 2).replace(/\d*WE/, 3).replace(/\d*TH/, 4).replace(/\d*FR/, 5).replace(/\d*SA/, 6).replace(/\d*SU/, 0).split(',');
                    if (byDay.length > 1 && (frequency == 'MONTHLY' || frequency == 'YEARLY')) {
                        console.log("Error:'" + inputEvent.uid + "': Unsupported recurrence rule in event:" + vcalendar);
                        return false;
                    }
                }
            }
            if (!returnForValue) {
                continue;
            }
            if (!interval) {
                interval = 1;
            }
        }

        var dayLightStartDate, dayLightEndDate, tzObject;
        vcalendar_element = vcalendar.match(vCalendar.pre['contentline_DTSTART']);
        if (vcalendar_element != null) {
            parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);

            start = parsed[4];
            var help1 = start;

            if (help1.indexOf("T") == -1) {
                help1 = help1.substring(0, 4) + '-' + help1.substring(4, 6) + '-' + help1.substring(6, 8);
                all = true;
            } else {
                help1 = help1.substring(0, 4) + '-' + help1.substring(4, 6) + '-' + help1.substring(6, 8) + 'T' + help1.substring(9, 11) + ':' + help1.substring(11, 13) + ':' + help1.substring(13, 15);
                all = false;
            }

            var t = $.fullCalendar.parseDate(help1);
            if (t == null) {
                return false;
            }
            if (t.toString() == 'Invalid Date') {
                return false;
            }

            if (!all) {
                parsed_value = vcalendarSplitParam(parsed[3]);
                for (h = 1; h < parsed_value.length; h++) {
                    if (parsed_value[h] != '') {
                        dtStartTimezone = parsed_value[h];
                    }
                }
                dtStartTimezone = dtStartTimezone.split('=')

                if (start.charAt(start.length - 1) == 'Z') {
                    tzName = 'UTC';
                }
                if (dtStartTimezone.length > 1 || tzName == 'UTC') {
                    if (tzName != 'UTC') {
                        tzName = $.trim(dtStartTimezone[1]);
                    }
                    var finTZ = checkTimezone(tzName);
                    if (finTZ != null) {
                        tzName = finTZ;
                    }
                    if (globalSettings.timezonesupport.value && tzName in timezones) {
                        valOffsetFrom = getOffsetByTZ(tzName, t);
                        intOffset = (getLocalOffset(t) * -1 * 1000) - valOffsetFrom.getSecondsFromOffset() * 1000;
                    }
                } else if (processedTimezones.indexOf(tzName) == -1) {
                    if (timeZonesEnabled.indexOf(tzName) == -1) {
                        timeZonesEnabled.push('local');
                    }
                    processedTimezones.push('local');
                }
                if (tzName != '' && tzName != 'local')
                    if (processedTimezones.indexOf(tzName) == -1) {
                        if (timeZonesEnabled.indexOf(tzName) == -1) {
                            timeZonesEnabled.push(tzName);
                        }
                        processedTimezones.push(tzName);
                    }
            } else {
                tzName = globalSessionTimeZone;
            }
            realStart        = $.fullCalendar.parseDate(help1);
            inputEvent.start = $.fullCalendar.parseDate(help1);
            start            = $.fullCalendar.parseDate(help1);

            if (intOffset) {
                inputEvent.start.setTime(inputEvent.start.getTime() + intOffset);
                start.setTime(start.getTime() + intOffset);
            }
            if (exDate_array != null)
                for (var j = 0; j < exDate_array.length; j++) {
                    var exString = (exDate_array[j] + '\r\n').match(vCalendar.pre['contentline_parse'])[4];
                    if (exString.indexOf('T') != -1 && exString.indexOf('Z') != -1) {
                        var utcTime = exString.parseComnpactISO8601().setSeconds(getLocalOffset(exString.parseComnpactISO8601()) * -1);
                    }
                    else if (exString.indexOf('T') != -1 && exString.indexOf('Z') == -1) {
                        var utcTime = exString.parseComnpactISO8601();
                    }
                    else {
                        if (help1.indexOf('T') != -1)
                            exString += 'T' + $.fullCalendar.formatDate(start, 'HHmmss');

                        var utcTime = exString.parseComnpactISO8601();
                    }
                    exDates[exDates.length] = new Date(utcTime).toString();
                }
            var valarm = vcalendar.match(vCalendar.pre['valarm']);
            if (valarm != null) {
                vcalendar = vcalendar.replace(valarm[0], '');
                var alarmString = '';
                var alarmArray  = new Array();
                for (var i = 0; i < valarm[0].length; i++) {
                    if (valarm[0].substring(i - 'END:VALARM'.length, i) == 'END:VALARM') {
                        alarmArray[alarmArray.length] = alarmString + '\r\n';
                        alarmString = '';
                    }
                    alarmString += valarm[0][i];
                }

                for (var j = 0; j < alarmArray.length; j++) {
                    checkA = alarmArray[j].match(vCalendar.re['valarm']);
                    if (checkA != null) {
                        action = (alarmArray[j]).match(vCalendar.pre['contentline_ACTION']);
                        if (action != null) {
                            parsed = action[0].match(vCalendar.pre['contentline_parse']);
                        }
                        else {
                            break;
                        }

                        trigger = alarmArray[j].match(vCalendar.pre['contentline_TRIGGER']);
                        if (trigger != null) {
                            parsed = (trigger[0] + '\r\n').match(vCalendar.pre['contentline_parse']);

                            if (parsed != null) {
                                value = parsed[4];
                                var checkD     = value.match(vCalendar.pre['date-time-value']);
                                var intOffsetA = '';
                                var tzNameA    = '';

                                if (checkD != null) {
                                    if (parsed[3]) {
                                        var dtStartTimezoneA = parsed[3].split('=');
                                    }
                                    var alarmTimeA = $.fullCalendar.parseDate(value.substring(0, 4) + '-' + value.substring(4, 6) + '-' + value.substring(6, 8) + 'T' + value.substring(9, 11) + ':' + value.substring(11, 13) + ':' + value.substring(13, 15));

                                    if (value.charAt(value.length - 1) == 'Z') {
                                        tzNameA = 'UTC';
                                    }
                                    if (dtStartTimezoneA.length > 1 || tzNameA == 'UTC') {
                                        if (tzNameA != 'UTC' && dtStartTimezoneA[0] == ';TZID') {
                                            tzNameA = $.trim(dtStartTimezoneA[1]);
                                        }
                                        var finTZ = checkTimezone(tzNameA);
                                        if (finTZ != null) {
                                            tzNameA = finTZ;
                                        }
                                        if (globalSettings.timezonesupport.value && tzNameA in timezones) {
                                            var valOffsetFromA = getOffsetByTZ(tzNameA, alarmTimeA);
                                            intOffsetA = getOffsetByTZ(tzName, alarmTimeA).getSecondsFromOffset() * 1000 - valOffsetFromA.getSecondsFromOffset() * 1000;
                                        }
                                    } else if (processedTimezones.indexOf(tzName) == -1) {
                                        if (timeZonesEnabled.indexOf(tzName) == -1) {
                                            timeZonesEnabled.push('local');
                                        }
                                        processedTimezones.push('local');
                                    }
                                    if (tzNameA != '' && tzNameA != 'local') {
                                        if (processedTimezones.indexOf(tzNameA) == -1) {
                                            if (timeZonesEnabled.indexOf(tzNameA) == -1) {
                                                timeZonesEnabled.push(tzNameA);
                                            }
                                            processedTimezones.push(tzNameA);
                                        }
                                    }

                                    if (intOffsetA != '') {
                                        alarmTimeA.setTime(alarmTimeA.getTime() + intOffsetA);
                                    }
                                    alertTime[j] = $.fullCalendar.formatDate(alarmTimeA, "yyyy-MM-dd'T'HH:mm:ss");
                                } else {
                                    alertTime[j] = 0;
                                    if (value.indexOf('W') != -1) {
                                        alertTime[j] = parseAlarmWeek(value);
                                    }
                                    else if (value.indexOf('D') != -1) {
                                        alertTime[j] = parseAlarmDay(value);
                                    }
                                    else if (value.indexOf('T') != -1) {
                                        alertTime[j] = parseAlarmTime(value);
                                    }
                                    if (parsed[4].charAt(0) == "-") {
                                        alertTime[j] = "-" + alertTime[j];
                                    }
                                    else {
                                        alertTime[j] = "+" + alertTime[j];
                                    }
                                }
                            }
                        } else {
                            break;
                        }

                        noteA = alarmArray[j].match(vCalendar.pre['contentline_NOTE']);
                        if (noteA != null) {
                            parsed = noteA[0].match(vCalendar.pre['contentline_parse']);
                            alertNote[j] = parsed[4];
                        } else {
                            alertNote[j] = 'Default note';
                        }
                    }
                }
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_LOCATION']);
            if (vcalendar_element != null) {
                parsed   = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                location = vcalendarUnescapeValue(parsed[4]);
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_NOTE']);
            if (vcalendar_element != null) {
                parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                note   = vcalendarUnescapeValue(parsed[4]);
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_SUMMARY']);
            if (vcalendar_element != null) {
                parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                title  = vcalendarUnescapeValue(parsed[4]);
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_PRIORITY']);
            if (vcalendar_element != null) {
                parsed   = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                priority = vcalendarUnescapeValue(parsed[4]);
            }

            var index = 0;
            for (var p = 0; p < globalResourceCalDAVList.collections.length; p++)
                if (typeof globalResourceCalDAVList.collections[p].uid != 'undefined' && globalResourceCalDAVList.collections[p].uid == inputCollection.uid) {
                    index = p;
                    break;
                }
            var firstPart = index.pad(String(globalResourceCalDAVList.collections.length).length);

            var compareString = (firstPart + title).toLowerCase();

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_CLASS']);
            if (vcalendar_element != null) {
                parsed    = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                classType = vcalendarUnescapeValue(parsed[4]);
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_STATUS']);
            if (vcalendar_element != null) {
                parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                status = vcalendarUnescapeValue(parsed[4]);
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_TRANSP']);
            if (vcalendar_element != null) {
                parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                avail  = vcalendarUnescapeValue(parsed[4]);
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_URL']);
            if (vcalendar_element != null) {
                parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                hrefUrl = vcalendarUnescapeValue(parsed[4]);
            }

            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_RECURRENCE_ID']);
            if (vcalendar_element != null) {
                parsed  = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                var rec = parsed[4];
                /*if (rec.indexOf("T")==-1)
                {
                    rec=rec.substring(0, 4)+'/'+rec.substring(4, 6)+'/'+rec.substring(6, 8);
                    var d=$.fullCalendar.parseDate(rec);
                    var da=new Date(d.getTime()-1*24*60*60*1000);
                    var day=da.getDate();

                    if (day<10)
                        day='0'+day;

                    var month=da.getMonth();
                    month++;
                    if (month<10)
                        month='0'+month;

                    rec=da.getFullYear()+'-'+month+'-'+day;
                }
                else
                    rec=rec.substring(0, 4)+'-'+rec.substring(4, 6)+'-'+rec.substring(6, 8)+'T'+rec.substring(9, 11)+':'+rec.substring(11, 13)+':'+rec.substring(13, 15);
                rec_id=$.fullCalendar.parseDate(rec);*/
                //if(!rec_id || rec_id=='Invalid Date')
                //  rec_id='';
                rec_id = rec;
            }

            var isDuration = false;
            var dur        = 0;
            vcalendar_element = vcalendar.match(vCalendar.pre['contentline_DTEND']);
            if (vcalendar_element != null) {
                parsed = vcalendar_element[0].match(vCalendar.pre['contentline_parse']);
                end = parsed[4];
                var help = end;

                if (help.indexOf("T") == -1) {
                    help   = help.substring(0, 4) + '-' + help.substring(4, 6) + '-' + help.substring(6, 8);
                    var d  = $.fullCalendar.parseDate(help);
                    var da = new Date(d.getTime());

                    if (help1.indexOf("T") == -1) {
                        da.setDate(da.getDate() - 1);
                    }
                    help = $.fullCalendar.formatDate(da, "yyyy-MM-dd");
                    all  = true;
                    if (help1.indexOf("T") != -1) {
                        all = false;
                        help += 'T00:00:00';
                        if (tzName == 'UTC') {
                            help += 'Z';
                        }
                    }
                } else {
                    help = help.substring(0, 4) + '-' + help.substring(4, 6) + '-' + help.substring(6, 8) + 'T' + help.substring(9, 11) + ':' + help.substring(11, 13) + ':' + help.substring(13, 15);
                    all = false;
                }
            } else {
                var checkDur = vcalendar.match(vCalendar.pre['dur-value']);
                if (checkDur != null) {
                    var checkP = (checkDur[0] + '\r\n').match(vCalendar.pre['contentline_parse']);
                    if (checkP != null) {
                        var value = checkP[4];
                        var number = 0;
                        if (value.indexOf('W') != -1) {
                            number = parseAlarmWeek(value);
                        }
                        else if (value.indexOf('D') != -1) {
                            number = parseAlarmDay(value);
                        }
                        else if (value.indexOf('T') != -1) {
                            number = parseAlarmTime(value);
                        }
                        if (parsed[4].charAt(0) == "-") {
                            number = "-" + number;
                        }
                        else {
                            number = "+" + number;
                        }
                        dur = parseInt(number.substring(1, number.length - 1), 10);
                        isDuration = true;
                    }
                }
            }
            if (isDuration) {
                var st = '';
                if (!all) {
                    st = $.fullCalendar.parseDate(help1);
                }
                else {
                    st = $.fullCalendar.parseDate(help1 + 'T00:00:00');
                    //date object mindfuck problem
                    st.setMilliseconds(-1);
                }
                var durDate = new Date(st.getTime() + dur);
                help = $.fullCalendar.formatDate(durDate, "yyyy-MM-dd'T'HH:mm:ss");
            }

            if (typeof help == 'undefined' || help == '' || help == null) {
                help = help1;
            }
            var t1 = $.fullCalendar.parseDate(help);
            if (t1 == null) {
                return false;
            }
            else if (t1.toString() == 'Invalid Date') {
                return false;
            }

            if (!all) {
                if (end.charAt(end.length - 1) == 'Z') {
                    tzName = 'UTC';
                }
                if (dtStartTimezone.length > 1 || tzName == 'UTC') {
                    if (tzName != 'UTC') {
                        tzName = $.trim(dtStartTimezone[1]);
                    }
                    var finTZ = checkTimezone(tzName);
                    if (finTZ != null) {
                        tzName = finTZ;
                    }
                    if (globalSettings.timezonesupport.value && tzName in timezones) {
                        valOffsetFrom = getOffsetByTZ(tzName, t1);
                        intOffset = (getLocalOffset(t1) * -1 * 1000) - valOffsetFrom.getSecondsFromOffset() * 1000;
                    }
                } else if (processedTimezones.indexOf(tzName) == -1) {
                    if (timeZonesEnabled.indexOf(tzName) == -1) {
                        timeZonesEnabled.push('local');
                    }
                    processedTimezones.push('local');
                }
                //realEnd=$.fullCalendar.parseDate(help);
                //help1+=valOffsetFrom;

                if (tzName != '' && tzName != 'local')
                    if (processedTimezones.indexOf(tzName) == -1) {
                        if (timeZonesEnabled.indexOf(tzName) == -1) {
                            timeZonesEnabled.push(tzName);
                        }
                        processedTimezones.push(tzName);
                    }
            } else {
                tzName = globalSessionTimeZone;
            }

            realEnd        = $.fullCalendar.parseDate(help);
            inputEvent.end = $.fullCalendar.parseDate(help);
            end            = $.fullCalendar.parseDate(help);

            if (intOffset) {
                inputEvent.end.setTime(inputEvent.end.getTime() + intOffset);
                end.setTime(end.getTime() + intOffset);
            }
        } else {
            return false;
        }

        if (globalVisibleCalDAVCollections.indexOf(rid) != -1 || isChange || isNew) {
            if (isRepeat) {
                var futureRLimit = new Date(globalToLoadedLimit.getTime())
                futureRLimit.setDate(futureRLimit.getDate() + 14);
                var ruleString = vcalendar.match(vCalendar.pre['contentline_RRULE2'])[0].match(vCalendar.pre['contentline_parse'])[4];
                var isSpecialRule = false;
                if (ruleString.indexOf('BYMONTH=') != -1 || ruleString.indexOf('BYMONTHDAY=') != -1 || ruleString.indexOf('BYDAY=') != -1) {
                    isSpecialRule = true;
                }
                inputEvent.isRepeat = true;
                if (realStart) {
                    var varDate = new Date(realStart.getTime());
                }
                else {
                    var varDate = new Date(start.getTime());
                }

                if (realEnd) {
                    var varEndDate = new Date(realEnd.getTime());
                }
                else {
                    var varEndDate = new Date(end.getTime());
                }

                var lastGenDate = '';
                var repeatStart = new Date(varDate.getTime());
                var repeatEnd = new Date(varEndDate.getTime());
                var untilDate     = '',
                    realUntilDate = '',
                    realUntil     = '';

                if (until !== '') {
                    if (isUntilDate) {
                        if (until.indexOf('T') != -1) {
                            var uString = until.substring(0, 4) + '-' + until.substring(4, 6) + '-' + until.substring(6, 8) + 'T' + until.substring(9, 11) + ':' + until.substring(11, 13) + ':' + until.substring(13, 15);
                            var ut = $.fullCalendar.parseDate(uString);
                            if (ut == null) {
                                return false;
                            }
                            if (ut.toString() == 'Invalid Date') {
                                return false;
                            }
                            if (!all) {
                                if (globalSettings.timezonesupport.value && tzName in timezones) {
                                    valOffsetFrom = getOffsetByTZ(tzName, ut);
                                }
                                if (valOffsetFrom) {
                                    var intOffset = valOffsetFrom.getSecondsFromOffset() * 1000;
                                    ut.setTime(ut.getTime() + intOffset);
                                }
                            }
                            untilDate = new Date(ut.getTime());
                        } else {
                            untilDate = $.fullCalendar.parseDate(until.substring(0, 4) + '-' + until.substring(4, 6) + '-' + until.substring(6, 8));
                            untilDate.setHours(realStart.getHours());
                            untilDate.setMinutes(realStart.getMinutes());
                            untilDate.setSeconds(realStart.getSeconds());
                        }

                        realUntil = '';
                    } else {
                        if (!isSpecialRule) {
                            untilDate = giveMeUntilDate(varDate, until, frequency, interval, all);
                        }
                        realUntil = until;

                    }
                    realUntilDate = untilDate;
                    inputEvent.untilDate = untilDate;
                } else {
                    untilDate            = new Date(futureRLimit.getTime());
                    realUntilDate        = '';
                    inputEvent.untilDate = 'never';
                }
                var repeatCount     = 0,
                    realRepeatCount = 0;
                var monthPlus = 0,
                    dayPlus   = 0;

                if (frequency == "DAILY\r\n" || frequency == "DAILY") {
                    monthPlus = 0,
                    dayPlus   = 1;
                } else if (frequency == "WEEKLY\r\n" || frequency == "WEEKLY") {
                    monthPlus = 0,
                    dayPlus   = 7;
                } else if (frequency == "MONTHLY\r\n" || frequency == "MONTHLY") {
                    monthPlus = 1,
                    dayPlus   = 0;
                } else if (frequency == "YEARLY\r\n" || frequency == "YEARLY") {
                    monthPlus = 12,
                    dayPlus   = 0;
                }

                if (!inputEvent.isDrawn) {
                    if (alertTime.length > 0) {
                        var aTime = '';
                        var now = new Date();
                        if (!inputCollection.ignoreAlarms) {
                            for (var u = 0; u < alertTime.length; u++) {
                                if (alertTime[u].charAt(0) == '-') {
                                    aTime = start.getTime() - parseInt(alertTime[u].substring(1, alertTime[u].length - 1));
                                }
                                else if (alertTime[u].charAt(0) == '+') {
                                    aTime = end.getTime() + parseInt(alertTime[u].substring(1, alertTime[u].length - 1));
                                }
                                else {
                                    aTime = $.fullCalendar.parseDate(alertTime[u]);
                                }

                                if (aTime > now) {
                                    var delay = aTime - now;
                                    if (maxAlarmValue < delay) {
                                        delay = maxAlarmValue;
                                    }
                                    alertTimeOut[alertTimeOut.length] = setTimeout(function() {
                                        showAlertEvents(inputEvent.uid, (aTime - now), {
                                            start: start,
                                            allDay: all,
                                            title: title
                                        });
                                    }, delay);
                                }
                            }
                        } 
                    }

                    realRepeatCount++;
                    var checkRec = false;
                    if (recurrence_id_array.length > 0) {
                        for (var ir = 0; ir < recurrence_id_array.length; ir++) {
                            var recString = recurrence_id_array[ir].split(';')[0];
                            if (recString.charAt(recString.length - 1) == 'Z') {
                                if (globalSettings.timezonesupport.value && tzName in timezones) {
                                    var recValOffsetFrom = getOffsetByTZ(tzName, varDate);
                                    var recTime = new Date(recString.parseComnpactISO8601().getTime());
                                    if (recValOffsetFrom) {
                                        var rintOffset = recValOffsetFrom.getSecondsFromOffset() * 1000;
                                        recTime.setTime(recTime.getTime() + rintOffset);
                                    }
                                    if (recTime.toString() + recurrence_id_array[ir].split(';')[1] == varDate + stringUID) {
                                        checkRec = true;
                                    }
                                }
                            } else {
                                if (recString.parseComnpactISO8601().toString() + recurrence_id_array[ir].split(';')[1] == varDate + stringUID) {
                                    checkRec = true;
                                }
                            }
                        }
                    }
                    if (exDates.length > 0) {
                        if (exDates.indexOf(varDate.toString()) != -1) {
                            checkRec = true;
                        }
                    }
                    if (!checkRec) {
                        repeatCount++;
                        var tmpObj = new items(inputEvent.etag, start, end, title, all, inputEvent.uid, rid, evid, note, inputEvent.displayValue, alertTime, alertNote, realUntilDate, frequency, interval, realUntil, repeatStart, repeatEnd, byMonthDay, repeatCount, realRepeatCount, vcalendar, location, alertTimeOut, tzName, realStart, realEnd, byDay, rec_id, wkst, classType, avail, hrefUrl, compareString, priority, status);
                        globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                    }
                    isFirstTimeRepeat = true;
                }

                var td  = '',
                    td2 = '';
                if (byMonthDay != '' && dayPlus == 0) {
                    byMonthDay = varDate.getDate() + dayPlus;
                }
                var rCount = 0;
                var dayDifference = varEndDate.getTime() - varDate.getTime();
                var iterator = 0;
                var o = 0;
                var lastYear = 0;
                if (isSpecialRule) {
                    if (pars.length > 0) {
                        if (realStart) {
                            var resStart = new Date(realStart.getTime());
                        }
                        else {
                            var resStart = new Date(start.getTime());
                        }

                        if (pars.indexElementOf('BYMONTH=') != -1 && pars.indexElementOf('BYMONTHDAY=') == -1 && pars.indexElementOf('BYDAY=') == -1) {
                            pars[pars.length] = "BYMONTHDAY=" + resStart.getDate();
                        }
                        var objR = processRule(vcalendar, resStart, pars.slice(), [resStart], frequencies.indexOf(frequency), futureRLimit, interval, inputEvent.uid, rCount, resStart, wkst)
                        dates = objR.dates;
                        if (dates.length == 0) {
                            objR.rCount++;
                        }
                        rCount = objR.rCount;
                    }

                    for (var idt = 0; idt < dates.length; idt++) {
                        varDate = new Date(dates[idt].getTime());
                        varEndDate = new Date(varDate.getTime() + dayDifference);
                        if ((varDate.getTime() - futureRLimit) >= 0) {
                            break;
                        }
                        if (untilDate) {
                            var count = untilDate - varDate;
                        }
                        else {
                            var count = until - realRepeatCount;
                        }
                        if (isUntilDate && count < 0 || !isUntilDate && count <= 0) {
                            break;
                        }
                        else {
                            iterator++;
                            if (frequency == "YEARLY") {
                                if (lastYear != varDate.getFullYear()) {
                                    lastYear = varDate.getFullYear();
                                    if (lastYear > 0 && rCount % interval != 0) {
                                        rCount++;
                                        continue;
                                    }
                                    rCount++;
                                }
                            }
                            realRepeatCount++;
                            if (recurrence_id_array.length > 0) {
                                var checkCont = false;
                                for (var ir = 0; ir < recurrence_id_array.length; ir++) {
                                    var recString = recurrence_id_array[ir].split(';')[0];
                                    if (recString.charAt(recString.length - 1) == 'Z') {
                                        if (globalSettings.timezonesupport.value && tzName in timezones) {
                                            var recValOffsetFrom = getOffsetByTZ(tzName, varDate);
                                            var recTime = new Date(recString.parseComnpactISO8601().getTime());
                                            if (recValOffsetFrom) {
                                                var rintOffset = recValOffsetFrom.getSecondsFromOffset() * 1000;
                                                recTime.setTime(recTime.getTime() + rintOffset);
                                            }
                                            if (recTime.toString() + recurrence_id_array[ir].split(';')[1] == varDate + stringUID)
                                                checkCont = true;
                                        }
                                    } else {
                                        if (recString.parseComnpactISO8601().toString() + recurrence_id_array[ir].split(';')[1] == varDate + stringUID)
                                            checkCont = true;
                                    }
                                }
                                if (checkCont)
                                    continue;
                            }
                            if (!all) {
                                var dateStart, dateEnd;
                                if (globalSettings.timezonesupport.value && tzName in timezones)
                                    valOffsetFrom = getOffsetByTZ(tzName, varDate);
                                realStart = new Date(varDate.getTime());
                                dateStart = new Date(realStart.getTime());
                                if (valOffsetFrom) {
                                    intOffset = (getLocalOffset(dateStart) * -1 * 1000) - valOffsetFrom.getSecondsFromOffset() * 1000;
                                    dateStart.setTime(dateStart.getTime() + intOffset);
                                }
                                if (exDates.length > 0)
                                    if (exDates.indexOf(dateStart.toString()) != -1)
                                        continue;
                                realEnd = new Date(varEndDate.getTime());
                                dateEnd = new Date(realEnd.getTime());
                                if (intOffset)
                                    dateEnd.setTime(dateEnd.getTime() + intOffset);
                            } else {
                                realStart = new Date(varDate.getTime());
                                if (exDates.length > 0)
                                    if (exDates.indexOf(realStart.toString()) != -1)
                                        continue;
                                dateStart = $.fullCalendar.formatDate(realStart, "yyyy-MM-dd'T'HH:mm:ss");
                                realEnd = new Date(varEndDate.getTime());
                                dateEnd = $.fullCalendar.formatDate(realEnd, "yyyy-MM-dd'T'HH:mm:ss");
                            }
                            if (alertTime.length > 0) {
                                var repeatAlarm = '',
                                    myVarDate = '',
                                    alertString = '';
                                if (!inputCollection.ignoreAlarms)
                                    for (var v = 0; v < alertTime.length; v++) {
                                        if ((alertTime[v].charAt(0) == '-') || (alertTime[v].charAt(0) == '+')) {
                                            var startTime;
                                            if (alertTime[v].charAt(0) == '-') {
                                                if (typeof dateStart == 'string')
                                                    startTime = $.fullCalendar.parseDate(dateStart);
                                                else
                                                    startTime = new Date(dateStart.getTime());
                                                aTime = startTime.getTime() - parseInt(alertTime[v].substring(1, alertTime[v].length - 1));
                                            } else if (alertTime[v].charAt(0) == '+') {
                                                if (typeof dateEnd == 'string')
                                                    startTime = $.fullCalendar.parseDate(dateEnd);
                                                else
                                                    startTime = new Date(dateEnd.getTime());
                                                aTime = startTime.getTime() + parseInt(alertTime[v].substring(1, alertTime[v].length - 1));
                                            }
                                            var now = new Date();

                                            if (aTime > now) {
                                                var delay = aTime - now;
                                                if (maxAlarmValue < delay)
                                                    delay = maxAlarmValue;

                                                alertTimeOut[alertTimeOut.length] = setTimeout(function(startTime) {
                                                    showAlertEvents(inputEvent.uid, (aTime - now), {
                                                        start: new Date(startTime.getTime()),
                                                        allDay: all,
                                                        title: title
                                                    });
                                                }, delay, startTime);
                                            }
                                        }
                                    }
                            }
                            var checkDateTime = new Date(start.getTime());
                            if (typeof dateStart == 'string')
                                checkDateTime = $.fullCalendar.formatDate(start, "yyyy-MM-dd'T'HH:mm:ss");

                            if ((typeof dateStart == 'object' && (checkDateTime - dateStart) != 0) || (typeof dateStart == 'string' && checkDateTime != dateStart)) {
                                repeatCount++;

                                var tmpObj = new items(inputEvent.etag, dateStart, dateEnd, title, all, inputEvent.uid, rid, evid, note, inputEvent.displayValue, alertTime, alertNote, realUntilDate, frequency, interval, realUntil, repeatStart, repeatEnd, byMonthDay, repeatCount, realRepeatCount, vcalendar, location, alertTimeOut, tzName, realStart, realEnd, byDay, rec_id, wkst, classType, avail, hrefUrl, compareString, priority, status);
                                globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                                lastGenDate = new Date(varDate.getTime());
                            } else
                                realRepeatCount--;
                        }
                    }
                } else {
                    while (true) {

                        var dayNumberStart = varDate.getDate() + dayPlus;
                        var dayNumberEnd = varEndDate.getDate() + dayPlus;

                        if (dayPlus == 0) {
                            if (realStart)
                                dayNumberStart = getValidRepeatDay(varDate, realStart);
                            else
                                dayNumberStart = getValidRepeatDay(varDate, start);

                            if (realEnd)
                                dayNumberEnd = getValidRepeatDay(varEndDate, realEnd);
                            else
                                dayNumberEnd = getValidRepeatDay(varEndDate, end);
                        }

                        if (varEndDate.getDate() >= dayNumberEnd) {
                            varEndDate.setDate(dayNumberEnd);
                            varEndDate.setMonth(varEndDate.getMonth() + monthPlus);
                        } else {
                            varEndDate.setMonth(varEndDate.getMonth() + monthPlus);
                            varEndDate.setDate(dayNumberEnd);
                        }

                        varDate = new Date(varEndDate.getTime() - dayDifference);
                        if (byMonthDay != '' && dayPlus == 0)
                            if (byMonthDay != dayNumberStart)
                                continue;

                        if ((varDate.getTime() - futureRLimit) >= 0)
                            break;

                        var count = untilDate - varDate;
                        if (count < 0)
                            break;
                        else {
                            if (byDay.length > 0)
                                if (byDay.indexOf((varDate.getDay()).toString()) == -1)
                                    continue;
                            iterator++;
                            if ((iterator % interval) != 0)
                                continue;
                            realRepeatCount++;
                            if (recurrence_id_array.length > 0) {
                                var checkCont = false;
                                for (var ir = 0; ir < recurrence_id_array.length; ir++) {
                                    var recString = recurrence_id_array[ir].split(';')[0];
                                    if (recString.charAt(recString.length - 1) == 'Z') {
                                        if (globalSettings.timezonesupport.value && tzName in timezones) {
                                            var recValOffsetFrom = getOffsetByTZ(tzName, varDate);
                                            var recTime = new Date(recString.parseComnpactISO8601().getTime());
                                            if (recValOffsetFrom) {
                                                var rintOffset = recValOffsetFrom.getSecondsFromOffset() * 1000;
                                                recTime.setTime(recTime.getTime() + rintOffset);
                                            }
                                            if (recTime.toString() + recurrence_id_array[ir].split(';')[1] == varDate + stringUID)
                                                checkCont = true;
                                        }
                                    } else {
                                        if (recString.parseComnpactISO8601().toString() + recurrence_id_array[ir].split(';')[1] == varDate + stringUID)
                                            checkCont = true;
                                    }
                                }
                                if (checkCont)
                                    continue;
                            }
                            if (!all) {
                                var dateStart, dateEnd;
                                if (globalSettings.timezonesupport.value && tzName in timezones)
                                    valOffsetFrom = getOffsetByTZ(tzName, varDate);

                                realStart = new Date(varDate.getTime());
                                dateStart = new Date(realStart.getTime());
                                if (valOffsetFrom) {
                                    intOffset = (getLocalOffset(dateStart) * -1 * 1000) - valOffsetFrom.getSecondsFromOffset() * 1000;
                                    dateStart.setTime(dateStart.getTime() + intOffset);
                                }
                                if (exDates.length > 0)
                                    if (exDates.indexOf(dateStart.toString()) != -1)
                                        continue;
                                realEnd = new Date(varEndDate.getTime());
                                dateEnd = new Date(realEnd.getTime());
                                if (intOffset)
                                    dateEnd.setTime(dateEnd.getTime() + intOffset);
                            } else {
                                realStart = new Date(varDate.getTime());
                                dateStart = $.fullCalendar.formatDate(realStart, "yyyy-MM-dd'T'HH:mm:ss");

                                if (exDates.length > 0)
                                    if (exDates.indexOf(realStart.toString()) != -1)
                                        continue;

                                realEnd = new Date(varEndDate.getTime());
                                dateEnd = $.fullCalendar.formatDate(realEnd, "yyyy-MM-dd'T'HH:mm:ss");
                            }
                            if (alertTime.length > 0) {
                                var repeatAlarm = '',
                                    myVarDate = '',
                                    alertString = '';
                                if (!inputCollection.ignoreAlarms)
                                    for (var v = 0; v < alertTime.length; v++) {
                                        if ((alertTime[v].charAt(0) == '-') || (alertTime[v].charAt(0) == '+')) {
                                            var startTime;
                                            if (alertTime[v].charAt(0) == '-') {
                                                if (typeof dateStart == 'string')
                                                    startTime = $.fullCalendar.parseDate(dateStart);
                                                else
                                                    startTime = new Date(dateStart.getTime());
                                                aTime = startTime.getTime() - parseInt(alertTime[v].substring(1, alertTime[v].length - 1));
                                            } else if (alertTime[v].charAt(0) == '+') {
                                                if (typeof dateEnd == 'string')
                                                    startTime = $.fullCalendar.parseDate(dateEnd);
                                                else
                                                    startTime = new Date(dateEnd.getTime());
                                                aTime = startTime.getTime() + parseInt(alertTime[v].substring(1, alertTime[v].length - 1));
                                            }
                                            var now = new Date();

                                            if (aTime > now) {
                                                var delay = aTime - now;
                                                if (maxAlarmValue < delay) {
                                                    delay = maxAlarmValue;
                                                }
                                                
                                                alertTimeOut[alertTimeOut.length] = setTimeout(function(startTime) {
                                                    showAlertEvents(inputEvent.uid, (aTime - now), {
                                                        start: new Date(startTime.getTime()),
                                                        allDay: all,
                                                        title: title
                                                    });
                                                }, delay, startTime);
                                            }
                                        }
                                    }
                            }
                            repeatCount++;
                            var tmpObj = new items(inputEvent.etag, dateStart, dateEnd, title, all, inputEvent.uid, rid, evid, note, inputEvent.displayValue, alertTime, alertNote, realUntilDate, frequency, interval, realUntil, repeatStart, repeatEnd, byMonthDay, repeatCount, realRepeatCount, vcalendar, location, alertTimeOut, tzName, realStart, realEnd, byDay, rec_id, wkst, classType, avail, hrefUrl, compareString, priority, status);

                            globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                        }
                    }
                }
                var checkRepeat = false;
                for (var i = 0; i < globalEventList.repeatable.length; i++)
                    if (globalEventList.repeatable[i].uid == inputEvent.uid) {
                        checkRepeat = true;
                        break;
                    }

                if (!checkRepeat){
                    var tmpObj = {collection: inputCollection,wkst: wkst,lastYear: lastYear,rCount: rCount,rulePartsArray: pars.slice(),lastGenDate: lastGenDate,start: start,end: end,title: title,allDay: all,rid: rid,evid: evid,note: note,displayValue: inputEvent.displayValue,alertTime: alertTime,alertNote: alertNote,frequency: frequency,interval: interval,location: location,realUntil: realUntil,realUntilDate: realUntilDate,repeatStart: repeatStart,repeatEnd: repeatEnd,byMonthDay: byMonthDay,realRepeatCount: realRepeatCount,repeatCount: repeatCount,uid: inputEvent.uid,vcalendar: vcalendar,etag: inputEvent.etag,isDrawn: true,alertTimeOut: alertTimeOut,timeZone: tzName,realStart: realStart,realEnd: realEnd,byDay: byDay,rec_id: rec_id,rec_id_array: recurrence_id_array,exDates: exDates,stringUID: stringUID,classType: classType,avail: avail,hrefUrl: hrefUrl,compareString: compareString,priority: priority,status: status
                    };
                    globalEventList.repeatable.splice(globalEventList.repeatable.length, 0, tmpObj);
                }
            } 
            else {
                if (alertTime.length > 0) {
                    var aTime = '';
                    var now = new Date();
                    if (!inputCollection.ignoreAlarms)
                        for (var u = 0; u < alertTime.length; u++) {
                            if (alertTime[u].charAt(0) == '-')
                                aTime = start.getTime() - parseInt(alertTime[u].substring(1, alertTime[u].length - 1));
                            else if (alertTime[u].charAt(0) == '+')
                                aTime = end.getTime() + parseInt(alertTime[u].substring(1, alertTime[u].length - 1));
                            else
                                aTime = $.fullCalendar.parseDate(alertTime[u]);

                            if (aTime > now) {
                                var delay = aTime - now;
                                if (maxAlarmValue < delay)
                                    delay = maxAlarmValue;
                                alertTimeOut[alertTimeOut.length] = setTimeout(function() {
                                    showAlertEvents(inputEvent.uid, (aTime - now), {
                                        start: start,
                                        allDay: all,
                                        title: title
                                    });
                                }, delay);
                            }
                        }
                }

                var tmpObj = new items(inputEvent.etag, start, end, title, all, inputEvent.uid, rid, evid, note, inputEvent.displayValue, alertTime, alertNote, '', '', '', '', '', '', '', '', '', vcalendar, location, alertTimeOut, tzName, realStart, realEnd, byDay, rec_id, wkst, classType, avail, hrefUrl, compareString, priority, status);

                if (isChange) {
                    if (needReload) {
                        showEventForm(null, null, tmpObj, globalJsEvent, 'show', '');
                    }
                }

                // -- 新增属性邀请事件、新增判断订阅的他人日历 --
                tmpObj.isInvitation = inputEvent.isInvitation;

                if (!inputCollection.isSubscribed) {
                    // 当前日历为我的日历
                    if (tmpObj.isInvitation) {
                        // 如果是邀请事件，则添加相关属性，并判断邀请状态
                        tmpObj.isOrganizer       = inputEvent.isOrganizer;
                        tmpObj.organizerData     = inputEvent.organizerData;
                        tmpObj.acceptedAttendees = inputEvent.acceptedAttendees;
                        tmpObj.declinedAttendees = inputEvent.declinedAttendees;
                        tmpObj.unknownAttendees  = inputEvent.unknownAttendees;
                        tmpObj.originVcalendar   = inputEvent.vcalendar;

                        if (!tmpObj.isOrganizer) {
                            // 自己在邀请事件中作为参与者，在未响应和已同意状态数组中寻找自己
                            if (matchObjectArrayByProp(tmpObj.unknownAttendees, globalAccountSettings[0].cahref.slice(-37,-1), 'uid')) {
                                // 在未响应数组中找到了，将其放入 displayEventsArray 数组,并将其在界面中的 div#invitationEventBox 中的他人邀请中显示出来
                                displayInvitation(true, true, false, '', tmpObj);
                            } 
                            else if (matchObjectArrayByProp(tmpObj.acceptedAttendees, globalAccountSettings[0].cahref.slice(-37,-1), 'uid')) {
                                // 在已同意数组中找到了，将其放入 displayEventsArray 数组,并将其在界面中的 div#invitationEventBox 中的已回复邀请中显示出来
                                globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                                displayInvitation(false, true, true, '', tmpObj);
                            } 
                            else if (matchObjectArrayByProp(tmpObj.declinedAttendees, globalAccountSettings[0].cahref.slice(-37,-1), 'uid')) {
                                // 在已拒绝数组中找到了，「不」将其放入 displayEventsArray 数组,并将其在界面中的 div#invitationEventBox 中的已回复邀请中显示出来
                                displayInvitation(false, true, false, '', tmpObj);
                            }
                            else {
                                alert('Cannot find the Obj, please check...');
                            }
                        }
                        else {
                            // 自己在邀请事件中作为发起者，将拒绝的用户保存下来
                            globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                            for (var i = 0; i < tmpObj.declinedAttendees.length; i++) {
                                displayInvitation(true, false, false, tmpObj.declinedAttendees[i].CN, tmpObj);
                            }
                        }                
                    } 
                    else {
                        globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                    }
                }
                else {
                    // 当前日历为他人日历
                    if (tmpObj.isInvitation) {
                        // 如果是邀请事件，则添加相关属性，并判断邀请状态
                        tmpObj.organizerData     = inputEvent.organizerData;
                        tmpObj.acceptedAttendees = inputEvent.acceptedAttendees;
                        tmpObj.declinedAttendees = inputEvent.declinedAttendees;
                        tmpObj.unknownAttendees  = inputEvent.unknownAttendees;
                        tmpObj.originVcalendar   = inputEvent.vcalendar;
                        if (inputEvent.organizerData.uid === inputCollection.origin_uid) {
                            // 订阅的他人日历中的事件，
                            tmpObj.isOrganizer = true;
                        }
                        else {
                            tmpObj.isOrganizer = false;
                        }

                        if (!tmpObj.isOrganizer) {
                            // 被订阅者在邀请事件中作为参与者，在未响应和已同意状态数组中寻找被订阅者
                            if (matchObjectArrayByProp(tmpObj.unknownAttendees, inputCollection.origin_uid, 'uid')) {
                                // 在未响应数组中找到了，暂无操作
                            } 
                            else if (matchObjectArrayByProp(tmpObj.acceptedAttendees, inputCollection.origin_uid, 'uid')) {
                                // 在已同意数组中找到了，将其放入 displayEventsArray 数组
                                globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                            } 
                            else if (matchObjectArrayByProp(tmpObj.declinedAttendees, inputCollection.origin_uid, 'uid')) {
                                // 在已拒绝数组中找到了，暂无操作
                            }
                            else {
                                alert('Cannot find the Obj, please check...');
                            }
                        }
                        else {
                            // 被订阅者在邀请事件中作为发起者显示该事件，暂无操作
                            globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                        }                
                    } 
                    else {
                        globalEventList.displayEventsArray[rid].splice(globalEventList.displayEventsArray[rid].length, 0, tmpObj);
                    }
                }
            }
        }
    }
    inputEvent.isDrawn = true;
}

/** 
 * @desc 在由对象组成的数组中，根据 prop 匹配 tar
 * @author BuptStEve
 * @param {Array} arr 由对象组成的数组
 * @param {String} tar 匹配对象
 * @param {String} prop 匹配的参数
 * @return {Boolean} isFound 是否在数组中找到目标
 */
function matchObjectArrayByProp(arr, tar, prop) {
    var isFound = false;    

    for (var i = 0; i < arr.length; i++) {
        if (arr[i][prop] === tar) {
            isFound = true;
            break;
        }
    }    
    return isFound;
}

/** 
 * @desc 在由对象组成的数组中，根据 prop 匹配，若匹配成功则返回下标
 * @author BuptStEve
 * @param {Array} arr 由对象组成的数组
 * @param {String} tar 匹配对象
 * @param {String} prop 匹配的参数
 * @return {Number} index 在数组的下标，没有则返回 -1
 */
function searchObjectArrayByProp(arr, tar, prop) {
    var index = -1;    

    for (var i = 0; i < arr.length; i++) {
        if (arr[i][prop] === tar) {
            index = i;
            break;
        }
    }    
    return index;
}

/** 
 * @desc 将邀请事件数据保存
 * @author BuptStEve
 * @param {Boolean} isNew 是否是需要响应事件
 * @param {Boolean} isOthers 是否是他人事件
 * @param {Boolean} isAgreed 是否是已经同意（仅当 isNew === false）
 * @param {String} declinedUser 拒绝的 User
 * @param {Object} eventObj 事件对象
 */
function displayInvitation(isNew, isOthers, isAgreed, declinedUser, eventObj) {
    // 1. 生成时间字段 
        var tmp_time_txt = "";
        if (eventObj.allDay) {
            // 该事件为全天事件，格式为：2015年10月10日 全天
            var s_time = new Date(eventObj.start);   
            var s_month_fix = s_time.getMonth() + 1;     
            tmp_time_txt = s_time.getFullYear() + "年" + s_month_fix + "月" + s_time.getDate() + "日 全天";
        }
        else {
            var s_time = new Date(eventObj.start);        
            var e_time = new Date(eventObj.end);
            var s_minute_fix = "0";
            var e_minute_fix = "0";
            var s_month_fix = s_time.getMonth() + 1;
            var e_month_fix = e_time.getMonth() + 1;
            if (s_time.getMinutes() === 0) {
                s_minute_fix = "00";
            }
            if (e_time.getMinutes() === 0) {
                e_minute_fix = "00";
            }

            if (s_time.getFullYear()===e_time.getFullYear() && s_month_fix===e_month_fix && s_time.getDate()===e_time.getDate()) {
                // 该事件在一天内完成，格式为：2015年10月10日 10:00 - 12:00
                tmp_time_txt = s_time.getFullYear() + "年" + s_month_fix + "月" + s_time.getDate() + "日 " + 
                               s_time.getHours() + ":" + s_minute_fix + " - " + e_time.getHours() + ":" + e_minute_fix;
            } 
            else {
                // 该事件涉及多天，格式为：2015年10月10日 10:00 - 2015年10月11日 12:00
                tmp_time_txt = s_time.getFullYear() + "年" + s_month_fix + "月" + s_time.getDate() + "日 " + s_time.getHours() + ":" + s_minute_fix + " - " +
                             + e_time.getFullYear() + "年" + e_month_fix + "月" + e_time.getDate() + "日 " + e_time.getHours() + ":" + e_minute_fix;
            }
        }
        var tmp_obj = {
            compView: '',
            uid: eventObj.id,
            title: eventObj.title,
            time: tmp_time_txt,
            user: eventObj.organizerData.CN,
            head: true,
            color: globalDefaultCalendar.ecolor,
            obj: eventObj
        }

    // 2. 插入数据
        if (isNew) {
            // 2.1. 加入左侧
            if (isOthers) {
                // 他人事件的新事件邀请
                tmp_obj.compView = 'invitationComp';
                InvitationEventBox.partNewItems.unshift(tmp_obj);
            } 
            else {
                // 我的事件，但被他人拒绝
                tmp_obj.compView = 'responseComp';
                tmp_obj.user = declinedUser;
                InvitationEventBox.partNewItems.unshift(tmp_obj);            
            }
        }
        else {
            // 2.2. 加入右侧
            tmp_obj.compView = 'oldInvitationComp';
            if (isAgreed) {
                // 已同意
                tmp_obj.mode = 'agreed';
            } 
            else {
                // 已拒绝
                tmp_obj.mode = 'declined';
            }
            InvitationEventBox.partOldItems.push(tmp_obj); 
        }

    // 新增提示消息条目
    displayNewInvitationNumber(InvitationEventBox.partNewItems.length);
}

/** 
 * @desc 新增提示消息条目函数，将新消息的数目显示在界面上 
 * @author BuptStEve
 * @param {Number} len
 * @return {null} null
 * @example null
 */
function displayNewInvitationNumber(len) {
    if (typeof(len) !== 'number' || len < 0) {
        alert('len is not a corret number! please check...');
        return;
    }

    if (len === 0) {
        $("#newInvitationNum").text('');
        $("#newInvitationNum").removeClass();
    } 
    else if (len < 10) {
        $("#newInvitationNum").text(len);
        $("#newInvitationNum").removeClass();
        $("#newInvitationNum").addClass('singleDigit');
    }
    else if (len < 100) {
        $("#newInvitationNum").text(len);
        $("#newInvitationNum").removeClass();
        $("#newInvitationNum").addClass('doubleDigit');
    }
    else {
        $("#newInvitationNum").text('...');
        $("#newInvitationNum").removeClass();
        $("#newInvitationNum").addClass('doubleDigit');
    }
}

function notRFCDataToRFCData(vcalendarString) {
    // If vCalendar contains only '\n' instead of '\r\n' we correct this
    if (vcalendarString.match(RegExp('\r', 'm')) == null)
        vcalendarString = vcalendarString.replace(RegExp('\n', 'gm'), '\r\n');

    // remove multiple empty lines
    vcalendarString = vcalendarString.replace(RegExp('(\r\n)+', 'gm'), '\r\n');

    // remove line folding
    vcalendarString = vcalendarString.replace(RegExp('\r\n' + vCalendar.re['WSP'], 'gm'), '');

    // append '\r\n' to the end of the vCalendar if missing
    if (vcalendarString[vcalendarString.length - 1] != '\n') {
        vcalendarString += '\r\n';
    }

    return vcalendarString;
}


function vCalendarCleanup(vcalendarString) {
    vcalendarString = notRFCDataToRFCData(vcalendarString);
    return vcalendarString;
}

