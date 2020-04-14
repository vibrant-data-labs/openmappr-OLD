FROM mongo:3.2

RUN mkdir -p /mongo/dump
COPY config/mongolocal_MAPPRDB_base.gzip /mongo/mongolocal_MAPPRDB_base.gzip
COPY config/mongo.sh /mongo/mongo.sh
RUN chmod 777 /mongo/mongo.sh

CMD /mongo/mongo.sh
