import CasinoIcon from "@mui/icons-material/Casino";
import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import IconButton from "@mui/joy/IconButton";
import Textarea from "@mui/joy/Textarea";
import { atom } from "jotai";
import { useAtom } from "jotai";

export const livePaintingOptionsAtom = atom({
	prompt: "a person, incredible watercolor painting, futuristic ink art",
	size: { width: 512, height: 512 },
	seed: 0,
	strength: 0.95,
	guidanceScale: 1.5,
	steps: 3,
});

export function UpdateProperties() {
	const [, setLivePaintingOptions] = useAtom(livePaintingOptionsAtom);

	return (
		<Box sx={{ display: "flex", gap: 1, width: "100%", alignItems: "center" }}>
			<IconButton
				variant="soft"
				color="neutral"
				onClick={() => {
					setLivePaintingOptions(previousState => ({
						...previousState,
						seed: Math.floor(Math.random() * 10_000_000_000 + 1),
					}));
				}}
			>
				<CasinoIcon />
			</IconButton>
		</Box>
	);
}

export function Prompt() {
	const [livePaintingOptions, setLivePaintingOptions] = useAtom(livePaintingOptionsAtom);

	return (
		<Box sx={{ pt: 2 }}>
			<FormControl sx={{ flex: 1, width: "100%" }}>
				<FormLabel>Prompt</FormLabel>
				<Textarea
					value={livePaintingOptions.prompt}
					placeholder="Enter prompt"
					minRows={4}
					maxRows={4}
					onChange={event => {
						setLivePaintingOptions(previousState => ({
							...previousState,
							prompt: event.target.value,
						}));
					}}
				/>
			</FormControl>
		</Box>
	);
}
