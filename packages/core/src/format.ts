export function formatDate(iso: string, pattern: string): string {
	const [year = "", month = "", day = ""] = iso.split("-");
	return pattern.replace(/YYYY|MM|DD/g, (token) => {
		switch (token) {
			case "YYYY":
				return year;
			case "MM":
				return month;
			case "DD":
				return day;
			default:
				return token;
		}
	});
}
