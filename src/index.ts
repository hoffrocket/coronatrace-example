import express from "express";
import * as bodyParser from 'body-parser';
import s2 from '@radarlabs/s2';
import moment from 'moment';

const app = express();
app.use(bodyParser.json());
const port = 3000;

// index of userId to list of s2token+timestamp pairs for finding past locations for a user
const userIdToLocationsDb = new Map<string, Set<String>>();

// index of s2token+timestamp to list of userIds for finding overlaps
const locationsToUserIdsDb = new Map<string, Set<String>>();

const infectedUsers = new Set<string>();

const broadcastInfection = (userId: string) => {
    const locations = userIdToLocationsDb.get(userId);

    const affectedUsers = new Set(Array.from(locations).flatMap((location: string) => {
        return Array.from(locationsToUserIdsDb.get(location));
    }));

    affectedUsers.forEach((affectedUserId: string) => {
        if (affectedUserId !== userId) {
            console.log(`Hey ${affectedUserId} you may have crossed path with infected person`)
        }
    });
};

app.post('/locationUpdate', (req, res) => {
    console.log(req.body);
    const userId = req.body.userId;
    const s2latlng = new s2.LatLng(req.body.lat, req.body.lng);

    // build an s2 cell covering with a 10 meter radius for that point
    // see http://s2.sidewalklabs.com/regioncoverer/
    const coveringTokens = s2.RegionCoverer.getRadiusCoveringTokens(
        s2latlng,
        10, // meters radius
        {
            max_cells: 3 // use a very crude covering to keep total keys down
        }
    );
    // round current time down to nearest hour
    const now = moment().startOf('hour');
    const locationTimeTokens = coveringTokens.flatMap((token: string) => {
        return [
            token + '.' + now.unix(),
            token + '.' + now.add(1, 'hour').unix(),
            token + '.' + now.add(-1, 'hour').unix()
        ]
    })

    // update the userId to locations index
    const existingLocationTimeTokens = userIdToLocationsDb.get(userId) || new Set<string>();
    locationTimeTokens.forEach((token: string) => {
        existingLocationTimeTokens.add(token)
    });
    userIdToLocationsDb.set(userId, existingLocationTimeTokens);

    // update the location to userId index
    locationTimeTokens.forEach((token: string) => {
        const existingUserIds = locationsToUserIdsDb.get(token) ||  new Set<string>();
        existingUserIds.add(userId);
        locationsToUserIdsDb.set(token, existingUserIds);
    });

    res.send({
        ...req.body,
        locationTimeTokens
    })
})

app.post('/setInfected', (req, res) => {
    console.log(req.body);
    const userId = req.body.userId;

    infectedUsers.add(userId);

    broadcastInfection(userId);

    res.send({
        ...req.body,
    })
})

app.get('/checkExposed', (req, res) => {
    const userId = req.query.userId;

    const locations = userIdToLocationsDb.get(userId);

    const exposedLocations = Array.from(locations).filter((location: string) => {
        const overlapUsers = locationsToUserIdsDb.get(location);
        // perhaps consider some time cutoff
        return Array.from(overlapUsers).find((overlapUserId: string) => {
            return overlapUserId !== userId && infectedUsers.has(overlapUserId);
        });
    });

    res.send({
        ...req.body,
        exposedLocations,
        isExposed: exposedLocations.length > 0,
        isInfected: infectedUsers.has(userId),
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
});
