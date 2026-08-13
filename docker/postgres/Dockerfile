FROM postgres:16-alpine

RUN apk add --no-cache openssl

COPY --chmod=755 docker/postgres/docker-entrypoint-tls.sh /usr/local/bin/docker-entrypoint-tls.sh

ENTRYPOINT ["docker-entrypoint-tls.sh"]
CMD ["postgres", "-c", "ssl=on", "-c", "ssl_cert_file=/var/lib/postgresql/tls/server.crt", "-c", "ssl_key_file=/var/lib/postgresql/tls/server.key", "-c", "ssl_min_protocol_version=TLSv1.2", "-c", "password_encryption=scram-sha-256", "-c", "hba_file=/var/lib/postgresql/tls/pg_hba.conf"]
