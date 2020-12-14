const createUsersWebhookRouter = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: generateId } = require('uuid');
const { User, Team, UserTeam } = require('../../../models');
const {
    webhookAddUsersValidation,
    webhookCreateTeamValidation,
    webhookChangePermissionsValidation
} = require('../../../helpers/validator');
const Filters = require('../../../helpers/Filters');
const { eventsRegistrationFunc } = require('./events');

/* 
request look like this :
header : {
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp // webhook token
}
body : {
    "teamName": "crm",
    "leaders": [
        {
            "userName": "roy"
        },
        {
            "userName": "david"
        }
    ],
    "usersToCreate": [ optional
        {
            "userName": "david",
            "email": "david@email.com"
        },
        {
            "userName": "omer",
            "email":"omer@email.com"
        }
    ],
    "eventsRegistration": { // optional
        "webhookUrl": "http://localhost:8090/api/v1/webhook",
        "events":  ["startedChallenge","submittedChallenge"],
        "authorizationToken": "1234567abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    }
*/

// webhook create team with/out users
createUsersWebhookRouter.post('/create', async (req, res) => {
    try {
        // Joi validation
        const { error } = webhookCreateTeamValidation(req.body);
        if (error) {
            console.error(error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        const { teamName, leaders, usersToCreate, eventsRegistration } = req.body;

        const teamExternalId = generateId();
        let usersTeamToCreate = [];

        // create base response because it could change
        const baseResponse = {
            message: `Create ${teamName} Team Success`,
            leaders: leaders,
            teamId: teamExternalId
        }


        // check if leaders(users) exist already in the db by userName
        const dbLeadersExist = await User.findAll({
            where: {
                userName: leaders.map(leader => leader.userName)
            }
        })

        // a boolean condition based on existent users in the system or request 'usersToCreate'
        const leadersExistInDbOrCreationList = (leader) => Filters.userNameInArray(usersToCreate, leader.userName) || Filters.userNameInArray(dbLeadersExist, leader.userName)

        if (!leaders.every(leader => leadersExistInDbOrCreationList(leader))) {
            const missingLeaders = leaders.filter(leader => !leadersExistInDbOrCreationList(leader))
                .map(leader => leader.userName)

            return res.status(406).json({ message: `${missingLeaders} Are not Exist In The System, Please Add Them Inside 'usersToCreate' Array ` })
        }

        if (usersToCreate) {
            const createUsers = await bulkCreateUsers(usersToCreate, res)
            if (!createUsers) {
                return
            }
            const newUsersResponse = await User.bulkCreate(createUsers.newUsersToCreate);
            newUsersResponse.forEach(user => usersTeamToCreate.push(user.toJSON()))
            baseResponse.newUsers = createUsers.newUsersForResponse;
            baseResponse.message = `Create ${teamName} Team With ${createUsers.newUsersForResponse.length} New Users Success`;
        }

        const newTeamResponse = await Team.create({ name: teamName, externalId: teamExternalId });

        dbLeadersExist.forEach(leader =>
            usersTeamToCreate.push(leader.toJSON())
        )

        // convert the 'usersTeamToCreate' to usersTeams convention on the db with the proper permission
        usersTeamToCreate = usersTeamToCreate.map(user => {
            const permission = Filters.userNameInArray(leaders, user.userName) ? 'teacher' : 'student';
            return { teamId: newTeamResponse.id, userId: user.id, permission }
        })

        await UserTeam.bulkCreate(usersTeamToCreate);

        let statusCode = 201;
        if (eventsRegistration) {
            eventsRegistration.teamId = teamExternalId;
            const eventsRegistrationResponse = await eventsRegistrationFunc(eventsRegistration)
            statusCode = eventsRegistrationResponse.status;
            baseResponse.eventRegistrationMessage = eventsRegistrationResponse.response.message;
        }

        res.status(statusCode).json(baseResponse);

    } catch (error) {
        console.error(error);
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
    "usersToCreate": [
        {
            "userName": "david", 
            "email": "david@email.com",
            "leader": "true"   // leader true is optional(must be string)
        },
        {
            "userName": "omer",
            "email":"omer@email.com"
        }
    ]
*/
createUsersWebhookRouter.post('/add-users/:externalId', async (req, res) => {
    const { externalId } = req.params;
    req.body.externalId = externalId
    try {
        // Joi validation
        const { error } = webhookAddUsersValidation(req.body);
        if (error) {
            console.error(error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        const { usersToCreate } = req.body;

        const teamExists = await Team.findOne({
            where: {
                externalId: externalId
            }
        })
        if (!teamExists) return res.status(400).json({ message: `There is no such team with ${externalId} team id` })

        const filteredUsers = usersToCreate.map(user => {
            const newUser = { ...user }
            delete newUser.leader
            return newUser
        })

        const createUsers = await bulkCreateUsers(filteredUsers, res)
        if (!createUsers) {
            return
        }
        const newUsersResponse = await User.bulkCreate(createUsers.newUsersToCreate);
        const leaders = usersToCreate.filter(user => user.leader === 'true')
        const usersTeamToCreate = newUsersResponse.map(user => {
            const permission = Filters.userNameInArray(leaders, user.userName) ? 'teacher' : 'student';
            return { teamId: teamExists.id, userId: user.id, permission }
        })

        await UserTeam.bulkCreate(usersTeamToCreate);

        res.status(201).json({ message: `Add ${usersToCreate.length} new users to team ${teamExists.name}` })


    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Cannot process request' });
    }
});


/* 
request look like this :
header : {
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp // webhook token
}
params : e9db316f-4b2b-4f40-a096-5ee443007a00 //team id
body : {
    "usersToBeLeaders": [
        {
            "userName": "royTheKing"
        },
        {
            "userName": "suvelocity"
        }
    ]
}
*/

// github api for update status about submission
createUsersWebhookRouter.patch('/change-permissions/:externalId', async (req, res) => {
    const { externalId } = req.params;
    req.body.externalId = externalId
    try {
        // Joi validation
        const { error } = webhookChangePermissionsValidation(req.body);
        if (error) {
            console.error(error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        const { usersToBeLeaders } = req.body;

        const teamExists = await Team.findOne({
            where: {
                externalId: externalId
            },
            include: [{
                model: User,
                through: {},
                attributes: ['id', 'userName'],
                where: {
                    userName: usersToBeLeaders.map(user => user.userName)
                }
            }]
        })
        if (!teamExists) return res.status(400).json({ message: `There is no such team with ${externalId} team id` })

        const dbUsers = teamExists.Users.map(user => user.toJSON())

        if (dbUsers.length !== usersToBeLeaders.length) {
            const missingUsers = usersToBeLeaders.filter(user => !Filters.userNameInArray(dbUsers, user.userName))
                .map(user => user.userName)

            return res.status(406).json({ message: `${missingUsers} Are not exist on this team, Please check the 'usersToBeLeaders' list that will contain only team members` })
        }

        const updatedNum = await UserTeam.update({ permission: 'teacher' }, {
            where: {
                userId: dbUsers.map(user => user.id),
                teamId: teamExists.id,
            }
        })

        return res.status(200).json({ message: `Update ${updatedNum[0]} Users Permission` });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Cannot process request' });
    }
});

module.exports = createUsersWebhookRouter;

// generate temporary Password
function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

// check in the DateBase if user is in the system
async function userIsExist(userName) {
    try {
        const user = await User.findOne({
            where: {
                userName,
            },
        });
        if (user) {
            return true
        }
        return false;
    } catch (error) {
        console.error(error.message);
    }
}

async function bulkCreateUsers(users, res) {

    const checkExistenceUsers = [];
    for (let index = 0; index < users.length; index++) {
        const isExist = await userIsExist(users[index].userName);
        const checkUser = {
            userName: users[index].userName,
            isExist
        }
        checkExistenceUsers.push(checkUser)
    }
    const userNamesTaken = checkExistenceUsers.some((userName) => userName.isExist)
    if (userNamesTaken) {
        const userNamesTakenAlready = checkExistenceUsers.filter((userName) => userName.isExist).map(user => user.userName)
        res.status(409).json({
            message: 'There are usernames that already exists',
            userNamesTakenAlready
        });
        return false
    }
    const newUsersToCreate = [];
    const newUsersForResponse = [];
    for (let index = 0; index < users.length; index++) {
        const temporaryPassword = generatePassword()
        newUsersForResponse.push({
            userName: users[index].userName,
            password: temporaryPassword
        })
        const hashPassword = await bcrypt.hashSync(temporaryPassword, 10);
        users[index].password = hashPassword
        newUsersToCreate.push(users[index])
    }
    return { newUsersToCreate, newUsersForResponse }
}