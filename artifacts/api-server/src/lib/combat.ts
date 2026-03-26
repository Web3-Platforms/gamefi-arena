import type { Fighter } from "@workspace/db";

export interface BattleRound {
  round: number;
  attacker: string;
  defender: string;
  damage: number;
  fighter1Hp: number;
  fighter2Hp: number;
  move: string;
}

export interface BattleResult {
  rounds: BattleRound[];
  winnerId: string;
  loserId: string;
  fighter1FinalHp: number;
  fighter2FinalHp: number;
  totalRounds: number;
}

const MOVES = [
  "Neural Strike",
  "Quantum Slash",
  "AI Overload",
  "Synaptic Burst",
  "Data Surge",
  "Cyber Uppercut",
  "Logic Bomb",
  "Firewall Breaker",
  "Core Exploit",
  "Heuristic Kick",
  "Buffer Overflow",
  "Algorithm Smash",
];

const MAX_HP = 1000;
const MAX_ROUNDS = 30;

function calcAttackDamage(attacker: Fighter, defender: Fighter): number {
  const baseAttack = attacker.power * 120 + attacker.aggression * 80 + attacker.speed * 40;
  const baseDef = defender.defense * 90 + defender.intelligence * 30;
  const rawDamage = Math.max(5, baseAttack - baseDef * 0.6);
  const critChance = attacker.intelligence * 0.2;
  const crit = Math.random() < critChance ? 1.5 : 1.0;
  const variance = 0.85 + Math.random() * 0.3;
  return Math.round(rawDamage * crit * variance);
}

function getMove(attacker: Fighter): string {
  const idx = Math.floor(
    (attacker.aggression + attacker.power) * MOVES.length * 0.4 +
      Math.random() * 4
  ) % MOVES.length;
  return MOVES[idx] ?? MOVES[0]!;
}

export function simulateBattle(fighter1: Fighter, fighter2: Fighter): BattleResult {
  let hp1 = MAX_HP;
  let hp2 = MAX_HP;
  const rounds: BattleRound[] = [];
  let roundNum = 0;

  while (hp1 > 0 && hp2 > 0 && roundNum < MAX_ROUNDS) {
    roundNum++;

    const f1Speed = fighter1.speed + Math.random() * 0.3;
    const f2Speed = fighter2.speed + Math.random() * 0.3;

    if (f1Speed >= f2Speed) {
      const dmg1 = calcAttackDamage(fighter1, fighter2);
      hp2 = Math.max(0, hp2 - dmg1);
      rounds.push({
        round: roundNum,
        attacker: fighter1.name,
        defender: fighter2.name,
        damage: dmg1,
        fighter1Hp: hp1,
        fighter2Hp: hp2,
        move: getMove(fighter1),
      });
      if (hp2 <= 0) break;

      const dmg2 = calcAttackDamage(fighter2, fighter1);
      hp1 = Math.max(0, hp1 - dmg2);
      rounds.push({
        round: roundNum,
        attacker: fighter2.name,
        defender: fighter1.name,
        damage: dmg2,
        fighter1Hp: hp1,
        fighter2Hp: hp2,
        move: getMove(fighter2),
      });
    } else {
      const dmg2 = calcAttackDamage(fighter2, fighter1);
      hp1 = Math.max(0, hp1 - dmg2);
      rounds.push({
        round: roundNum,
        attacker: fighter2.name,
        defender: fighter1.name,
        damage: dmg2,
        fighter1Hp: hp1,
        fighter2Hp: hp2,
        move: getMove(fighter2),
      });
      if (hp1 <= 0) break;

      const dmg1 = calcAttackDamage(fighter1, fighter2);
      hp2 = Math.max(0, hp2 - dmg1);
      rounds.push({
        round: roundNum,
        attacker: fighter1.name,
        defender: fighter2.name,
        damage: dmg1,
        fighter1Hp: hp1,
        fighter2Hp: hp2,
        move: getMove(fighter1),
      });
    }
  }

  const fighter1Wins = hp1 > 0 && (hp2 <= 0 || hp1 >= hp2);
  const winnerId = fighter1Wins ? fighter1.id : fighter2.id;
  const loserId = fighter1Wins ? fighter2.id : fighter1.id;

  return {
    rounds,
    winnerId,
    loserId,
    fighter1FinalHp: Math.max(0, Math.round(hp1)),
    fighter2FinalHp: Math.max(0, Math.round(hp2)),
    totalRounds: roundNum,
  };
}
