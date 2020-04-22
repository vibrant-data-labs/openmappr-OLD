#!/bin/bash

# Ref: https://stackoverflow.com/questions/39282957/mongorestore-in-a-dockerfile

# Initialize mongo logfile
touch /var/log/mongodb.log
chmod 777 /var/log/mongodb.log

# Start mongodb with logging
# --logpath    Without this mongod will output all log information to the standard output.
# --logappend  Ensure mongod appends new entries to the end of the logfile. We create it first so that the below tail always finds something
mongod --logpath /var/log/mongodb.log --logappend &

# Wait until mongo logs that it's ready (or timeout after 60s)
COUNTER=0
grep -q 'waiting for connections on port' /var/log/mongodb.log
while [[ $? -ne 0 && $COUNTER -lt 60 ]] ; do
    sleep 2
    let COUNTER+=2
    echo "Waiting for mongo to initialize... ($COUNTER seconds so far)"
    grep -q 'waiting for connections on port' /var/log/mongodb.log
done

# Check if MAPPRDB exists
if [[ $(mongo localhost:27017 --eval 'db.getMongo().getDBNames().indexOf("MAPPRDB")' --quiet) -lt 0 ]]; then
    echo "MAPPRDB does not exist, restoring from DB dump"
    # Restore from dump created via: mongodump --db MAPPRDB --gzip --archive=mongolocal_MAPPRDB_base.gzip
    # mongorestore --db MAPPRDB --gzip --noIndexRestore --archive=mongo/mongolocal_MAPPRDB_base.gzip
    mongorestore --gzip --archive=mongo/mongo-openmappr-starter-database.gz
else
    echo "MAPPRDB exists."
fi

# Keep container running
tail -f /dev/null
