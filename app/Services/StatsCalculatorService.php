<?php

namespace App\Services;

use Illuminate\Support\Collection;

// Service responsible for all DepEd statistical calculations and performance mastery classifications
class StatsCalculatorService
{
    // Compute examination statistics, Mean Percentage Score (MPS), standard deviation, and DepEd 7-level mastery classification
    public function calculate(array $scores, int|float $totalItems = 50): array
    {
        // Filter input array to extract only valid numeric student scores, ignoring empty or null submissions
        $validScores = array_values(array_filter($scores, fn ($s) => is_numeric($s)));

        // Count total number of valid examinees who took the test
        $n = count($validScores);

        // Guard clause: Return zeroed baseline metrics if no valid examinee scores were provided
        if ($n === 0) {
            return [
                // Set examinee count to 0 when list is empty
                'no_of_entries' => 0,
                // Default arithmetic mean to 0.0
                'mean' => 0.0,
                // Default Mean Percentage Score to 0.0%
                'mps' => 0.0,
                // Default standard deviation to 0.0
                'sd' => 0.0,
                // Default highest score recorded to 0.0
                'highest_score' => 0.0,
                // Default lowest score recorded to 0.0
                'lowest_score' => 0.0,
                // Preserve the designated total test items for the assessment
                'total_items' => (int) $totalItems,
                // Assign Pending mastery status pending student score encoding
                'mastery_level' => 'Pending',
            ];
        }

        // Ensure totalItems is a positive non-zero float to prevent division-by-zero errors in MPS calculation
        $totalItems = (float) $totalItems > 0 ? (float) $totalItems : 50.0;

        // Calculate arithmetic mean: sum of all examinee scores divided by total number of examinees (x̄ = Σx / N)
        $mean = array_sum($validScores) / $n;

        // Calculate Mean Percentage Score (MPS): (arithmetic mean / total test items) * 100%
        $mps = ($mean / $totalItems) * 100.0;

        // Calculate population variance: sum of squared differences from the mean divided by N (σ² = Σ(x - x̄)² / N)
        $variance = array_reduce(
            $validScores,
            fn ($carry, $x) => $carry + ($x - $mean) ** 2,
            0.0
        ) / $n;

        // Calculate population standard deviation: square root of population variance (σ = √σ²)
        $sd = sqrt($variance);

        // Map computed MPS percentage to official DepEd 7-level mastery descriptor
        $masteryLevel = $this->classifyMasteryLevel($mps);

        // Return structured associative array of rounded statistics conforming to DepEd assessment standards
        return [
            // Total number of students who completed the assessment
            'no_of_entries' => $n,
            // Arithmetic mean rounded to two decimal places
            'mean' => round($mean, 2),
            // Mean Percentage Score rounded to two decimal places
            'mps' => round($mps, 2),
            // Population standard deviation rounded to two decimal places
            'sd' => round($sd, 2),
            // Highest individual raw score attained among examinees
            'highest_score' => round(max($validScores), 2),
            // Lowest individual raw score attained among examinees
            'lowest_score' => round(min($validScores), 2),
            // Maximum total score possible on the examination
            'total_items' => (int) $totalItems,
            // Official DepEd verbal interpretation bracket for learner mastery
            'mastery_level' => $masteryLevel,
        ];
    }

    // Determine official DepEd 7-level mastery verbal interpretation from Mean Percentage Score (MPS)
    public function classifyMasteryLevel(float $mps): string
    {
        // Evaluate MPS against official Department of Education mastery benchmark brackets
        return match (true) {
            // Scores between 96% and 100% represent full mastery of the competencies tested
            $mps >= 96.0 => 'Mastered',
            // Scores between 86% and 95.99% demonstrate near-complete mastery
            $mps >= 86.0 => 'Closely Approximating Mastery',
            // Scores between 66% and 85.99% demonstrate progressive learning approaching mastery
            $mps >= 66.0 => 'Moving Towards Mastery',
            // Scores between 35% and 65.99% represent average academic competence
            $mps >= 35.0 => 'Average',
            // Scores between 15% and 34.99% indicate low performance requiring instructional intervention
            $mps >= 15.0 => 'Low',
            // Scores between 5% and 14.99% represent very low competency requiring remedial instruction
            $mps >= 5.0 => 'Very Low',
            // Scores below 5% indicate critical lack of prerequisite knowledge
            default => 'Absolutely No Mastery',
        };
    }

    // Compute consolidated statistics across multiple assessment records using mathematically sound pooled variance
    public function summarizeConsolidation(Collection $records): array
    {
        // Count number of section assessment records included in this consolidation grouping
        $count = $records->count();

        // Calculate grand total of all students tested across all included sections
        $totalExaminees = (int) $records->sum('no_of_entries');

        // Guard clause: Return zeroed summary metrics if collection is empty or has zero examinees
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

        // Initialize array to aggregate raw score vectors from individual records where available
        $allRawScores = [];

        // Loop through each assessment record in the collection
        foreach ($records as $record) {
            // Decode raw score vector if stored as JSON string, or use directly if array
            $raw = is_array($record->raw_scores)
                ? $record->raw_scores
                : json_decode($record->raw_scores ?? '[]', true);

            // Verify raw scores exist as an array before processing individual student entries
            if (is_array($raw)) {
                // Collect valid numeric student scores into the consolidated vector
                foreach ($raw as $score) {
                    if (is_numeric($score)) {
                        $allRawScores[] = (float) $score;
                    }
                }
            }
        }

        // Method 1: If full raw score vectors are available for all examinees, perform exact population calculation
        if (count($allRawScores) === $totalExaminees && $totalExaminees > 0) {
            // Compute overall mean directly from the complete set of student scores
            $overallMean = array_sum($allRawScores) / $totalExaminees;

            // Compute exact population variance across all examinee scores
            $variance = array_reduce(
                $allRawScores,
                fn ($carry, $score) => $carry + ($score - $overallMean) ** 2,
                0.0
            ) / $totalExaminees;

            // Compute overall standard deviation as square root of exact variance
            $overallSd = sqrt($variance);
        } else {
            // Method 2: Use mathematically sound pooled weighted mean and pooled population variance
            // Initialize accumulator for weighted sum of section means: Σ(mean_i * n_i)
            $sumWeightedMean = 0.0;
            foreach ($records as $r) {
                $n = (int) ($r->no_of_entries ?? 0);
                $meanVal = (float) ($r->mean ?? 0.0);
                $sumWeightedMean += $meanVal * ($n > 0 ? $n : 1);
            }
            // Overall weighted mean: Σ(mean_i * n_i) / Σn_i
            $overallMean = $totalExaminees > 0 ? ($sumWeightedMean / $totalExaminees) : 0.0;

            // Compute pooled variance accounting for both within-section variance and between-section dispersion:
            // σ²_pooled = (1 / N) * Σ n_i * (σ_i² + (μ_i - μ)²)
            $sumVarianceComponents = 0.0;
            foreach ($records as $r) {
                $n = (int) ($r->no_of_entries ?? 0);
                $meanVal = (float) ($r->mean ?? 0.0);
                $sdVal = (float) ($r->sd ?? 0.0);
                $weight = $n > 0 ? $n : 1;

                // Within-group variance: σ_i²
                $varianceI = $sdVal ** 2;

                // Between-group dispersion: (μ_i - μ)²
                $betweenGroupI = ($meanVal - $overallMean) ** 2;

                // Accumulate weighted combined variance component
                $sumVarianceComponents += $weight * ($varianceI + $betweenGroupI);
            }

            // Divide accumulated components by total examinees to obtain exact pooled variance
            $pooledVariance = $totalExaminees > 0 ? ($sumVarianceComponents / $totalExaminees) : 0.0;

            // Standard deviation is the square root of pooled variance
            $overallSd = sqrt($pooledVariance);
        }

        // Calculate student-weighted overall Mean Percentage Score (MPS): Σ(mps_i * n_i) / Σn_i
        $sumWeightedMps = 0.0;
        foreach ($records as $r) {
            $n = (int) ($r->no_of_entries ?? 0);
            $mpsVal = (float) ($r->mps ?? 0.0);
            $sumWeightedMps += $mpsVal * ($n > 0 ? $n : 1);
        }
        $overallMps = $totalExaminees > 0 ? ($sumWeightedMps / $totalExaminees) : 0.0;

        // Return finalized consolidated statistical summary rounded for official reporting
        return [
            // Total number of sections encoded in this report
            'total_sections_encoded' => $count,
            // Total student examinees included across all sections
            'total_examinees' => $totalExaminees,
            // Overall examinee-weighted arithmetic mean
            'overall_mean' => round($overallMean, 2),
            // Overall examinee-weighted Mean Percentage Score
            'overall_mps' => round($overallMps, 2),
            // Mathematically valid pooled standard deviation
            'overall_sd' => round($overallSd, 2),
            // Official DepEd verbal mastery classification for the consolidated group
            'overall_mastery' => $this->classifyMasteryLevel($overallMps),
        ];
    }
}
