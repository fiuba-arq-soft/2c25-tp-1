#!/bin/bash
npm install -g artillery-plugin-statsd
npm run artillery -- run scenarios/recovery.yaml -e api &

sleep 35
echo "💥 Simulando caída de Redis..."
docker compose stop redis

sleep 20
echo "🧱 Redis vuelve a levantarse..."
docker compose start redis

wait
echo "✅ Escenario de recuperación finalizado"
