# README

## Build
```
docker -H ssh://gnarg@nihility.lan build -t groceries:latest .
```

## Deploy
```
docker -H ssh://gnarg@nihility.lan compose down
docker -H ssh://gnarg@nihility.lan compose up -d
```
