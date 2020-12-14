const eventsWebhookRouter = require('express').Router();
const { WebhookTeam, WebhookEventTeam, WebhookEvent, Team } = require('../../../models');
const {
    webhookEventsValidation,
    webhookAuthorizationChangeValidation,
    webhookUrlChangeValidation,
    webhookEventsLogoutValidation
} = require('../../../helpers/validator');

/* 
request look like this :
header : {
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp // webhook token
}
params : e9db316f-4b2b-4f40-a096-5ee443007a00 // team id
body : {
    "webhookUrl": "http://localhost:8090/api/v1/webhook",
    "events":  ["submittedChallenge", "startedChallenge"],
    "authorizationToken": "1234567abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
}
*/
// register to events webhook
eventsWebhookRouter.post('/registration/:externalId', async (req, res) => {
    const { externalId } = req.params;
    req.body.externalId = externalId
    // Joi validation
    const { error } = webhookEventsValidation(req.body);
    if (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, message: error.message });
    }

    const { webhookUrl, events, authorizationToken } = req.body
    const eventsRegistrationResponse = await eventsRegistrationFunc({ externalId, webhookUrl, events, authorizationToken })
    res.status(eventsRegistrationResponse.status).json(eventsRegistrationResponse.response);
});

/*
 header : {
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp // webhook token
}
params : e9db316f-4b2b-4f40-a096-5ee443007a00 // team id
body : {
    "webhookUrl": "http://localhost:8090/api/v1/webhook",
    "authorizationToken": "1234567abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" // new one
}
 */

// update authorization token
eventsWebhookRouter.patch('/authorization/:externalId', async (req, res) => {
    const { externalId } = req.params;
    req.body.externalId = externalId
    // Joi validation
    const { error } = webhookAuthorizationChangeValidation(req.body);
    if (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, message: error.message });
    }

    const teamExists = await Team.findOne({
        where: {
            externalId: externalId
        }
    })
    if (!teamExists) return res.status(400).json({ message: `There is no such team with ${externalId} team id` })


    const { webhookUrl, authorizationToken } = req.body
    try {
        const isWebhookExist = await WebhookTeam.update({
            authorizationToken,
        },
            {
                where: {
                    webhookUrl,
                    teamId: teamExists.id
                },
            })
        if (isWebhookExist[0] > 0) {
            res.json({ message: 'Update Authorization Token Success' })
        } else {
            res.status(400).json({ message: `Update Authorization Token Fail, There is no webhook url '${webhookUrl}' fot this team` })
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: 'Cannot process request' });
    }
});

/*
 header : {
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp // webhook token
}
params : e9db316f-4b2b-4f40-a096-5ee443007a00 // team id
body : {
    "oldWebhookUrl": "http://localhost:8090/api/v1/webhook",
    "newWebhookUrl": "http://localhost:8090/api/v1/webhook", // new one
}
 */

// update webhookUrl
eventsWebhookRouter.patch('/url/:externalId', async (req, res) => {
    const { externalId } = req.params;
    req.body.externalId = externalId
    // Joi validation
    const { error } = webhookUrlChangeValidation(req.body);
    if (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, message: error.message });
    }

    const { oldWebhookUrl, newWebhookUrl, } = req.body
    try {
        const teamExists = await Team.findOne({
            where: {
                externalId: externalId
            }
        })
        if (!teamExists) return res.status(400).json({ message: `There is no such team with ${externalId} team id` })

        const isWebhookExist = await WebhookTeam.update({
            webhookUrl: newWebhookUrl
        },
            {
                where: {
                    teamId: teamExists.id,
                    webhookUrl: oldWebhookUrl
                },
            })
        if (isWebhookExist[0] > 0) {
            res.json({ message: 'Update Url Success' })
        } else {
            res.status(400).json({ message: `Update url Fail, There is no webhook url '${oldWebhookUrl}' fot this team` })
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: 'Cannot process request' });
    }
});

/* 
request look like this :
header : {
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp // webhook token
}
params : e9db316f-4b2b-4f40-a096-5ee443007a00 // team id
body : {
    "webhookUrl": "http://localhost:8090/api/v1/webhook",
    "events": ["submittedChallenge", "startedChallenge"]
}
*/

// update authorization token
eventsWebhookRouter.delete('/logout/:externalId', async (req, res) => {
    const { externalId } = req.params;
    req.body.externalId = externalId
    // Joi validation
    const { error } = webhookEventsLogoutValidation(req.body);
    if (error) {
        console.error(error.message);
        return res.status(400).json({ success: false, message: error.message });
    }

    const { events, webhookUrl } = req.body
    try {
        const isWebhookExist = await Team.findOne({
            where: {
                externalId: externalId,
            },
            include: [
                {
                    model: WebhookTeam,
                    where: {
                        webhookUrl
                    },
                    include: [
                        {
                            model: WebhookEventTeam,
                        }
                    ]
                }
            ]
        })
        if (!isWebhookExist) {
            return res.status(400).json({ message: 'You are not register with this team to this webhookUrl' })
        } else if (!isWebhookExist.WebhookTeams[0].WebhookEventTeams[0]) {
            return res.status(400).json({ message: 'You are not register with this events to this webhookUrl' })
        } else {
            await WebhookEventTeam.destroy({
                where: {
                    eventId: isWebhookExist.WebhookTeams[0].WebhookEventTeams.map(ev => ev.toJSON().eventId),
                    webhookId: isWebhookExist.WebhookTeams[0].toJSON().id
                },
            })
            return res.json({ message: `Logout from ${events} Events Success` })
        }
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: 'Cannot process request' });
    }
});

async function eventsRegistrationFunc({ externalId, webhookUrl, events, authorizationToken }) {
    try {
        const teamInsideId = await Team.findOne({
            where: {
                externalId: externalId
            },
            include: [{
                model: WebhookTeam,
                where: {
                    webhookUrl
                },
                required: false
            }]
        })
        if (!teamInsideId) return { status: 400, response: { message: `There is no such team with ${externalId} team id` } };
        const alreadyRegisteredId = teamInsideId.WebhookTeams[0] ? teamInsideId.WebhookTeams[0].id : null;
        const eventsFromDb = await WebhookEvent.findAll({
            where: {
                name: events
            },
            include: [{
                model: WebhookEventTeam,
                where: {
                    webhookId: alreadyRegisteredId
                },
                required: false
            }]
        })

        if (eventsFromDb.length === 0) return { status: 400, response: { message: 'There is no such events' } };
        if (events.length !== eventsFromDb.length) {
            const notExistEvents = events.filter(event => !eventsFromDb.some(dbEvent => event === dbEvent.name))
            return { status: 400, response: { message: `There is no such events as ${notExistEvents}` } };
        }

        let webhookEventTeamToCreate = []
        if (alreadyRegisteredId) {
            const alreadySignEvents = eventsFromDb.map(e => e.toJSON()).filter(x => !!x.WebhookEventTeams[0])
            if (alreadySignEvents.length > 0) {
                const ifManyEvents = (alreadySignEvents.length > 1) ? 's' : '';
                return {
                    status: 400, response: {
                        message: `You already registered with ${alreadySignEvents.map(event => event.name)} event${ifManyEvents}`
                    }
                };
            }
            webhookEventTeamToCreate = eventsFromDb.map(event => {
                return { webhookId: alreadyRegisteredId, eventId: event.id }
            })
        } else {
            const webhooksCreated = await WebhookTeam.create({
                teamId: teamInsideId.id,
                webhookUrl,
                authorizationToken
            });
            webhookEventTeamToCreate = eventsFromDb.map(event => {
                return { webhookId: webhooksCreated.id, eventId: event.id }
            })
        }
        await WebhookEventTeam.bulkCreate(webhookEventTeamToCreate)
        return { status: 201, response: { message: 'Events Registration Success' } };
    } catch (error) {
        console.error(error.message);
        return { status: 400, response: { message: 'Cannot process request' } };
    }
}


module.exports = eventsWebhookRouter;
module.exports.eventsRegistrationFunc = eventsRegistrationFunc