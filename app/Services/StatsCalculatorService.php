<?php

namespace App\Services;

use Illuminate\Support\Collection;

// Handles DepEd score calculations and mastery level classifications
class StatsCalculatorService
{
    // Calculate assessment stats: Mean, MPS, Standard Deviation, and DepEd Mastery Level
    public function calculate(array $scores, int|float $totalItems = 50): array
    {
        // Filter out non-numeric values
        $validScores = array_values(array_filter($scores, fn ($s) => is_numeric($s))); // Keep only numeric scores
        $n = count($validScores); // Count number of valid examinees

        // Return empty stats if no valid scores are given
        if ($n === 0) {
            return [
                'no_of_entries' => 0, // Zero examinees
                'mean' => 0.0, // Zero mean
                'mps' => 0.0, // Zero MPS
                'sd' => 0.0, // Zero standard deviation
                'highest_score' => 0.0, // Zero high score
                'lowest_score' => 0.0, // Zero low score
                'total_items' => (int) $totalItems, // Target item count
                'mastery_level' => 'Pending', // Pending mastery status
            ];
        }

        // Avoid division by zero by ensuring total items is at least 50 if zero or negative
        $totalItems = (float) $totalItems > 0 ? (float) $totalItems : 50.0; // Fallback to 50 items

        // Formula: Mean = Sum of all scores / Number of students
        $mean = array_sum($validScores) / $n; // Arithmetic mean

        // Formula: Mean Percentage Score (MPS) = (Mean / Total Items) * 100
        $mps = ($mean / $totalItems) * 100.0; // DepEd MPS percentage

        // Formula: Population Variance = Sum of squared differences from the mean / N
        $variance = array_reduce(
            $validScores,
            fn ($carry, $x) => $carry + ($x - $mean) ** 2,
            0.0
        ) / $n; // Population variance

        // Formula: Population Standard Deviation = Square root of variance
        $sd = sqrt($variance); // Standard deviation

        // Get the official DepEd 7-bracket verbal interpretation
        $masteryLevel = $this->classifyMasteryLevel($mps); // Mastery classification

        return [
            'no_of_entries' => $n, // Number of students
            'mean' => round($mean, 2), // Mean rounded to 2 decimal places
            'mps' => round($mps, 2), // MPS rounded to 2 decimal places
            'sd' => round($sd, 2), // SD rounded to 2 decimal places
            'highest_score' => round(max($validScores), 2), // Maximum score achieved
            'lowest_score' => round(min($validScores), 2), // Minimum score recorded
            'total_items' => (int) $totalItems, // Total test items
            'mastery_level' => $masteryLevel, // DepEd mastery descriptor
        ];
    }

    // Classify MPS percentage into official DepEd 7-level mastery descriptors
    public function classifyMasteryLevel(float $mps): string
    {
        return match (true) {
            $mps >= 96.0 => 'Mastered', // 96.0% to 100.0%
            $mps >= 86.0 => 'Closely Approximating Mastery', // 86.0% to 95.99%
            $mps >= 66.0 => 'Moving Towards Mastery', // 66.0% to 85.99%
            $mps >= 35.0 => 'Average', // 35.0% to 65.99%
            $mps >= 15.0 => 'Low', // 15.0% to 34.99%
            $mps >= 5.0 => 'Very Low', // 5.0% to 14.99%
            default => 'Absolutely No Mastery', // Below 5.0%
        };
    }

    // Calculate consolidated statistics across multiple class sections
    public function summarizeConsolidation(Collection $records): array
    {
        $count = $records->count(); // Total section records encoded
        $totalExaminees = (int) $records->sum('no_of_entries'); // Total student count across all sections

        // Return empty summary if there are no records or students
        if ($count === 0 || $totalExaminees === 0) {
            return [
                'total_sections_encoded' => $count, // Count of sections
                'total_examinees' => 0, // Zero total students
                'overall_mean' => 0.00, // Zero overall mean
                'overall_mps' => 0.00, // Zero overall MPS
                'overall_sd' => 0.00, // Zero overall SD
                'overall_mastery' => 'Absolutely No Mastery', // Default zero-mastery descriptor
            ];
        }

        // Collect all individual raw student scores when available
        $allRawScores = []; // Array to hold all raw scores

        foreach ($records as $record) {
            $raw = is_array($record->raw_scores)
                ? $record->raw_scores
                : json_decode($record->raw_scores ?? '[]', true); // Parse JSON raw scores

            if (is_array($raw)) {
                foreach ($raw as $score) {
                    if (is_numeric($score)) {
                        $allRawScores[] = (float) $score; // Append score to pooled array
                    }
                }
            }
        }

        // Method 1: If full raw scores are available for every student, calculate exact overall mean and SD
        if (count($allRawScores) === $totalExaminees && $totalExaminees > 0) {
            $overallMean = array_sum($allRawScores) / $totalExaminees; // Exact pooled arithmetic mean

            $variance = array_reduce(
                $allRawScores,
                fn ($carry, $score) => $carry + ($score - $overallMean) ** 2,
                0.0
            ) / $totalExaminees; // Exact pooled variance

            $overallSd = sqrt($variance); // Exact pooled standard deviation

            // Compute overall weighted MPS from section MPS values
            $sumWeightedMps = 0.0; // Weighted sum accumulator
            foreach ($records as $r) {
                $n = (int) ($r->no_of_entries ?? 0); // Student count for this section
                $sumWeightedMps += (float) ($r->mps ?? 0.0) * ($n > 0 ? $n : 1); // Weighted MPS contribution
            }
            $overallMps = $totalExaminees > 0 ? ($sumWeightedMps / $totalExaminees) : 0.0; // Overall weighted MPS
        } else {
            // Method 2: Use mathematically sound pooled weighted mean, variance, and MPS in a single pass
            $sumWeightedMean = 0.0; // Weighted mean accumulator
            $sumWeightedMps = 0.0; // Weighted MPS accumulator
            foreach ($records as $r) {
                $n = (int) ($r->no_of_entries ?? 0); // Student count
                $weight = $n > 0 ? $n : 1; // Section weighting factor
                $sumWeightedMean += (float) ($r->mean ?? 0.0) * $weight; // Weighted mean contribution
                $sumWeightedMps += (float) ($r->mps ?? 0.0) * $weight; // Weighted MPS contribution
            }

            // Weighted Mean = Sum(mean_i * n_i) / Total Students
            $overallMean = $totalExaminees > 0 ? ($sumWeightedMean / $totalExaminees) : 0.0; // Weighted average score
            $overallMps = $totalExaminees > 0 ? ($sumWeightedMps / $totalExaminees) : 0.0; // Weighted average percentage

            // Pooled Variance accounts for within-section variance and between-section difference
            // Formula: (1 / N) * Sum( n_i * (sd_i^2 + (mean_i - overallMean)^2) )
            $sumVarianceComponents = 0.0; // Variance accumulator
            foreach ($records as $r) {
                $n = (int) ($r->no_of_entries ?? 0); // Student count
                $meanVal = (float) ($r->mean ?? 0.0); // Section mean
                $sdVal = (float) ($r->sd ?? 0.0); // Section SD
                $weight = $n > 0 ? $n : 1; // Section weight

                $varianceI = $sdVal ** 2; // Within-group variance
                $betweenGroupI = ($meanVal - $overallMean) ** 2; // Between-group variance difference

                $sumVarianceComponents += $weight * ($varianceI + $betweenGroupI); // Combined component
            }

            $pooledVariance = $totalExaminees > 0 ? ($sumVarianceComponents / $totalExaminees) : 0.0; // Pooled variance
            $overallSd = sqrt($pooledVariance); // Pooled standard deviation
        }

        return [
            'total_sections_encoded' => $count, // Number of sections included
            'total_examinees' => $totalExaminees, // Total students evaluated
            'overall_mean' => round($overallMean, 2), // Overall mean to 2 decimals
            'overall_mps' => round($overallMps, 2), // Overall MPS to 2 decimals
            'overall_sd' => round($overallSd, 2), // Overall SD to 2 decimals
            'overall_mastery' => $this->classifyMasteryLevel($overallMps), // Consolidated mastery descriptor
        ];
    }
}
