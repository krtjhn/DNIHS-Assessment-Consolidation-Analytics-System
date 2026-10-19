import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../api';
import ScoreSheet from '../../components/ScoreSheet';
import LoadingIndicator from '../../components/LoadingIndicator';

// Build a consistent class display title from assignment or record data
function buildClassTitle(gradeName, sectionName, subjectName) {
    return `${gradeName} ${sectionName} - ${subjectName}`;
}

export default function RecordEntry({ user }) {
    const isTeacher = user?.roles?.some((r) => r.name === 'teacher');

    const [refData, setRefData] = useState({
        grade_levels: [],
        school_years: [],
        terms: [],
        subjects: [],
        sections: [],
        active_sy: null,
    });
    const [teacherAssignments, setTeacherAssignments] = useState([]);
    const [existingRecords, setExistingRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Google Classroom To-Do tabs: 'assigned' | 'missing' | 'done'
    const [activeTab, setActiveTab] = useState('assigned');

    // Workflow state: 'list' | 'score_grid'
    const [currentStep, setCurrentStep] = useState('list');
    const [editingRecord, setEditingRecord] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [assessmentType, setAssessmentType] = useState('term_exam');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [refsRes, assessmentsRes, myClassesRes] = await Promise.all([
                api.get('/reference-data'),
                api.get('/assessments'),
                isTeacher ? api.get('/my-classes').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            ]);

            const activeYear =
                refsRes.active_sy ||
                (refsRes.school_years || []).find((sy) => sy.is_active) ||
                refsRes.school_years?.[0];
            const extractedTerms = (activeYear?.terms || [])
                .slice()
                .sort((a, b) => (a.term_number ?? 0) - (b.term_number ?? 0));

            const combinedRefs = {
                ...refsRes,
                terms: extractedTerms,
                active_sy: activeYear,
            };

            setRefData(combinedRefs);
            setTeacherAssignments(myClassesRes?.data || []);
            setExistingRecords(assessmentsRes.data || []);
        } catch (err) {
            // ignore — loading state clears in finally
        } finally {
            setLoading(false);
        }
    }

    // Active School Year
    const activeSY = useMemo(() => {
        return (
            refData.active_sy ||
            refData.school_years?.find((s) => s.is_active) ||
            refData.school_years?.[0] ||
            null
        );
    }, [refData.active_sy, refData.school_years]);

    // Active Term in Academic Calendar
    const activeTerm = useMemo(() => {
        return (
            refData.terms?.find((t) => t.status === 'active') ||
            refData.terms?.[0] ||
            null
        );
    }, [refData.terms]);

    const activeTermNum = activeTerm?.term_number ?? 1;

    // Fast O(1) Record Lookup Map: `${term_id}-${section_id}-${subject_id}-${type}`
    const recordsMap = useMemo(() => {
        const map = new Map();
        for (const r of existingRecords) {
            const key = `${r.term_id}-${r.section_id}-${r.subject_id}-${r.type}`;
            map.set(key, r);
        }
        return map;
    }, [existingRecords]);

    // 1. Assigned Tasks (Current open term items awaiting score entry: Diagnostic Test & Term Exam)
    const assignedTasks = useMemo(() => {
        if (!teacherAssignments || teacherAssignments.length === 0 || !activeTerm) return [];

        const tasks = [];

        for (const assignment of teacherAssignments) {
            const gradeName =
                assignment.section?.grade_level?.name ||
                (assignment.section?.grade_level_id ? `Grade ${assignment.section.grade_level_id}` : 'Grade');
            const sectionName = assignment.section?.name || 'Section';
            const subjectName = assignment.subject?.name || 'Subject';
            const classTitle = buildClassTitle(gradeName, sectionName, subjectName);

            // Current Term Diagnostic Test
            const diagKey = `${activeTerm.id}-${assignment.section_id}-${assignment.subject_id}-diagnostic`;
            if (!recordsMap.has(diagKey)) {
                tasks.push({
                    id: `assigned-diag-${assignment.id}-${activeTerm.id}`,
                    assignment,
                    term: activeTerm,
                    type: 'diagnostic',
                    classTitle,
                    assessmentTitle: 'Diagnostic Test',
                    termSubtitle: activeTerm.name,
                });
            }

            // Current Term Examination
            const examKey = `${activeTerm.id}-${assignment.section_id}-${assignment.subject_id}-term_exam`;
            if (!recordsMap.has(examKey)) {
                tasks.push({
                    id: `assigned-exam-${assignment.id}-${activeTerm.id}`,
                    assignment,
                    term: activeTerm,
                    type: 'term_exam',
                    classTitle,
                    assessmentTitle: 'Term Exam',
                    termSubtitle: activeTerm.name,
                });
            }
        }

        return tasks;
    }, [teacherAssignments, activeTerm, recordsMap]);

    // 2. Missing Tasks (Past closed terms with unrecorded assessments: Diagnostic Test & Term Exam)
    const missingTasks = useMemo(() => {
        if (!teacherAssignments || teacherAssignments.length === 0 || !refData.terms) return [];

        const tasks = [];
        const pastTerms = refData.terms.filter((t) => (t.term_number ?? 1) < activeTermNum);

        for (const pt of pastTerms) {
            for (const assignment of teacherAssignments) {
                const gradeName =
                    assignment.section?.grade_level?.name ||
                    (assignment.section?.grade_level_id ? `Grade ${assignment.section.grade_level_id}` : 'Grade');
                const sectionName = assignment.section?.name || 'Section';
                const subjectName = assignment.subject?.name || 'Subject';
                const classTitle = buildClassTitle(gradeName, sectionName, subjectName);

                // Check Diagnostic Test for past term
                const diagKey = `${pt.id}-${assignment.section_id}-${assignment.subject_id}-diagnostic`;
                if (!recordsMap.has(diagKey)) {
                    tasks.push({
                        id: `missing-diag-${assignment.id}-${pt.id}`,
                        assignment,
                        term: pt,
                        type: 'diagnostic',
                        classTitle,
                        assessmentTitle: 'Diagnostic Test',
                        termSubtitle: pt.name || `${pt.term_number ?? 1} Term`,
                        isLocked: pt.status !== 'active',
                    });
                }

                // Check Term Exam for past term
                const examKey = `${pt.id}-${assignment.section_id}-${assignment.subject_id}-term_exam`;
                if (!recordsMap.has(examKey)) {
                    tasks.push({
                        id: `missing-exam-${assignment.id}-${pt.id}`,
                        assignment,
                        term: pt,
                        type: 'term_exam',
                        classTitle,
                        assessmentTitle: 'Term Exam',
                        termSubtitle: pt.name || `${pt.term_number ?? 1} Term`,
                        isLocked: pt.status !== 'active',
                    });
                }
            }
        }

        return tasks;
    }, [teacherAssignments, refData.terms, activeTermNum, recordsMap]);

    // 3. Done Tasks (Completed student assessment records)
    const doneTasks = useMemo(() => {
        if (!existingRecords || existingRecords.length === 0) return [];

        return existingRecords.map((r) => {
            const gradeName =
                r.grade_level?.name ||
                (r.section?.grade_level_id ? `Grade ${r.section.grade_level_id}` : 'Grade');
            const sectionName = r.section?.name || 'Section';
            const subjectName = r.subject?.name || 'Subject';
            const classTitle = buildClassTitle(gradeName, sectionName, subjectName);
            const foundTerm = r.term || refData.terms?.find((t) => t.id === r.term_id);
            const assessmentTitle =
                r.type === 'diagnostic'
                    ? 'Diagnostic Test'
                    : 'Term Exam';
            const studentCount = r.no_of_entries || r.raw_scores?.length || 0;

            return {
                id: `done-${r.id}`,
                record: r,
                term: foundTerm,
                type: r.type,
                classTitle,
                assessmentTitle,
                termSubtitle: `${foundTerm?.name || 'Term'} • ${studentCount} Students`,
            };
        });
    }, [existingRecords, refData.terms]);

    // Open score sheet on row tap
    function handleOpenTask(item) {
        if (item.isLocked) {
            alert(
                'This academic term is closed per school calendar policy. New score recording is locked. Please coordinate with the School Administrator if an encoding extension is required.'
            );
            return;
        }

        const assignment = item.assignment;
        const gl =
            assignment?.section?.grade_level ||
            refData.grade_levels?.find((g) => g.id === assignment?.section?.grade_level_id) ||
            null;

        setSelectedGrade(gl);
        setSelectedSection(assignment?.section || null);
        setSelectedSubject(assignment?.subject || null);
        setSelectedTerm(item.term || activeTerm);
        setAssessmentType(item.type);
        setEditingRecord(null);
        setCurrentStep('score_grid');
    }

    // Open existing record from Done tab
    function handleOpenDone(item) {
        const r = item.record;
        const foundTerm = refData.terms?.find((t) => t.id === r.term_id) || r.term || null;

        setSelectedGrade(r.grade_level || null);
        setSelectedSection(r.section || null);
        setSelectedSubject(r.subject || null);
        setSelectedTerm(foundTerm);
        setAssessmentType(r.type === 'diagnostic' ? 'diagnostic' : 'term_exam');
        setEditingRecord(r);
        setCurrentStep('score_grid');
    }

    if (currentStep === 'score_grid') {
        return (
            <ScoreSheet
                user={user}
                selectedTerm={selectedTerm}
                selectedSY={activeSY}
                selectedGrade={selectedGrade}
                selectedSection={selectedSection}
                selectedSubject={selectedSubject}
                assessmentType={assessmentType}
                existingRecord={editingRecord}
                onBack={() => setCurrentStep('list')}
                onRecordSaved={async () => {
                    await loadData();
                    setCurrentStep('list');
                }}
                onRecordDeleted={async () => {
                    await loadData();
                    setActiveTab('assigned');
                    setCurrentStep('list');
                }}
            />
        );
    }

    return (
        <div className="space-y-2">
            {/* Google Classroom To-Do Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setActiveTab('assigned')}
                    className={`relative pb-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'assigned'
                            ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <span>Assigned</span>
                    {assignedTasks.length > 0 && (
                        <span className="ml-1.5 text-xs font-normal text-slate-500">
                            {assignedTasks.length}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('missing')}
                    className={`relative pb-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'missing'
                            ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <span>Missing</span>
                    {missingTasks.length > 0 && (
                        <span className="ml-1.5 text-xs font-bold text-amber-600">
                            {missingTasks.length}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('done')}
                    className={`relative pb-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'done'
                            ? 'text-[#0071e3] border-b-2 border-[#0071e3]'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <span>Done</span>
                    {doneTasks.length > 0 && (
                        <span className="ml-1.5 text-xs font-normal text-slate-500">
                            {doneTasks.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Borderless List Content */}
            <div className="divide-y divide-slate-100">
                {loading ? (
                    <div className="space-y-1.5 py-1">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl animate-pulse bg-slate-50/70"
                            >
                                <div className="space-y-2 min-w-0 pr-4">
                                    <div className="h-4 w-44 sm:w-60 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-28 bg-slate-100 rounded"></div>
                                </div>
                                <div className="space-y-2 text-right shrink-0">
                                    <div className="h-4 w-20 bg-slate-200 rounded ml-auto"></div>
                                    <div className="h-3 w-16 bg-slate-100 rounded ml-auto"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {activeTab === 'assigned' && (
                            <>
                                {assignedTasks.length > 0 ? (
                                    assignedTasks.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleOpenTask(item)}
                                            className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl hover:bg-slate-100/70 transition-colors cursor-pointer"
                                        >
                                            <div className="min-w-0 pr-4">
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#0071e3] transition-colors truncate">
                                                    {item.classTitle}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs sm:text-sm font-medium text-slate-800">
                                                    {item.assessmentTitle}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {item.termSubtitle}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 px-4 text-center text-slate-500">
                                        <p className="text-xs font-medium">
                                            You don't have any pending assessments to encode for the active term.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'missing' && (
                            <>
                                {missingTasks.length > 0 ? (
                                    missingTasks.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleOpenTask(item)}
                                            className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl hover:bg-amber-50/60 transition-colors cursor-pointer"
                                        >
                                            <div className="min-w-0 pr-4">
                                                <div className="text-xs sm:text-sm font-semibold text-amber-950 truncate">
                                                    {item.classTitle}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs sm:text-sm font-medium text-amber-900">
                                                    {item.assessmentTitle}
                                                </div>
                                                <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                                                    {item.termSubtitle}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 px-4 text-center text-slate-500">
                                        <p className="text-xs font-medium">
                                            No missing assessments from previous terms.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'done' && (
                            <>
                                {doneTasks.length > 0 ? (
                                    doneTasks.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleOpenDone(item)}
                                            className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl hover:bg-slate-100/70 transition-colors cursor-pointer"
                                        >
                                            <div className="min-w-0 pr-4">
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#0071e3] transition-colors truncate">
                                                    {item.classTitle}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs sm:text-sm font-medium text-slate-800">
                                                    {item.assessmentTitle}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {item.termSubtitle}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 px-4 text-center text-slate-500">
                                        <p className="text-xs font-medium">
                                            No completed assessment records yet.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
