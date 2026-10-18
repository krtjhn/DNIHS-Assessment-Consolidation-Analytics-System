<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Terms\UpdateTermStatusRequest;
use App\Models\Term;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// Term Controller managing academic terms (1st, 2nd, 3rd), active term transitions, and calendar lockout states
class TermController extends Controller
{
    // List terms filtered optionally by school year ID
    public function index(Request $request): JsonResponse
    {
        // Build term query with eager-loaded parent school year
        $query = Term::with('schoolYear');

        // Apply school year filter when requested
        if ($request->filled('school_year_id')) {
            $query->where('school_year_id', $request->school_year_id);
        }

        // Order terms sequentially by term number (Term 1, Term 2, Term 3)
        $terms = $query->orderBy('term_number')->get();

        // Return collection of terms as JSON response
        return response()->json([
            'data' => $terms,
        ]);
    }

    // Retrieve single term record with associated school year
    public function show(Term $term): JsonResponse
    {
        // Return term resource with loaded schoolYear relation
        return response()->json([
            'data' => $term->load('schoolYear'),
        ]);
    }

    // Update term status: pending (locked), active (open for encoding), or completed (locked/concluded)
    public function updateStatus(UpdateTermStatusRequest $request, Term $term): JsonResponse
    {
        // Extract validated status attribute from UpdateTermStatusRequest
        $validated = $request->validated();

        // Execute status transition inside a database transaction
        DB::transaction(function () use ($validated, $term) {
            // Calendar Invariant: When activating a term, automatically mark any currently active term in the same school year as completed
            if ($validated['status'] === 'active') {
                $this->completeOtherActiveTerms($term);
            }

            // Update the term's status attribute
            $term->update($validated);
        });

        // Return confirmation of status update along with reloaded relationship data
        return response()->json([
            'message' => "Term status updated to {$term->status}.",
            'data' => $term->load('schoolYear'),
        ]);
    }

    // Mark other active terms in the same school year as completed to preserve single-active term invariant
    protected function completeOtherActiveTerms(Term $term): void
    {
        // Query other terms within the same school year that are currently marked active
        Term::where('school_year_id', $term->school_year_id)
            ->where('status', 'active')
            ->where('id', '!=', $term->id)
            // Transition their status to completed
            ->update(['status' => 'completed']);
    }
}
