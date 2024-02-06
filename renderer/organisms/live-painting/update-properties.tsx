import Recycling from "@mui/icons-material/Recycling";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Input from "@mui/joy/Input";
import Stack from "@mui/joy/Stack";
import type { ChangeEvent } from "react";
import { useState } from "react";

export function UpdateProperties() {
	const [prompt, setPrompt] = useState("");
	const [seed, setSeed] = useState("0");
	const [size, setSize] = useState({ width: 512, height: 512 });
	const [strength, setStrength] = useState("1");

	// Handle input changes
	function handlePromptChange(event: ChangeEvent<HTMLInputElement>) {
		setPrompt(event.target.value);
	}

	function handleSeedChange(event: ChangeEvent<HTMLInputElement>) {
		setSeed(event.target.value);
	}

	function handleSizeChange(dimension: "height" | "width", event: ChangeEvent<HTMLInputElement>) {
		setSize(previousSize => ({
			...previousSize,
			[dimension]: Number.parseInt(event.target.value, 10),
		}));
	}

	function handleStrengthChange(event: ChangeEvent<HTMLInputElement>) {
		setStrength(event.target.value);
	}

	function randomSeed() {
		setSeed(Math.floor(Math.random() * 100_000_000 + 1).toString());
	}

	// Use effect to send updates
	/* useEffect(() => {
		const properties = {
			prompt,
			seed: seed === "" ? 0 : Number.parseInt(seed, 10),
			size,
			strength: Number.parseFloat(strength),
		};
		// SendUpdatedProperties(properties);
	}, [prompt, seed, size, strength]); */

	return (
		<Stack direction="row" spacing={2}>
			<FormControl sx={{ flex: 4 }}>
				<FormLabel>Prompt</FormLabel>
				<Input value={prompt} placeholder="Enter prompt" onChange={handlePromptChange} />
			</FormControl>

			<FormControl sx={{ flex: 1 }}>
				<FormLabel>Strength</FormLabel>
				<Input
					value={strength}
					placeholder="Strength"
					type="number"
					slotProps={{ input: { min: 0, max: 1, step: 0.1 } }}
					onChange={event => {
						handleStrengthChange(event);
					}}
				/>
			</FormControl>

			<FormControl sx={{ flex: 1 }}>
				<FormLabel>Seed</FormLabel>
				<Input
					value={seed}
					placeholder="Enter seed"
					type="number"
					endDecorator={
						<IconButton variant="soft" color="neutral" onClick={randomSeed}>
							<Recycling />
						</IconButton>
					}
					onChange={handleSeedChange}
				/>
			</FormControl>
			<FormControl sx={{ flex: 1, display: "none" }}>
				<FormLabel>Width</FormLabel>
				<Input
					value={size.width}
					placeholder="Width"
					type="number"
					onChange={event => {
						handleSizeChange("width", event);
					}}
				/>
			</FormControl>
			<FormControl sx={{ flex: 1, display: "none" }}>
				<FormLabel>Height</FormLabel>
				<Input
					value={size.height}
					placeholder="Height"
					type="number"
					onChange={event => {
						handleSizeChange("height", event);
					}}
				/>
			</FormControl>
		</Stack>
	);
}
