import Box from "@mui/joy/Box";
import Input from "@mui/joy/Input";
import type { ColorPaletteProp } from "@mui/joy/styles";
import { useEffect, useState } from "react";

export function ChatName({
	name,
	onUpdate,
	color,
}: {
	name: string;
	onUpdate(_label: string): void;
	color: ColorPaletteProp;
}) {
	const [currentName, setCurrentName] = useState(name);
	useEffect(() => {
		setCurrentName(name);
	}, [name]);
	return (
		<Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
			<Input
				fullWidth
				color={color}
				variant="soft"
				value={currentName}
				onChange={event => {
					setCurrentName(event.target.value);
				}}
				onBlur={() => {
					if (onUpdate && currentName !== name) {
						onUpdate(currentName);
					}
				}}
			/>
		</Box>
	);
}
