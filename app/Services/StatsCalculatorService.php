<?php

namespace App\Services;

class StatsCalculatorService
{
    /**
     * Compute examination statistics and DepEd 7-level mastery classification.
     *
     * @param  array<int, numeric>  $scores
     * @return array{no_of_entries: int, mean: float, mps: float, sd: float, highest_score: float, lowest_score: float, total_items: int, mastery_level: string}
     */
    public function calculate(array $scores, int|float $totalItems = 50): array
    {
        // 1. Filter valid numeric scores
        $validScores = array_values(array_filter($scores, fn ($s) => is_numeric($s)));
        $n = count($validScores);

        if ($n === 0) {
            return [
                'no_of_entries'  => 0,
                'mean'           => 0.0,
                'mps'            => 0.0,
                'sd'             => 0.0,
                'highest_score'  => 0.0,
                'lowest_score'   => 0.0,
                'total_items'    => (int) $totalItems,
                'mastery_level'  => 'No Mastery',
            ];
        }

        $totalItems = (float) $totalItems > 0 ? (float) $totalItems : 50.0;

        // 2. Mean (Average)
        $mean = array_sum($validScores) / $n;

        // 3. MPS (Mean Percentage Score)
        $mps = ($mean / $totalItems) * 100.0;

        // 4. Population Standard Deviation (DepEd Standard)
        $variance = array_reduce(
            $validScores,
            fn ($carry, $x) => $carry + ($x - $mean) ** 2,
            0.0
        ) / $n;
        $sd = sqrt($variance);

        // 5. 7-Level DepEd Mastery Classification
        $masteryLevel = $this->classifyMasteryLevel($mps);

        return [
            'no_of_entries'  => $n,
            'mean'           => round($mean, 2),
            'mps'            => round($mps, 2),
            'sd'             => round($sd, 2),
            'highest_score'  => round(max($validScores), 2),
            'lowest_score'   => round(min($validScores), 2),
            'total_items'    => (int) $totalItems,
            'mastery_level'  => $masteryLevel,
        ];
    }

    /**
     * Determine official DepEd 7-Level Mastery bracket.
     */
    public function classifyMasteryLevel(float $mps): string
    {
        return match (true) {
            $mps >= 96.0 => 'Mastered',
            $mps >= 86.0 => 'Closely Approximating Mastery',
            $mps >= 66.0 => 'Moving Towards Mastery',
            $mps >= 35.0 => 'Average',
            $mps >= 15.0 => 'Low',
            $mps >= 5.0  => 'Very Low',
            default      => 'Absolutely No Mastery',
        };
    }
}