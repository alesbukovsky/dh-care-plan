export function calculateAge(dob: string | undefined, on: Date = new Date()): number | undefined {
	const [year, month, day] = (dob ?? "").split("-").map(Number);
	if (!year || !month || !day) return undefined;

	let age = on.getFullYear() - year;
	const beforeBirthday =
		on.getMonth() + 1 < month || (on.getMonth() + 1 === month && on.getDate() < day);
	if (beforeBirthday) age -= 1;

	return age >= 0 ? age : undefined;
}
