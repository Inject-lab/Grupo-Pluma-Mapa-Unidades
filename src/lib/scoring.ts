import { Unit, LocationType } from "@/types/unit";

/**
 * Calculate precision score for a geocoded unit (0-100)
 * 
 * Scoring rules:
 * +60 ROOFTOP
 * +20 municipality match
 * +10 CEP match
 * +10 no partial_match
 * -30 RANGE_INTERPOLATED
 * -50 GEOMETRIC_CENTER/APPROXIMATE
 * -40 municipality divergence
 */
export function calculateScore(unit: Partial<Unit>): number {
  let score = 0;
  
  // Location type scoring
  if (unit.location_type === "ROOFTOP") {
    score += 60;
  } else if (unit.location_type === "RANGE_INTERPOLATED") {
    score += 30; // Base score, then -30 penalty
  } else if (
    unit.location_type === "GEOMETRIC_CENTER" ||
    unit.location_type === "APPROXIMATE"
  ) {
    score += 10; // Very low base
  }
  
  // Municipality match
  if (unit.municipality_match) {
    score += 20;
  } else if (unit.municipality_match === false) {
    score -= 40;
  }
  
  // CEP match
  if (unit.cep_match) {
    score += 10;
  }
  
  // Partial match penalty
  if (!unit.partial_match) {
    score += 10;
  }
  
  // Inside PR validation
  if (unit.inside_pr === false) {
    score = 0; // Automatic fail
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "status-ok";
  if (score >= 60) return "status-warning";
  return "status-error";
}

/**
 * Get status text based on score
 */
export function getScoreStatus(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Aceitável";
  return "Revisar";
}
