## Example CoronaTrace Overlap Methodology


_NOTE: tested in node 13.5_
```sh
npm install
npm start
./try_api.sh
```

## API Functionality

### POST locationUpdate

When a new location update comes in from the device:

 - lat-lng of the update is converted to an s2 cell using the s2 geometry library from google
 - the current time is rounded down to the nearest hour, and two more time tokens are created: 1 hour above, and 1 hour below the rounded time
 - a s2 cell covering is generated from the s2 cell for a 10 meter radius
 - the cell covering tokens are joined with the three time values to create a list of tokens*times
 - those tokenTime pairs are used update two storage indexes
    - an index of current userId to a list of all tokenTime pairs
    - an index of tokenTime pair to userIds


### POST setInfected

When a use marks themselves as infected:

 - a Set of infectedUsers is updated
 - we find all the users that may have overlapped with this user by:
   - find all past tokenTime pairs for this user in the userId to tokenTime pair index
      - for each tokenTime pair, find overlapping users in the tokenTime to userId index
        - send an allert to each of those userIds


### GET checkExposed

When a user checks if they have been exposed to an infected person:

 - find all past tokenTime pairs for this user in the userId to tokenTime pair index
    - for each tokenTime pair, find overlapping users in the tokenTime to userId index
        - for each overlapping userId, check if they're in the infectedUsers Set


## Storage

Data is stored in-memory, but storage could be done in any database system that supports primary key
indexes and allows for multiple values per key or transactions to atomically append a value to an list



## References

http://s2geometry.io/devguide/s2cell_hierarchy

http://s2.sidewalklabs.com/regioncoverer/

https://radar.io/blog/open-source-node-js-typescript-s2-library
