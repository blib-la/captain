// UseColumns.test.tsx
import { extendTheme, ThemeProvider } from "@mui/joy/styles";
import { render } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";

import { useColumns } from "../columns"; // Adjust the import path as necessary

// Mock component to utilize the useColumns hook
function MockComponent({ xs, sm, md, lg }: { xs: number; sm: number; md: number; lg: number }) {
	const columns = useColumns({ xs, sm, md, lg });
	return <div data-testid="column-count">{columns}</div>;
}

describe("useColumns", () => {
	const theme = extendTheme(); // Use your custom theme if you have one

	function renderWithTheme(properties: { xs: number; sm: number; md: number; lg: number }) {
		return render(
			<ThemeProvider theme={theme}>
				<MockComponent {...properties} />
			</ThemeProvider>
		);
	}

	it("should return xs value for initial render", () => {
		const { getByTestId } = renderWithTheme({ xs: 2, sm: 4, md: 6, lg: 8 });
		expect(getByTestId("column-count")).toHaveTextContent("2");
	});
});
