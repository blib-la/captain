import { isEqual } from "lodash";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export function useObject<T extends Record<string, unknown>>(value_?: T | null, delay = 300) {
	const [value, setValue] = useState(value_);
	const [debouncedValue] = useDebounce(value_, delay);

	useEffect(() => {
		setValue(previousState =>
			isEqual(previousState, debouncedValue) ? previousState : debouncedValue
		);
	}, [debouncedValue]);
	return value;
}
