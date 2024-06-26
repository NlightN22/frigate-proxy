# tested only with mongo 7.0.6

chmod 400 /opt/keyfile && \
chown 999 /opt/keyfile && \
mongod --bind_ip_all --replSet rs0 --keyFile /opt/keyfile &
MONGO_PID=$!

sleep 10

mongosh "mongodb://localhost:$REPLICA_SET_PORT/?authSource=admin" --eval "
try {
    var status = rs.status();
    print('Replica Set already initialized. Status:', status.ok);
} catch (err) {
    print('Error to get status Replica Set:', err.message);
    if (err.message.match(/no replset config/)) { 
        print('Initializing Replica Set');
        rs.initiate({_id: '$REPLICA_SET_ID', members: [{ _id: $REPLICA_SET_NUMBER, host: '$REPLICA_SET_HOST' }]});
        while(rs.status().ok == 0 || rs.status().myState != 1) {
            sleep(1);
        }
        print('Replica Set is ready');
    } else {
        print('Unknown error, Replica Set cannot be initilazed');
    }
}
"

mongosh "mongodb://$REPLICA_SET_ADMIN_NAME:$REPLICA_SET_ADMIN_PASSWORD@localhost:$REPLICA_SET_PORT/admin" --eval "
print('Check existing admin user...');
" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Admin not found. Start creating..."
    mongosh "mongodb://localhost:$REPLICA_SET_PORT/?authSource=admin" --eval "
        print('Creating admin user...');
        db = db.getSiblingDB('admin');
        db.createUser({
        user: '$REPLICA_SET_ADMIN_NAME',
        pwd: '$REPLICA_SET_ADMIN_PASSWORD',
        roles: [{ role: 'clusterAdmin', db: 'admin' },{ role: 'root', db: 'admin' }]
        });
    "
fi

wait $MONGO_PID
