# README

## Prepare
```
export DOCKER_HOST=ssh://gnarg@nihility.lan
```

## Build
```
docker build -t groceries:latest .
```

## Deploy
```
docker compose down
docker compose up -d
```

## Migrate
```
docker run --rm -v /data/groceries/storage:/rails/storage groceries:latest bin/rails db:migrate
```

## Database
```
docker exec -ti groceries-app-1 bin/rails dbconsole
```
