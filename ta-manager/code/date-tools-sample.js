Number.prototype.mod = function (n) { // Fixes a bug with the JavaScript modulo operator where it will return a negative value for a negative number.
    return ((this % n) + n) % n;
};

var dateTools = (function () {
    var convertDateToTerm = function (date) {
        if (!date) {
            return '';
        } else if (date.getMonth() < 4) {
            return 'Winter';
        } else if (date.getMonth() < 8) {
            return 'Summer';
        } else {
            return 'Fall';
        }
    };

    var convertDateToTermYear = function (date) {
        return !!date ? convertDateToTerm(date) + ', ' + date.getFullYear() : '';
    };

    var startDateTermDictionary = {
        'WINTER': '01-01',
        'SUMMER': '05-01',
        'FALL': '09-01'
    };

    var endDateTermDictionary = {
        'WINTER': '04-30',
        'SUMMER': '08-31',
        'FALL': '12-31'
    };

    var buildStartDatePgpString = function (term, year) {
        if (!term || !year) {
            return '';
        } else {
            return year + '-' + startDateTermDictionary[term.toUpperCase()];
        }
    };

    var buildEndDatePgpString = function (term, year) {
        if (!term || !year) {
            return '';
        } else {
            return year + '-' + endDateTermDictionary[term.toUpperCase()];
        }
    };

    // Converts to JS Date object to string of format "YYYY-MM-DD"
    var convertDateToPgpString = function (date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        return year + '-' + month + '-' + day;
    };

    // Takes dates of format "YYYY-MM-DD" from PostgreSQL and returns a JS Date object
    var convertPgpStringToDate = function (dateString) {
        var date = new Date(dateString);
        date.setDate(date.getMonth() + 1);
        return date;
    };

    // Takes start and end date PostgreSQL strings and finds the amount of terms between them.
    var convertDateRangeToTermCount = function (startDate, endDate) {
        startDate = convertPgpStringToDate(startDate);
        endDate = convertPgpStringToDate(endDate);
        var startDateTerm = convertDateToTerm(startDate);
        var endDateTerm = convertDateToTerm(endDate);
        var startDateYear = startDate.getFullYear();
        var endDateYear = endDate.getFullYear();
        var termDict = {
            'WINTER': 0,
            'SUMMER': 1,
            'FALL': 2
        };
        return 3 * (endDateYear - startDateYear) + (termDict[endDateTerm.toUpperCase()] - termDict[startDateTerm.toUpperCase()]) + 1;
    };

    // Takes date strings in objects like { startDate: ___, endDate: ___ }
    var doDateRangesOverlap = function (range1, range2) {
        range1.startDate = convertPgpStringToDate(range1.startDate);
        range1.endDate = convertPgpStringToDate(range1.endDate);
        range2.startDate = convertPgpStringToDate(range2.startDate);
        range2.endDate = convertPgpStringToDate(range2.endDate);

        return (range2.startDate >= range1.startDate && range2.startDate <= range1.endDate) 
            || (range2.endDate >= range1.startDate && range2.endDate <= range1.endDate) 
            || (range2.startDate <= range1.startDate && range2.endDate >= range1.endDate);
    };

    var convertPgpStringToTermYear = function (dateString) {
        convertDateToTermYear(convertPgpStringToDate(dateString));
        return convertDateToTermYear(convertPgpStringToDate(dateString));
    };

    // Takes date strings in objects like { startDate: ___, endDate: ___ }.  Completely empty date ranges are also valid.
    var isDateRangeValid = function (startDate, endDate) {
        var startDateObj = convertPgpStringToDate(buildStartDatePgpString(startDate.term, startDate.year));
        var endDateObj = convertPgpStringToDate(buildEndDatePgpString(endDate.term, endDate.year));

        return ((startDate.term && startDate.year && endDate.term && endDate.year) || (!startDate.term && !startDate.year && !endDate.term && !endDate.year))
            && (startDateObj < endDateObj);
    };

    var dateTools = {};
    dateTools.convertDateToTerm = convertDateToTerm;
    dateTools.convertDateToTermYear = convertDateToTermYear;
    dateTools.convertDateToPgpString = convertDateToPgpString;
    dateTools.convertPgpStringToDate = convertPgpStringToDate;
    dateTools.buildStartDatePgpString = buildStartDatePgpString;
    dateTools.buildEndDatePgpString = buildEndDatePgpString;
    dateTools.convertDateRangeToTermCount = convertDateRangeToTermCount;
    dateTools.doDateRangesOverlap = doDateRangesOverlap;
    dateTools.convertPgpStringToTermYear = convertPgpStringToTermYear;
    dateTools.isDateRangeValid = isDateRangeValid;
    return dateTools;
}());

var module = module || {};
module.exports = dateTools;