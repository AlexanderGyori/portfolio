var express = require('express');
var pgp = require('pg-promise')(/* options */);
var bodyParser = require('body-parser');
var configDb = require('./config/database.js');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var session = require('express-session');
var dateTools = require('./public/js/date-tools.js');
var connectEnsureLogin = require('connect-ensure-login');
var db = pgp(configDb.url);
var schema = configDb.schema;
var PORT = 8080;




/**
 * Passport configuration
 */
passport.use(new Strategy(
    function (username, password, done) {
        var user = {
            username: username,
            password: password
        };
        if (user.username === 'agyori' && user.password === 'aPass') {
            return done(null, user); 
        } else {
            return done(null, false, { message: 'Incorrect username or password.' });
        }
  })
);

passport.serializeUser(function (user, done) {
    done(null, user.username);
});

passport.deserializeUser(function (username, done) {
    done(null, username);
});

var taManager = express();
taManager.use(require('cookie-parser')());
taManager.use(bodyParser.json());       // only need this for JSON-encoded bodies
taManager.use(bodyParser.urlencoded({   // only need this for URL-encoded bodies
    extended: true
}));
taManager.use(express.static(__dirname + '/public'));
taManager.use(session({ secret: 'a secret', resave: false, saveUninitialized: false }));
taManager.use(passport.initialize());
taManager.use(passport.session());

// =========================================== AUTHENTICATION TEST ROUTES ==============================
taManager.get('/loginFail', function (req, res) {
    res.send({ message: 'Login failed!' });
});

taManager.post('/login',
    passport.authenticate('local', { failureRedirect: '/loginFail' }),
    function (req, res) {
        res.send({ message: 'Logged in!' });
    }
);

taManager.get('/logout', function (req, res) {
    req.logout();
    res.send({ message: 'Logged out!' });
});

taManager.get('/profile',
    connectEnsureLogin.ensureLoggedIn('/loginFail'),
    function (req, res) {
        res.send({ message: 'Viewing profile!' });
    }
);

// =========================================== GENERIC CALLS ==========================================

// Returns a TA with the maxAssigns and numOfAssigns fields
var formatTa = function (ta, assignmentSchedule) {
    ta.maxAssigns = (ta.studentType === 'PhD' ? 8 : 3);
    ta.numOfAssigns = assignmentSchedule.filter(function (assignment) {
        return assignment.userId === ta.userId;
    }).reduce(function (acc, assignment) {
        return +acc + dateTools.convertDateRangeToTermCount(assignment.startDate, assignment.endDate) * (assignment.assignType === "Full" ? 1 : 0.5);
    }, 0);
    return ta;
};

// =========================================== COURSES PAGE ===========================================
taManager.get('/getAllCourses', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    db.query('SELECT "CourseId" AS "courseId", "CourseCode" AS "courseCode", "Title" AS "title", "StudentCount" AS "studentCount", "StartDate" AS "startDate", "EndDate" AS "endDate", ' +
        '"HasLab" AS "hasLab", "IsActive" AS "isActive", (SELECT count(*) FROM ' + schema + '."CourseTaAssigns" WHERE "CourseId" = course."CourseId" AND "AssignType" = \'Half\') AS "halfAssignCount", ' +
            '(SELECT count(*) FROM ' + schema + '."CourseTaAssigns" WHERE "CourseId" = course."CourseId" AND "AssignType" = \'Full\') AS "fullAssignCount"FROM ' + schema + '."Course" course ORDER BY "IsActive" DESC, "CourseCode" ASC;')
        .then(function (courses) {
            courses = courses.map(function (course) {
                return formatCourse(course);
            });
            res.send(courses);
        })
        .catch(function (error) {
            console.log('ERROR: ', error);
        });
});

taManager.get('/getCourse', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    var courseId = req.query.courseId;
    db.query('SELECT "CourseId" AS "courseId", "CourseCode" AS "courseCode", "Title" AS "title", "StudentCount" AS "studentCount", "StartDate" AS "startDate", "EndDate" AS "endDate", ' +
        '"HasLab" AS "hasLab", "IsActive" AS "isActive" FROM ' + schema + '."Course" WHERE "CourseId" = $1', [courseId])
    .then(function (course) {
        res.send(course);
    })
    .catch(function (error) {
        console.log('ERROR: ', error);
    });
});

taManager.post('/addCourse', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    var course = req.body;
    course.studentCount = (!course.studentCount ? null : course.studentCount);
    course.startDate = (!course.startDate ? null : course.startDate);
    course.endDate = (!course.endDate ? null : course.endDate);
    if (!course.courseCode || !((course.startDate && course.endDate) || (!course.startDate && !course.endDate))) {
        res.send({
            error: true,
            message: 'Course is invalid.'
        });
    } else {
        db.query('INSERT INTO ' + schema + '."Course"("CourseCode", "Title", "StudentCount", "StartDate", "EndDate", "HasLab", "IsActive") ' +
        'VALUES ($1, $2, $3, $4, $5, $6, $7);', [course.courseCode, course.title, course.studentCount, course.startDate, course.endDate, course.hasLab, course.isActive]) 
        .then(function (data) {
            res.send();
        })
        .catch(function (error) {
            console.log('ERROR: ', error);
        });
    }
});

taManager.post('/editCourse', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    var course = req.body;
    course.studentCount = (!course.studentCount ? null : course.studentCount);
    course.startDate = (!course.startDate ? null : course.startDate);
    course.endDate = (!course.endDate ? null : course.endDate);
    if (!course.courseId || !course.courseCode || !((course.startDate && course.endDate) || (!course.startDate && !course.endDate))) {
        res.send({
            error: true,
            message: 'Course is invalid.'
        });
    } else {
        db.query('UPDATE ' + schema + '."Course" SET "CourseCode" = $1, "Title" = $2, "StudentCount" = $3, "StartDate" = $4, "EndDate" = $5, "HasLab" = $6, "IsActive" = $7 WHERE "CourseId" = $8',
        [course.courseCode, course.title, course.studentCount, course.startDate, course.endDate, course.hasLab, course.isActive, course.courseId])
        .then(function (data) {
            res.send();
        })
        .catch(function (error) {
            console.log('ERROR: ', error);
        });
    }
});

taManager.post('/removeCourse', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    var course = req.body;
    db.task(function (t) {
        return t.query('DELETE FROM ' + schema + '."CourseTaAssigns" WHERE "CourseId" = $1', course.courseId)
            .then(function () {
                return t.query('DELETE FROM ' + schema + '."Course" WHERE "CourseId" = $1', course.courseId);
            });
        })
        .then(function (data) {
            res.send();
        })
        .catch(function (error) {
            console.log('ERROR: ', error);
        });
});

taManager.get('/getAllTasForCourse', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    var courseId = req.query.courseId;
    db.task(t => {
        return t.query('SELECT ta."UserId" AS "userId", ta."FirstName" AS "firstName", ta."LastName" AS "lastName", ta."Email" AS "email", ta."StudentNumber" AS "studentNumber", ' +
        'ta."StudentType" AS "studentType", assign."AssignType" AS "assignType", ta."IsActive" as "isActive" FROM ' + schema + '."CourseTaAssigns" assign ' +
        'INNER JOIN ' + schema + '."TeachingAssistant" ta ON assign."UserId" = ta."UserId" WHERE assign."CourseId" = $1 GROUP BY ta."UserId", assign."AssignType" ORDER BY ta."LastName" ASC', [courseId])
        .then(tas => {
            return getAssignmentSchedule(t)
            .then(assignmentSchedule => {
                tas = tas.map(function (ta) {
                    return formatTa(ta, assignmentSchedule);
                });
                res.send(tas);
            });
        })
    })
    .catch(function (error) {
        console.log('ERROR: ', error);
    });
});

taManager.get('/getAllPreviousTasForCourse', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    var courseId = req.query.courseId;
    db.task(t => {
        return t.query('SELECT "CourseCode" from ' + schema + '."Course" where "CourseId" = $1', [courseId])
        .then(course => {
            return t.query('SELECT ta."UserId" AS "userId", ta."FirstName" AS "firstName", ta."LastName" AS "lastName", ta."Email" AS "email", ta."StudentNumber" AS "studentNumber", ' + 
            'ta."StudentType" AS "studentType", assign."AssignType" AS "assignType" FROM ' + schema + '."CourseTaAssigns" assign INNER JOIN ' + schema + '."TeachingAssistant" ta ON assign."UserId" = ta."UserId" ' +
            'JOIN ' + schema + '."Course" course ON course."CourseId" = assign."CourseId"' + 
            'WHERE course."CourseCode" = $1 AND assign."CourseId" != $2 GROUP BY ta."UserId", assign."AssignType" ORDER BY ta."LastName" ASC', [course[0].CourseCode, courseId])
            .then(taList => {
                res.send(taList);
            });
        });
    })    
    .catch(function (error) {
        console.log('ERROR: ', error);
    });
});

taManager.get('/getUnassignedTasForCourse', connectEnsureLogin.ensureLoggedIn('/loginFail'), function (req, res) {
    var courseId = req.query.courseId;
    db.task(t => {
        return t.query('SELECT  ta."UserId" AS "userId", ta."FirstName" AS "firstName", ta."LastName" AS "lastName", ta."Email" AS "email", ta."StudentType" AS "studentType", ta."StudentNumber" as "studentNumber", ta."IsActive" as "isActive" ' +
        'FROM ' + schema + '."TeachingAssistant" ta LEFT OUTER JOIN (SELECT * FROM ' + schema + '."CourseTaAssigns" WHERE "CourseId" = $1) assign ' +
        'ON ta."UserId" = assign."UserId" ' +
        'WHERE assign."UserId" is null ' +
        'GROUP BY ta."UserId" ' +
        'ORDER BY ta."LastName" ASC;', [courseId])
        .then(tas => {
            return getAssignmentSchedule(t)
            .then(assignmentSchedule => {
                tas = tas.map(function (ta) {
                    return formatTa(ta, assignmentSchedule);
                });
                res.send(tas);
            });
        });
    })
        
        .catch(function (error) {
            console.log('ERROR: ', error);
        });
});

// Listen on 8080
taManager.listen(PORT, function () {
    console.log('TA Manager listening on port ' + PORT);
});