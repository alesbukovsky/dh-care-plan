import { type Plan, parsePlan } from "@dh-care-plan/core";
import { describeSchemaIssues, type ImportIssue } from "./schemaIssues";

export type { ImportIssue };

export interface ImportFailure {
	ok: false;
	summary: string;
	issues: ImportIssue[];
}

export type ImportResult = { ok: true; plan: Plan } | ImportFailure;

const FIELD_LABELS: Record<string, string> = {
	aap: "AAP classification",
	allergies: "Allergies",
	appointments: "Appointments",
	asa: "ASA classification",
	bmi: "BMI",
	caries: "Caries",
	chartId: "Chart ID",
	complaint: "Chief complaint",
	debridement: "Debridement",
	dental: "Dental history",
	diagnostic: "Diagnostic tests",
	diseases: "Diseases",
	dob: "Date of birth",
	doneBy: "Target date",
	evidencedBy: "Evidenced by",
	exams: "Exams",
	findings: "Findings",
	gi: "Gingival index",
	gingiva: "Gingiva",
	goals: "Goals",
	initials: "Initials",
	instruction: "Instruction",
	interval: "Recommended interval of care",
	interventions: "Interventions",
	isMet: "Need met",
	length: "Length",
	medical: "Medical history",
	medications: "Medications",
	needs: "Human needs",
	objective: "Objective data",
	occlusion: "Occlusion",
	outcome: "Outcome",
	patient: "Patient",
	periodontal: "Periodontal",
	personal: "Personal history",
	pi: "Plaque index",
	planned: "Appointment plan",
	prophylaxis: "Prophylaxis",
	radiographic: "Radiographic findings",
	recommendation: "Recommendation",
	referral: "Referral",
	referrals: "Referrals",
	relatedTo: "Related to",
	relative: "Relative date",
	restorations: "Restorations",
	restorative: "Restorative",
	risk: "Caries risk",
	social: "Social history",
	status: "Status",
	study: "Case study",
	subjective: "Subjective data",
	task: "Task",
	type: "Need type",
};

function fail(summary: string, issues: ImportIssue[] = []): ImportFailure {
	return { ok: false, summary, issues };
}

export async function readPlanFile(file: File): Promise<ImportResult> {
	let text: string;
	try {
		text = await file.text();
	} catch {
		return fail(`“${file.name}” could not be read. Check the file and try again.`);
	}

	if (text.trim() === "") return fail(`“${file.name}” is empty.`);

	const result = parsePlan(text);
	if (result.ok) return { ok: true, plan: result.data };

	if (result.reason === "json") {
		return fail(
			`“${file.name}” is not a JSON file. Import expects a care plan exported from this app.`,
			[{ field: "The file", message: result.message }],
		);
	}

	const issues = describeSchemaIssues(result.issues, result.raw, FIELD_LABELS);

	return fail(
		`“${file.name}” is not a valid care plan. ${issues.length === 1 ? "One field needs" : `${issues.length} fields need`} attention:`,
		issues,
	);
}
