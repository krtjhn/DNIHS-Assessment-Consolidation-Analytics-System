<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Terms\UpdateTermStatusRequest;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// Manages academic terms (1st, 2nd, 3rd) and their status
class TermController extends Controller
{
    // List terms with optional school year filter
    public function index(Request $request): JsonResponse
    {
        $query = Term::with('schoolYear'); // Eager load parent school year

        if ($request->filled('school_year_id')) {
            $query->where('school_year_id', $request->school_year_id); // Filter by school year
        }

        $terms = $query->orderBy('term_number')->get(); // Sort chronologically by term number

        return response()->json([
            'data' => $terms, // Return terms array
        ]);
    }

    // View details of a single term
    public function show(Term $term): JsonResponse
    {
        return response()->json([
            'data' => $term->load('schoolYear'), // Return term model with school year loaded
        ]);
    }

    // Update term status (pending, active, or completed)
    public function updateStatus(UpdateTermStatusRequest $request, Term $term): JsonResponse
    {
        $validated = $request->validated(); // Get validated payload

        DB::transaction(function () use ($validated, $term) {
            // When opening a term, automatically mark any previously active term as completed
            if ($validated['status'] === 'active') {
                $this->completeOtherActiveTerms($term); // Close concurrent active terms
            }

            $term->update($validated); // Save updated status
        });

        Cache::store('file')->forget('academic_reference_data'); // Clear cached reference data

        return response()->json([
            'message' => "Term status updated to {$term->status}.", // Status update confirmation
            'data' => $term->load('schoolYear'), // Return updated term
        ]);
    }

    // Close any other active terms in the same school year
    protected function completeOtherActiveTerms(Term $term): void
    {
        Term::where('school_year_id', $term->school_year_id)
            ->where('status', 'active')
            ->where('id', '!=', $term->id)
            ->update(['status' => 'completed']); // Set status to completed
    }
}
