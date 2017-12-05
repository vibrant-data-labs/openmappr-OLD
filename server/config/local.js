'use strict';

module.exports = {
    'dbUrl': 'mongodb://localhost:27017/MAPPRDB',
    'oldDbUrl': 'mongodb://localhost:27017/MPTEST',
    'sessiondbUrl': 'mongodb://localhost:27017/sessionDB',
    'elasticSearchConfig': {
        host: 'localhost:9200',
        log: 'error'
    },
    'athena' : {
        url : 'localhost:5000'
    },
    'beanstalk' : {
        host : '127.0.0.1',
        port : 11300
    },
    'redis' : {
        // url : 'redis://user:password@redis-service.com:6379/'
        url : 'redis://127.0.0.1:6380/0'
    }
};
