FROM alpine:latest

ARG PB_VERSION=0.18.9

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download and unzip PocketBase binary
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

WORKDIR /pb

COPY ./migrations ./migrations
COPY ./hooks ./hooks

EXPOSE 8090

CMD ["pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/data", "--migrationsDir=/pb/migrations", "--hooksDir=/pb/hooks" ]