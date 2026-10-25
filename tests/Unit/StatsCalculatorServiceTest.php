<?php

namespace Tests\Unit;

use App\Models\AssessmentRecord;
use App\Services\StatsCalculatorService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class StatsCalculatorServiceTest extends TestCase
{
    protected StatsCalculatorService $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new StatsCalculatorService;
    }

    // Data provider for all 7 DepEd mastery descriptor brackets
    public static function depedMasteryBracketsProvider(): array
    {
        return [
            'Mastered ceiling 100%' => [100.0, 'Mastered'],
            'Mastered boundary 96.0%' => [96.0, 'Mastered'],
            'Closely Approximating ceiling 95.99%' => [95.99, 'Closely Approximating Mastery'],
            'Closely Approximating boundary 86.0%' => [86.0, 'Closely Approximating Mastery'],
            'Moving Towards ceiling 85.99%' => [85.99, 'Moving Towards Mastery'],
            'Moving Towards boundary 66.0%' => [66.0, 'Moving Towards Mastery'],
            'Average ceiling 65.99%' => [65.99, 'Average'],
            'Average boundary 35.0%' => [35.0, 'Average'],
            'Low ceiling 34.99%' => [34.99, 'Low'],
            'Low boundary 15.0%' => [15.0, 'Low'],
            'Very Low ceiling 14.99%' => [14.99, 'Very Low'],
            'Very Low boundary 5.0%' => [5.0, 'Very Low'],
            'Absolutely No Mastery ceiling 4.99%' => [4.99, 'Absolutely No Mastery'],
            'Absolutely No Mastery floor 0.0%' => [0.0, 'Absolutely No Mastery'],
        ];
    }

    #[DataProvider('depedMasteryBracketsProvider')]
    public function test_classify_mastery_level_matches_official_deped_7_brackets(float $mps, string $expectedDescriptor): void
    {
        $this->assertSame($expectedDescriptor, $this->calculator->classifyMasteryLevel($mps));
    }

    // Test calculate() returns accurate descriptive statistics and mastery level
    public function test_calculate_returns_accurate_mean_mps_sd_and_mastery(): void
    {
        // 5 scores: 40, 45, 50, 35, 30 with totalItems = 50
        // Sum = 200, N = 5
        // Mean = 200 / 5 = 40.00
        // MPS = (40 / 50) * 100 = 80.00% -> 'Moving Towards Mastery'
        // Deviations from 40: 0, +5, +10, -5, -10
        // Squared deviations: 0, 25, 100, 25, 100 -> Sum = 250
        // Population Variance = 250 / 5 = 50.00
        // Population SD = sqrt(50) = 7.07106... -> 7.07
        $result = $this->calculator->calculate([40, 45, 50, 35, 30], 50);

        $this->assertSame(5, $result['no_of_entries']);
        $this->assertSame(40.0, $result['mean']);
        $this->assertSame(80.0, $result['mps']);
        $this->assertSame(7.07, $result['sd']);
        $this->assertSame(50.0, $result['highest_score']);
        $this->assertSame(30.0, $result['lowest_score']);
        $this->assertSame(50, $result['total_items']);
        $this->assertSame('Moving Towards Mastery', $result['mastery_level']);
    }

    // Test calculate() handles empty input gracefully
    public function test_calculate_handles_empty_scores_array(): void
    {
        $result = $this->calculator->calculate([], 50);

        $this->assertSame(0, $result['no_of_entries']);
        $this->assertSame(0.0, $result['mean']);
        $this->assertSame(0.0, $result['mps']);
        $this->assertSame(0.0, $result['sd']);
        $this->assertSame(0.0, $result['highest_score']);
        $this->assertSame(0.0, $result['lowest_score']);
        $this->assertSame(50, $result['total_items']);
        $this->assertSame('Pending', $result['mastery_level']);
    }

    // Test calculate() filters out non-numeric values
    public function test_calculate_filters_non_numeric_scores(): void
    {
        $result = $this->calculator->calculate([48, 'invalid', null, 50, 49], 50);

        // Valid: 48, 50, 49 -> Sum = 147, N = 3
        // Mean = 49.00
        // MPS = (49 / 50) * 100 = 98.00% -> 'Mastered'
        $this->assertSame(3, $result['no_of_entries']);
        $this->assertSame(49.0, $result['mean']);
        $this->assertSame(98.0, $result['mps']);
        $this->assertSame('Mastered', $result['mastery_level']);
    }

    // Test summarizeConsolidation() computes pooled statistics across sections
    public function test_summarize_consolidation_computes_pooled_statistics(): void
    {
        $rec1 = new AssessmentRecord([
            'no_of_entries' => 40,
            'mean' => 42.00,
            'mps' => 84.00,
            'sd' => 5.20,
            'raw_scores' => null,
        ]);

        $rec2 = new AssessmentRecord([
            'no_of_entries' => 40,
            'mean' => 38.00,
            'mps' => 76.00,
            'sd' => 4.80,
            'raw_scores' => null,
        ]);

        $summary = $this->calculator->summarizeConsolidation(collect([$rec1, $rec2]));

        $this->assertSame(2, $summary['total_sections_encoded']);
        $this->assertSame(80, $summary['total_examinees']);
        // Equal weighting: Overall Mean = (42 + 38) / 2 = 40.00
        $this->assertSame(40.0, $summary['overall_mean']);
        // Overall MPS = (84 + 76) / 2 = 80.00%
        $this->assertSame(80.0, $summary['overall_mps']);
        // Overall Mastery for 80% is 'Moving Towards Mastery'
        $this->assertSame('Moving Towards Mastery', $summary['overall_mastery']);
    }
}
