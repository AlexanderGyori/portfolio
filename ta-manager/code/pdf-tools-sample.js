var pdfTools = (function () {
    var getTaReportInfo = function (userId, onSuccess) {
        var xhttp1 = new XMLHttpRequest();
        xhttp1.open("GET", "getAllCoursesForTa?userId=" + userId, true);
        xhttp1.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var courses = xhttp1.responseText ? JSON.parse(xhttp1.responseText) : [];
                var xhttp2 = new XMLHttpRequest();
                xhttp2.open("GET", "getAllSupervisorsForTa?userId=" + userId, true);
                xhttp2.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        var supervisors = xhttp2.responseText ? JSON.parse(xhttp2.responseText) : [];
                        var xhttp3 = new XMLHttpRequest();
                        xhttp3.open("GET", "getTa?userId=" + userId, true);
                        xhttp3.onreadystatechange = function () {
                            if (this.readyState === 4 && this.status === 200) {
                                var ta = xhttp3.responseText ? JSON.parse(xhttp3.responseText) : [];
                                ta = ta.length ? ta[0] : {};
                                onSuccess && onSuccess(ta, courses, supervisors);
                            }
                        };
                        xhttp3.send();
                    }
                };
                xhttp2.send();
            }
        };
        xhttp1.send();
    };

    var printTaReport = function (userId) {
        var onSuccess = function (ta, courses, supervisors) {
            var coursesTableContent = [];
            coursesTableContent.push([
                { text: 'Course Code', bold: true },
                { text: 'Title', bold: true },
                { text: 'Start Term', bold: true },
                { text: 'End Term', bold: true }
            ]);
            courses.forEach(function (course) {
                var row = [];
                row.push(course.courseCode || '');
                row.push(course.title || '');
                row.push(dateTools.convertPgpStringToTermYear(course.startDate) || '');
                row.push(dateTools.convertPgpStringToTermYear(course.endDate) || '');
                coursesTableContent.push(row);
            });

            var supervisorsTableContent = [];
            supervisorsTableContent.push([
                { text: 'Name', bold: true },
                { text: 'Email', bold: true }
            ]);
            supervisors.forEach(function (supervisor) {
                var row = [];
                row.push((supervisor.lastName || 'n/a') + ', ' + (supervisor.firstName || 'n/a'));
                row.push(supervisor.email || '');
                supervisorsTableContent.push(row);
            });

            var docDefinition = {
                info: {
                    title: 'TA Manager Report'
                },
                content: [
                    { text: (ta.lastName || 'n/a') + ', ' + (ta.firstName || 'n/a'), fontSize: 20, bold: true },
                    (ta.userId || '') + (ta.userId && ta.studentNumber ? ', ' : '') + (ta.studentNumber || ''),
                    ta.email || '',
                    ta.studentType || '',
                    ' ',
                    { text: 'Assigned Courses', fontSize: 16, bold: true },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', '*', '*', '*'],
                            body: coursesTableContent
                        }
                    },
                    ' ',
                    { text: 'Assigned Supervisors', fontSize: 16, bold: true },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', '*'],
                            body: supervisorsTableContent
                        }
                    }
                ]
            };

            pdfMake.createPdf(docDefinition).open();
        };
        getTaReportInfo(userId, onSuccess);
    };

    var getAllTasReportInfo = function (onSuccess) {
        var xhttp1 = new XMLHttpRequest();
        xhttp1.open("GET", "getAllActiveTas", true);
        xhttp1.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var activeTas = xhttp1.responseText ? JSON.parse(xhttp1.responseText) : [];
                var xhttp2 = new XMLHttpRequest();
                xhttp2.open("GET", "getAllCoursesForAllActiveTas", true);
                xhttp2.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        var courses = xhttp2.responseText ? JSON.parse(xhttp2.responseText) : [];
                        activeTas.forEach(function (ta, i, activeTas) {
                            ta.courseList = [];
                            courses.forEach(function (course) {
                                if (course.userId === ta.userId) {
                                    ta.courseList.push(course);
                                }
                            });
                        });
                        onSuccess && onSuccess(activeTas);
                    }
                };
                xhttp2.send();
            }
        };
        xhttp1.send();
    };

    var printAllTasReport = function () {
        var onSuccess = function (taList) {
            var docDefinition = {
                info: {
                    title: 'TA Manager Report'
                },
                content: [
                    { text: 'TA Report', fontSize: 20, bold: true },
                    ' '
                ]
            };
            taList.forEach(function (ta) {
                docDefinition.content.push({ text: (ta.lastName || 'n/a') + ', ' + (ta.firstName || 'n/a') + (ta.email ? ' - ' + ta.email : ''), bold: true });
                docDefinition.content.push({ text: ta.numOfAssigns + '/' + ta.maxAssigns + ' 140hr assignments' });
                var courseListTableContent = [];
                courseListTableContent.push([{ text: 'Course Code', bold: true }, { text: 'Title', bold: true }, { text: 'Start Term', bold: true }, { text: 'End Term', bold: true }]);
                ta.courseList.forEach(function (course) {
                    courseListTableContent.push([course.courseCode || '', course.title, dateTools.convertPgpStringToTermYear(course.startDate) || '', dateTools.convertPgpStringToTermYear(course.endDate) || '']);
                });
                docDefinition.content.push({
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*', '*'],
                        body: courseListTableContent
                    }
                });
                docDefinition.content.push(' ');
            });

            pdfMake.createPdf(docDefinition).open();
        };
        getAllTasReportInfo(onSuccess);
    };

    var getCourseAssignedReportInfo = function (courseId, onSuccess) {
        var xhttp1 = new XMLHttpRequest();
        xhttp1.open("GET", "getCourse?courseId=" + courseId, true);
        xhttp1.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var course = xhttp1.responseText ? JSON.parse(xhttp1.responseText) : [];
                course = course.length ? course[0] : {};
                var xhttp2 = new XMLHttpRequest();
                xhttp2.open("GET", "getAllTasForCourse?courseId=" + courseId, true);
                xhttp2.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        var taList = xhttp2.responseText ? JSON.parse(xhttp2.responseText) : [];
                        onSuccess && onSuccess(course, taList)
                    }
                };
                xhttp2.send();
            }
        };
        xhttp1.send();
    };

    var printCourseAssignedReport = function (courseId) {
        var onSuccess = function (course, taList) {
            var taListTableContent = [];
            taListTableContent.push([{ text: 'Name', bold: true }, { text: 'User ID', bold: true }, { text: 'Email', bold: true }, { text: 'Student Number', bold: true }, { text: 'Type', bold: true }])
            taList.forEach(function (ta) {
                taListTableContent.push([
                    (ta.lastName || 'n/a') + ', ' + (ta.firstName || 'n/a'),
                    ta.userId || '',
                    ta.email || '',
                    ta.studentNumber || '',
                    ta.studentType || ''
                ]);
            });
            var docDefinition = {
                info: {
                    title: 'TA Manager Report'
                },
                content: [
                    { text: course.courseCode + (course.title ? ' - ' + course.title : ''), fontSize: 20, bold: true },
                    course.startDate && course.endDate ? dateTools.convertPgpStringToTermYear(course.startDate) + ' to ' + dateTools.convertPgpStringToTermYear(course.startDate) : '',
                    (course.studentCount ? course.studentCount + ' students' : ''),
                    ' ',
                    { text: 'Assigned TAs', fontSize: 16, bold: true },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', '*', '*', '*', '*'],
                            body: taListTableContent
                        }
                    }
                ]
            };
            pdfMake.createPdf(docDefinition).open();
        };
        getCourseAssignedReportInfo(courseId, onSuccess);
    };

    var getCoursePreviouslyAssignedReportInfo = function (courseId, onSuccess) {
        var xhttp1 = new XMLHttpRequest();
        xhttp1.open("GET", "getCourse?courseId=" + courseId, true);
        xhttp1.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var course = xhttp1.responseText ? JSON.parse(xhttp1.responseText) : [];
                course = course.length ? course[0] : {};
                var xhttp2 = new XMLHttpRequest();
                xhttp2.open("GET", "getAllPreviousTasForCourse?courseId=" + courseId, true);
                xhttp2.onreadystatechange = function () {
                    if (this.readyState === 4 && this.status === 200) {
                        var taList = xhttp2.responseText ? JSON.parse(xhttp2.responseText) : [];
                        onSuccess && onSuccess(course, taList)
                    }
                };
                xhttp2.send();
            }
        };
        xhttp1.send();
    };

    var printCoursePreviouslyAssignedReport = function (courseId) {
        var onSuccess = function (course, taList) {
            var taListTableContent = [];
            taListTableContent.push([{ text: 'Name', bold: true }, { text: 'User ID', bold: true }, { text: 'Email', bold: true }, { text: 'Student Number', bold: true }, { text: 'Type', bold: true }])
            taList.forEach(function (ta) {
                taListTableContent.push([
                    (ta.lastName || 'n/a') + ', ' + (ta.firstName || 'n/a'),
                    ta.userId || '',
                    ta.email || '',
                    ta.studentNumber || '',
                    ta.studentType || ''
                ]);
            });
            var docDefinition = {
                info: {
                    title: 'TA Manager Report'
                },
                content: [
                    { text: course.courseCode + (course.title ? ' - ' + course.title : ''), fontSize: 20, bold: true },
                    course.startDate && course.endDate ? dateTools.convertPgpStringToTermYear(course.startDate) + ' to ' + dateTools.convertPgpStringToTermYear(course.startDate) : '',
                    (course.studentCount ? course.studentCount + ' students' : ''),
                    ' ',
                    { text: 'Previously Assigned TAs', fontSize: 16, bold: true },
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', '*', '*', '*', '*'],
                            body: taListTableContent
                        }
                    }
                ]
            };
            pdfMake.createPdf(docDefinition).open();
        };
        getCoursePreviouslyAssignedReportInfo(courseId, onSuccess);
    };

    var getTermReportInfo = function (onSuccess, startDate, endDate) {
        var xhttp1 = new XMLHttpRequest();
        var params =
            "startDateTerm=" + startDate.term + "&" +
            "startDateYear=" + startDate.year + "&" +
            "endDateTerm=" + endDate.term + "&" +
            "endDateYear=" + endDate.year;
        xhttp1.open("GET", "getCourseTaAssignsBetweenDates?" + params, true);
        xhttp1.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var courseList = xhttp1.responseText ? JSON.parse(xhttp1.responseText) : [];
                onSuccess && onSuccess(courseList, startDate, endDate);
            }
        };
        xhttp1.send();
    };

    var printTermReport = function (startDate, endDate) {
        var onSuccess = function (courses, startDate, endDate) {
            var docDefinition = {
                info: {
                    title: 'TA Manager Report'
                },
                content: [
                    { text: 'Term Report', fontSize: 20, bold: true },
                    startDate.term + ' ' + startDate.year + ' to ' + endDate.term + ' ' + endDate.year,
                    ' '
                ]
            };

            courses.forEach(function (course) {
                course.startDate = dateTools.convertPgpStringToTermYear(course.startDate);
                course.endDate = dateTools.convertPgpStringToTermYear(course.endDate);
                docDefinition.content.push({ text: (course.courseCode || 'n/a') + ' - ' + (course.title || 'n/a'), bold: true });
                docDefinition.content.push({ text: course.startDate + ' to ' + course.endDate });
                var taListTableContent = [];
                taListTableContent.push([{ text: 'Name', bold: true }, { text: 'User ID', bold: true }, { text: 'Email', bold: true }, { text: 'Student Number', bold: true }, { text: 'Type', bold: true }]);
                course.taList.forEach(function (ta) {
                    taListTableContent.push([
                        (ta.lastName || 'n/a') + ', ' + (ta.firstName || 'n/a'),
                        ta.userId || '',
                        ta.email || '',
                        ta.studentNumber || '',
                        ta.studentType || ''
                    ]);
                });
                docDefinition.content.push({
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*', '*', '*'],
                        body: taListTableContent
                    }
                });
                docDefinition.content.push(' ');
            });

            pdfMake.createPdf(docDefinition).open();
        };
        getTermReportInfo(onSuccess, startDate, endDate);
    };

    var pdfTools = {};
    pdfTools.printTaReport = printTaReport;
    pdfTools.printAllTasReport = printAllTasReport;
    pdfTools.printCourseAssignedReport = printCourseAssignedReport;
    pdfTools.printCoursePreviouslyAssignedReport = printCoursePreviouslyAssignedReport;
    pdfTools.printTermReport = printTermReport;
    return pdfTools;

}());

var module = module || {};
module.exports = pdfTools;