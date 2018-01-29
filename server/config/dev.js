// This is not dev, this is prod config. Don't know how this happened.

module.exports = {
    'dbUrl': 'mongodb://<>/MAPPRDB',
    'oldDbUrl': 'mongodb://<>/MPTEST',
    'sessiondbUrl': 'mongodb://<>sessionDB',
    'elasticSearchConfig': {
        //host: 'search-mappr-elastic-qfr5ebmqflpfuk54rthtues2ti.us-west-1.es.amazonaws.com',
        host: '<>:9200',
        requestTimeout: 990000,
        log: 'error',
        apiVersion: '2.4'
    },
    'athena' : {
        url : '<>:5000'
    },
    'beanstalk' : {
        host : '<>',
        port : 11300
    },
    'redis' : {
        url : 'redis://<>:6380'
    }
};
