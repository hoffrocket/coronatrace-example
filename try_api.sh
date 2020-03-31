#!/bin/sh

curl -H "Content-Type: application/json" -d '{"lat": 40.70113, "lng": 73.9922, "userId": "1"}' localhost:3000/locationUpdate
echo
curl localhost:3000/checkExposed?userId=1
echo
curl -H "Content-Type: application/json" -d '{"lat": 40.70113, "lng": 73.9922, "userId": "2"}' localhost:3000/locationUpdate
echo
curl localhost:3000/checkExposed?userId=2
echo
curl -H "Content-Type: application/json" -d '{"userId": "2"}' localhost:3000/setInfected
echo
curl localhost:3000/checkExposed?userId=1
echo
curl localhost:3000/checkExposed?userId=2
echo