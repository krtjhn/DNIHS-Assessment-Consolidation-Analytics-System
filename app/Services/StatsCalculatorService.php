<?php

namespace App\Services;

use Illuminate\Support\Collection;

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
                'no_of_entries' => 0,
                'mean' => 0.0,
                'mps' => 0.0,
                'sd' => 0.0,
                'highest_score' => 0.0,
                'lowest_score' => 0.0,
                'total_items' => (int) $totalItems,
                'mastery_level' => 'Pending',
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
            'no_of_entries' => $n,
            'mean' => round($mean, 2),
            'mps' => round($mps, 2),
            'sd' => round($sd, 2),
            'highest_score' => round(max($validScores), 2),
            'lowest_score' => round(min($validScores), 2),
            'total_items' => (int) $totalItems,
            'mastery_level' => $masteryLevel,
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
            $mps >= 5.0 => 'Very Low',
            default => 'Absolutely No Mastery',
        };
    }

    /**
     * Compute consolidated summary metrics across multiple assessment records.
     * Uses exact raw score pooling when available or true pooled population variance and weighted mean.
     *
     * @param  Collection<int, mixed>  $records
     * @return array{total_sections_encoded: int, total_examinees: int, overall_mean: float, overall_mps: float, overall_sd: float, overall_mastery: string}
     */
    public function summarizeConsolidation(Collection $records): array
    {
        $count = $records->count();
        $totalExaminees = (int) $records->sum('no_of_entries');

        if ($count === 0 || $totalExaminees === 0) {
            return [
                'total_sections_encoded' => $count,
                'total_examinees' => 0,
                'overall_mean' => 0.00,
                'overall_mps' => 0.00,
                'overall_sd' => 0.00,
                'overall_mastery' => 'Absolutely No Mastery',
            ];
        }

        // Collect all available raw scores from records
        $allRawScores = [];
        foreach ($records as $record) {
            $raw = is_array($record->raw_scores)
                ? $record->raw_scores
                : json_decode($record->raw_scores ?? '[]', true);

            if (is_array($raw)) {
                foreach ($raw as $score) {
                    if (is_numeric($score)) {
                        $allRawScores[] = (float) $score;
                    }
                }
            }
        }

        // 1. If raw scores match total examinees, compute exact population mean and SD
        if (count($allRawScores) === $totalExaminees && $totalExaminees > 0) {
            $overallMean = array_sum($allRawScores) / $totalExaminees;
            $variance = array_reduce(
                $allRawScores,
                fn ($carry, $score) => $carry + ($score - $overallMean) ** 2,
                0.0
            ) / $totalExaminees;
            $overallSd = sqrt($variance);
        } else {
            // 2. Otherwise calculate exact pooled weighted mean and pooled population variance
            // Pooled Mean: sum(n_i * mean_i) / sum(n_i)
            $sumWeightedMean = 0.0;
            foreach ($records as $r) {
                $n = (int) ($r->no_of_entries ?? 0);
                $meanVal = (float) ($r->mean ?? 0.0);
                $sumWeightedMean += $meanVal * ($n > 0 ? $n : 1);
            }
            $overallMean = $totalExaminees > 0 ? ($sumWeightedMean / $totalExaminees) : 0.0;

            // Pooled Population Variance: sum(n_i * (sd_i^2 + (mean_i - mean_pooled)^2)) / sum(n_i)
            $sumVarianceComponents = 0.0;
            foreach ($records as $r) {
                $n = (int) ($r->no_of_entries ?? 0);
                $meanVal = (float) ($r->mean ?? 0.0);
                $sdVal = (float) ($r->sd ?? 0.0);
                $weight = $n > 0 ? $n : 1;
                $varianceI = $sdVal ** 2;
                $betweenGroupI = ($meanVal - $overallMean) ** 2;
                $sumVarianceComponents += $weight * ($varianceI + $betweenGroupI);
            }
            $pooledVariance = $totalExaminees > 0 ? ($sumVarianceComponents / $totalExaminees) : 0.0;
            $overallSd = sqrt($pooledVariance);
        }

        // Weighted MPS: sum(n_i * mps_i) / sum(n_i)
        $sumWeightedMps = 0.0;
        foreach ($records as $r) {
            $n = (int) ($r->no_of_entries ?? 0);
            $mpsVal = (float) ($r->mps ?? 0.0);
            $sumWeightedMps += $mpsVal * ($n > 0 ? $n : 1);
        }
        $overallMps = $totalExaminees > 0 ? ($sumWeightedMps / $totalExaminees) : 0.0;

        return [
            'total_sections_encoded' => $count,
            'total_examinees' => $totalExaminees,
            'overall_mean' => round($overallMean, 2),
            'overall_mps' => round($overallMps, 2),
            'overall_sd' => round($overallSd, 2),
            'overall_mastery' => $this->classifyMasteryLevel($overallMps),
        ];
    }
}
