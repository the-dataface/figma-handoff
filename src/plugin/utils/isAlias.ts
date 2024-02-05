export default function isAlias(value: VariableAlias): boolean {
	return value.toString().trim().charAt(0) === '{';
}
