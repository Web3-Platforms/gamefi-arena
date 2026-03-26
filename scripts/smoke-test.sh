#!/usr/bin/env bash
set -euo pipefail

BASE="${API_BASE:-http://localhost:80/api}"
COOKIE_JAR="/tmp/ai_arena_smoke_test_$$.txt"
WALLET="0xSmokeTest_$$"

cleanup() { rm -f "$COOKIE_JAR"; }
trap cleanup EXIT

ok() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

echo "=== AI Arena Smoke Test ==="
echo "Base: $BASE"

# 1. Session returns 204 when not authenticated
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/session")
[ "$STATUS" = "204" ] && ok "Auth session 204 when no cookie" || fail "Expected 204 unauthenticated session, got $STATUS"

# 2. Connect wallet
CONNECT=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE/auth/connect" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"$WALLET\"}")
BALANCE=$(echo "$CONNECT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).wallet.balance)))")
[ "$BALANCE" = "100" ] && ok "Connect wallet, starting balance 100 ONE" || fail "Expected balance 100, got $BALANCE"

# 3. Session returns 200 after connect
STATUS=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE/auth/session")
[ "$STATUS" = "200" ] && ok "Auth session 200 with valid cookie" || fail "Expected 200 authenticated session, got $STATUS"

# 4. Mint fighter 1
F1=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/fighters" \
  -H "Content-Type: application/json" \
  -d '{"name":"SmokeA","color":"#00f0ff"}' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(JSON.parse(d).id))")
[ -n "$F1" ] && ok "Minted fighter 1: $F1" || fail "Failed to mint fighter 1"

# 5. Mint fighter 2
F2=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/fighters" \
  -H "Content-Type: application/json" \
  -d '{"name":"SmokeB","color":"#ff003c"}' | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(JSON.parse(d).id))")
[ -n "$F2" ] && ok "Minted fighter 2: $F2" || fail "Failed to mint fighter 2"

# 6. Train fighter 1
TRAIN=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/fighters/$F1/train" \
  -H "Content-Type: application/json" \
  -d '{"type":"BASIC","stat":"aggression"}')
IMPROVEMENT=$(echo "$TRAIN" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).improvement)))")
[ -n "$IMPROVEMENT" ] && ok "Trained fighter (aggression improvement: $IMPROVEMENT)" || fail "Training failed"

# 7. Battle own fighters (own-vs-own allowed for demo)
BATTLE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE/battles" \
  -H "Content-Type: application/json" \
  -d "{\"fighter1Id\":\"$F1\",\"fighter2Id\":\"$F2\"}")
ROUNDS=$(echo "$BATTLE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).rounds)))")
STATUS_BATTLE=$(echo "$BATTLE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(JSON.parse(d).status))")
[ "$STATUS_BATTLE" = "COMPLETED" ] && ok "Battle completed in $ROUNDS rounds" || fail "Battle status: $STATUS_BATTLE"

# 8. Wallet transaction history (full, no limit)
TX_COUNT=$(curl -s -b "$COOKIE_JAR" "$BASE/wallet/transactions" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).transactions.length)))")
[ "$TX_COUNT" -ge 5 ] && ok "Transaction history: $TX_COUNT records" || fail "Expected >=5 transactions, got $TX_COUNT"

# 9. Verify wallet balance (100 - 10 - 10 - 5 [train] + reward)
FINAL_BAL=$(curl -s -b "$COOKIE_JAR" "$BASE/wallet" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>process.stdout.write(String(JSON.parse(d).balance)))")
[ -n "$FINAL_BAL" ] && ok "Final balance: $FINAL_BAL ONE" || fail "Could not fetch final balance"

# 10. Platform stats
STATS_STATUS=$(curl -s -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE/stats")
[ "$STATS_STATUS" = "200" ] && ok "Platform stats endpoint working" || fail "Stats endpoint returned $STATS_STATUS"

echo ""
echo "=== All smoke tests passed ==="
