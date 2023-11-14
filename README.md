# README

## Build
`docker -H ssh://gnarg@nihility.lan build -t groceries:latest .`

## Deploy
`cp docker-compose sync/nihility/groceries.yml`
`docker -H ssh://gnarg@nihility.lan compose -f groceries.yml up -d`
