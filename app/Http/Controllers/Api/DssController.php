<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssessmentRecord;
use App\Models\SchoolYear;
use App\Models\Subject;
use App\Models\TeachingAssignment;
use App\Models\Term;
use App\Services\StatsCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Manages Decision Support System (DSS) analytics, early warnings, and institutional KPIs
class DssController extends Controller
{
    public function __construct(
        protected StatsCalculatorService $statsCalculator
    ) {}

    // Generate executive overview metrics and early warning intelligence for the Decision Support System
    public function overview(Request $request): JsonResponse
    {
        // 1. Resolve Academic Scoping (School Year and Term)
        $schoolYearId = $request->input('school_year_id');
        $termId = $request->input('term_id');

        $schoolYear = $schoolYearId
            ? SchoolYear::with('terms')->find($schoolYearId)
            : (SchoolYear::with('terms')->where('is_active', true)->first() ?? SchoolYear::with('terms')->latest()->first());

        if (! $schoolYear) {
            return response()->json([
                'message' => 'No active academic year found in the institutional records.',
                'data' => null,
            ], 404);
        }

        $term = $termId
            ? Term::where('school_year_id', $schoolYear->id)->find($termId)
            : (Term::where('school_year_id', $schoolYear->id)->where('status', 'active')->first()
                ?? Term::where('school_year_id', $schoolYear->id)->first());

        // List all available school years with their terms for the temporal filter dropdown
        $allSchoolYears = SchoolYear::with(['terms' => fn ($q) => $q->orderBy('term_number')])
            ->orderBy('start_date', 'desc')
            ->get();

        if (! $term) {
            return response()->json([
                'data' => [
                    'active_school_year' => $schoolYear,
                    'active_term' => null,
                    'all_school_years' => $allSchoolYears,
                    'kpis' => null,
                    'at_risk_classes' => [],
                    'subject_mastery_matrix' => [],
                    'grade_level_breakdown' => [],
                    'growth_analytics' => null,
                    'pending_submissions' => [],
                ],
            ]);
        }

        // 2. Fetch all Assessment Records for this School Year & Term
        $records = AssessmentRecord::with(['section.gradeLevel', 'subject', 'teacher', 'gradeLevel'])
            ->where('school_year_id', $schoolYear->id)
            ->where('term_id', $term->id)
            ->get();

        $termExams = $records->where('type', 'term_exam');
        $diagnostics = $records->where('type', 'diagnostic');

        // Primary dataset for consolidated institutional health is term_exam (or all records if none exist yet)
        $primaryRecords = $termExams->isNotEmpty() ? $termExams : $records;
        $consolidationSummary = $this->statsCalculator->summarizeConsolidation($primaryRecords);

        // 3. Faculty Encoding Compliance & Submission Rate
        $activeAssignments = TeachingAssignment::with(['section.gradeLevel', 'subject', 'teacher'])
            ->where('school_year_id', $schoolYear->id)
            ->active()
            ->get();

        $totalExpectedClasses = $activeAssignments->count();

        // Track which assignments have been submitted
        $submittedClassKeys = $termExams->map(function ($rec) {
            return "{$rec->section_id}_{$rec->subject_id}";
        })->unique()->toArray();

        $submittedCount = 0;
        $pendingSubmissions = [];

        foreach ($activeAssignments as $assignment) {
            $key = "{$assignment->section_id}_{$assignment->subject_id}";
            if (in_array($key, $submittedClassKeys, true)) {
                $submittedCount++;
            } else {
                $pendingSubmissions[] = [
                    'assignment_id' => $assignment->id,
                    'teacher_name' => $assignment->teacher?->name ?? 'Unassigned Faculty',
                    'teacher_email' => $assignment->teacher?->email ?? '',
                    'grade_level' => $assignment->section?->gradeLevel?->display_name ?? 'N/A',
                    'section_name' => $assignment->section?->name ?? 'N/A',
                    'subject_code' => $assignment->subject?->code ?? 'N/A',
                    'subject_name' => $assignment->subject?->name ?? 'N/A',
                ];
            }
        }

        $submissionRate = $totalExpectedClasses > 0
            ? round(($submittedCount / $totalExpectedClasses) * 100, 1)
            : 0.0;

        // 4. Early Warning Radar: At-Risk & Polarized Classes
        $atRiskClasses = [];
        foreach ($primaryRecords as $record) {
            $mps = (float) ($record->mps ?? 0);
            $sd = (float) ($record->sd ?? 0);
            $isLowMps = $mps < 75.0; // DepEd minimum baseline standard
            $isHighSd = $sd >= 7.0;  // High polarization between high and low scorers

            if ($isLowMps || $isHighSd) {
                $reasons = [];
                if ($mps < 35.0) {
                    $reasons[] = 'Critical Academic Deficiency (MPS < 35%)';
                } elseif ($mps < 75.0) {
                    $reasons[] = 'Below DepEd 75% Mastery Benchmark';
                }

                if ($isHighSd) {
                    $reasons[] = "High Score Variance (σ = {$sd})";
                }

                $atRiskClasses[] = [
                    'id' => $record->id,
                    'grade_level' => $record->gradeLevel?->display_name ?? "Grade {$record->section?->grade_level_id}",
                    'section_name' => $record->section?->name ?? 'N/A',
                    'subject_code' => $record->subject?->code ?? 'N/A',
                    'subject_name' => $record->subject?->name ?? 'N/A',
                    'teacher_name' => $record->teacher?->name ?? 'Faculty Member',
                    'mean' => (float) $record->mean,
                    'mps' => $mps,
                    'sd' => $sd,
                    'mastery_level' => $record->remarks ?? $this->statsCalculator->classifyMasteryLevel($mps),
                    'risk_level' => $mps < 35.0 ? 'critical' : ($isLowMps ? 'high' : 'moderate'),
                    'reasons' => $reasons,
                    'least_learned_competency' => $record->least_learned_competency,
                ];
            }
        }

        // Sort at-risk classes with lowest MPS first for immediate executive intervention
        usort($atRiskClasses, fn ($a, $b) => $a['mps'] <=> $b['mps']);

        // 5. Cross-Grade Subject Area Mastery Matrix
        $subjectGroups = [];
        foreach ($primaryRecords as $record) {
            $subjName = $record->subject?->name ?? 'General';
            if (! isset($subjectGroups[$subjName])) {
                $subjectGroups[$subjName] = [
                    'name' => $subjName,
                    'records' => collect(),
                ];
            }
            $subjectGroups[$subjName]['records']->push($record);
        }

        $subjectMasteryMatrix = [];
        foreach ($subjectGroups as $group) {
            $subjConsolidation = $this->statsCalculator->summarizeConsolidation($group['records']);
            $avgMps = (float) $subjConsolidation['overall_mps'];

            $subjectMasteryMatrix[] = [
                'subject_name' => $group['name'],
                'classes_count' => $group['records']->count(),
                'total_examinees' => $subjConsolidation['total_examinees'],
                'average_mps' => $avgMps,
                'mastery_level' => $subjConsolidation['overall_mastery'],
                'is_benchmark_met' => $avgMps >= 75.0,
            ];
        }

        // Sort subject areas from highest performing to lowest
        usort($subjectMasteryMatrix, fn ($a, $b) => $b['average_mps'] <=> $a['average_mps']);

        // 6. Grade Level Comparative Breakdown
        $gradeBreakdown = [];
        $gradeGrouped = $primaryRecords->groupBy(fn ($r) => $r->gradeLevel?->level ?? $r->section?->grade_level_id);

        foreach ([7, 8, 9, 10] as $level) {
            $gradeRecords = $gradeGrouped->get($level, collect());
            $stats = $this->statsCalculator->summarizeConsolidation($gradeRecords);

            $gradeBreakdown[] = [
                'level' => $level,
                'display_name' => "Grade {$level}",
                'classes_count' => $gradeRecords->count(),
                'total_examinees' => $stats['total_examinees'],
                'overall_mps' => (float) $stats['overall_mps'],
                'mastery_level' => $stats['overall_mastery'],
                'is_benchmark_met' => (float) $stats['overall_mps'] >= 75.0,
            ];
        }

        // 7. Value-Added Growth Analytics (Diagnostic vs. Term Exam)
        $growthAnalytics = null;
        if ($diagnostics->isNotEmpty() && $termExams->isNotEmpty()) {
            $diagSummary = $this->statsCalculator->summarizeConsolidation($diagnostics);
            $termSummary = $this->statsCalculator->summarizeConsolidation($termExams);

            $diagMps = (float) $diagSummary['overall_mps'];
            $termMps = (float) $termSummary['overall_mps'];
            $growthDelta = round($termMps - $diagMps, 2);

            $growthAnalytics = [
                'has_comparison' => true,
                'diagnostic_examinees' => $diagSummary['total_examinees'],
                'diagnostic_mps' => $diagMps,
                'diagnostic_mastery' => $diagSummary['overall_mastery'],
                'term_exam_examinees' => $termSummary['total_examinees'],
                'term_exam_mps' => $termMps,
                'term_exam_mastery' => $termSummary['overall_mastery'],
                'growth_delta' => $growthDelta,
                'growth_direction' => $growthDelta > 0 ? 'positive' : ($growthDelta < 0 ? 'negative' : 'neutral'),
            ];
        } elseif ($diagnostics->isNotEmpty()) {
            $diagSummary = $this->statsCalculator->summarizeConsolidation($diagnostics);
            $growthAnalytics = [
                'has_comparison' => false,
                'diagnostic_examinees' => $diagSummary['total_examinees'],
                'diagnostic_mps' => (float) $diagSummary['overall_mps'],
                'diagnostic_mastery' => $diagSummary['overall_mastery'],
                'term_exam_examinees' => 0,
                'term_exam_mps' => 0.0,
                'term_exam_mastery' => 'Pending',
                'growth_delta' => 0.0,
                'growth_direction' => 'pending_exam',
            ];
        }

        // 8. Recent Assessment Submissions
        $recentSubmissions = $records->sortByDesc('updated_at')->take(6)->values()->map(function ($r) {
            return [
                'id' => $r->id,
                'section_name' => $r->section?->name ?? 'N/A',
                'grade_level' => $r->gradeLevel?->display_name ?? 'N/A',
                'subject_code' => $r->subject?->code ?? 'N/A',
                'teacher_name' => $r->teacher?->name ?? 'Faculty Member',
                'type' => $r->type,
                'mps' => (float) $r->mps,
                'updated_at' => $r->updated_at?->toISOString() ?? now()->toISOString(),
            ];
        });

        return response()->json([
            'data' => [
                'active_school_year' => [
                    'id' => $schoolYear->id,
                    'name' => $schoolYear->name,
                    'is_active' => (bool) $schoolYear->is_active,
                ],
                'active_term' => [
                    'id' => $term->id,
                    'term_number' => $term->term_number,
                    'name' => $term->name,
                    'status' => $term->status,
                ],
                'all_school_years' => $allSchoolYears,
                'kpis' => [
                    'total_examinees' => $consolidationSummary['total_examinees'],
                    'overall_mps' => (float) $consolidationSummary['overall_mps'],
                    'overall_mean' => (float) $consolidationSummary['overall_mean'],
                    'overall_sd' => (float) $consolidationSummary['overall_sd'],
                    'overall_mastery' => $consolidationSummary['overall_mastery'],
                    'total_expected_classes' => $totalExpectedClasses,
                    'submitted_classes_count' => $submittedCount,
                    'pending_classes_count' => count($pendingSubmissions),
                    'submission_rate' => $submissionRate,
                    'at_risk_count' => count($atRiskClasses),
                ],
                'at_risk_classes' => $atRiskClasses,
                'subject_mastery_matrix' => $subjectMasteryMatrix,
                'grade_level_breakdown' => $gradeBreakdown,
                'growth_analytics' => $growthAnalytics,
                'pending_submissions' => $pendingSubmissions,
                'recent_submissions' => $recentSubmissions,
            ],
        ]);
    }
}
