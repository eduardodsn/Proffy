const express = require('express');
const nunjucks = require('nunjucks');
const Database = require('./database/db')
const { subjects, weekdays, getSubject, convertHoursToMinutes } = require('./utils/format');
const { urlencoded } = require('express');


const app = express()

nunjucks.configure('src/views', {
    express: app,
    noCache: true,
})

app.use(express.static('public'));
app.use(urlencoded({ extended: true }))

app.get('/', (req, res) => {
    return res.render('index.html');
});

app.get('/study', async (req, res) => {
    const filters = req.query;

    if(!filters.subject || ! filters.weekday || !filters.time) {
        return res.render('study.html', {filters, subjects, weekdays});
    }

    const timeToMinutes = convertHoursToMinutes(filters.time)

    const query = `
        SELECT classes.*, proffys.*
        FROM proffys
        JOIN classes ON (classes.proffy_id = proffys.id)
        WHERE EXISTS (
            SELECT class_schedule.*
            FROM class_schedule
            WHERE class_schedule.class_id = classes.id
            AND class_schedule.weekday = ${filters.weekday}
            AND class_schedule.time_from <= ${timeToMinutes}
            AND class_schedule.time_to > ${timeToMinutes}
        )
        AND classes.subject = '${filters.subject}'
    `
    
    try {
        const db = await Database;
        const proffys = await db.all(query)

        proffys.map((proffy) => {
            proffy.subject = getSubject(proffy.subject)
        })

        return res.render('study.html', { proffys, subjects, filters, weekdays })

    } catch(err) {
        console.log(err)
    }

});

app.get('/give-classes', (req, res) => {
    return res.render('give-classes.html', {subjects, weekdays});
});

app.post('/give-classes', async(req, res) => {
    const createProffy = require('./database/createProffy')

    const proffyValue = {
        name: req.body.name,
        avatar: req.body.avatar,
        whatsapp: req.body.whatsapp,
        bio: req.body.bio
    }
    
    const classValue = {
        subject: req.body.subject,
        cost: req.body.cost
    }

    const classScheduleValues = req.body.weekday.map((weekday, index) => {
        return {
            weekday,
            time_from: convertHoursToMinutes(req.body.time_from[index]),
            time_to: convertHoursToMinutes(req.body.time_to[index])
        }
    })

    try {
        const db = await Database
        await createProffy(db, { proffyValue, classValue, classScheduleValues })

        let queryString = "?subject=" + req.body.subject
        queryString += "&weekday=" + req.body.weekday[0] 
        queryString += "&time=" + req.body.time_from[0] 

        return res.redirect('/study' + queryString)

    } catch(err) {
        console.log(err)
    }
    

})

app.listen(process.env.PORT || 3000)