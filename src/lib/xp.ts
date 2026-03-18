/**
 * XP Formula (Logarithmic Difficulty Increase):
 * 
 * Required XP for level L -> L+1:
 * R(L) = 500 + 250 * ln(L)
 * 
 * 특징:
 * 1. 레벨이 오를수록 다음 레벨에 필요한 경험치는 '증가'합니다. (R(L) > R(L-1))
 * 2. 하지만 그 '증가하는 양'은 점점 줄어듭니다. (그래프가 완만해짐)
 * 3. 따라서 고레벨로 가도 난이도가 감당할 수 없을 만큼 치솟지 않습니다.
 */

const BASE_XP = 500;
const SLOPE = 250;

export const getExpForNextLevel = (currentLevel: number): number => {
  // 다음 레벨로 가기 위해 필요한 총 경험치 양 (현재 레벨 기준)
  // ln(1) = 0 이므로 1레벨에서는 500이 보장됨
  return Math.floor(BASE_XP + SLOPE * Math.log(currentLevel));
};

export const getExpToReachLevel = (level: number): number => {
  if (level <= 1) return 0;
  
  // 합산 (반복문으로 계산 - 효율적임)
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getExpForNextLevel(i);
  }
  return total;
};

export const getLevelFromExp = (totalExp: number): number => {
  if (totalExp <= 0) return 1;
  
  let level = 1;
  let accumulatedExp = 0;
  
  while (true) {
    const nextLevelExp = getExpForNextLevel(level);
    if (accumulatedExp + nextLevelExp > totalExp) break;
    accumulatedExp += nextLevelExp;
    level++;
  }
  
  return level;
};
