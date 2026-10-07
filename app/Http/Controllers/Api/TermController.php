<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Terms\UpdateTermStatusRequest;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TermController extends Controller
{
    /**
     * GET /api/terms
     * List terms with an optional school-year filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Term::with('schoolYear');

        if ($request->filled('school_year_id')) {
            $query->where('school_year_id', $request->school_year_id);
        }

        $terms = $query->orderBy('term_number')->get();

        return response()->json([
            'data' => $terms,
        ]);
    }

    /**
     * GET /api/terms/{term}
     * Display a term.
     */
    public function show(Term $term): JsonResponse
    {
        return response()->json([
            'data' => $term->load('schoolYear'),
        ]);
    }

    /**
     * PATCH /api/terms/{term}/status (Admin only)
     * Quick status switcher: pending (gray), active (blue), completed (green).
     */
    public function updateStatus(UpdateTermStatusRequest $request, Term $term): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $term) {
            if ($validated['status'] === 'active') {
                $this->completeOtherActiveTerms($term);
            }

            $term->update($validated);
        });

        return response()->json([
            'message' => "Term status updated to {$term->status}.",
            'data' => $term->load('schoolYear'),
        ]);
    }

    /**
     * Complete any previously active terms for the given school year.
     */
    protected function completeOtherActiveTerms(Term $term): void
    {
        Term::where('school_year_id', $term->school_year_id)
            ->where('status', 'active')
            ->where('id', '!=', $term->id)
            ->update(['status' => 'completed']);
    }
}
