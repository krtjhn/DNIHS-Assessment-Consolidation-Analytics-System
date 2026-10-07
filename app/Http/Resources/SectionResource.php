<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'school_year_id' => $this->school_year_id,
            'grade_level_id' => $this->grade_level_id,
            'name'           => $this->name,
            'is_active'      => (bool) $this->is_active,
            'grade_level'    => $this->whenLoaded('gradeLevel'),
            'school_year'    => $this->whenLoaded('schoolYear'),
            'created_at'     => $this->created_at?->toDateTimeString(),
        ];
    }
}